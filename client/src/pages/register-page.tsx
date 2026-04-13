import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HttpError } from '../api/http';
import { useAuth } from '../features/auth/auth-context';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    nickname: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (form.password !== form.confirmPassword) {
      setError('Passwords must match.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await register({
        email: form.email,
        nickname: form.nickname,
        password: form.password
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof HttpError ? err.message : 'Unable to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[38rem]">
      <Card>
        <div className="flex items-center justify-between gap-3">
          <span className="comic-kicker">Join Arena</span>
          <span className="ink-stamp">New</span>
        </div>
        <h1 className="panel-title mt-3 text-6xl">Create Account</h1>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <Input
            id="register-email"
            type="email"
            label="Email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            required
          />
          <Input
            id="register-nickname"
            type="text"
            label="Nickname"
            value={form.nickname}
            onChange={(event) => setForm((current) => ({ ...current, nickname: event.target.value }))}
            required
          />
          <Input
            id="register-password"
            type="password"
            label="Password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            required
          />
          <Input
            id="register-confirm-password"
            type="password"
            label="Confirm Password"
            value={form.confirmPassword}
            onChange={(event) =>
              setForm((current) => ({ ...current, confirmPassword: event.target.value }))
            }
            required
          />
          {error ? <p className="text-sm font-bold text-red-700">{error}</p> : null}
          <Button type="submit" className="w-full" loading={loading}>
            Sign Up
          </Button>
        </form>

        <p className="mt-4 text-sm text-base-ink/80">
          Already playing?{' '}
          <Link to="/login" className="ink-link font-bold">
            Login
          </Link>
        </p>
      </Card>
    </div>
  );
}
