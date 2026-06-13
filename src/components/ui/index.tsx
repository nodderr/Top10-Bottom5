'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================
// Button
// ============================================================
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
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
    'inline-flex items-center justify-center font-display font-bold tracking-wide ' +
    'cursor-pointer select-none transition-[background,border,box-shadow,transform] duration-150 ' +
    'disabled:opacity-40 disabled:cursor-not-allowed active:translate-y-px ' +
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ' +
    'focus-visible:outline-[var(--primary)]';

  const variants: Record<string, string> = {
    primary:
      'bg-[var(--primary)] text-[var(--primary-text)] shadow-[var(--shadow-sm)] ' +
      'hover:bg-[var(--primary-2)] hover:shadow-[var(--shadow)]',
    secondary:
      'bg-[var(--surface)] text-[var(--text)] border border-[var(--border-strong)] ' +
      'hover:bg-[var(--surface-2)] hover:border-[var(--text-dim)]',
    ghost:
      'bg-transparent text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]',
    danger:
      'bg-[var(--danger)] text-white shadow-[var(--shadow-sm)] hover:brightness-95 hover:shadow-[var(--shadow)]',
  };

  const sizes: Record<string, string> = {
    sm: 'px-3.5 py-1.5 text-sm gap-1.5',
    md: 'px-5 py-2.5 text-sm gap-2',
    lg: 'px-7 py-3.5 text-base gap-2.5',
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
          Loading…
        </>
      ) : (
        children
      )}
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
        <label className="text-[11px] font-display font-semibold text-[var(--text-muted)] uppercase tracking-[0.18em]">
          {label}
        </label>
      )}
      <input
        className={
          'w-full bg-[var(--surface)] border border-[var(--border)] rounded-none ' +
          'px-4 py-3 text-[var(--text)] placeholder-[var(--text-dim)] text-base ' +
          'outline-none transition-colors duration-150 ' +
          'focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_rgba(26,115,232,0.12)] ' +
          (error ? 'border-[var(--danger)] ' : '') +
          className
        }
        {...props}
      />
      {error && <p className="text-xs font-medium text-[var(--danger)]">{error}</p>}
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
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-[var(--overlay)] backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <div
              role="dialog"
              aria-modal="true"
              className="w-full max-w-md bg-[var(--surface)] border border-[var(--border-strong)] shadow-[var(--shadow-lg)] p-8 box-border"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6 w-full">
                <h2 className="font-display font-bold text-xl text-[var(--text)] leading-none">{title}</h2>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="text-[var(--text-muted)] hover:text-[var(--text)] text-2xl w-8 h-8 flex items-center justify-center leading-none transition-colors"
                >
                  ×
                </button>
              </div>
              <div className="flex flex-col gap-5 w-full">{children}</div>
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
  const accent: Record<string, string> = {
    success: 'border-l-[var(--success)]',
    error:   'border-l-[var(--danger)]',
    info:    'border-l-[var(--primary)]',
  };
  const labelColor: Record<string, string> = {
    success: 'text-[var(--success)]',
    error:   'text-[var(--danger)]',
    info:    'text-[var(--primary)]',
  };

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 bg-[var(--surface)] border border-[var(--border)] border-l-[3px] shadow-[var(--shadow)] ${accent[type]}`}
    >
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-display font-semibold ${labelColor[type]} leading-tight`}>{message}</p>
        {points !== undefined && (
          <p className="text-xs font-bold text-[var(--text-muted)] mt-0.5 tabular">
            +{points.toLocaleString()} pts
          </p>
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
            initial={{ opacity: 0, x: 24, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 24, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            <Toast {...t} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
