import { createBrowserRouter, RouterProvider, Outlet, NavLink } from 'react-router-dom';
import { SubscriptionsPage } from './pages/SubscriptionsPage';
import { SearchPage } from './pages/SearchPage';
import { RecommendationsPage } from './pages/RecommendationsPage';


function navClass({ isActive }: { isActive: boolean }) {
  return `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-surface-2 text-white' : 'text-slate-400 hover:text-white'
    }`;
}

function Layout() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-white/5 bg-[#0f1117]/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <NavLink to="/" className="flex items-baseline gap-2 text-white">
            <span className="rounded-md bg-accent/15 px-2 py-0.5 font-mono text-sm text-accent">AAG</span>
            <span className="text-sm font-semibold">Anime AutoGrab</span>
          </NavLink>
          <nav className="flex gap-1">
            <NavLink to="/recommendations" className={navClass}>Recommandations</NavLink>
            <NavLink to="/subscriptions" className={navClass}>Abonnements</NavLink>
            <NavLink to="/search" className={navClass}>Recherche</NavLink>
          </nav>
        </div>
      </header>
      <Outlet />
    </div>
  );
}

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <SubscriptionsPage /> },
      { path: '/subscriptions', element: <SubscriptionsPage /> },
      { path: '/search', element: <SearchPage /> },
      { path: '/recommendations', element: <RecommendationsPage /> },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
