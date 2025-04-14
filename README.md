# Local Interview Bot

This application provides a local version of the Interview Bot originally designed to run in a Google Colab notebook. This local version is specifically modified to run on a MacBook Air.

## Prerequisites

- macOS (tested on MacBook Air)
- Node.js v18 (recommended)
- Python 3.6+
- Google API Key for the Gemini API

## Project Structure

```
local-interview-bot/
├── app.py                # FastAPI backend
├── setup.sh              # Initial setup script
├── start.sh              # Application startup script
├── files/                # Files used during setup
│   └── App.svelte        # Main Svelte component
└── frontend/            # Created during setup
    ├── public/          # Built frontend files
    └── src/             # Svelte source files
```

## Setup Instructions

1. **Clone or download this repository**

2. **Make the scripts executable**
   ```bash
   chmod +x setup.sh start.sh
   ```

3. **Run the setup script**
   ```bash
   ./setup.sh
   ```
   This will:
   - Check for required dependencies
   - Create the Svelte frontend project
   - Install all necessary Node.js packages
   - Build the frontend
   - Install required Python packages

4. **Get a Google API Key**
   - Visit the [Google AI Studio](https://aistudio.google.com/) to obtain an API key
   - The application uses the Gemini 2.0 Flash Live API

5. **Set your API key**
   ```bash
   export GOOGLE_API_KEY=your_api_key_here
   ```

## Starting the Application

1. **Run the start script**
   ```bash
   ./start.sh
   ```

2. **Access the application**
   - The application should automatically open in your default browser
   - If not, navigate to http://localhost:8000

## How It Works

1. The FastAPI backend handles API requests and WebSocket connections
2. The Svelte frontend provides the user interface
3. When you send a message:
   - It's sent to the backend via WebSocket
   - The backend forwards it to the Gemini API
   - Gemini returns an audio response
   - The audio is converted to WAV format and sent back to the frontend
   - The frontend plays the audio

## Troubleshooting

- **API Key Issues**: Make sure your Google API key is set and has access to the Gemini API
- **Port Conflicts**: If port 8000 is in use, edit the `start.sh` script to use a different port
- **Node Version**: This application was developed with Node.js v18. If you're using a different version, you might encounter issues
