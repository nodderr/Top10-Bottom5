import Link from 'next/link';
import { LoginForm } from './LoginForm';

export const metadata = { title: 'Sign in — Top 10 Bottom 5' };

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] bg-dotgrid flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden">
      <span className="hidden md:block absolute top-12 left-12 w-2 h-2 bg-[var(--blue)]" />
      <span className="hidden md:block absolute top-12 right-12 w-2 h-2 bg-[var(--red)]" />
      <span className="hidden md:block absolute bottom-12 left-12 w-2 h-2 bg-[var(--yellow)]" />
      <span className="hidden md:block absolute bottom-12 right-12 w-2 h-2 bg-[var(--green)]" />

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <p className="text-[11px] font-display font-bold text-[var(--blue)] uppercase tracking-[0.3em] mb-2">
            Welcome back
          </p>
          <h1 className="font-display font-extrabold text-4xl text-[var(--text)] leading-tight">
            Sign in
          </h1>
          <p className="text-sm font-medium text-[var(--text-muted)] mt-2">
            Climb the leaderboard. Track your ELO.
          </p>
        </div>

        <LoginForm />

        <p className="text-center text-sm font-medium text-[var(--text-muted)] mt-6">
          New here?{' '}
          <Link
            href="/register"
            className="text-[var(--primary)] font-display font-bold hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
