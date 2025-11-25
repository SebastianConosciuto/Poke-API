import React from 'react';
import { TextField } from '@mui/material';
import type { TextFieldProps } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledPixelTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    fontFamily: '"Roboto Mono", monospace',
    fontSize: '1rem',
    backgroundColor: '#fff',
    borderRadius: 0,
    
    '& fieldset': {
      borderWidth: 3,
      borderColor: '#000',
      borderRadius: 0,
    },
    
    '&:hover fieldset': {
      borderColor: theme.palette.primary.main,
      borderWidth: 3,
    },
    
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main,
      borderWidth: 3,
    },
    
    '&.Mui-error fieldset': {
      borderColor: theme.palette.error.main,
    },
  },
  
  '& .MuiInputLabel-root': {
    fontFamily: '"Press Start 2P", monospace',
    fontSize: '0.65rem',
    color: theme.palette.text.secondary,
    
    '&.Mui-focused': {
      color: theme.palette.primary.main,
    },
    
    '&.Mui-error': {
      color: theme.palette.error.main,
    },
  },
  
  '& .MuiFormHelperText-root': {
    fontFamily: '"Roboto Mono", monospace',
    fontSize: '0.7rem',
    marginLeft: 0,
    marginTop: theme.spacing(0.5),
  },
  
  '& .MuiInputAdornment-root': {
    '& .MuiSvgIcon-root': {
      fontSize: '1.2rem',
    },
  },
}));

const PixelTextField: React.FC<TextFieldProps> = (props) => {
  return <StyledPixelTextField {...props} />;
};

export default PixelTextField;