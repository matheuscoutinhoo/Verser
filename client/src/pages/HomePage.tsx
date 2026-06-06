import { Link, Navigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';

export function HomePage() {
  const { isAuthenticated, status } = useAuth();

  // Once we know the user is signed in, the marketing landing has no value —
  // send them straight into their dashboard.
  if (status === 'authenticated' && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-12">
      <section className="space-y-6 text-center">
        <h1 className="font-display text-5xl tracking-wider text-text-accent">
          The World-Aware Writing Studio
        </h1>
        <p className="mx-auto max-w-2xl text-text-secondary">
          Worldbuilding and AI-assisted writing for series fiction. Your universe stays consistent,
          your voice stays yours.
        </p>
        <div className="flex justify-center gap-4">
          <Link to="/register">
            <Button size="lg">Start writing</Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="secondary">
              Login
            </Button>
          </Link>
        </div>
      </section>

      <div className="ornate-divider" />

      <section className="grid gap-6 md:grid-cols-3">
        <Card title="Deep Worldbuilding">
          Characters, locations, systems, lore, and immutable laws — all linked, all searchable.
        </Card>
        <Card title="Context-Aware AI">
          The AI knows your world. Suggestions stay consistent with every law and character you
          define.
        </Card>
        <Card title="Voice Preserved">
          Fragments and options, not bulk paragraphs. You always have the final word.
        </Card>
      </section>
    </div>
  );
}
