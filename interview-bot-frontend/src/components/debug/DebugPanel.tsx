import React, { useState } from 'react';
import Grid from '@mui/material/Grid';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Tabs,
  Tab,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Chip,
  useTheme,
  alpha,
  Card,
  CardContent
} from '@mui/material';
import {
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Share as ShareIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { useInterview } from '../../context/InterviewContext'; // Adjust path as needed

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Tab panel component for debug view
const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`debug-tabpanel-${index}`}
      aria-labelledby={`debug-tab-${index}`}
      {...other}
      style={{ height: '100%', overflow: 'auto' }}
    >
      {value === index && (
        <Box sx={{ p: 2, height: '100%' }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const DebugPanel: React.FC = () => {
  const theme = useTheme();
  const {
    showDebugPanel,
    toggleDebugPanel,
    messages,
    activeDebugMessage,
    setActiveDebugMessage,
    clientId,
    isConnected,
    interviewConfig
  } = useInterview();

  const [tabValue, setTabValue] = useState(0);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    messageMeta: true,
    rawData: false,
    parsedData: false
  });

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Format JSON for display
  const formatJSON = (data: any): string => {
    try {
      return JSON.stringify(data, null, 2);
    } catch (error) {
      return `Error formatting data: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  };

  return (
    <Drawer
      anchor="right"
      open={showDebugPanel}
      onClose={toggleDebugPanel}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '100%', sm: 450, md: 550 },
          boxSizing: 'border-box',
          p: 0,
        },
      }}
    >
      {/* Debug Panel Header */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        p: 2,
        borderBottom: `1px solid ${theme.palette.divider}`,
        bgcolor: theme.palette.background.paper
      }}>
        <Typography variant="h6" component="div">
          Debug Information
        </Typography>
        <IconButton onClick={toggleDebugPanel} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Debug Panel Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
        >
          <Tab label="Message View" />
          <Tab label="Session Info" />
          <Tab label="Messages Log" />
        </Tabs>
      </Box>

      {/* Tab 1: Message Details */}
      <TabPanel value={tabValue} index={0}>
        {activeDebugMessage ? (
          <Box sx={{ height: '100%', overflow: 'auto' }}>
            {/* Message header */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Message Details
              </Typography>
              <Chip
                label={activeDebugMessage.sender}
                color={
                  activeDebugMessage.sender === 'user'
                    ? 'primary'
                    : activeDebugMessage.sender === 'bot'
                      ? 'secondary'
                      : 'default'
                }
                size="small"
                sx={{ mr: 1 }}
              />
              <Chip
                label={new Date(activeDebugMessage.metadata.timestamp).toLocaleString()}
                variant="outlined"
                size="small"
              />
            </Box>

            {/* Message content preview */}
            <Paper
              elevation={0}
              sx={{
                p: 2,
                mb: 3,
                bgcolor: alpha(theme.palette.background.default, 0.5),
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 1
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 1 }}>
                Content:
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  maxHeight: '100px',
                  overflow: 'auto'
                }}
              >
                {activeDebugMessage.text || '(Audio message)'}
              </Typography>

              {activeDebugMessage.audioSrc && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 0.5 }}>
                    Audio:
                  </Typography>
                  <audio
                    controls
                    src={activeDebugMessage.audioSrc}
                    style={{ width: '100%', height: '40px' }}
                  />
                </Box>
              )}
            </Paper>

            {/* Message metadata section */}
            <Paper sx={{ mb: 2, overflow: 'hidden' }}>
              <Box
                sx={{
                  p: 1.5,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  cursor: 'pointer',
                }}
                onClick={() => toggleSection('messageMeta')}
              >
                <Typography variant="subtitle1">Metadata</Typography>
                <IconButton size="small">
                  {expandedSections.messageMeta ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>

              {expandedSections.messageMeta && (
                <Box sx={{ p: 2 }}>
                  <Grid container spacing={1.5}>
                    {Object.entries(activeDebugMessage.metadata)
                      .filter(([key]) =>
                        key !== 'rawMessage' &&
                        key !== 'parsedMessage' &&
                        typeof activeDebugMessage.metadata[key] !== 'object'
                      )
                      .map(([key, value]) => (
                        // Using 'size' prop for Grid below
                        <Grid size={{ xs: 6 }} key={key}>
                          <Typography variant="caption" sx={{ fontWeight: 'medium', color: theme.palette.text.secondary }}>
                            {key}:
                          </Typography>
                          <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                            {value?.toString() || 'N/A'}
                          </Typography>
                        </Grid>
                      ))}
                  </Grid>
                </Box>
              )}
            </Paper>

            {/* Raw message data */}
            {activeDebugMessage.metadata.rawMessage && (
              <Paper sx={{ mb: 2, overflow: 'hidden' }}>
                <Box
                  sx={{
                    p: 1.5,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    cursor: 'pointer',
                  }}
                  onClick={() => toggleSection('rawData')}
                >
                  <Typography variant="subtitle1">Raw Data</Typography>
                  <IconButton size="small">
                    {expandedSections.rawData ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Box>

                {expandedSections.rawData && (
                  <Box sx={{ p: 2 }}>
                    <Box
                      component="pre"
                      sx={{
                        p: 1.5,
                        bgcolor: '#f5f5f5', // Consider using theme.palette.grey[100] or similar
                        borderRadius: 1,
                        overflow: 'auto',
                        fontSize: '0.75rem',
                        fontFamily: 'monospace',
                        maxHeight: '200px'
                      }}
                    >
                      {activeDebugMessage.metadata.rawMessage}
                    </Box>
                  </Box>
                )}
              </Paper>
            )}

            {/* Parsed message data */}
            {activeDebugMessage.metadata.parsedMessage && (
              <Paper sx={{ mb: 2, overflow: 'hidden' }}>
                <Box
                  sx={{
                    p: 1.5,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    cursor: 'pointer',
                  }}
                  onClick={() => toggleSection('parsedData')}
                >
                  <Typography variant="subtitle1">Parsed Data</Typography>
                  <IconButton size="small">
                    {expandedSections.parsedData ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Box>

                {expandedSections.parsedData && (
                  <Box sx={{ p: 2 }}>
                    <Box
                      component="pre"
                      sx={{
                        p: 1.5,
                        bgcolor: '#f5f5f5', // Consider using theme.palette.grey[100] or similar
                        borderRadius: 1,
                        overflow: 'auto',
                        fontSize: '0.75rem',
                        fontFamily: 'monospace',
                        maxHeight: '200px'
                      }}
                    >
                      {formatJSON(activeDebugMessage.metadata.parsedMessage)}
                    </Box>
                  </Box>
                )}
              </Paper>
            )}

            {/* API request/response data */}
            {(activeDebugMessage.metadata.apiRequest || activeDebugMessage.metadata.apiResponse) && (
              <Paper sx={{ mb: 2, overflow: 'hidden' }}>
                <Box
                  sx={{
                    p: 1.5,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                  }}
                >
                  <Typography variant="subtitle1">API Data</Typography>
                </Box>

                <Box sx={{ p: 2 }}>
                  {activeDebugMessage.metadata.apiRequest && (
                    <>
                      <Typography variant="subtitle2" gutterBottom>
                        Request:
                      </Typography>
                      <Box
                        component="pre"
                        sx={{
                          p: 1.5,
                          bgcolor: '#f5f5f5', // Consider using theme.palette.grey[100] or similar
                          borderRadius: 1,
                          overflow: 'auto',
                          fontSize: '0.75rem',
                          fontFamily: 'monospace',
                          maxHeight: '150px',
                          mb: 2
                        }}
                      >
                        {formatJSON(activeDebugMessage.metadata.apiRequest)}
                      </Box>
                    </>
                  )}

                  {activeDebugMessage.metadata.apiResponse && (
                    <>
                      <Typography variant="subtitle2" gutterBottom>
                        Response:
                      </Typography>
                      <Box
                        component="pre"
                        sx={{
                          p: 1.5,
                          bgcolor: '#f5f5f5', // Consider using theme.palette.grey[100] or similar
                          borderRadius: 1,
                          overflow: 'auto',
                          fontSize: '0.75rem',
                          fontFamily: 'monospace',
                          maxHeight: '150px'
                        }}
                      >
                        {formatJSON(activeDebugMessage.metadata.apiResponse)}
                      </Box>
                    </>
                  )}
                </Box>
              </Paper>
            )}
          </Box>
        ) : (
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
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Select a message to view its details
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Click the debug icon (🔍) on any message to see its information
            </Typography>
          </Box>
        )}
      </TabPanel>

      {/* Tab 2: Session Info */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ height: '100%', overflow: 'auto' }}>
          <Typography variant="h6" gutterBottom>
            Session Information
          </Typography>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Connection Status
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                {/* Using 'size' prop for Grid below */}
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'medium', color: theme.palette.text.secondary }}>
                    Status:
                  </Typography>
                  <Chip
                    label={isConnected ? "Connected" : "Disconnected"}
                    color={isConnected ? "success" : "error"}
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                </Grid>

                {/* Using 'size' prop for Grid below */}
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'medium', color: theme.palette.text.secondary }}>
                    Client ID:
                  </Typography>
                  <Typography variant="body2">
                    {clientId || 'Not connected'}
                  </Typography>
                </Grid>

                {/* Using 'size' prop for Grid below */}
                <Grid size={{ xs: 12 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'medium', color: theme.palette.text.secondary }}>
                    WebSocket URL:
                  </Typography>
                  <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                    {clientId
                      ? `${process.env.REACT_APP_WS_URL || 'ws://localhost:8000/ws'}/${clientId}`
                      : 'N/A'
                    }
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Interview Configuration
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                {/* Using 'size' prop for Grid below */}
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'medium', color: theme.palette.text.secondary }}>
                    Topic:
                  </Typography>
                  <Typography variant="body2">
                    {interviewConfig?.interviewTopic || 'Not set'}
                  </Typography>
                </Grid>

                {/* Using 'size' prop for Grid below */}
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'medium', color: theme.palette.text.secondary }}>
                    Duration:
                  </Typography>
                  <Typography variant="body2">
                    {interviewConfig?.interviewDuration || 'N/A'} minutes
                  </Typography>
                </Grid>

                {/* Using 'size' prop for Grid below */}
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'medium', color: theme.palette.text.secondary }}>
                    Role Type:
                  </Typography>
                  <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                    {interviewConfig?.roleType || 'N/A'}
                  </Typography>
                </Grid>

                {/* Using 'size' prop for Grid below */}
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'medium', color: theme.palette.text.secondary }}>
                    Messages:
                  </Typography>
                  <Typography variant="body2">
                    {messages.length} total
                  </Typography>
                </Grid>

                {/* Using 'size' prop for Grid below */}
                <Grid size={{ xs: 12 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'medium', color: theme.palette.text.secondary }}>
                    Context:
                  </Typography>
                  <Box
                    sx={{
                      p: 1.5,
                      mt: 0.5,
                      bgcolor: alpha(theme.palette.background.default, 0.5),
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 1,
                      maxHeight: '150px',
                      overflow: 'auto'
                    }}
                  >
                    <Typography variant="body2">
                      {interviewConfig?.initialContext || 'No context provided'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                API Information
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                {/* Using 'size' prop for Grid below */}
                <Grid size={{ xs: 12 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'medium', color: theme.palette.text.secondary }}>
                    API Base URL:
                  </Typography>
                  <Typography variant="body2">
                    {process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}
                  </Typography>
                </Grid>

                {/* Using 'size' prop for Grid below */}
                <Grid size={{ xs: 12 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'medium', color: theme.palette.text.secondary }}>
                    Environment:
                  </Typography>
                  <Typography variant="body2">
                    {process.env.NODE_ENV || 'development'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
      </TabPanel>

      {/* Tab 3: Messages Log */}
      <TabPanel value={tabValue} index={2}>
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Messages Log
            </Typography>
            <Box>
              {/* Consider adding onClick handlers for these buttons */}
              <IconButton size="small" sx={{ mr: 1 }} title="Refresh">
                <RefreshIcon />
              </IconButton>
              <IconButton size="small" title="Export (Not implemented)">
                <ShareIcon />
              </IconButton>
            </Box>
          </Box>

          <Paper
            variant="outlined"
            sx={{
              flexGrow: 1,
              overflow: 'auto',
              bgcolor: alpha(theme.palette.background.default, 0.6)
            }}
          >
            {messages.length > 0 ? (
              <List dense>
                {messages.map((message, index) => (
                  <React.Fragment key={message.id}>
                    {index > 0 && <Divider />}
                    <ListItem disablePadding>
                      <ListItemButton
                        selected={activeDebugMessage?.id === message.id}
                        onClick={() => setActiveDebugMessage(message)}
                        sx={{ py: 1 }}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Chip
                                label={message.sender}
                                color={
                                  message.sender === 'user'
                                    ? 'primary'
                                    : message.sender === 'bot'
                                      ? 'secondary'
                                      : 'default'
                                }
                                size="small"
                                variant="outlined"
                                sx={{ mr: 1, minWidth: 45, fontSize: '0.7rem' }}
                              />
                              <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                                {message.text
                                  ? message.text.length > 60
                                    ? `${message.text.substring(0, 60)}...`
                                    : message.text
                                  : message.audioSrc
                                    ? '(Audio)'
                                    : '(Empty)'
                                }
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                {new Date(message.metadata.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' })} {/* Ensure time format is reasonable */}
                              </Typography>

                              {message.metadata.messageType && (
                                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                  {message.metadata.messageType}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No messages yet
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      </TabPanel>
    </Drawer>
  );
};

export default DebugPanel;
