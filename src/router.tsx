import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { App } from './App';

const HomePage = lazy(() => import('./pages/Home').then((m) => ({ default: m.Home })));
const CharacterPage = lazy(() =>
  import('./pages/Character').then((m) => ({ default: m.Character })),
);
const ErrorPage = lazy(() =>
  import('./pages/ErrorPage').then((m) => ({ default: m.ErrorPage })),
);

export const router = createBrowserRouter([
  {
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/char/:char', element: <CharacterPage /> },
    ],
  },
]);
