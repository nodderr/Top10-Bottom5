'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRoom } from '@/hooks/useRoom';
import { Leaderboard } from './Leaderboard';
import { Button } from '@/components/ui';
import { useRouter } from 'next/navigation';

// Simple confetti particle
function Confetti() {
  const colors = ['#FFD54A', '#FF5A5A', '#3DDC84', '#A78BFA', '#60A5FA', '#FB923C'];
  const count = 60;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {Array.from({ length: count }).map((_, i) => {
        const color = colors[i % colors.length];
        const left = `${Math.random() * 100}%`;
        const delay = Math.random() * 3;
        const duration = 3 + Math.random() * 3;
        const size = 6 + Math.random() * 8;
        const isCircle = Math.random() > 0.5;

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left,
              top: `-${size * 2}px`,
              width: size,
              height: size,
              backgroundColor: color,
              borderRadius: isCircle ? '50%' : '2px',
              animation: `confetti-fall ${duration}s ${delay}s ease-in forwards`,
              opacity: 0.9,
            }}
          />
        );
      })}
    </div>
  );
}

export function GameEndScreen() {
  const { gameEndState, roomState, myId, isHost, playAgain } = useRoom();
  const router = useRouter();

  if (!gameEndState || !roomState) return null;

  const { scores, players, winnerName, winnerId } = gameEndState;
  const sorted = [...players].sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0));
  const top3 = sorted.slice(0, 3);

  const handlePlayAgain = () => {
    playAgain();
  };

  const handleHome = () => {
    router.push('/');
  };

  return (
    <div className="relative min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center p-4 overflow-hidden">
      <Confetti />

      <div className="relative z-10 w-full max-w-lg flex flex-col gap-6">
        {/* Winner banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', damping: 15, delay: 0.2 }}
          className="text-center"
        >
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-2">Game Over</p>
          <h1 className="font-display font-black text-4xl text-[var(--primary)] mb-1">
            🏆 {winnerName}
          </h1>
          <p className="text-[var(--text-muted)] text-base">wins the game!</p>
        </motion.div>

        {/* Podium */}
        {top3.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-end justify-center gap-3"
          >
            {/* 2nd place */}
            {top3[1] && (
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-[var(--bg-card)] border-2 border-[var(--rank-silver)] flex items-center justify-center font-display font-black text-lg text-[var(--rank-silver)]">
                  {top3[1].name.slice(0, 2).toUpperCase()}
                </div>
                <p className="text-xs font-bold text-[var(--text)] text-center max-w-[60px] truncate">{top3[1].name}</p>
                <p className="text-lg font-black text-[var(--rank-silver)] font-display">{scores[top3[1].id] ?? 0}</p>
                <div className="w-16 h-12 bg-[var(--bg-card-elevated)] border border-[var(--border)] rounded-t-lg flex items-center justify-center">
                  <span className="text-2xl">🥈</span>
                </div>
              </div>
            )}

            {/* 1st place */}
            {top3[0] && (
              <div className="flex flex-col items-center gap-2">
                <motion.div
                  animate={{ y: [-4, 4, -4] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-16 h-16 rounded-full bg-[var(--bg-card)] border-2 border-[var(--rank-gold)] flex items-center justify-center font-display font-black text-xl"
                  style={{ color: 'var(--rank-gold)', boxShadow: '0 0 20px rgba(255,215,0,0.4)' }}
                >
                  {top3[0].name.slice(0, 2).toUpperCase()}
                </motion.div>
                <p className="text-sm font-bold text-[var(--text)] text-center max-w-[70px] truncate">{top3[0].name}</p>
                <p className="text-2xl font-black text-[var(--primary)] font-display">{scores[top3[0].id] ?? 0}</p>
                <div className="w-16 h-20 bg-[rgba(255,213,74,0.1)] border border-[rgba(255,213,74,0.3)] rounded-t-lg flex items-center justify-center">
                  <span className="text-3xl">🥇</span>
                </div>
              </div>
            )}

            {/* 3rd place */}
            {top3[2] && (
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-[var(--bg-card)] border-2 border-[var(--rank-bronze)] flex items-center justify-center font-display font-black text-lg text-[var(--rank-bronze)]">
                  {top3[2].name.slice(0, 2).toUpperCase()}
                </div>
                <p className="text-xs font-bold text-[var(--text)] text-center max-w-[60px] truncate">{top3[2].name}</p>
                <p className="text-lg font-black text-[var(--rank-bronze)] font-display">{scores[top3[2].id] ?? 0}</p>
                <div className="w-16 h-8 bg-[var(--bg-card-elevated)] border border-[var(--border)] rounded-t-lg flex items-center justify-center">
                  <span className="text-2xl">🥉</span>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Full leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass rounded-2xl p-4 border border-[var(--border)]"
        >
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest font-semibold mb-3">Final Scores</p>
          <Leaderboard players={players} scores={scores} myId={myId} />
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col gap-3"
        >
          {isHost && (
            <Button onClick={handlePlayAgain} size="lg" className="w-full font-display tracking-widest">
              🔄 PLAY AGAIN
            </Button>
          )}
          <Button onClick={handleHome} variant="secondary" size="lg" className="w-full font-display tracking-widest">
            🏠 HOME
          </Button>
          {!isHost && (
            <p className="text-center text-xs text-[var(--text-muted)]">
              Waiting for host to start a new game...
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
