import type { AppointmentStatus } from './types';

export const STATUS_META: Record<AppointmentStatus, { label: string; color: string; bg: string; dot: string; ring: string }> = {
  agendado:       { label:'Agendado',      color:'text-ink-700',   bg:'bg-ink-100',    dot:'bg-ink-400',       ring:'ring-ink-200' },
  confirmado:     { label:'Confirmado',    color:'text-brand-700', bg:'bg-brand-50',   dot:'bg-brand-500',     ring:'ring-brand-200' },
  aguardando:     { label:'Aguardando',    color:'text-honey-500', bg:'bg-amber-50',   dot:'bg-honey-500',     ring:'ring-amber-200' },
  em_atendimento: { label:'Em atendimento',color:'text-aqua-500',  bg:'bg-cyan-50',    dot:'bg-aqua-500',      ring:'ring-cyan-200' },
  atendido:       { label:'Atendido',      color:'text-grass-600', bg:'bg-emerald-50', dot:'bg-grass-500',     ring:'ring-emerald-200' },
  falta:          { label:'Não compareceu',color:'text-flame-600', bg:'bg-rose-50',    dot:'bg-flame-500',     ring:'ring-rose-200' },
  cancelado:      { label:'Cancelado',     color:'text-ink-500',   bg:'bg-ink-100',    dot:'bg-ink-400',       ring:'ring-ink-200' },
  reagendado:     { label:'Reagendado',    color:'text-violet-600',bg:'bg-violet-50',  dot:'bg-violet-500',    ring:'ring-violet-200' },
};
