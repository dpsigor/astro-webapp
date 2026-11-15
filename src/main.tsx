import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { SwephProvider } from './context/SwephContext';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('No root element');

createRoot(root).render(
  <StrictMode>
    <SwephProvider>
      <App />
    </SwephProvider>
  </StrictMode>,
);
