import { Link } from 'react-router-dom';
import { useAuth } from '../features/auth/auth-context';
import { Button } from './ui/button';

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/leaderboard', label: 'Leaderboard' }
];

const privateItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/history', label: 'History' }
];

const navLinkClass =
  'shrink-0 whitespace-nowrap border-[4px] border-black bg-[#fff8e7] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] shadow-sticker transition hover:-translate-y-[2px] active:translate-y-[1px] active:shadow-[2px_2px_0_#000]';

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b-[4px] border-black bg-[#f5f0e3] text-black shadow-[0_5px_0_0_#000]">
      <nav className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-3 py-3 md:flex-nowrap md:px-6">
        <Link
          to="/"
          className="comic-kicker shrink-0 rotate-[-2deg] bg-[#cf1a4f] text-white transition active:translate-y-[1px] active:shadow-[2px_2px_0_#000]"
        >
          OtakuVersus
        </Link>

        <div className="order-3 flex w-full min-w-0 items-center gap-2 overflow-x-auto pb-1 md:order-none md:w-auto md:overflow-visible md:pb-0">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={navLinkClass}
            >
              {item.label}
            </Link>
          ))}
          {isAuthenticated
            ? privateItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={navLinkClass}
                >
                  {item.label}
                </Link>
              ))
            : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {isAuthenticated ? (
            <>
              <span className="hidden border-[4px] border-black bg-[#fff8e7] px-3 py-1 text-sm font-black shadow-sticker md:block">
                {user?.nickname}
              </span>
              <Button variant="ghost" size="sm" onClick={logout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Sign Up</Button>
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
