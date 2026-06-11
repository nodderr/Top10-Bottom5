'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================
// Button
// ============================================================
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center font-display font-bold tracking-wide cursor-pointer transition-colors duration-150 select-none disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]';

  const variants = {
    primary:  'bg-[var(--primary)] text-[var(--primary-text)] hover:bg-[#e6bf3c]',
    secondary: 'bg-transparent text-[var(--text)] border border-[var(--border-strong)] hover:border-[var(--primary)] hover:text-[var(--primary)]',
    ghost:    'bg-transparent text-[var(--text-muted)] hover:text-[var(--text)]',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-md gap-1.5',
    md: 'px-5 py-2.5 text-sm rounded-lg gap-2',
    lg: 'px-6 py-3 text-base rounded-lg gap-2',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Loading...
        </>
      ) : children}
    </button>
  );
}

// ============================================================
// Input
// ============================================================
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest">
          {label}
        </label>
      )}
      <input
        className={`w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-4 py-3 text-[var(--text)] placeholder-[var(--text-muted)] outline-none transition-colors focus:border-[var(--primary)] text-base ${error ? 'border-[var(--danger)]' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
    </div>
  );
}

// ============================================================
// Modal
// ============================================================
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/60 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.18 }}
          >
            <div
              className="bg-[var(--surface)] border border-[var(--border)] rounded-xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display font-bold text-lg text-[var(--text)]">{title}</h2>
                <button
                  onClick={onClose}
                  className="text-[var(--text-muted)] hover:text-[var(--text)] text-xl w-8 h-8 flex items-center justify-center"
                >
                  ×
                </button>
              </div>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================================
// Toast
// ============================================================
interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  points?: number;
}

export function Toast({ type, message, points }: ToastProps) {
  const styles = {
    success: 'border-l-[var(--success)] text-[var(--success)]',
    error:   'border-l-[var(--danger)]  text-[var(--danger)]',
    info:    'border-l-[var(--primary)] text-[var(--primary)]',
  };

  return (
    <div className={`flex items-start gap-3 px-4 py-3 bg-[var(--surface)] border border-[var(--border)] border-l-2 rounded-lg toast-enter ${styles[type]}`}>
      <div>
        <p className="text-sm font-semibold text-[var(--text)]">{message}</p>
        {points !== undefined && (
          <p className={`text-xs font-bold mt-0.5`}>+{points} pts</p>
        )}
      </div>
    </div>
  );
}

// ============================================================
// ToastContainer
// ============================================================
export function ToastContainer({ toasts }: { toasts: ToastProps[] }) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-72 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.18 }}
          >
            <Toast {...t} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
