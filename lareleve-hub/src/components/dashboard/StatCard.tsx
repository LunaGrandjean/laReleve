import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  variant?: 'noir' | 'primary' | 'success' | 'accent';
  onClick?: () => void;
}

export default function StatCard({ title, value, icon, variant = 'primary', onClick }: StatCardProps) {
  const accent =
    variant === 'success'
      ? 'text-success'
      : variant === 'noir'
        ? 'text-white/60'
        : variant === 'accent'
          ? 'text-orange-300'
          : 'text-primary';

  return (
    <div
      className={`stat-card group flex items-center justify-between p-5 animate-fade-in ${onClick ? 'cursor-pointer hover:border-primary/40' : ''}`}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={event => {
        if (onClick && (event.key === 'Enter' || event.key === ' ')) onClick();
      }}
    >
      <div>
        <p className="stat-label">{title}</p>
        <p className="stat-value">{String(value).padStart(2, '0')}</p>
      </div>
      <div className={`rounded-md border border-white/[0.08] bg-white/[0.04] p-3 ${accent} transition-default group-hover:border-primary/30`}>
        {icon}
      </div>
    </div>
  );
}
