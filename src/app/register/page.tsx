import Link from 'next/link';
import { RegisterForm } from './RegisterForm';

export const metadata = { title: 'Create account — Top 10 Bottom 5' };

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] bg-dotgrid flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden">
      <span className="hidden md:block absolute top-12 left-12 w-2 h-2 bg-[var(--blue)]" />
      <span className="hidden md:block absolute top-12 right-12 w-2 h-2 bg-[var(--red)]" />
      <span className="hidden md:block absolute bottom-12 left-12 w-2 h-2 bg-[var(--yellow)]" />
      <span className="hidden md:block absolute bottom-12 right-12 w-2 h-2 bg-[var(--green)]" />

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <p className="text-[11px] font-display font-bold text-[var(--green)] uppercase tracking-[0.3em] mb-2">
            Join the board
          </p>
          <h1 className="font-display font-extrabold text-4xl text-[var(--text)] leading-tight">
            Create account
          </h1>
          <p className="text-sm font-medium text-[var(--text-muted)] mt-2">
            Get an @handle, start at 1400 ELO.
          </p>
        </div>

        <RegisterForm />

        <p className="text-center text-sm font-medium text-[var(--text-muted)] mt-6">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-[var(--primary)] font-display font-bold hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
