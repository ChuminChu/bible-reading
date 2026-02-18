import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { BibleVersionProvider } from '@/contexts/BibleVersionContext';
import App from '@/app/App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <BibleVersionProvider>
          <App />
        </BibleVersionProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
