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
    const trimmed = value.trim();
    if (!trimmed || disabled) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    onGuess(trimmed);
    setValue('');
    inputRef.current?.focus();
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') submit();
  };

  return (
    <motion.div
      className={`flex gap-2 w-full ${shake ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}
      animate={shake ? { x: [-4, 4, -4, 4, 0] } : { x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKey}
        placeholder={disabled ? 'Round ended...' : 'Type your guess and press Enter'}
        disabled={disabled}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        className="flex-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-3.5 text-[var(--text)] placeholder-[var(--text-muted)] outline-none transition-all duration-200 focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_var(--primary-glow)] font-display font-600 text-base disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <button
        onClick={submit}
        disabled={disabled || !value.trim()}
        className="px-5 py-3.5 rounded-xl font-display font-bold text-sm bg-[var(--primary)] text-[#0F1115] hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 active:scale-95 flex-shrink-0 hover:shadow-[0_0_20px_var(--primary-glow)]"
      >
        GUESS
      </button>
    </motion.div>
  );
}
