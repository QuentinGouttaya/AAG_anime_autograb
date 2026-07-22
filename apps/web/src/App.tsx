import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { SubscriptionsPage } from './pages/SubscriptionsPage';
import { SearchPage } from './pages/SearchPage';              // ← AJOUTÉ

const router = createBrowserRouter([
  { path: '/', element: <SubscriptionsPage /> },
  { path: '/subscriptions', element: <SubscriptionsPage /> },
  { path: '/search', element: <SearchPage /> },               // ← AJOUTÉ
]);

export function App() {
  return <RouterProvider router={router} />;
}
