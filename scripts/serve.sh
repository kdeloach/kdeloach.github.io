#!/bin/bash

# Function to gracefully stop the background processes
stop_background_processes() {
    echo "Stopping background processes..."
    kill -TERM $http_server_pid
    wait $http_server_pid 2>/dev/null
    echo "Background processes stopped."
    exit
}

build_mdsite() {
    watch_dir="."
    command_to_run="./scripts/build.sh"
    echo "Watching markdown files..."
    fswatch --recursive --exclude ".*" --include "\\.md$" --event=Updated "$watch_dir" | while read -r event
    do
      echo "Change detected: $event"
      # Run the specified command
      eval "$command_to_run"
    done
}

# Trap Ctrl+C (SIGINT) to call the stop_background_processes function
trap stop_background_processes SIGINT

# Start HTTP server
python3.9 -m http.server 8000 &
http_server_pid=$!

build_mdsite &
build_mdsite_pid=$!

# Keep the script running until Ctrl+C is pressed
echo "Press Ctrl+C to stop..."
wait

