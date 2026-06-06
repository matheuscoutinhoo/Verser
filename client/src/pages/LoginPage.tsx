import { useForm } from 'react-hook-form';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import type { LoginInput } from '@verser/shared';
import { loginSchema } from '@verser/shared';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';

export function LoginPage() {
  const { login, error, status, isAuthenticated, clearError } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>();

  if (isAuthenticated) {
    const target = (location.state as { from?: Location } | null)?.from?.pathname ?? '/dashboard';
    return <Navigate to={target} replace />;
  }

  async function onSubmit(values: LoginInput): Promise<void> {
    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) return;
    clearError();
    try {
      await login(parsed.data);
      navigate('/dashboard');
    } catch {
      // error surfaced via useAuth().error
    }
  }

  return (
    <div className="mx-auto max-w-md py-10">
      <Card title="Login" subtitle="Welcome back to your worlds.">
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            {...register('email', { required: 'Email is required' })}
            error={errors.email?.message}
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            {...register('password', { required: 'Password is required' })}
            error={errors.password?.message}
          />
          {error ? <p className="text-sm text-accent-red">{error}</p> : null}
          <Button type="submit" loading={isSubmitting || status === 'loading'} className="w-full">
            Login
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-text-secondary">
          No account yet?{' '}
          <Link to="/register" className="text-text-accent hover:underline">
            Create one
          </Link>
          .
        </p>
      </Card>
    </div>
  );
}
