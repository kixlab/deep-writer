#!/bin/bash
# Hook: PreToolUse - Called when Claude requests permission for a tool
# Updates task status to "waiting"

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

# Read input from Claude Code
input=$(cat)

# Current timestamp in ISO format
timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Extract tool name for context (optional enhancement)
tool_name=$(echo "$input" | jq -r '.tool_name // empty')

# Extract working directory from input (enables multi-directory tracking)
cwd=$(echo "$input" | jq -r '.cwd // empty')
if [ -z "$cwd" ]; then
    cwd=$(pwd)
fi

# Use cwd as project directory (where Claude is actually running)
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$cwd}"
TASK_QUEUE_FILE="$PROJECT_DIR/.claude/task-queue.json"

# Ensure the task queue file exists
if [ ! -f "$TASK_QUEUE_FILE" ]; then
    exit 0
fi

# Read and validate JSON
existing=$(cat "$TASK_QUEUE_FILE")
if ! echo "$existing" | jq -e '.tasks' > /dev/null 2>&1; then
    exit 0  # Invalid JSON, skip update
fi

# Update task status to waiting
updated=$(echo "$existing" | jq --arg sid "$SESSION_ID" --arg status "waiting" --arg ts "$timestamp" --arg tool "$tool_name" '
    .tasks = [.tasks[] | if .sessionId == $sid then .status = $status | .updatedAt = $ts | .pendingTool = $tool else . end]
')

# Only write if updated is not empty (prevent data loss on jq errors)
if [ -n "$updated" ] && echo "$updated" | jq -e '.tasks' > /dev/null 2>&1; then
    echo "$updated" > "$TASK_QUEUE_FILE"
fi
