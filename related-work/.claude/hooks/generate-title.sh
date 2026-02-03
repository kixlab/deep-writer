#!/bin/bash
# Hook: UserPromptSubmit - Called when user submits a prompt to Claude
# Updates task status to "working"
#
# Title Generation reads from config.json (synced from VS Code settings):
#   1. Configured provider (ollama or openai)
#   2. Fallback to other provider if primary fails
#   3. Truncate prompt - Last resort

# Script directory for reference (used for config lookup)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/config.json"

# Load API key from .env (project-level only)
# API key is synced from VS Code settings to .claude/hooks/.env
if [ -f "$SCRIPT_DIR/.env" ]; then
    export $(grep -v '^#' "$SCRIPT_DIR/.env" | xargs)
fi

# Read configuration from config.json (synced from VS Code extension)
TITLE_PROVIDER="ollama"
TITLE_MODEL="qwen3:0.6b"
OLLAMA_ENDPOINT="http://localhost:11434"

if [ -f "$CONFIG_FILE" ]; then
    TITLE_PROVIDER=$(jq -r '.titleGeneration.provider // "ollama"' "$CONFIG_FILE" 2>/dev/null)
    TITLE_MODEL=$(jq -r '.titleGeneration.model // "qwen3:0.6b"' "$CONFIG_FILE" 2>/dev/null)
    OLLAMA_ENDPOINT=$(jq -r '.ollama.endpoint // "http://localhost:11434"' "$CONFIG_FILE" 2>/dev/null)
fi

# === Utility Functions for Context Management ===

# Estimate token count (approximation: word_count * 1.3)
estimate_tokens() {
    local text="$1"
    local word_count=$(echo "$text" | wc -w | tr -d ' ')
    echo $(( (word_count * 13 + 9) / 10 ))  # Integer math for word_count * 1.3
}

# Compact context to stay within token budget (~200 tokens)
# Preserves most recent 3 prompts and truncates older content
compact_context() {
    local context="$1"
    local max_tokens=200

    local current_tokens=$(estimate_tokens "$context")

    if [ "$current_tokens" -le "$max_tokens" ]; then
        echo "$context"
        return
    fi

    # Split by delimiter and keep last 3 entries
    local compacted=$(echo "$context" | awk '
        BEGIN { RS="---"; ORS="---" }
        { entries[NR] = $0 }
        END {
            start = NR > 3 ? NR - 2 : 1
            for (i = start; i <= NR; i++) {
                if (i == start) printf "%s", entries[i]
                else printf "---\n%s", entries[i]
            }
        }
    ' | sed 's/---$//')

    # If still too long, truncate each entry
    current_tokens=$(estimate_tokens "$compacted")
    if [ "$current_tokens" -gt "$max_tokens" ]; then
        # Truncate to approximately max_tokens worth of characters
        local max_chars=$(( max_tokens * 4 ))  # ~4 chars per token
        compacted=$(echo "$compacted" | head -c "$max_chars")
        compacted="${compacted}..."
    fi

    echo "$compacted"
}

# Walk up the process tree to find the terminal shell PID
# This finds the shell that VS Code's terminal.processId returns
get_terminal_pid() {
    local pid=$$
    local shell_pid=""

    while [ "$pid" != "1" ] && [ -n "$pid" ]; do
        # Get parent PID and command name
        if [[ "$OSTYPE" == "darwin"* ]]; then
            local parent=$(ps -o ppid= -p "$pid" 2>/dev/null | tr -d ' ')
            local cmd=$(ps -o comm= -p "$pid" 2>/dev/null | xargs basename 2>/dev/null)
        else
            local parent=$(ps -o ppid= -p "$pid" 2>/dev/null | tr -d ' ')
            local cmd=$(ps -o comm= -p "$pid" 2>/dev/null)
        fi

        # Check if this is a shell (the terminal's shell)
        if [[ "$cmd" =~ ^(zsh|bash|sh|fish|tcsh|ksh)$ ]]; then
            shell_pid="$pid"
        fi

        pid="$parent"
    done

    # Return the outermost shell PID found (terminal shell)
    if [ -n "$shell_pid" ]; then
        echo "$shell_pid"
    else
        echo "$$"
    fi
}

SESSION_ID=$(get_terminal_pid)

# Read input from Claude Code (JSON with cwd, session info, etc.)
input=$(cat)

# Extract working directory from input
cwd=$(echo "$input" | jq -r '.cwd // empty')
if [ -z "$cwd" ]; then
    cwd=$(pwd)
fi

# Use cwd as project directory (where Claude is actually running)
# This enables multi-directory task tracking
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$cwd}"
TASK_QUEUE_FILE="$PROJECT_DIR/.claude/task-queue.json"

