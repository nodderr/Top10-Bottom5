'use client';

export function Logo() {
  return (
    <div className="text-center select-none flex flex-col items-center">
      {/* Top 10 */}
      <h1 className="font-display font-bold tracking-tight leading-none" style={{ fontSize: 'clamp(3.5rem, 10vw, 6.5rem)' }}>
        <span style={{ color: '#4285F4' }}>T</span>
        <span style={{ color: '#EA4335' }}>o</span>
        <span style={{ color: '#FBBC05' }}>p</span>
        <span style={{ color: '#4285F4' }} className="ml-4">1</span>
        <span style={{ color: '#34A853' }}>0</span>
      </h1>
      
      {/* Bottom 5 */}
      <h2 className="font-display font-bold tracking-tight leading-none mt-2" style={{ fontSize: 'clamp(2rem, 6vw, 3.5rem)' }}>
        <span style={{ color: '#EA4335' }}>B</span>
        <span style={{ color: '#4285F4' }}>o</span>
        <span style={{ color: '#FBBC05' }}>t</span>
        <span style={{ color: '#34A853' }}>t</span>
        <span style={{ color: '#EA4335' }}>o</span>
        <span style={{ color: '#4285F4' }}>m</span>
        <span style={{ color: '#34A853' }} className="ml-2.5">5</span>
      </h2>

      <p className="text-[var(--text-muted)] text-sm font-bold tracking-widest uppercase mt-6">
        GUESS WHAT THE AI RANKED
      </p>
    </div>
  );
}
