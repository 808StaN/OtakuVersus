import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/navbar';

export function MainLayout() {
  return (
    <div className="min-h-screen">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-3 top-12 rotate-[-8deg] border-[4px] border-black bg-[#ffd000]/90 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-black shadow-panel">
          Otaku Zone
        </div>
        <div className="absolute right-6 top-24 h-56 w-56 -rotate-6 border-[4px] border-black bg-[#ffd000]/30 shadow-panel" />
        <div className="absolute bottom-6 left-1/3 h-52 w-52 rotate-12 border-[4px] border-black bg-[#ff7a00]/35 shadow-panel" />
      </div>
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-4 pb-14 pt-8 md:px-6">
        <div className="manga-page">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
