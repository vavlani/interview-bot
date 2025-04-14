#!/bin/bash

# Create a new React project with Material UI for the Interview Bot
# This script sets up the necessary packages and project structure

# Set up colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Setting up React Interview Bot Frontend ===${NC}"

# Create React app with TypeScript template
echo -e "${GREEN}Creating new React application...${NC}"
npx create-react-app interview-bot-frontend --template typescript

# Move into project directory
cd interview-bot-frontend

# Install Material UI and other dependencies
echo -e "${GREEN}Installing Material UI and other dependencies...${NC}"
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled
npm install @fontsource/lato @fontsource/roboto
npm install react-router-dom
npm install axios uuid

# Create project structure
echo -e "${GREEN}Creating project directory structure...${NC}"
mkdir -p src/components/layout
mkdir -p src/components/chat
mkdir -p src/components/setup
mkdir -p src/components/debug
mkdir -p src/hooks
mkdir -p src/context
mkdir -p src/utils
mkdir -p src/types
mkdir -p src/styles
mkdir -p src/assets

# Create the theme file for Material UI with Slack-inspired colors
echo -e "${GREEN}Creating theme configuration...${NC}"
cat > src/styles/theme.ts << 'EOL'
import { createTheme } from '@mui/material/styles';

// Slack-inspired color palette
export const theme = createTheme({
  palette: {
    primary: {
      main: '#4A154B', // Slack purple
      light: '#7C3085',
      dark: '#340F35',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#36C5F0', // Slack blue
      light: '#7FDBFF',
      dark: '#0092CC',
      contrastText: '#000000',
    },
    success: {
      main: '#2EB67D', // Slack green
      light: '#57D9A3',
      dark: '#1E7F54',
    },
    warning: {
      main: '#ECB22E', // Slack yellow
      light: '#FFD679',
      dark: '#CB8C00',
    },
    error: {
      main: '#E01E5A', // Slack red
      light: '#FF6392',
      dark: '#B00043',
    },
    background: {
      default: '#F8F8F8',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1D1C1D',
      secondary: '#616061',
    },
  },
  typography: {
    fontFamily: '"Lato", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '1.75rem',
      fontWeight: 700,
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 700,
    },
    h3: {
      fontSize: '1.25rem',
      fontWeight: 700,
    },
    body1: {
      fontSize: '0.9375rem',
    },
    body2: {
      fontSize: '0.875rem',
    },
    button: {
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          padding: '6px 16px',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.08)',
        },
      },
    },
  },
});

export default theme;
EOL

# Create a proxy configuration to connect to the Python backend
echo -e "${GREEN}Creating proxy configuration to connect to Python backend...${NC}"
cat > src/setupProxy.js << 'EOL'
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    ['/api', '/ws'],
    createProxyMiddleware({
      target: 'http://localhost:8000',
      ws: true,
      changeOrigin: true,
    })
  );
};
EOL

# Update the package.json to add proxy
echo -e "${GREEN}Updating package.json...${NC}"
npm install --save-dev http-proxy-middleware

# Create a basic .env file
echo -e "${GREEN}Creating environment configuration...${NC}"
cat > .env << 'EOL'
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_WS_URL=ws://localhost:8000/ws
EOL

echo -e "${BLUE}=== Project setup complete! ===${NC}"
echo -e "You can now copy the component files into the appropriate directories."
echo -e "To start the development server, run: ${YELLOW}npm start${NC}"
