import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="font-display text-5xl text-text-accent">404</h1>
      <p className="mt-4 text-text-secondary">This page is lost in another universe.</p>
      <div className="mt-8">
        <Link to="/">
          <Button>Return home</Button>
        </Link>
      </div>
    </div>
  );
}
