import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  Paper, 
  Tooltip, 
  Fade, 
  useTheme, 
  alpha 
} from '@mui/material';
import { 
  BugReport as DebugIcon,
  AccessTime as TimeIcon, 
  Person as PersonIcon,
  SmartToy as BotIcon,
  Info as InfoIcon 
} from '@mui/icons-material';
import { useInterview, Message } from '../../context/InterviewContext';

interface MessageItemProps {
  message: Message;
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const theme = useTheme();
  const { setActiveDebugMessage } = useInterview();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [showControls, setShowControls] = useState(false);
  
  // Get timestamp in local time
  const formattedTime = new Date(message.metadata.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  const isUser = message.sender === 'user';
  const isSystem = message.sender === 'system';
  
  // Auto-play audio when component mounts
  useEffect(() => {
    if (message.audioSrc && audioRef.current) {
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log('Auto-play prevented:', error);
        });
      }
    }
  }, [message.audioSrc]);

  // Define message styles based on sender
  const getMessageStyles = () => {
    if (isSystem) {
      return {
        alignSelf: 'center',
        bgcolor: alpha(theme.palette.warning.light, 0.1),
        border: `1px solid ${alpha(theme.palette.warning.light, 0.3)}`,
        color: theme.palette.text.secondary,
        maxWidth: '90%',
      };
    }
    
    if (isUser) {
      return {
        alignSelf: 'flex-end',
        bgcolor: theme.palette.secondary.main,
        color: theme.palette.common.white,
        ml: 'auto',
        borderBottomRightRadius: 0,
      };
    }
    
    return {
      alignSelf: 'flex-start',
      bgcolor: theme.palette.common.white,
      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
      borderBottomLeftRadius: 0,
      mr: 'auto',
    };
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        maxWidth: isSystem ? '100%' : '80%',
        position: 'relative',
        ...getMessageStyles(),
      }}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Message content */}
      <Paper
        elevation={0}
        sx={{
          p: isSystem ? 1 : 2,
          borderRadius: 2,
          ...getMessageStyles(),
        }}
      >
        {/* Sender and time */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
          {!isSystem && (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              color: isUser ? 'inherit' : theme.palette.primary.main,
              opacity: isUser ? 0.9 : 0.8,
              fontWeight: 500
            }}>
              {isUser ? <PersonIcon fontSize="small" sx={{ mr: 0.5 }} /> : <BotIcon fontSize="small" sx={{ mr: 0.5 }} />}
              <Typography 
                variant="body2" 
                fontWeight={500}
                component="span"
              >
                {isUser ? 'You' : 'Interviewer'}
              </Typography>
            </Box>
          )}
          
          <Typography
            variant="caption"
            sx={{
              ml: 'auto',
              opacity: 0.7,
              display: 'flex',
              alignItems: 'center',
              color: isUser ? 'inherit' : theme.palette.text.secondary
            }}
          >
            <TimeIcon fontSize="inherit" sx={{ mr: 0.5, fontSize: '0.875rem' }} />
            {formattedTime}
          </Typography>
        </Box>

        {/* Message text */}
        {message.text && (
          <Typography 
            variant="body1" 
            sx={{ 
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}
          >
            {message.text}
          </Typography>
        )}

        {/* Audio player */}
        {message.audioSrc && (
          <Box sx={{ mt: message.text ? 2 : 0, width: '100%' }}>
            <audio 
              ref={audioRef}
              controls 
              src={message.audioSrc}
              style={{ 
                width: '100%', 
                borderRadius: '8px',
                backgroundColor: theme.palette.background.default
              }}
            />
            
            {message.metadata.audioDuration && (
              <Typography 
                variant="caption" 
                sx={{ 
                  display: 'block', 
                  textAlign: 'right',
                  mt: 0.5,
                  color: isUser ? alpha(theme.palette.common.white, 0.7) : theme.palette.text.secondary
                }}
              >
                Duration: {message.metadata.audioDuration}
              </Typography>
            )}
          </Box>
        )}
      </Paper>

      {/* Debug button - shown on hover */}
      <Fade in={showControls}>
        <Tooltip title="View debug information">
          <IconButton
            size="small"
            onClick={() => setActiveDebugMessage(message)}
            sx={{
              position: 'absolute',
              top: -15,
              right: isUser ? -15 : 'auto',
              left: isUser ? 'auto' : -15,
              bgcolor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              color: theme.palette.text.secondary,
              opacity: 0.7,
              '&:hover': {
                bgcolor: theme.palette.background.paper,
                opacity: 1,
              },
            }}
          >
            <DebugIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Fade>
    </Box>
  );
};

export default MessageItem;
