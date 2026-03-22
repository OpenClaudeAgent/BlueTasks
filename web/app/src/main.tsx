import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import 'react-day-picker/style.css';
import './i18n';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