# Extract project name from path
project_name=$(basename "$cwd")

# Current timestamp in ISO format
timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Extract user prompt from input (try various field names)
user_prompt=$(echo "$input" | jq -r '.prompt // .message // .user_message // .content // empty' | head -1)

# Get existing context summary and prompt history for this session
context_summary=""
prompt_history=""
if [ -f "$TASK_QUEUE_FILE" ]; then
    # Extract contextSummary for this session (accumulated context)
    context_summary=$(cat "$TASK_QUEUE_FILE" | jq -r --arg sid "$SESSION_ID" '
        .tasks[] | select(.sessionId == $sid) | .contextSummary // ""
    ' 2>/dev/null || echo "")

    # Extract promptHistory array for this session, get last 5 prompts
    prompt_history=$(cat "$TASK_QUEUE_FILE" | jq -r --arg sid "$SESSION_ID" '
        .tasks[] | select(.sessionId == $sid) | .promptHistory // [] | .[-5:] | join("\n---\n")
    ' 2>/dev/null || echo "")
fi

# Build accumulated context summary for session-aware title generation
if [ -n "$user_prompt" ]; then
    if [ -n "$context_summary" ]; then
        # Append current prompt to existing context
        context_summary="${context_summary}
---
${user_prompt}"
    else
        # First prompt in session
        context_summary="$user_prompt"
    fi

    # Compact context if exceeding token budget
    context_summary=$(compact_context "$context_summary")
fi

# Generate title + topic using Ollama → OpenAI → Fallback chain
# - title: Current request focus (3-6 words) - what the user is asking RIGHT NOW
# - topic: Overall conversation theme (1-3 words) - inferred from ENTIRE conversation history
title=""
topic=""
if [ -n "$user_prompt" ]; then
    # Escape the prompt for JSON (handle quotes and newlines)
    escaped_prompt=$(echo "$user_prompt" | jq -Rs '.')

    # Build context section using accumulated context summary
    if [ -n "$context_summary" ]; then
        context_section="Session Context (accumulated):
${context_summary}

Current Request:
${user_prompt}"
    else
        context_section="Current Request (first in session):
${user_prompt}"
    fi

    # Prompt template for session-aware title generation
    generation_prompt="Analyze this conversation session and generate:
1. title: A 3-6 word title reflecting the OVERALL SESSION THEME
2. topic: A 1-3 word category

${context_section}

Generate a title that captures what this SESSION is about, not just the latest request.
Examples: 'Building Auth System', 'Refactoring Database Layer', 'API Documentation Update'

Output ONLY valid JSON:
{\"title\": \"...\", \"topic\": \"...\"}"

    # === Try configured provider first, then fallback ===

    # Function to call Ollama
    call_ollama() {
        local model="$1"
        local prompt="$2"
        curl -s --max-time 5 "${OLLAMA_ENDPOINT}/api/generate" -d "{
            \"model\": \"${model}\",
            \"prompt\": $(echo "$prompt" | jq -Rs '.'),
            \"stream\": false
        }" 2>/dev/null || echo ""
    }

    # Function to call OpenAI
    call_openai() {
        local model="$1"
        local prompt="$2"
        if [ -z "$OPENAI_API_KEY" ]; then
            echo ""
            return
        fi
        curl -s --max-time 5 "https://api.openai.com/v1/chat/completions" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $OPENAI_API_KEY" \
            -d "{
                \"model\": \"${model}\",
                \"messages\": [
                    {
                        \"role\": \"system\",
                        \"content\": \"You generate structured metadata for task tracking. Output ONLY valid JSON.\"
                    },
                    {
                        \"role\": \"user\",
                        \"content\": $(echo "$prompt" | jq -Rs '.')
                    }
                ],
                \"max_tokens\": 50,
                \"temperature\": 0.3
            }" 2>/dev/null || echo ""
    }

    # Parse response based on provider type
    parse_ollama_response() {
        local response="$1"
        echo "$response" | jq -r '.response // empty' | sed 's/<[^>]*>//g'
    }

    parse_openai_response() {
        local response="$1"
        echo "$response" | jq -r '.choices[0].message.content // empty'
    }

    # Try primary provider
    if [ "$TITLE_PROVIDER" = "ollama" ]; then
        response=$(call_ollama "$TITLE_MODEL" "$generation_prompt")
        if [ -n "$response" ]; then
            raw_response=$(parse_ollama_response "$response")
            parsed_title=$(echo "$raw_response" | grep -o '{[^}]*}' | head -1 | jq -r '.title // empty' 2>/dev/null)
            parsed_topic=$(echo "$raw_response" | grep -o '{[^}]*}' | head -1 | jq -r '.topic // empty' 2>/dev/null)
            if [ -n "$parsed_title" ]; then
                title="$parsed_title"
                topic="$parsed_topic"
            fi
        fi
        # Fallback to OpenAI if Ollama failed
        if [ -z "$title" ] && [ -n "$OPENAI_API_KEY" ]; then
            response=$(call_openai "gpt-4o-mini" "$generation_prompt")
            if [ -n "$response" ]; then
                raw_response=$(parse_openai_response "$response")
                parsed_title=$(echo "$raw_response" | jq -r '.title // empty' 2>/dev/null)
                parsed_topic=$(echo "$raw_response" | jq -r '.topic // empty' 2>/dev/null)
                if [ -n "$parsed_title" ]; then
                    title="$parsed_title"
                    topic="$parsed_topic"
                fi
            fi
        fi
    elif [ "$TITLE_PROVIDER" = "openai" ]; then
        response=$(call_openai "$TITLE_MODEL" "$generation_prompt")
        if [ -n "$response" ]; then
            raw_response=$(parse_openai_response "$response")
            parsed_title=$(echo "$raw_response" | jq -r '.title // empty' 2>/dev/null)
            parsed_topic=$(echo "$raw_response" | jq -r '.topic // empty' 2>/dev/null)
            if [ -n "$parsed_title" ]; then
                title="$parsed_title"
                topic="$parsed_topic"
            fi
        fi
        # Fallback to Ollama if OpenAI failed
        if [ -z "$title" ]; then
            response=$(call_ollama "qwen3:0.6b" "$generation_prompt")
            if [ -n "$response" ]; then
                raw_response=$(parse_ollama_response "$response")
                parsed_title=$(echo "$raw_response" | grep -o '{[^}]*}' | head -1 | jq -r '.title // empty' 2>/dev/null)
                parsed_topic=$(echo "$raw_response" | grep -o '{[^}]*}' | head -1 | jq -r '.topic // empty' 2>/dev/null)
                if [ -n "$parsed_title" ]; then
                    title="$parsed_title"
                    topic="$parsed_topic"
                fi
            fi
        fi
    fi

    # === PRIORITY 3: Fallback (last resort) ===
    if [ -z "$title" ]; then
        title=$(echo "$user_prompt" | head -c 50 | tr '\n' ' ')
        if [ ${#user_prompt} -gt 50 ]; then
            title="${title}..."
        fi
    fi
    # Topic fallback: use project name
    if [ -z "$topic" ]; then
        topic="$project_name"
    fi
fi

# Ensure the .claude directory exists
mkdir -p "$PROJECT_DIR/.claude"

# Create or update task-queue.json
if [ -f "$TASK_QUEUE_FILE" ]; then
    # Read existing file
    existing=$(cat "$TASK_QUEUE_FILE")

    # Validate JSON - if invalid, treat as new file
    if ! echo "$existing" | jq -e '.tasks' > /dev/null 2>&1; then
        existing=""
    fi
fi

# Handle empty or invalid file as new file
if [ -z "$existing" ] || [ "$existing" = "" ]; then
    # Create new file with this task
    new_content=$(jq -n \
        --arg sid "$SESSION_ID" \
        --arg path "$cwd" \
        --arg name "$project_name" \
        --arg ts "$timestamp" \
        --arg title "$title" \
        --arg topic "$topic" \
        --arg prompt "$user_prompt" \
        --arg ctx "$context_summary" '
        {
            "tasks": [{
                "sessionId": $sid,
                "projectPath": $path,
                "projectName": $name,
                "status": "working",
                "updatedAt": $ts,
                "startedAt": $ts,
                "title": (if $title != "" then $title else null end),
                "topic": (if $topic != "" then $topic else null end),
                "userPrompt": (if $prompt != "" then $prompt else null end),
                "contextSummary": (if $ctx != "" then $ctx else null end),
                "promptHistory": (if $prompt != "" then [$prompt] else [] end),
                "ttsEnabled": true
            }]
        }
    ')
    # Only write if jq succeeded and output is valid JSON
    if [ -n "$new_content" ] && echo "$new_content" | jq -e '.tasks' > /dev/null 2>&1; then
        echo "$new_content" > "$TASK_QUEUE_FILE"
    else
        # Fallback: create minimal valid structure
        echo '{"tasks":[]}' > "$TASK_QUEUE_FILE"
    fi
    exit 0
fi

# File exists with valid JSON - check if session exists
session_exists=$(echo "$existing" | jq --arg sid "$SESSION_ID" '.tasks | map(select(.sessionId == $sid)) | length' 2>/dev/null || echo "0")

if [ "$session_exists" -gt 0 ]; then
    # Update existing session - update contextSummary, append to promptHistory, update title/topic
    updated=$(echo "$existing" | jq \
        --arg sid "$SESSION_ID" \
        --arg status "working" \
        --arg ts "$timestamp" \
        --arg title "$title" \
        --arg topic "$topic" \
        --arg prompt "$user_prompt" \
        --arg ctx "$context_summary" '
        .tasks = [.tasks[] | if .sessionId == $sid then
            .status = $status |
            .updatedAt = $ts |
            (if $title != "" then .title = $title else . end) |
            (if $topic != "" then .topic = $topic else . end) |
            (if $prompt != "" then .userPrompt = $prompt else . end) |
            (if $ctx != "" then .contextSummary = $ctx else . end) |
            .promptHistory = ((.promptHistory // []) + (if $prompt != "" then [$prompt] else [] end) | .[-10:])
        else . end]
    ')
else
    # Add new session with all fields including contextSummary and promptHistory
    updated=$(echo "$existing" | jq \
        --arg sid "$SESSION_ID" \
        --arg path "$cwd" \
        --arg name "$project_name" \
        --arg ts "$timestamp" \
        --arg title "$title" \
        --arg topic "$topic" \
        --arg prompt "$user_prompt" \
        --arg ctx "$context_summary" '
        .tasks += [{
            "sessionId": $sid,
            "projectPath": $path,
            "projectName": $name,
            "status": "working",
            "updatedAt": $ts,
            "startedAt": $ts,
            "title": (if $title != "" then $title else null end),
            "topic": (if $topic != "" then $topic else null end),
            "userPrompt": (if $prompt != "" then $prompt else null end),
            "contextSummary": (if $ctx != "" then $ctx else null end),
            "promptHistory": (if $prompt != "" then [$prompt] else [] end),
            "ttsEnabled": true
        }]
    ')
fi

# Only write if updated is not empty (prevent data loss on jq errors)
if [ -n "$updated" ] && echo "$updated" | jq -e '.tasks' > /dev/null 2>&1; then
    echo "$updated" > "$TASK_QUEUE_FILE"
fi
