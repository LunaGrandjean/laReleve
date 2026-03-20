import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  variant?: 'noir' | 'primary' | 'success' | 'accent';
}

const variantStyles: Record<string, string> = {
  noir: 'bg-noir text-primary-foreground',
  primary: 'bg-primary text-primary-foreground',
  success: 'bg-success text-success-foreground',
  accent: 'bg-accent text-accent-foreground',
};

export default function StatCard({ title, value, icon, variant = 'primary' }: StatCardProps) {
  return (
    <div className={cn('p-5 rounded-lg flex items-center justify-between shadow-card animate-fade-in', variantStyles[variant])}>
      <div>
        <p className="text-xs uppercase tracking-wider font-medium opacity-80">{title}</p>
        <p className="text-3xl font-bold mt-1">{value}</p>
      </div>
      <div className="p-3 rounded-full bg-background/20">{icon}</div>
    </div>
  );
}
