import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@/lib/theme';
import { ensureFontsLoaded } from '@/lib/theme/fonts';
import { EditorApp } from './EditorApp';
import './styles.css';

// Same font gate as the deck — node sizes depend on the real glyphs.
ensureFontsLoaded().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ThemeProvider>
        <EditorApp />
      </ThemeProvider>
    </React.StrictMode>,
  );
});
