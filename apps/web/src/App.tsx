import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { SubscriptionsPage } from './pages/SubscriptionsPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <SubscriptionsPage />,
  },
  {
    path: '/subscriptions',
    element: <SubscriptionsPage />,
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
