import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Chip,
  Tooltip,
  useTheme,
  alpha
} from '@mui/material';
import {
  Settings as SettingsIcon,
  BugReport as DebugIcon,
  Close as CloseIcon,
  Psychology as PsychologyIcon
} from '@mui/icons-material';
import { useInterview } from '../../context/InterviewContext';

interface AppHeaderProps {
  setupVisible: boolean;
  onSetupToggle: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ setupVisible, onSetupToggle }) => {
  const theme = useTheme();
  
  const {
    isConnected,
    isLoading,
    clientId,
    interviewConfig,
    toggleDebugPanel,
    endInterview
  } = useInterview();

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        bgcolor: theme.palette.primary.main,
        borderBottom: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Left - Title and logo */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <PsychologyIcon sx={{ mr: 1.5, fontSize: 28 }} />
          <Typography variant="h1" fontSize="1.25rem" fontWeight="bold" color="white">
            AI Interview Bot
          </Typography>
        </Box>

        {/* Center - Status */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
          {!setupVisible && (
            <>
              {isConnected && (
                <Chip
                  label={isLoading ? "Processing..." : "Connected"}
                  color={isLoading ? "warning" : "success"}
                  size="small"
                  sx={{ 
                    mr: 1.5,
                    color: 'white',
                    '& .MuiChip-label': { fontWeight: 500 }
                  }}
                />
              )}
              
              {interviewConfig.interviewTopic && (
                <Chip
                  label={`Topic: ${interviewConfig.interviewTopic}`}
                  color="secondary"
                  size="small"
                  sx={{ 
                    ml: 1,
                    color: theme.palette.primary.main,
                    fontWeight: 500
                  }}
                />
              )}
              
              {clientId && (
                <Typography
                  variant="body2"
                  color="white"
                  sx={{ opacity: 0.7, ml: 2, fontSize: '0.75rem' }}
                >
                  Session ID: {clientId}
                </Typography>
              )}
            </>
          )}
        </Box>

        {/* Right - Actions */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          {!setupVisible && (
            <>
              <Tooltip title="Debug Panel">
                <IconButton 
                  color="inherit" 
                  onClick={toggleDebugPanel}
                  sx={{ 
                    color: 'white',
                    opacity: 0.8,
                    '&:hover': { opacity: 1 }
                  }}
                >
                  <DebugIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title="Settings">
                <IconButton 
                  color="inherit" 
                  onClick={() => {
                    endInterview();
                    onSetupToggle();
                  }}
                  sx={{ 
                    color: 'white',
                    opacity: 0.8,
                    '&:hover': { opacity: 1 }
                  }}
                >
                  <SettingsIcon />
                </IconButton>
              </Tooltip>

              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={<CloseIcon />}
                onClick={endInterview}
                sx={{ 
                  borderColor: alpha(theme.palette.error.main, 0.5),
                  color: theme.palette.error.light,
                  '&:hover': {
                    borderColor: theme.palette.error.main,
                    bgcolor: alpha(theme.palette.error.main, 0.08)
                  }
                }}
              >
                End Interview
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default AppHeader;
