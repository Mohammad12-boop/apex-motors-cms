import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { CmsProvider } from './context/CmsContext';
import App from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><BrowserRouter><LanguageProvider><AuthProvider><CmsProvider><App /></CmsProvider></AuthProvider></LanguageProvider></BrowserRouter></React.StrictMode>);
