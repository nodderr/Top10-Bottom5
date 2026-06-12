'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';

export function RegisterForm() {
  const router = useRouter();
  const { register } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [handle, setHandle] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register({
        email: email.trim(),
        password,
        handle: handle.trim().toLowerCase(),
        displayName: displayName.trim(),
      });
      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create account.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 bg-[var(--surface)] border border-[var(--border)] p-6 shadow-[var(--shadow-sm)]">
      <Input
        type="text"
        label="DISPLAY NAME"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        maxLength={40}
        required
        autoFocus
      />
      <Input
        type="text"
        label="HANDLE"
        value={handle}
        onChange={(e) => setHandle(e.target.value.toLowerCase())}
        placeholder="lowercase letters / digits / underscore"
        maxLength={20}
        required
      />
      <Input
        type="email"
        label="EMAIL"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input
        type="password"
        label="PASSWORD"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="At least 8 characters"
        minLength={8}
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
        CREATE ACCOUNT
      </Button>
    </form>
  );
}
