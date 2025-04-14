#!/bin/bash

# Local development setup script for MacBook Air
# Converted from Colab notebook

# Set up colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Setting up Interview Bot for local development ===${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js not found. Please install Node.js v18.${NC}"
    echo "You can use nvm, homebrew, or download directly from nodejs.org"
    echo "For example: brew install node@18"
    exit 1
else
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}Using Node.js version: ${NODE_VERSION}${NC}"
    
    # Check if version starts with v18
    if [[ $NODE_VERSION != v18* ]]; then
        echo -e "${YELLOW}Warning: This app was developed with Node.js v18.${NC}"
        echo "Your version: $NODE_VERSION. Consider using nvm to switch to v18."
    fi
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm not found. Please install npm.${NC}"
    exit 1
else
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}Using npm version: ${NPM_VERSION}${NC}"
fi

# Create frontend directory if it doesn't exist
if [ ! -d "frontend" ]; then
    echo -e "${GREEN}Creating frontend directory with Svelte template...${NC}"
    # Use npx degit to get the Svelte template
    npx degit sveltejs/template frontend
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to create Svelte project with degit.${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}Frontend directory already exists, skipping creation.${NC}"
fi

# Install frontend dependencies
echo -e "${GREEN}Installing frontend dependencies...${NC}"
cd frontend
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to install frontend dependencies.${NC}"
    exit 1
fi
cd ..

# Copy all necessary files
echo -e "${GREEN}Setting up application files...${NC}"

# Write App.svelte file
mkdir -p frontend/src
cp ./files/App.svelte frontend/src/

# Build the frontend
echo -e "${GREEN}Building frontend...${NC}"
cd frontend
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to build the frontend.${NC}"
    exit 1
fi
cd ..

# Check for Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Python 3 not found. Please install Python 3.${NC}"
    exit 1
else
    PYTHON_VERSION=$(python3 --version)
    echo -e "${GREEN}Using ${PYTHON_VERSION}${NC}"
fi

# Check for pip
if ! command -v pip3 &> /dev/null; then
    echo -e "${RED}pip3 not found. Please install pip for Python 3.${NC}"
    exit 1
fi

# Install Python dependencies
echo -e "${GREEN}Installing Python backend dependencies...${NC}"
pip3 install -q fastapi "uvicorn[standard]" google-genai watchdog
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to install Python dependencies.${NC}"
    exit 1
fi

echo -e "${GREEN}=== Setup completed successfully! ===${NC}"
echo "To start the application, run: ./start.sh"
echo "Make sure to set your Google API key first: export GOOGLE_API_KEY=your_key_here"
