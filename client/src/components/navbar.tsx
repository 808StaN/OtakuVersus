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
  'flex min-h-10 items-center justify-center whitespace-nowrap border-[3px] border-black bg-[#fff8e7] px-2 py-1.5 text-center text-[11px] font-black uppercase tracking-[0.1em] shadow-[3px_3px_0_#000] transition hover:-translate-y-[2px] active:translate-y-[1px] active:shadow-[1px_1px_0_#000] sm:border-[4px] sm:px-3 sm:py-1 sm:text-xs sm:tracking-[0.12em] sm:shadow-sticker sm:active:shadow-[2px_2px_0_#000]';

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const visibleNavItems = isAuthenticated ? [...navItems, ...privateItems] : navItems;

  return (
    <header className="sticky top-0 z-40 border-b-[3px] border-black bg-[#f5f0e3] text-black shadow-[0_4px_0_0_#000] sm:border-b-[4px] sm:shadow-[0_5px_0_0_#000]">
      <nav className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-3 py-2 sm:gap-3 sm:py-3 md:flex-nowrap md:px-6">
        <Link
          to="/"
          className="comic-kicker max-w-[52vw] shrink-0 rotate-[-2deg] overflow-hidden text-ellipsis whitespace-nowrap bg-[#cf1a4f] text-white transition active:translate-y-[1px] active:shadow-[2px_2px_0_#000] sm:max-w-none"
        >
          OtakuVersus
        </Link>

        <div className="order-3 grid w-full grid-cols-2 gap-2 pt-1 sm:flex sm:flex-wrap sm:justify-center sm:pt-0 md:order-none md:w-auto md:flex-nowrap md:justify-start">
          {visibleNavItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={navLinkClass}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {isAuthenticated ? (
            <>
              <span className="hidden border-[4px] border-black bg-[#fff8e7] px-3 py-1 text-sm font-black shadow-sticker md:block">
                {user?.nickname}
              </span>
              <Button variant="ghost" size="sm" className="px-3 py-2 text-xs sm:text-sm" onClick={logout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm" className="px-3 py-2 text-xs sm:text-sm">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="px-3 py-2 text-xs sm:text-sm">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
