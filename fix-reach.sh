#!/bin/bash

# Clear directory structure script
echo "Cleaning up old static files mapping..."

# Stop any running servers
PID=$(lsof -ti:8000)
if [ ! -z "$PID" ]; then
  echo "Stopping server on port 8000 (PID: $PID)..."
  kill -9 $PID
  sleep 1
fi

# Update app.py to properly serve the React frontend
cat > app.py << 'EOL'
import os
import asyncio
import traceback
import base64
import logging
import io  # For in-memory bytes buffer
import wave  # For WAV header/format
import json

# --- Imports ---
try:
    from google import genai
    from google.genai import types
    genai_imported = True
except ImportError as import_err:
    print(f"ERROR: Import Failed: {import_err}")
    genai = None
    genai_imported = False

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# --- Basic Setup & Logging ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)
logger.info("--- Loading app.py (React Frontend) ---")
app = FastAPI(title="Interview Bot Backend (React Frontend)")

# --- Define Frontend Paths ---
FRONTEND_BUILD_DIR = "interview-bot-frontend/build"

# --- Gemini Client Initialization ---
client = None
MODEL = "gemini-2.0-flash-live-001"
logger.info("--- Attempting Gemini Client initialization ---")
api_key = os.environ.get('COLAB_GEMINI_API_KEY')
if genai_imported and api_key:
    try:
        client = genai.Client(api_key=api_key)
        logger.info(f"✅ Gemini Client Initialized. Model: {MODEL}")
    except Exception as e:
        logger.error(f"❌ ERROR during Gemini Client initialization: {e}")
        traceback.print_exc()
logger.info(f"Final client state: {'Initialized' if client else 'NOT Initialized'}")

# --- CORS, State, Pydantic Models ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple in-memory session storage
pending_sessions = {}
client_id_counter = 0

class StartRequest(BaseModel):
    initial_context: str = ""
    interview_duration: int = 15
    interview_topic: str = ""
    role_type: str = "interviewer"

class SessionResponse(BaseModel):
    client_id: str
    message: str

# --- System Prompts for Different Interview Types ---
def create_interview_system_prompt(context, duration, topic, role_type):
    """Create a system prompt based on interview parameters"""
    
    if not context and not topic:
        # Default general interview if no context or topic provided
        return """You are an AI interview assistant conducting a professional interview.
        Ask relevant questions one at a time, listen to responses, and follow up thoughtfully.
        Begin by introducing yourself and explaining the interview purpose.
        Manage time efficiently to complete the interview within the allocated time.
        """
    
    # Build a customized system prompt
    prompt = f"""You are an AI conducting a {duration}-minute interview on the topic of: {topic}.
    
    CONTEXT INFORMATION:
    {context}
    
    YOUR ROLE:
    You are acting as a professional {role_type}. 
    
    INTERVIEW INSTRUCTIONS:
    1. Begin by introducing yourself, your role, and the purpose of this interview.
    2. Plan approximately {max(4, duration//3)} questions to fit within the {duration}-minute timeframe.
    3. Ask only ONE question at a time and wait for the response.
    4. Listen attentively and ask relevant follow-up questions based on responses.
    5. Maintain a conversational, professional tone throughout.
    6. Manage time effectively - if the interview seems to be running long, adapt by asking more focused questions.
    7. When appropriate, wrap up the interview by thanking the participant and providing a brief summary.
    
    Start the interview when the user says hello or introduces themselves."""
    
    return prompt

# --- API Endpoint for Starting Sessions ---
@app.post("/api/start_interview")
async def start_session_setup(request: StartRequest):
    global client_id_counter
    client_id_counter += 1
    client_id = f"client_{client_id_counter}"
    
    # Create the system prompt based on request parameters
    system_prompt = create_interview_system_prompt(
        request.initial_context, 
        request.interview_duration,
        request.interview_topic,
        request.role_type
    )
    
    # Store interview parameters in session
    pending_sessions[client_id] = {
        "initial_context": request.initial_context,
        "interview_duration": request.interview_duration,
        "interview_topic": request.interview_topic,
        "role_type": request.role_type,
        "system_prompt": system_prompt
    }
    
    logger.info(f"Created new interview session: {client_id}")
    logger.info(f"Topic: {request.interview_topic}, Duration: {request.interview_duration} minutes")
    
    return SessionResponse(
        client_id=client_id,
        message="Interview session created successfully. Ready to connect."
    )

