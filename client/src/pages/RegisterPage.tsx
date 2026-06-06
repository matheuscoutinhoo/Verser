import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import type { RegisterInput } from '@verser/shared';
import { registerSchema } from '@verser/shared';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';

export function RegisterPage() {
  const { register: registerUser, error, status, isAuthenticated, clearError } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RegisterInput>();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function onSubmit(values: RegisterInput): Promise<void> {
    const parsed = registerSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      (Object.keys(fieldErrors) as Array<keyof RegisterInput>).forEach((key) => {
        const message = fieldErrors[key]?.[0];
        if (message) setError(key, { message });
      });
      return;
    }
    clearError();
    try {
      await registerUser(parsed.data);
      navigate('/dashboard');
    } catch {
      // error surfaced via useAuth().error
    }
  }

  return (
    <div className="mx-auto max-w-md py-10">
      <Card title="Create your account" subtitle="Begin building your first universe.">
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Input
            label="Display name"
            type="text"
            autoComplete="name"
            {...register('displayName', { required: 'Display name is required' })}
            error={errors.displayName?.message}
          />
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
            autoComplete="new-password"
            {...register('password', { required: 'Password is required' })}
            error={errors.password?.message}
          />
          <p className="text-xs text-text-muted">
            Min 8 characters. Must include an uppercase letter, a number, and a special character.
          </p>
          {error ? <p className="text-sm text-accent-red">{error}</p> : null}
          <Button type="submit" loading={isSubmitting || status === 'loading'} className="w-full">
            Create account
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-text-secondary">
          Already have an account?{' '}
          <Link to="/login" className="text-text-accent hover:underline">
            Login
          </Link>
          .
        </p>
      </Card>
    </div>
  );
}
