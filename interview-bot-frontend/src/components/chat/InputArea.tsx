import React, { useState, useRef, useEffect } from 'react';
import { 
  Paper, 
  InputBase, 
  IconButton, 
  Box,
  Tooltip,
  Zoom,
  useTheme,
  alpha
} from '@mui/material';
import { 
  Send as SendIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  EmojiEmotions as EmojiIcon
} from '@mui/icons-material';
import { useInterview } from '../../context/InterviewContext';

const InputArea: React.FC = () => {
  const theme = useTheme();
  const { sendMessage, isConnected, isLoading } = useInterview();
  const [message, setMessage] = useState('');
  const [isMicActive, setIsMicActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [isConnected]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || !isConnected || isLoading) {
      return;
    }
    
    sendMessage(message.trim());
    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Toggle microphone (placeholder for voice input - not implemented)
  const toggleMic = () => {
    setIsMicActive(!isMicActive);
    // In a real implementation, this would handle voice recording
  };

  return (
    <Paper
      component="form"
      onSubmit={handleSubmit}
      elevation={0}
      sx={{
        p: '2px 4px',
        display: 'flex',
        alignItems: 'center',
        borderRadius: 3,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
        backgroundColor: theme.palette.background.paper,
        '&:focus-within': {
          borderColor: theme.palette.primary.main,
        },
      }}
    >
      {/* Voice input button (placeholder - not functional) */}
      <Tooltip 
        title={isMicActive ? "Stop recording" : "Voice input (not available)"}
        TransitionComponent={Zoom}
      >
        <span>
          <IconButton 
            disabled
            color={isMicActive ? "error" : "default"}
            sx={{ 
              p: '10px',
              color: isMicActive ? theme.palette.error.main : theme.palette.action.active,
              opacity: 0.6
            }}
            onClick={toggleMic}
          >
            {isMicActive ? <MicOffIcon /> : <MicIcon />}
          </IconButton>
        </span>
      </Tooltip>

      {/* Emoji button (placeholder - not functional) */}
      <Tooltip title="Emoji picker (not available)" TransitionComponent={Zoom}>
        <span>
          <IconButton 
            disabled
            sx={{ 
              p: '10px',
              opacity: 0.6
            }}
          >
            <EmojiIcon />
          </IconButton>
        </span>
      </Tooltip>

      {/* Text input */}
      <InputBase
        inputRef={inputRef}
        sx={{
          ml: 1,
          flex: 1,
          fontSize: '1rem',
          py: 1,
          maxHeight: '120px',
          overflowY: 'auto',
        }}
        placeholder={
          !isConnected 
            ? "Start interview to chat" 
            : isLoading 
              ? "Wait for response..." 
              : "Type your message..."
        }
        multiline
        maxRows={4}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        disabled={!isConnected || isLoading}
      />

      {/* Send button */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Tooltip title="Send message" TransitionComponent={Zoom}>
          <span>
            <IconButton 
              color="primary" 
              sx={{ 
                p: '10px',
                opacity: (!isConnected || isLoading || !message.trim()) ? 0.5 : 1,
                transition: 'opacity 0.2s',
              }}
              disabled={!isConnected || isLoading || !message.trim()}
              type="submit"
            >
              <SendIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    </Paper>
  );
};

export default InputArea;
