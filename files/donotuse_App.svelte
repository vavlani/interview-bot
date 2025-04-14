<script>
    import { onMount, onDestroy } from 'svelte';
    
    // --- Config ---
    // Relative URLs work because frontend is served from same origin as API
    const API_URL = '/api';
    // Construct WebSocket URL relative to current window location
    const WS_PROTOCOL = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const WS_URL_BASE = `${WS_PROTOCOL}//${window.location.host}/ws/`;
    
    // --- State ---
    let clientId = null;
    let websocket = null;
    let isConnected = false;
    let isLoading = false;
    let conversation = []; // { sender: 'user' | 'bot' | 'system', text?: string, audioSrc?: string }
    let currentMessage = '';
    let error = null;
    let audioElements = []; // Keep track of audio elements
    
    // --- Interview Configuration ---
    let initialContext = '';
    let interviewDuration = 15; // Default to 15 minutes
    let interviewTopic = '';
    let interviewRoleType = 'interviewer';
    let setupVisible = true;
    
    // --- WebSocket Logic ---
    function connectWebSocket(id) {
        if (!id) return;
        if (websocket && websocket.readyState === WebSocket.OPEN) {
            console.log('WS already open');
            return;
        }
        console.log(`Connecting WS to: ${WS_URL_BASE}${id}`);
        websocket = new WebSocket(`${WS_URL_BASE}${id}`);
    
        websocket.onopen = () => {
            console.log('WS Connected');
            isConnected = true;
            isLoading = false;
            error = null;
            addMessage('system', 'Connected. Say hello to start the interview.');
        };
    
        websocket.onmessage = (event) => {
            console.log('WS message:', event.data);
            isLoading = false;
            try {
                const msg = JSON.parse(event.data);
                if (msg.type === 'bot_text') {
                    addMessage('bot', msg.content);
                } else if (msg.type === 'bot_audio') {
                    // Create a playable source from base64 data
                    const audioSrc = `data:audio/wav;base64,${msg.content}`; // Assuming WAV
                    const messageIndex = addMessage('bot', '(Audio Response)', audioSrc);
                    
                    // Allow time for the DOM to update before playing
                    setTimeout(() => {
                        const audioElement = document.querySelector(`.message-audio-${messageIndex}`);
                        if (audioElement) {
                            // Add to our collection of audio elements
                            audioElements.push(audioElement);
                            
                            // Set up audio playback with autoplay
                            audioElement.play().catch(e => {
                                console.error('Audio autoplay failed:', e);
                                // This may happen due to browser autoplay policies
                                addMessage('system', 'Audio autoplay blocked. Please click play to listen.');
                            });
                            
                            // Enable audio visualization (optional)
                            try {
                                setupAudioVisualization(audioElement);
                            } catch (vizError) {
                                console.warn('Audio visualization setup failed:', vizError);
                            }
                        }
                    }, 100);
                } else if (msg.type === 'error') {
                    addMessage('system', `Error: ${msg.content}`);
                    error = msg.content;
                }
            } catch (e) {
                console.error('Failed to process WS message:', e);
                addMessage('system', 'Received unparseable message');
            }
        };
    
        websocket.onerror = (err) => {
            console.error('WS Error:', err);
            error = 'WebSocket connection error.';
            isConnected = false;
            isLoading = false;
            addMessage('system', 'WebSocket error.');
        };
    
        websocket.onclose = (event) => {
            console.log('WS Closed:', event.code, event.reason);
            isConnected = false;
            isLoading = false;
            addMessage('system', `Connection closed (${event.code}).`);
            clientId = null; // Reset client ID on close
        };
    }
    
    // --- Optional audio visualization (can be removed if not needed) ---
    function setupAudioVisualization(audioElement) {
        // This is a simple visualization, could be enhanced later
        if (!window.AudioContext) return; // Not supported in browser
        
        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaElementSource(audioElement);
        
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        // Add visual element or just return the analyzer for future use
        return analyser;
    }
    
    // --- API Calls ---
    async function startInterview() {
        if (isLoading) return;
        console.log('Starting interview...');
        isLoading = true;
        error = null;
        
        // Hide setup UI once interview starts
        setupVisible = false;
        
        // Clear previous conversation
        conversation = []; 
        
        // Stop any playing audio elements
        stopAllAudio();
        
        // Close old connection if exists
        if (websocket) { 
            websocket.close(); 
            websocket = null; 
        } 
        
        clientId = null;
    
        try {
            addMessage('system', 'Requesting new interview session...');
            const response = await fetch(`${API_URL}/start_interview`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    initial_context: initialContext,
                    interview_duration: interviewDuration,
                    interview_topic: interviewTopic,
                    role_type: interviewRoleType
                }),
            });
            
            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`HTTP error ${response.status}: ${errText}`);
            }
            
            const data = await response.json();
            if (data.client_id) {
                clientId = data.client_id;
                addMessage('system', `Interview session ready (ID: ${clientId}). Connecting...`);
                connectWebSocket(clientId); // Connect WS
            } else {
                throw new Error('No client_id received');
            }
        } catch (err) {
            console.error('Failed start interview:', err);
            error = `Start failed: ${err.message}`;
            isLoading = false;
            addMessage('system', `Error: ${error}`);
            // Show setup UI again if interview fails to start
            setupVisible = true;
        }
    }
    
    function endInterview() {
        if (!websocket || websocket.readyState !== WebSocket.OPEN) return;
        
        try {
            // Send end interview message
            websocket.send("end interview");
            addMessage('system', "Ending interview session...");
            
            // Stop any playing audio
            stopAllAudio();
        } catch (err) {
            console.error('Error ending interview:', err);
        }
    }
    
    // --- Audio Control Functions ---
    function stopAllAudio() {
        // Stop all audio elements
        audioElements.forEach(audio => {
            if (!audio.paused) {
                audio.pause();
                audio.currentTime = 0;
            }
        });
        // Clear the array
        audioElements = [];
    }
    
    // --- Send Message ---
    function sendMessage() {
        const text = currentMessage.trim();
        if (!text || !websocket || websocket.readyState !== WebSocket.OPEN || isLoading) return;
        
        // Stop any currently playing audio before sending new message
        stopAllAudio();
    
        console.log('Sending:', text);
        isLoading = true; // Expecting bot response
        try {
            websocket.send(text);
            addMessage('user', text);
            currentMessage = ''; // Clear input
        } catch (err) {
            console.error('Send failed:', err);
            error = `Send failed: ${err.message}`;
            isLoading = false;
            addMessage('system', `Error sending: ${error}`);
        }
    }
    
    function handleInputKey(event) {
        if (event.key === 'Enter') {
            sendMessage();
        }
    }
    
    // --- Helpers ---
    function addMessage(sender, text, audioSrc = null) {
        const msgIndex = conversation.length;
        conversation = [...conversation, { sender, text, audioSrc, index: msgIndex }];
        
        // Auto-scroll to bottom
        setTimeout(() => {
            const chatWindow = document.querySelector('.chat-window');
            if (chatWindow) {
                chatWindow.scrollTop = chatWindow.scrollHeight;
            }
        }, 100);
        
        return msgIndex; // Return the index for reference
    }
    
    // --- Lifecycle ---
    onMount(() => {
        // Request audio permission on page load
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            // Just asking for audio permission makes browsers more likely to allow autoplay
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    // We don't actually need the stream, just the permission
                    // But we could use it for mic input later if needed
                    stream.getTracks().forEach(track => track.stop());
                    console.log('Audio permission granted - autoplay more likely to work');
                })
                .catch(err => {
                    console.warn('No audio permission:', err);
                });
        }
    });
    
    onDestroy(() => {
        // Cleanup WebSocket when component is destroyed
        if (websocket) {
            console.log('Closing WebSocket on component destroy');
            websocket.close();
        }
        // Stop any playing audio
        stopAllAudio();
    });
    
    </script>
    
    <main>
        <h1>AI Interview Bot</h1>
    
        {#if setupVisible}
            <div class="setup-panel">
                <h2>Interview Setup</h2>
                
                <div class="setup-field">
                    <label for="interviewTopic">Interview Topic:</label>
                    <input 
                        type="text" 
                        id="interviewTopic" 
                        bind:value={interviewTopic} 
                        placeholder="e.g., Data Science, Marketing Strategy, Web Development"
                    />
                </div>
                
                <div class="setup-field">
                    <label for="interviewDuration">Duration (minutes):</label>
                    <input 
                        type="number" 
                        id="interviewDuration" 
                        bind:value={interviewDuration} 
                        min="5" 
                        max="60"
                    />
                </div>
                
                <div class="setup-field">
                    <label for="interviewRoleType">Interviewer Role:</label>
                    <select id="interviewRoleType" bind:value={interviewRoleType}>
                        <option value="interviewer">General Interviewer</option>
                        <option value="hiring manager">Hiring Manager</option>
                        <option value="technical interviewer">Technical Interviewer</option>
                        <option value="career coach">Career Coach</option>
                        <option value="industry expert">Industry Expert</option>
                    </select>
                </div>
                
                <div class="setup-field full-width">
                    <label for="initialContext">Interview Context & Instructions:</label>
                    <textarea 
                        id="initialContext" 
                        bind:value={initialContext} 
                        rows="5" 
                        placeholder="Provide details about the interview purpose, candidate background, specific areas to cover, etc."
                    ></textarea>
                </div>
                
                <button class="start-button" on:click={startInterview} disabled={isLoading}>
                    Start Interview
                </button>
            </div>
        {:else}
            <div class="controls">
                <button on:click={() => {setupVisible = true; endInterview();}} class="settings-button">
                    ⚙️ Setup
                </button>
                <span class="status">Status: {isLoading ? 'Thinking...' : isConnected ? `Connected` : 'Disconnected'}</span>
                <button on:click={endInterview} disabled={!isConnected} class="end-button">
                    End Interview
                </button>
            </div>
    
            {#if error}
                <p class="error">Error: {error}</p>
            {/if}
    
            <div class="chat-window">
                {#each conversation as msg, i (i)}
                    <div class="message {msg.sender}">
                        <strong>{msg.sender === 'user' ? 'You' : msg.sender === 'bot' ? 'Interviewer' : 'System'}:</strong>
                        {#if msg.text}<span>{msg.text}</span>{/if}
                        {#if msg.audioSrc}
                            <audio 
                                controls 
                                src={msg.audioSrc} 
                                class="message-audio-{msg.index}"
                                autoplay
                            >Your browser doesn't support audio.</audio>
                        {/if}
                    </div>
                {/each}
                {#if isLoading && conversation.length > 0 && conversation[conversation.length-1].sender === 'user'}
                    <div class="message bot typing">Interviewer is thinking...</div>
                {/if}
            </div>
    
            <div class="input-area">
                <input
                    type="text"
                    bind:value={currentMessage}
                    placeholder={isConnected ? "Type your response..." : "Start interview to chat"}
                    disabled={!isConnected || isLoading}
                    on:keypress={handleInputKey}
                />
                <button on:click={sendMessage} disabled={!isConnected || isLoading || !currentMessage.trim()}>
                    Send
                </button>
            </div>
        {/if}
    </main>
    
    <style>
        main { display: flex; flex-direction: column; height: 100vh; font-family: sans-serif; max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        h1 { text-align: center; color: #4a4a4a; border-bottom: 1px solid #eaeaea; padding-bottom: 15px; margin-bottom: 20px; }
        
        /* Setup Panel */
        .setup-panel { 
            background: #f9f9f9; 
            border-radius: 10px; 
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        .setup-panel h2 { margin-top: 0; color: #333; }
        .setup-field { display: flex; flex-direction: column; gap: 5px; }
        .setup-field.full-width { grid-column: 1 / -1; }
        .setup-field label { font-weight: bold; color: #555; }
        .setup-field input, .setup-field select, .setup-field textarea {
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 16px;
        }
        .setup-field textarea { resize: vertical; min-height: 100px; }
        .start-button {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 12px;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            margin-top: 10px;
            font-weight: bold;
        }
        .start-button:hover { background: #45a049; }
        .start-button:disabled { background: #cccccc; cursor: not-allowed; }
        
        /* Controls */
        .controls { 
            padding: 10px; 
            display: flex; 
            gap: 10px; 
            align-items: center; 
            background: #f8f8f8;
            border-radius: 5px;
            margin-bottom: 10px;
        }
        .status { flex-grow: 1; color: #666; }
        .settings-button, .end-button {
            padding: 8px 15px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        }
        .settings-button { background: #f0f0f0; color: #333; }
        .end-button { background: #ff5252; color: white; }
        .end-button:disabled { background: #ffcccc; cursor: not-allowed; }
        
        /* Chat */
        .error { color: red; padding: 0 10px; }
        .chat-window { 
            flex-grow: 1; 
            overflow-y: auto; 
            padding: 15px; 
            display: flex; 
            flex-direction: column; 
            gap: 12px; 
            background: #f4f7f6;
            border-radius: 5px;
            margin-bottom: 10px;
        }
        .message { 
            padding: 10px 15px; 
            border-radius: 15px; 
            max-width: 80%; 
            word-wrap: break-word; 
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .message.user { 
            background-color: #dcf8c6; 
            align-self: flex-end; 
            margin-left: auto; 
            border-bottom-right-radius: 5px;
        }
        .message.bot { 
            background-color: #e0e0e0; 
            align-self: flex-start; 
            margin-right: auto; 
            border-bottom-left-radius: 5px;
        }
        .message.system { 
            background-color: #f0e68c; 
            font-style: italic; 
            text-align: center; 
            max-width: 100%;
            margin: 5px auto;
            font-size: 0.9rem;
        }
        .message.bot.typing { font-style: italic; color: #555; }
        .message audio { 
            display: block; 
            margin-top: 8px; 
            max-width: 100%;
            border-radius: 20px;
        }
        .message strong { 
            display: block; 
            margin-bottom: 5px; 
            color: #333;
            font-size: 0.9rem;
        }
        
        /* Input Area */
        .input-area { 
            display: flex; 
            padding: 10px; 
            background: #fff;
            border-top: 1px solid #eee;
            border-radius: 5px;
        }
        input[type="text"] { 
            flex-grow: 1; 
            padding: 12px; 
            border: 1px solid #ddd; 
            border-radius: 5px; 
            margin-right: 10px;
            font-size: 16px;
        }
        .input-area button {
            padding: 12px 20px;
            background: #2196F3;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
        }
        .input-area button:hover { background: #0b7dda; }
        .input-area button:disabled { background: #cccccc; cursor: not-allowed; }
    </style>
