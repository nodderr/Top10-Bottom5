'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface GuessInputProps {
  onGuess: (guess: string) => void;
  disabled?: boolean;
}

export function GuessInput({ onGuess, disabled = false }: GuessInputProps) {
  const [value, setValue] = useState('');
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    const t = value.trim();
    if (!t || disabled) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    onGuess(t);
    setValue('');
    inputRef.current?.focus();
  };

  return (
    <motion.div
      className="flex gap-2"
      animate={shake ? { x: [-6, 6, -6, 6, 0] } : { x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder={disabled ? 'Round over' : 'Type your guess...'}
        disabled={disabled}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        className="flex-1 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-5 py-4 text-[var(--text)] placeholder-[var(--text-muted)] outline-none transition-colors focus:border-[var(--primary)] font-display font-semibold text-lg disabled:opacity-40"
      />
      <button
        onClick={submit}
        disabled={disabled || !value.trim()}
        className="px-8 py-4 rounded-xl font-display font-bold text-base bg-[var(--primary)] text-[var(--primary-text)] hover:bg-[#e6bf3c] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
      >
        GUESS
      </button>
    </motion.div>
  );
}
