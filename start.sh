#!/bin/bash

# Local startup script for Interview Bot
# Runs both the FastAPI backend and opens the application in a browser

# Set up colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

APP_PORT=8000

# Check for Google API key
if [ -z "$GOOGLE_API_KEY" ]; then
    echo -e "${RED}GOOGLE_API_KEY environment variable not set.${NC}"
    echo "Please set your Google API key: export GOOGLE_API_KEY=your_key_here"
    exit 1
fi

# Kill any existing process on the port
echo -e "${GREEN}Checking for processes on port ${APP_PORT}...${NC}"
EXISTING_PID=$(lsof -ti:${APP_PORT})
if [ ! -z "$EXISTING_PID" ]; then
    echo -e "${YELLOW}Found process $EXISTING_PID using port ${APP_PORT}. Terminating...${NC}"
    kill -9 $EXISTING_PID
    sleep 1
fi

# Set environment variable
export COLAB_GEMINI_API_KEY="$GOOGLE_API_KEY"
echo -e "${GREEN}API key set as COLAB_GEMINI_API_KEY.${NC}"

# Start FastAPI backend with uvicorn
echo -e "${GREEN}Starting FastAPI backend on http://localhost:${APP_PORT}...${NC}"
uvicorn app:app --host 0.0.0.0 --port $APP_PORT --log-level info &
BACKEND_PID=$!

# Wait for server to start
echo "Waiting for server to start..."
sleep 3

# Open browser
echo -e "${GREEN}Opening application in default browser...${NC}"
open "http://localhost:${APP_PORT}"

echo -e "${YELLOW}Press Ctrl+C to stop the server.${NC}"

# Wait for user to press Ctrl+C
trap "echo -e '${GREEN}Stopping server...${NC}'; kill $BACKEND_PID; exit 0" INT
wait
