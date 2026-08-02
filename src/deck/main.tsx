import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@/lib/theme';
import { ensureFontsLoaded } from '@/lib/theme/fonts';
import { App } from './App';
import './styles.css';

// Load fonts before first paint — no glyph swap on stream.
ensureFontsLoaded().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </React.StrictMode>,
  );
});
