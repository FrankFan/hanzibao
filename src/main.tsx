import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import './index.css';
import { initCfWebAnalytics } from './utils/cfWebAnalytics';

const app = <RouterProvider router={router} />;

initCfWebAnalytics();

createRoot(document.getElementById('root')!).render(
  import.meta.env.DEV ? app : <StrictMode>{app}</StrictMode>,
);
