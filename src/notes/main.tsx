import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@/lib/theme';
import { ensureFontsLoaded } from '@/lib/theme/fonts';
import { NotesApp } from './NotesApp';
import './styles.css';

// Same font gate as the deck — Korean notes must not flash fallback glyphs.
ensureFontsLoaded().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ThemeProvider>
        <NotesApp />
      </ThemeProvider>
    </React.StrictMode>,
  );
});
