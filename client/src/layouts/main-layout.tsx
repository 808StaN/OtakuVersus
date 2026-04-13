import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/navbar';

export function MainLayout() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-4 pb-14 pt-8 md:px-6">
        <div className="manga-page">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
