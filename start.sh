#!/bin/bash

# Get the path to the Python program
COMMAND="python app.py"


# Clean up all processes if such
killall -9 "$COMMAND"

while true; do
  # pid=$(pgrep -f "$COMMAND")
  # echo "process id: $pid"

   # Check if the process is still running
   if ! pgrep -f "$COMMAND" > /dev/null; then
      # The process is not running, so restart it
      echo "The process is not running, so restart it"
      $COMMAND &
   fi

   # Sleep for 10 seconds
   sleep 10
done