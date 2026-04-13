import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { HttpError } from '../api/http';
import { mangaAssets } from '../assets/manga-assets';
import { useAuth } from '../features/auth/auth-context';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/dashboard';

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(form);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof HttpError ? err.message : 'Unable to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto comic-layout-asym max-w-5xl">
      <Card>
        <div className="flex items-center justify-between gap-3">
          <span className="comic-kicker">Login Portal</span>
          <span className="ink-stamp">Access</span>
        </div>
        <h1 className="panel-title mt-3 text-6xl">Welcome Back</h1>
        <div className="speech-bubble mt-4">Jump into the next round set and reclaim your ranking spot.</div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <Input
            id="login-email"
            type="email"
            label="Email"
            placeholder="you@domain.com"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            required
          />
          <Input
            id="login-password"
            type="password"
            label="Password"
            placeholder="********"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            required
          />
          {error ? <p className="text-sm font-bold text-red-700">{error}</p> : null}
          <Button type="submit" className="w-full" loading={loading}>
            Sign In
          </Button>
        </form>

        <p className="mt-4 text-sm text-base-ink/80">
          No account yet?{' '}
          <Link to="/register" className="ink-link font-bold">
            Create one
          </Link>
        </p>
      </Card>

      <div className="space-y-4 panel-overlap-right">
        <div className="comic-bg-panel">
          <img src={mangaAssets.backgrounds.hallwayNight} alt="Anime hallway" className="h-32 w-full object-cover" loading="lazy" />
        </div>
        <Card className="overflow-hidden p-0">
          <img src={mangaAssets.portraits.heroGray} alt="Anime character portrait" className="h-64 w-full object-cover" loading="lazy" />
        </Card>
      </div>
    </div>
  );
}