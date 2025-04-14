import React, { useState } from 'react';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import theme from './styles/theme';
import { InterviewProvider } from './context/InterviewContext';
import AppHeader from './components/layout/AppHeader';
import ChatContainer from './components/chat/ChatContainer';
import InputArea from './components/chat/InputArea';
import SetupPanel from './components/setup/SetupPanel';
import DebugPanel from './components/debug/DebugPanel';

function App() {
  const [setupVisible, setSetupVisible] = useState(true);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <InterviewProvider>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            overflow: 'hidden',
            bgcolor: 'background.default',
          }}
        >
          <AppHeader 
            onSetupToggle={() => setSetupVisible(prev => !prev)} 
            setupVisible={setupVisible}
          />
          
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              flexGrow: 1,
              overflow: 'hidden',
              p: 2,
              pt: 0,
            }}
          >
            {setupVisible ? (
              <SetupPanel onStartInterview={() => setSetupVisible(false)} />
            ) : (
              <>
                <ChatContainer />
                <InputArea />
              </>
            )}
          </Box>
          
          <DebugPanel />
        </Box>
      </InterviewProvider>
    </ThemeProvider>
  );
}

export default App;
