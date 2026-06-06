import { Link, Navigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { OrnateDivider } from '../components/ui/OrnateDivider';
import { useAuth } from '../hooks/useAuth';

export function HomePage() {
  const { isAuthenticated, status } = useAuth();

  // Once we know the user is signed in, the marketing landing has no value —
  // send them straight into their dashboard.
  if (status === 'authenticated' && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-16 py-8 sm:py-16">
      <section className="space-y-8 text-center">
        <p className="font-ui text-[10px] uppercase tracking-[0.4em] text-text-accent/70">
          ✦ Verser ✦
        </p>
        <h1 className="font-display text-4xl leading-tight tracking-tight text-text-primary sm:text-6xl">
          The World-Aware
          <br />
          <span className="text-text-accent">Writing Studio</span>
        </h1>
        <p className="mx-auto max-w-xl text-base leading-relaxed text-text-secondary">
          Worldbuilding and AI-assisted writing for series fiction. Your universe stays
          consistent, your voice stays yours.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/register">
            <Button size="lg">Start writing</Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="ghost">
              Login
            </Button>
          </Link>
        </div>
      </section>

      <OrnateDivider variant="diamond" />

      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
