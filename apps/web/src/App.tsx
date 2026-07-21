import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { AnimePage } from './pages/AnimePage';
import { SubscriptionsPage } from './pages/SubscriptionsPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/anime/:id',
    element: <AnimePage />,
  },
  {
    path: '/subscriptions',
    element: <SubscriptionsPage />,
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