# --- WebSocket Endpoint ---
@app.websocket("/ws/{client_id}")
async def websocket_interview_endpoint(websocket: WebSocket, client_id: str):
    # Check for Gemini client
    if not client or not MODEL:
        await websocket.accept()
        await websocket.send_json({
            "type": "error", 
            "content": "Gemini API client not initialized. Check API key."
        })
        await websocket.close()
        return
    
    await websocket.accept()
    logger.info(f"WebSocket accepted for {client_id}")
    
    # Check if this client_id is in pending sessions
    if client_id not in pending_sessions:
        await websocket.send_json({
            "type": "error", 
            "content": "Invalid session ID. Please start a new session."
        })
        await websocket.close()
        return

    # Get session info
    session_info = pending_sessions[client_id]
    system_prompt = session_info.get("system_prompt", "")
    
    # --- Config: AUDIO responses with system instructions ---
    session_config_dict = {
        "response_modalities": ["AUDIO"],
        "system_instruction": {
            "parts": [{"text": system_prompt}]
        }
    }
    
    logger.info(f"WS ({client_id}): Starting Gemini interview session (AUDIO).")

    try:
        config = types.LiveConnectConfig.model_validate(session_config_dict)
        async with client.aio.live.connect(model=MODEL, config=config) as live_session:
            logger.info(f"WS ({client_id}): Gemini Live API session active.")
            
            # --- Main Interview Loop ---
            while True:
                # Receive user message from WebSocket
                logger.info(f"WS ({client_id}): Waiting for message from client...")
                try:
                    user_message = await websocket.receive_text()
                    logger.info(f"WS ({client_id}): Received: '{user_message}'")
                except Exception as e:
                    logger.error(f"Error receiving message: {e}")
                    break
                
                if user_message.lower() in ['quit', 'exit', 'end interview']:
                    # Send a closing message before ending
                    content = types.Content(
                        role="user",
                        parts=[types.Part(text="Please conclude this interview now.")]
                    )
                    await live_session.send_client_content(turns=content)
                    
                    # Get final response
                    bot_audio_chunks = []
                    try:
                        turn = live_session.receive()
                        async for response in turn:
                            if audio_data := response.data:
                                bot_audio_chunks.append(audio_data)
                        
                        # Process and send the final audio
                        if bot_audio_chunks:
                            await process_and_send_audio(websocket, bot_audio_chunks)
                    except Exception as e:
                        logger.error(f"Error in final response: {e}")
                    
                    # End the interview
                    break
                
                # Send user message to Gemini
                logger.info(f"WS ({client_id}): Sending to Gemini...")
                content = types.Content(
                    role="user",
                    parts=[types.Part(text=user_message)]
                )
                try:
                    await live_session.send_client_content(turns=content)
                except Exception as e:
                    logger.error(f"Error sending message to Gemini: {e}")
                    await websocket.send_json({"type": "error", "content": f"Error sending message: {str(e)}"})
                    continue
                
                # Receive AUDIO response from Gemini
                logger.info(f"WS ({client_id}): Waiting for Gemini audio response...")
                bot_audio_chunks = []
                try:
                    turn = live_session.receive()
                    async for response in turn:
                        if audio_data := response.data:
                            bot_audio_chunks.append(audio_data)
                    logger.info(f"WS ({client_id}): Finished receiving turn. Audio chunks: {len(bot_audio_chunks)}")
                except Exception as recv_e:
                    logger.error(f"WS ({client_id}): Error receiving: {recv_e}")
                    await websocket.send_json({"type": "error", "content": f"Error receiving response: {recv_e}"})
                    continue
                
                # Process and send audio response
                if bot_audio_chunks:
                    await process_and_send_audio(websocket, bot_audio_chunks)
                else:
                    logger.warning(f"WS ({client_id}): No audio content received.")
                    await websocket.send_json({"type": "error", "content": "(Bot provided no audio response)"})
    
    except WebSocketDisconnect:
        logger.info(f"WS disconnected by client {client_id}.")
    except Exception as handler_err:
        logger.error(f"Error in WS handler {client_id}: {handler_err}")
        traceback.print_exc()
        try:
            await websocket.send_json({"type": "error", "content": f"Server error: {str(handler_err)}"})
        except:
            pass  # Client may already be disconnected
    finally:
        logger.info(f"Exiting WebSocket handler for {client_id}.")
        # Cleanup if needed
        if client_id in pending_sessions:
            del pending_sessions[client_id]

