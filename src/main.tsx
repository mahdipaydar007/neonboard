import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/dm-sans';
import '@fontsource-variable/manrope';
import '@fontsource-variable/jetbrains-mono';
import './styles/main.scss';
import App from './app/App';
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
