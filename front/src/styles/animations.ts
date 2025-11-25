import { keyframes } from '@mui/material/styles';

// 8-bit glitch effect
export const glitchAnimation = keyframes`
  0% {
    transform: translate(0);
  }
  20% {
    transform: translate(-2px, 2px);
  }
  40% {
    transform: translate(-2px, -2px);
  }
  60% {
    transform: translate(2px, 2px);
  }
  80% {
    transform: translate(2px, -2px);
  }
  100% {
    transform: translate(0);
  }
`;

// Pixel fade in
export const pixelFadeIn = keyframes`
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
`;

// Blink animation (like old monitors)
export const blinkAnimation = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
`;

// Slide in from right (like Pokédex screen)
export const slideInRight = keyframes`
  0% {
    transform: translateX(100%);
    opacity: 0;
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
`;

// Scan line effect
export const scanLine = keyframes`
  0% {
    transform: translateY(-100%);
  }
  100% {
    transform: translateY(100%);
  }
`;

// Pokéball shake
export const pokeballShake = keyframes`
  0%, 100% {
    transform: rotate(0deg);
  }
  10%, 30%, 50%, 70%, 90% {
    transform: rotate(-10deg);
  }
  20%, 40%, 60%, 80% {
    transform: rotate(10deg);
  }
`;

export const animations = {
  glitch: glitchAnimation,
  fadeIn: pixelFadeIn,
  blink: blinkAnimation,
  slideIn: slideInRight,
  scanLine: scanLine,
  shake: pokeballShake,
};

export default animations;