import React, { useRef, useEffect } from 'react';
import { Box, Typography, Paper, CircularProgress } from '@mui/material';
import { useInterview } from '../../context/InterviewContext';
import MessageItem from './MessageItem';

const ChatContainer: React.FC = () => {
  const { messages, isLoading } = useInterview();
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <Paper 
      elevation={0}
      sx={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderRadius: 2,
        bgcolor: '#F8F8F8',
        mb: 2,
        border: '1px solid rgba(0, 0, 0, 0.08)'
      }}
    >
      {/* Message list container */}
      <Box
        ref={containerRef}
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {/* Welcome message shown when no messages exist */}
        {messages.length === 0 && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              p: 4,
              textAlign: 'center',
            }}
          >
            <Typography variant="h2" color="text.secondary" gutterBottom>
              Welcome to Interview Bot
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Say hello to begin your interview session. The AI interviewer will guide you through the conversation.
            </Typography>
          </Box>
        )}

        {/* Message list */}
        {messages.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))}

        {/* Loading indicator */}
        {isLoading && messages.length > 0 && messages[messages.length - 1].sender === 'user' && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              alignSelf: 'flex-start',
              bgcolor: 'background.paper',
              p: 2,
              borderRadius: 2,
              maxWidth: '70%',
              boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
            }}
          >
            <CircularProgress size={20} sx={{ mr: 2, color: 'secondary.main' }} />
            <Typography variant="body2" color="text.secondary">
              Interviewer is thinking...
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default ChatContainer;
