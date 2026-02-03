#!/bin/bash
# Hook: Notify - Called when Claude finishes a response
# Updates task status to "done" and generates summary from Claude's response
#
# Summary Generation reads from config.json (synced from VS Code settings)

# Script directory for config lookup
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/config.json"

# Load API key from .env (project-level only)
# API key is synced from VS Code settings to .claude/hooks/.env
if [ -f "$SCRIPT_DIR/.env" ]; then
    export $(grep -v '^#' "$SCRIPT_DIR/.env" | xargs)
fi

# Read configuration from config.json (synced from VS Code extension)
SUMMARY_PROVIDER="ollama"
SUMMARY_MODEL="qwen3:0.6b"
OLLAMA_ENDPOINT="http://localhost:11434"

if [ -f "$CONFIG_FILE" ]; then
    SUMMARY_PROVIDER=$(jq -r '.summaryGeneration.provider // "ollama"' "$CONFIG_FILE" 2>/dev/null)
    SUMMARY_MODEL=$(jq -r '.summaryGeneration.model // "qwen3:0.6b"' "$CONFIG_FILE" 2>/dev/null)
    OLLAMA_ENDPOINT=$(jq -r '.ollama.endpoint // "http://localhost:11434"' "$CONFIG_FILE" 2>/dev/null)
fi

# Use CLAUDE_PROJECT_DIR if available, otherwise compute it
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
TASK_QUEUE_FILE="$PROJECT_DIR/.claude/task-queue.json"

# Walk up the process tree to find the terminal shell PID
get_terminal_pid() {
    local pid=$$
    local shell_pid=""

    while [ "$pid" != "1" ] && [ -n "$pid" ]; do
        if [[ "$OSTYPE" == "darwin"* ]]; then
            local parent=$(ps -o ppid= -p "$pid" 2>/dev/null | tr -d ' ')
            local cmd=$(ps -o comm= -p "$pid" 2>/dev/null | xargs basename 2>/dev/null)
        else
            local parent=$(ps -o ppid= -p "$pid" 2>/dev/null | tr -d ' ')
            local cmd=$(ps -o comm= -p "$pid" 2>/dev/null)
        fi

        if [[ "$cmd" =~ ^(zsh|bash|sh|fish|tcsh|ksh)$ ]]; then
            shell_pid="$pid"
        fi

        pid="$parent"
    done

    if [ -n "$shell_pid" ]; then
        echo "$shell_pid"
    else
        echo "$$"
    fi
}

SESSION_ID=$(get_terminal_pid)

# Read input from Claude Code (contains response content)
input=$(cat)

# Current timestamp in ISO format
timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Ensure the task queue file exists
if [ ! -f "$TASK_QUEUE_FILE" ]; then
    exit 0
fi

# Read and validate JSON
existing=$(cat "$TASK_QUEUE_FILE")
if ! echo "$existing" | jq -e '.tasks' > /dev/null 2>&1; then
    exit 0  # Invalid JSON, skip update
fi

# Extract transcript path from input - Stop hook provides path to conversation file
transcript_path=$(echo "$input" | jq -r '.transcript_path // empty' 2>/dev/null)

# Get Claude's last response from the transcript file
claude_response=""
if [ -n "$transcript_path" ] && [ -f "$transcript_path" ]; then
    # Transcript is JSONL format - get last assistant message
    # Each line is a JSON object with role field (not type)
    claude_response=$(tail -50 "$transcript_path" 2>/dev/null | \
        grep '"role":"assistant"' | \
        tail -1 | \
        jq -r '.message.content[] | select(.type=="text") | .text' 2>/dev/null | \
        head -c 2000)
fi

# Get the task title for context
task_title=$(echo "$existing" | jq -r --arg sid "$SESSION_ID" '.tasks[] | select(.sessionId == $sid) | .title // .userPrompt // "task" | .[0:100]')

# Generate summary from Claude's response
summary=""
if [ -n "$claude_response" ] && [ ${#claude_response} -gt 10 ]; then
    # Truncate response for API call (keep first 1500 chars)
    truncated_response=$(echo "$claude_response" | head -c 1500)

    generation_prompt="Summarize what was accomplished in this Claude Code response in 1 brief sentence (max 15 words). Focus on the action taken.

Task: ${task_title}

Claude's response (truncated):
${truncated_response}

Output ONLY the summary sentence, nothing else."

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
                        \"content\": \"You summarize task completions in 1 brief sentence. Be concise.\"
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

    # Try primary provider
    if [ "$SUMMARY_PROVIDER" = "ollama" ]; then
        response=$(call_ollama "$SUMMARY_MODEL" "$generation_prompt")
        if [ -n "$response" ]; then
            raw_summary=$(echo "$response" | jq -r '.response // empty' | sed 's/<[^>]*>//g' | tr -d '\n' | head -c 200)
            if [ -n "$raw_summary" ] && [ ${#raw_summary} -gt 5 ]; then
                summary="$raw_summary"
            fi
        fi
        # Fallback to OpenAI if Ollama failed
        if [ -z "$summary" ] && [ -n "$OPENAI_API_KEY" ]; then
            response=$(call_openai "gpt-4o-mini" "$generation_prompt")
            if [ -n "$response" ]; then
                raw_summary=$(echo "$response" | jq -r '.choices[0].message.content // empty' | tr -d '\n' | head -c 200)
                if [ -n "$raw_summary" ] && [ ${#raw_summary} -gt 5 ]; then
                    summary="$raw_summary"
                fi
            fi
        fi
    elif [ "$SUMMARY_PROVIDER" = "openai" ]; then
        response=$(call_openai "$SUMMARY_MODEL" "$generation_prompt")
        if [ -n "$response" ]; then
            raw_summary=$(echo "$response" | jq -r '.choices[0].message.content // empty' | tr -d '\n' | head -c 200)
            if [ -n "$raw_summary" ] && [ ${#raw_summary} -gt 5 ]; then
                summary="$raw_summary"
            fi
        fi
        # Fallback to Ollama if OpenAI failed
        if [ -z "$summary" ]; then
            response=$(call_ollama "qwen3:0.6b" "$generation_prompt")
            if [ -n "$response" ]; then
                raw_summary=$(echo "$response" | jq -r '.response // empty' | sed 's/<[^>]*>//g' | tr -d '\n' | head -c 200)
                if [ -n "$raw_summary" ] && [ ${#raw_summary} -gt 5 ]; then
                    summary="$raw_summary"
                fi
            fi
        fi
    fi
fi

# Update task status to done, set completedAt timestamp, and store summary
updated=$(echo "$existing" | jq \
    --arg sid "$SESSION_ID" \
    --arg status "done" \
    --arg ts "$timestamp" \
    --arg summary "$summary" '
    .tasks = [.tasks[] | if .sessionId == $sid then
        .status = $status |
        .updatedAt = $ts |
        .completedAt = $ts |
        (if $summary != "" then .summary = $summary else . end) |
        del(.pendingTool)
    else . end]
')

# Only write if updated is not empty (prevent data loss on jq errors)
if [ -n "$updated" ] && echo "$updated" | jq -e '.tasks' > /dev/null 2>&1; then
    echo "$updated" > "$TASK_QUEUE_FILE"
fi
