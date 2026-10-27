import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter-tight';
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource-variable/jetbrains-mono';
import 'lenis/dist/lenis.css';
import App from './App.tsx';
import './index.css';
import { applyDeviceClasses } from './lib/device';

// Tag <html> with the device tier before first paint so CSS can drop costly effects on weak devices.
applyDeviceClasses();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
