#!/bin/bash

# Set colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Fixing websockets compatibility issue...${NC}"

# Install a compatible version of websockets
echo -e "${GREEN}Installing websockets version 11.0.3 (compatible with google-genai)...${NC}"
pip3 install websockets==11.0.3

# Verify installation
WEBSOCKETS_VERSION=$(pip3 show websockets | grep Version)
echo -e "${GREEN}Installed: ${WEBSOCKETS_VERSION}${NC}"

echo -e "${YELLOW}Restarting the application...${NC}"
echo "Run './start.sh' to restart the application"