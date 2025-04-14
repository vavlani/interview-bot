import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef, // Import useRef
  ReactNode
} from 'react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

// Define types (no changes needed here)
export type MessageSender = 'user' | 'bot' | 'system';

export interface MessageMetadata {
  id: string;
  timestamp: string;
  messageType?: string;
  messageSize?: string;
  audioSize?: string;
  audioDuration?: string;
  rawMessage?: string;
  parsedMessage?: any;
  [key: string]: any;
}

export interface Message {
  id: string;
  sender: MessageSender;
  text?: string;
  audioSrc?: string;
  metadata: MessageMetadata;
}

export interface InterviewConfig {
  initialContext: string;
  interviewDuration: number;
  interviewTopic: string;
  roleType: string;
}

interface InterviewContextType {
  messages: Message[];
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  interviewConfig: InterviewConfig;
  clientId: string | null;
  activeDebugMessage: Message | null;
  showDebugPanel: boolean;

  startInterview: () => Promise<void>;
  endInterview: () => void;
  sendMessage: (text: string) => void;
  setInterviewConfig: (config: InterviewConfig) => void;
  stopAllAudio: () => void;
  toggleDebugPanel: () => void;
  setActiveDebugMessage: (message: Message | null) => void;
}

// Create the context (no changes needed here)
const InterviewContext = createContext<InterviewContextType | undefined>(undefined);

// Default interview configuration (no changes needed here)
const defaultConfig: InterviewConfig = {
  initialContext: '',
  interviewDuration: 15,
  interviewTopic: '',
  roleType: 'interviewer',
};

// Create a persistent WebSocket reference outside of the component
// This ensures it survives component remounts
let persistentWebSocket: WebSocket | null = null;

