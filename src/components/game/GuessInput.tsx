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
      setTimeout(() => setShake(false), 380);
      return;
    }
    onGuess(t);
    setValue('');
    inputRef.current?.focus();
  };

  return (
    <motion.div
      className="flex gap-2 w-full"
      animate={shake ? { x: [-6, 6, -6, 6, 0] } : { x: 0 }}
      transition={{ duration: 0.32 }}
    >
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder={disabled ? 'Round over' : 'Type your guess…'}
        disabled={disabled}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        maxLength={80}
        className="flex-1 bg-[var(--surface)] border border-[var(--border)] px-5 py-4 text-[var(--text)] placeholder-[var(--text-dim)] outline-none transition-all duration-150 focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_rgba(26,115,232,0.12)] font-display font-semibold text-lg disabled:opacity-40"
      />
      <button
        onClick={submit}
        disabled={disabled || !value.trim()}
        className="px-7 py-4 font-display font-extrabold text-base tracking-[0.18em] bg-[var(--primary)] text-[var(--primary-text)] shadow-[var(--shadow-sm)] hover:bg-[var(--primary-2)] hover:shadow-[var(--shadow)] active:translate-y-px disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[var(--primary)] transition-[background,box-shadow,transform] duration-150 shrink-0"
      >
        GUESS
      </button>
    </motion.div>
  );
}
