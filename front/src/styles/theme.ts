import { createTheme } from '@mui/material/styles';

// 8-bit Pokédex color palette
export const pokedexTheme = createTheme({
  palette: {
    primary: {
      main: '#DC0A2D', // Pokédex Red
      light: '#FF1C47',
      dark: '#A3081F',
    },
    secondary: {
      main: '#3B4CCA', // Pokémon Blue
      light: '#5D6FCF',
      dark: '#2A3599',
    },
    background: {
      default: '#F5F5F5',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#212121',
      secondary: '#666666',
    },
    success: {
      main: '#4CAF50',
    },
    warning: {
      main: '#FFCC00', // Pikachu Yellow
    },
    error: {
      main: '#DC0A2D',
    },
  },
  typography: {
    fontFamily: '"Press Start 2P", "Roboto Mono", monospace',
    fontSize: 12,
    h1: {
      fontSize: '2rem',
      fontWeight: 400,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 400,
      letterSpacing: '0.08em',
    },
    h3: {
      fontSize: '1.2rem',
      fontWeight: 400,
      letterSpacing: '0.06em',
    },
    body1: {
      fontSize: '0.875rem',
      lineHeight: 1.8,
    },
    body2: {
      fontSize: '0.75rem',
      lineHeight: 1.6,
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 400,
      letterSpacing: '0.05em',
    },
  },
  shape: {
    borderRadius: 0, // Sharp edges for 8-bit style
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          textTransform: 'uppercase',
          padding: '12px 24px',
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '0.75rem',
          boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.25)',
          transition: 'all 0.1s',
          '&:hover': {
            boxShadow: '2px 2px 0px rgba(0, 0, 0, 0.25)',
            transform: 'translate(2px, 2px)',
          },
          '&:active': {
            boxShadow: '0px 0px 0px rgba(0, 0, 0, 0.25)',
            transform: 'translate(4px, 4px)',
          },
        },
        contained: {
          border: '3px solid #000',
        },
        outlined: {
          border: '3px solid currentColor',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 0,
            fontFamily: '"Roboto Mono", monospace',
            '& fieldset': {
              borderWidth: 3,
              borderColor: '#000',
            },
            '&:hover fieldset': {
              borderColor: '#DC0A2D',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#DC0A2D',
              borderWidth: 3,
            },
          },
          '& .MuiInputLabel-root': {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '0.75rem',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          border: '4px solid #000',
          boxShadow: '8px 8px 0px rgba(0, 0, 0, 0.25)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          border: '3px solid #000',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          border: '3px solid currentColor',
          fontFamily: '"Roboto Mono", monospace',
          fontSize: '0.875rem',
        },
      },
    },
  },
});

export default pokedexTheme;