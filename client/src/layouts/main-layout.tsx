import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/navbar';

export function MainLayout() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-3 pb-10 pt-5 sm:px-4 md:px-6 md:pb-14 md:pt-8">
        <div className="manga-page">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