// Context Provider component
export const InterviewProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interviewConfig, setInterviewConfig] = useState<InterviewConfig>(defaultConfig);
  const [clientId, setClientId] = useState<string | null>(null);
  // const [websocket, setWebsocket] = useState<WebSocket | null>(null); // <-- Remove useState for websocket
  const websocketRef = useRef<WebSocket | null>(null); // <-- Use useRef for websocket instance
  const [audioElements, setAudioElements] = useState<HTMLAudioElement[]>([]);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [activeDebugMessage, setActiveDebugMessage] = useState<Message | null>(null);

  // Add a message to the conversation (no changes needed here)
  const addMessage = useCallback((sender: MessageSender, text?: string, audioSrc?: string, metadata: Partial<MessageMetadata> = {}) => {
    const newMessage: Message = {
      id: uuidv4(),
      sender,
      text,
      audioSrc,
      metadata: {
        id: `msg-${Date.now()}`,
        timestamp: new Date().toISOString(),
        ...metadata,
      },
    };

    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, []);

  // Stop all audio playback (memoized)
  // Add debug instrumentation to the stopAllAudio function
  const stopAllAudio = useCallback(() => {
    console.log("🔊 AUDIO: stopAllAudio called, elements count:", audioElements.length);
    
    setAudioElements(prevElements => {
        prevElements.forEach((audio, index) => {
            if (!audio.paused) {
                console.log(`🔊 AUDIO: Stopping audio element #${index}`);
                try {
                    audio.pause();
                    audio.currentTime = 0;
                    console.log(`🔊 AUDIO: Successfully stopped audio element #${index}`);
                } catch (err) {
                    console.error(`❌ AUDIO ERROR: Failed to stop audio element #${index}:`, err);
                }
            } else {
                console.log(`🔊 AUDIO: Audio element #${index} already paused`);
            }
        });
        console.log("🔊 AUDIO: All audio elements stopped, clearing array");
        return []; // Clear the array after stopping
    });
  }, [audioElements.length]); // Dependency on length ensures this updates when audio elements change


  // Connect to WebSocket
  // Updated connectWebSocket function
  // Updated connectWebSocket function with extensive debugging

// Update the connectWebSocket function to use the persistent reference
  const connectWebSocket = useCallback((id: string) => {
    console.log(`⭐️ connectWebSocket called with ID: ${id}`);
    
    if (!id) {
        console.error("❌ connectWebSocket called with no client ID.");
        return;
    }

    // Check if we have a persistent connection we can reuse
    if (persistentWebSocket && persistentWebSocket.readyState === WebSocket.OPEN) {
        console.log("✅ Reusing existing persistent WebSocket connection");
        websocketRef.current = persistentWebSocket;
        setIsConnected(true);
        setIsLoading(false);
        setError(null);
        return;
    }

    // Close existing connection if ref holds one
    if (websocketRef.current) {
      console.log("🔄 Closing existing WebSocket in ref before reconnecting");
      // Nullify handlers before closing to prevent triggering onclose logic for the old socket
      websocketRef.current.onclose = null;
      websocketRef.current.onerror = null;
      websocketRef.current.onopen = null;
      websocketRef.current.onmessage = null;
      websocketRef.current.close();
      websocketRef.current = null;
      persistentWebSocket = null;
    }

    const wsUrl = `${process.env.REACT_APP_WS_URL || 'ws://localhost:8000/ws'}/${id}`;
    console.log(`🔗 Connecting to WebSocket: ${wsUrl}`);

    try {
        // Create new WebSocket instance
        const ws = new WebSocket(wsUrl);
        console.log(`🔍 WebSocket created, readyState=${ws.readyState}`);
        
        // Set up event handlers
        ws.onopen = (event) => {
            console.log(`✅ WebSocket connected, readyState=${ws.readyState}`);
            setIsConnected(true);
            setIsLoading(false);
            setError(null);
            
            addMessage('system', 'Connected. Say hello to start the interview.', undefined, {
                connectionEvent: 'opened',
                clientId: id,
            });
        };

        ws.onmessage = (event) => {
            console.log('📩 WebSocket message received');
            setIsLoading(false);

            const receivedAt = new Date().toISOString();

            try {
                const msg = JSON.parse(event.data);
                
                if (msg.type === 'bot_text') {
                    addMessage('bot', msg.content, undefined, {
                        timestamp: receivedAt,
                        messageType: msg.type
                    });
                } else if (msg.type === 'bot_audio') {
                    console.log("📩 Received audio data");
                    
                    const audioSrc = `data:audio/wav;base64,${msg.content}`;
                    
                    // Add message first
                    const newMessage = addMessage('bot', '(Audio Response)', audioSrc, {
                        timestamp: receivedAt,
                        messageType: msg.type
                    });
                    
                    // Use setTimeout to handle audio after the UI update
                    setTimeout(() => {
                        try {
                            const audio = new Audio(audioSrc);
                            setAudioElements(prev => [...prev, audio]);
                            
                            // Try to play, but don't worry if it fails (many browsers block autoplay)
                            audio.play().catch(e => {
                                console.log("Audio autoplay blocked, normal browser behavior:", e);
                                // Don't add error message as this is expected behavior
                            });
                        } catch (err) {
                            console.error("Error creating audio:", err);
                        }
                    }, 100);
                } else if (msg.type === 'error') {
                    addMessage('system', `Error: ${msg.content}`, undefined, {
                        error: msg.content,
                    });
                    setError(msg.content);
                }
            } catch (e) {
                console.error('Failed to process WebSocket message:', e);
            }
        };

        ws.onerror = (event) => {
            console.error('❌ WebSocket error:', event);
            setError('WebSocket connection error.');
            setIsConnected(false);
            setIsLoading(false);
            addMessage('system', 'WebSocket error.', undefined, {
                error: 'websocket_error',
            });
        };

        ws.onclose = (event) => {
            console.log('🔴 WebSocket closed:', event.code, event.reason);
            
            // Only update UI if this was unexpected
            if (event.code !== 1000) { // 1000 is normal closure
                setIsConnected(false);
                setIsLoading(false);
                
                // Only show error for abnormal closures
                addMessage('system', `Connection closed (${event.code}).`, undefined, {
                    connectionEvent: 'closed',
                    code: event.code,
                    reason: event.reason,
                });
            }
        };
        
        // Store the WebSocket in both refs
        websocketRef.current = ws;
        persistentWebSocket = ws;
        
        console.log("🔗 WebSocket setup complete");
        
    } catch (err) {
        console.error('❌ Error in connectWebSocket:', err);
        setError(`Failed to connect: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setIsConnected(false);
        setIsLoading(false);
    }
  }, [addMessage]);

  // Start the interview
  // Add debug instrumentation to the startInterview function
  const startInterview = useCallback(async () => {
    console.log("🚀 START: startInterview called");
    
    if (isLoading) {
        console.log("🚀 START: Already loading, skipping");
        return;
    }

    console.log("🚀 START: Setting up new interview");
    setIsLoading(true);
    setError(null);
    setMessages([]); // Clear previous messages
    stopAllAudio(); // Stop any leftover audio

    // Close existing WebSocket connection held in ref
    if (websocketRef.current) {
      console.log("🚀 START: Closing existing WebSocket in ref");
      try {
          websocketRef.current.close();
          console.log("🚀 START: Existing WebSocket closed");
      } catch (err) {
          console.error("❌ START ERROR: Error closing existing WebSocket:", err);
      }
      websocketRef.current = null;
      console.log("🚀 START: Cleared websocketRef");
    } else {
        console.log("🚀 START: No existing WebSocket to clean up");
    }

    setClientId(null); // Clear client ID for new session
    console.log("🚀 START: Client ID cleared");

    try {
      const startTime = new Date().toISOString();
      console.log("🚀 START: Requesting new session via API", interviewConfig);

      addMessage('system', 'Requesting new interview session...', undefined, {
        timestamp: startTime,
        apiRequest: {
          endpoint: '/api/start_interview',
          method: 'POST',
          requestBody: interviewConfig,
        },
      });

      console.log("🚀 START: Sending axios POST request");
      const response = await axios.post('/api/start_interview', interviewConfig);
      console.log("🚀 START: Received response:", response.data);

      const endTime = new Date().toISOString();
      const responseTime = new Date().getTime() - new Date(startTime).getTime();

      if (response.data && response.data.client_id) {
        const newClientId = response.data.client_id;
        console.log(`🚀 START: Got client ID: ${newClientId}`);
        setClientId(newClientId); // Set the new client ID
        
        addMessage('system', `Interview session ready (ID: ${newClientId}). Connecting...`, undefined, {
          timestamp: endTime,
          responseTime: `${responseTime}ms`,
          apiResponse: response.data,
        });
        
        // Initiate WebSocket connection
        console.log(`🚀 START: Initiating WebSocket connection with ID: ${newClientId}`);
        connectWebSocket(newClientId);
      } else {
        // Handle case where response might be ok but no client_id
        console.error("❌ START ERROR: No client_id in response", response.data);
        throw new Error('No client_id received from server');
      }
    } catch (err) {
      console.error('❌ START ERROR: Failed to start interview:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to start interview';
      setError(errorMessage);
      setIsLoading(false); // Ensure loading stops on error
      addMessage('system', `Error starting session: ${errorMessage}`, undefined, {
        error: err instanceof Error ? err.toString() : 'Unknown error',
        requestBody: interviewConfig, // Include config in error metadata
      });
    }
  }, [connectWebSocket, interviewConfig, isLoading, addMessage, stopAllAudio]);

  // End the interview
  const endInterview = useCallback(() => {
    const wsInstance = websocketRef.current; // Get current instance from ref
    if (!wsInstance || wsInstance.readyState !== WebSocket.OPEN) {
        console.log("endInterview called but WebSocket not open or doesn't exist.");
        return;
    }

    try {
      console.log("Sending 'end interview' message.");
      wsInstance.send('end interview'); // Use instance from ref
      addMessage('system', 'Ending interview session...', undefined, {
        userAction: 'end_interview',
      });
      stopAllAudio();
      // Connection will close based on server logic or ws.onclose handler
    } catch (err) {
      console.error('Error ending interview:', err);
       addMessage('system', `Error trying to end interview: ${err instanceof Error ? err.message : 'Unknown error'}`, undefined, {
            error: 'end_interview_send_error',
        });
    }
  // Removed websocket state from dependencies
  }, [addMessage, stopAllAudio]);

  // Send a message
  // Also instrument the sendMessage function to debug communication issues
  // Fixed sendMessage function
  const sendMessage = useCallback((text: string) => {
    console.log(`📤 SEND: sendMessage called with text: ${text.substring(0, 50)}${text.length > 50 ? "..." : ""}`);
    
    const wsInstance = websocketRef.current; // Get current instance from ref
    if (!text.trim()) {
        console.log("📤 SEND: Empty message ignored");
        return;
    }
    
    if (!wsInstance) {
        console.error("📤 SEND: WebSocket instance is null");
        setError("Cannot send message: No active connection");
        addMessage('system', 'Cannot send message: No active connection', undefined, {
            error: 'send_message_no_connection',
            messageAttempted: text,
        });
        return;
    }
    
    // FIX HERE: The correct check for OPEN state is WebSocket.OPEN which is 1
    // So we should check if readyState === WebSocket.OPEN (1) not if it's not equal to OPEN
    if (wsInstance.readyState !== WebSocket.OPEN) {
        console.error(`📤 SEND: WebSocket not in OPEN state, current state: ${wsInstance.readyState}`);
        setError(`Cannot send message: Connection not active (state=${wsInstance.readyState})`);
        addMessage('system', `Cannot send message: Connection not active (state=${wsInstance.readyState})`, undefined, {
            error: 'send_message_not_connected',
            messageAttempted: text,
            readyState: wsInstance.readyState
        });
        return;
    }
    
    // If we get here, the WebSocket is open and ready to send
    console.log("📤 SEND: WebSocket is in OPEN state, proceeding with send");
    
    if (isLoading) {
        console.log("📤 SEND: Still loading previous response, message blocked");
        addMessage('system', 'Please wait for the previous response before sending', undefined, {
            info: 'message_blocked_loading',
            messageAttempted: text,
        });
        return;
    }

    console.log("📤 SEND: Stopping any currently playing audio");
    stopAllAudio(); // Stop any currently playing audio

    const sendTime = new Date().toISOString();
    console.log('📤 SEND: Sending message to WebSocket');
    setIsLoading(true); // Set loading true when sending

    try {
        console.log("📤 SEND: Calling ws.send()");
        wsInstance.send(text);
        console.log("📤 SEND: Message sent successfully");
        
        addMessage('user', text, undefined, {
            timestamp: sendTime,
            messageLength: text.length,
            wordCount: text.split(/\s+/).length,
            readyState: wsInstance.readyState
        });
        console.log("📤 SEND: User message added to UI");
    } catch (err) {
        console.error("❌ SEND ERROR:", err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
        setError(errorMessage);
        setIsLoading(false); // Ensure loading stops on error
        addMessage('system', `Error sending: ${errorMessage}`, undefined, {
            error: err instanceof Error ? err.toString() : 'Unknown error',
            messageAttempted: text,
        });
    }
  }, [isLoading, addMessage, stopAllAudio]);

  // Toggle debug panel (no changes needed here)
  const toggleDebugPanel = useCallback(() => {
    setShowDebugPanel(prev => !prev);
    if (showDebugPanel) {
      setActiveDebugMessage(null);
    }
  }, [showDebugPanel]);

  // Clean up on unmount - this effect now correctly handles the ref
  // Instrument cleanup effect to debug potential issues there
  // Update this useEffect cleanup function to prevent premature disconnection

// Update the cleanup function
useEffect(() => {
  console.log("🔄 EFFECT: WebSocket cleanup effect running");
  
  return () => {
      console.log("🔄 CLEANUP: Component cleanup function running");
      
      // Only close the WebSocket if the app is really closing
      // not just during component remounts
      const isRealUnmount = document.visibilityState === "hidden" || 
                           (window.navigator && window.navigator.userAgent.includes("ReactNative"));
      
      if (isRealUnmount) {
          console.log("🔄 CLEANUP: Real unmount detected, closing WebSocket");
          if (websocketRef.current) {
              try {
                  websocketRef.current.onclose = null;
                  websocketRef.current.onerror = null;
                  websocketRef.current.onopen = null; 
                  websocketRef.current.onmessage = null;
                  websocketRef.current.close();
                  websocketRef.current = null;
                  persistentWebSocket = null;
              } catch (err) {
                  console.error("❌ Error closing WebSocket:", err);
              }
          }
      } else {
          console.log("🔄 CLEANUP: Component remount detected, preserving WebSocket");
          // Save the current WebSocket to our persistent reference
          if (websocketRef.current) {
              persistentWebSocket = websocketRef.current;
          }
      }
      
      // Always stop audio playback during cleanup
      stopAllAudio();
  };
}, [stopAllAudio]);


  // Context value (no changes needed here)
  const contextValue: InterviewContextType = {
    messages,
    isConnected,
    isLoading,
    error,
    interviewConfig,
    clientId,
    activeDebugMessage,
    showDebugPanel,

    startInterview,
    endInterview,
    sendMessage,
    setInterviewConfig,
    stopAllAudio,
    toggleDebugPanel,
    setActiveDebugMessage,
  };

  return (
    <InterviewContext.Provider value={contextValue}>
      {children}
    </InterviewContext.Provider>
  );
};

// Custom hook to use the context (no changes needed here)
export const useInterview = (): InterviewContextType => {
  const context = useContext(InterviewContext);
  if (context === undefined) {
    throw new Error('useInterview must be used within an InterviewProvider');
  }
  return context;
};
