import type { ReactNode } from 'react';
import { cls } from '../lib/utils';

export function Card({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return <div onClick={onClick} className={cls('bg-white rounded-2xl card-ring', className)}>{children}</div>;
}

export function SectionTitle({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div>
        {eyebrow && <div className="text-[11px] uppercase tracking-[0.18em] text-brand-600 font-semibold mb-1">{eyebrow}</div>}
        <h2 className="font-display text-[22px] text-ink-800">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function Badge({ children, tone = 'ink', className }: { children: ReactNode; tone?: 'ink'|'brand'|'grass'|'flame'|'honey'|'aqua'|'violet'; className?: string }) {
  const tones = {
    ink: 'bg-ink-100 text-ink-700',
    brand: 'bg-brand-50 text-brand-700',
    grass: 'bg-emerald-50 text-grass-600',
    flame: 'bg-rose-50 text-flame-600',
    honey: 'bg-amber-50 text-honey-500',
    aqua: 'bg-cyan-50 text-aqua-500',
    violet: 'bg-violet-50 text-violet-600',
  };
  return <span className={cls('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium', tones[tone], className)}>{children}</span>;
}

export function Button({
  children, variant = 'primary', size = 'md', icon, className, ...props
}: {
  children?: ReactNode; variant?: 'primary'|'secondary'|'ghost'|'danger'|'success'; size?: 'sm'|'md'|'lg';
  icon?: ReactNode; className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const sizes = {
    sm: 'h-8 px-3 text-[13px] rounded-lg',
    md: 'h-10 px-4 text-sm rounded-lg',
    lg: 'h-12 px-5 text-sm rounded-xl',
  };
  const variants = {
    primary: 'btn-primary text-white hover:shadow-lg',
    secondary: 'bg-white border border-ink-100 text-ink-700 hover:border-brand-300 hover:text-brand-700',
    ghost: 'text-ink-600 hover:bg-ink-100',
    danger: 'bg-flame-500 text-white hover:bg-flame-600',
    success: 'bg-grass-500 text-white hover:bg-grass-600',
  };
  return (
    <button className={cls('inline-flex items-center justify-center gap-2 font-medium transition-all', sizes[size], variants[variant], className)} {...props}>
      {icon}{children}
    </button>
  );
}

export function Modal({ open, onClose, title, children, size = 'lg' }:{
  open: boolean; onClose: () => void; title: string; children: ReactNode; size?: 'md'|'lg'|'xl'
}) {
  if (!open) return null;
  const sizes = { md: 'max-w-md', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className={cls('relative bg-white rounded-2xl shadow-2xl w-full', sizes[size], 'max-h-[90vh] flex flex-col')}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100">
          <h3 className="font-display text-xl text-ink-800">{title}</h3>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700 size-8 rounded-lg hover:bg-ink-100 grid place-items-center">✕</button>
        </div>
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-ink-600 mb-1.5 block">{label}</span>
      {children}
      {hint && <span className="text-[11px] text-ink-400 mt-1 block">{hint}</span>}
    </label>
  );
}

export const inputCls = 'w-full h-10 px-3 rounded-lg bg-white border border-ink-100 text-sm text-ink-800 placeholder:text-ink-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition';
export const textareaCls = 'w-full min-h-20 p-3 rounded-lg bg-white border border-ink-100 text-sm text-ink-800 placeholder:text-ink-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition';
export const selectCls = inputCls + ' appearance-none bg-no-repeat pr-8';

export function PageHeader({ eyebrow, title, subtitle, children }:{ eyebrow?: string; title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-6 mb-6">
      <div>
        {eyebrow && <div className="text-[11px] uppercase tracking-[0.18em] text-brand-600 font-semibold mb-1.5">{eyebrow}</div>}
        <h1 className="font-display text-[32px] leading-[1.05] text-ink-900">{title}</h1>
        {subtitle && <p className="text-ink-500 text-sm mt-1.5 max-w-2xl">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
