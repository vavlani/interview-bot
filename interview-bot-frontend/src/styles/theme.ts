import { createTheme } from '@mui/material/styles';

// Slack-inspired color palette
export const theme = createTheme({
  palette: {
    primary: {
      main: '#4A154B', // Slack purple
      light: '#7C3085',
      dark: '#340F35',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#36C5F0', // Slack blue
      light: '#7FDBFF',
      dark: '#0092CC',
      contrastText: '#000000',
    },
    success: {
      main: '#2EB67D', // Slack green
      light: '#57D9A3',
      dark: '#1E7F54',
    },
    warning: {
      main: '#ECB22E', // Slack yellow
      light: '#FFD679',
      dark: '#CB8C00',
    },
    error: {
      main: '#E01E5A', // Slack red
      light: '#FF6392',
      dark: '#B00043',
    },
    background: {
      default: '#F8F8F8',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1D1C1D',
      secondary: '#616061',
    },
  },
  typography: {
    fontFamily: '"Lato", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '1.75rem',
      fontWeight: 700,
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 700,
    },
    h3: {
      fontSize: '1.25rem',
      fontWeight: 700,
    },
    body1: {
      fontSize: '0.9375rem',
    },
    body2: {
      fontSize: '0.875rem',
    },
    button: {
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          padding: '6px 16px',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.08)',
        },
      },
    },
  },
});

export default theme;