async def process_and_send_audio(websocket, audio_chunks):
    """Process raw PCM audio chunks and send as WAV"""
    try:
        raw_pcm_data = b"".join(audio_chunks)
        logger.info(f"Combined {len(raw_pcm_data)} bytes of raw PCM.")
        
        # Create WAV file structure in memory
        wav_buffer = io.BytesIO()
        with wave.open(wav_buffer, "wb") as wf:
            wf.setnchannels(1)  # Mono (confirm if Gemini output is mono)
            wf.setsampwidth(2)  # 16-bit PCM = 2 bytes sample width
            wf.setframerate(24000)  # 24kHz sample rate (as per docs)
            wf.writeframes(raw_pcm_data)
        logger.info(f"WAV headers added in memory.")
        
        # Get the complete WAV bytes and encode
        wav_bytes = wav_buffer.getvalue()
        full_audio_b64 = base64.b64encode(wav_bytes).decode('utf-8')
        logger.info(f"Encoded {len(wav_bytes)} WAV bytes to b64. Sending to client...")
        
        # Send base64 WAV data
        await websocket.send_json({
            "type": "bot_audio", 
            "content": full_audio_b64, 
            "mime_type": "audio/wav"
        })
        return True
    except Exception as wav_e:
        logger.error(f"Error converting PCM to WAV: {wav_e}")
        traceback.print_exc()
        await websocket.send_json({"type": "error", "content": "Error processing bot audio"})
        return False

# --- Serve Static React Frontend ---
if os.path.exists(FRONTEND_BUILD_DIR) and os.path.isdir(FRONTEND_BUILD_DIR):
    logger.info(f"✅ Found frontend build directory: {FRONTEND_BUILD_DIR}")
    
    # Mount static files directory for React
    app.mount("/static", StaticFiles(directory=os.path.join(FRONTEND_BUILD_DIR, "static")), name="static")
    
    # Serve standard files at root
    @app.get("/favicon.ico")
    async def serve_favicon():
        path = os.path.join(FRONTEND_BUILD_DIR, "favicon.ico")
        return FileResponse(path) if os.path.exists(path) else HTTPException(status_code=404)
        
    @app.get("/manifest.json")
    async def serve_manifest():
        path = os.path.join(FRONTEND_BUILD_DIR, "manifest.json")
        return FileResponse(path) if os.path.exists(path) else HTTPException(status_code=404)
        
    @app.get("/asset-manifest.json")
    async def serve_asset_manifest():
        path = os.path.join(FRONTEND_BUILD_DIR, "asset-manifest.json")
        return FileResponse(path) if os.path.exists(path) else HTTPException(status_code=404)
        
    @app.get("/robots.txt")
    async def serve_robots():
        path = os.path.join(FRONTEND_BUILD_DIR, "robots.txt")
        return FileResponse(path) if os.path.exists(path) else HTTPException(status_code=404)
        
    @app.get("/logo{size}.png")
    async def serve_logo(size: str):
        path = os.path.join(FRONTEND_BUILD_DIR, f"logo{size}.png")
        return FileResponse(path) if os.path.exists(path) else HTTPException(status_code=404)
    
    # Serve index.html for root and all other paths (client-side routing)
    @app.get("/")
    @app.get("/{full_path:path}")
    async def serve_react(full_path: str = ""):
        # Skip API routes but handle all other routes
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API route not found")
            
        index_path = os.path.join(FRONTEND_BUILD_DIR, "index.html")
        return FileResponse(index_path) if os.path.exists(index_path) else {"message": "Frontend not found"}
        
else:
    logger.warning(f"⚠️ Frontend build directory not found at: {FRONTEND_BUILD_DIR}")
    @app.get("/")
    async def read_root_api_only():
        return {"message": "API Only Mode - Frontend build directory not found."}

logger.info("--- Completed app.py loading ---")
EOL

echo "Updated app.py file with proper React frontend serving"
echo "Please start your server again with ./start.sh"
