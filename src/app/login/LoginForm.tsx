'use client';

import { FormEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search?.get('next') || '/';
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 bg-[var(--surface)] border border-[var(--border)] p-6 shadow-[var(--shadow-sm)]">
      <Input
        type="email"
        label="EMAIL"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoFocus
      />
      <Input
        type="password"
        label="PASSWORD"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {error && (
        <p className="text-sm font-medium text-[var(--danger)] -mt-1" role="alert">
          {error}
        </p>
      )}
      <Button
        type="submit"
        size="lg"
        loading={submitting}
        className="w-full tracking-[0.22em] mt-1"
      >
        SIGN IN
      </Button>
    </form>
  );
}
