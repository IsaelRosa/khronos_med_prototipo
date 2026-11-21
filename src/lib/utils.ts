export function cls(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(' ');
}

export function brl(n: number) {
  return n.toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
}

export function fmtDate(iso: string | null | undefined) {
  if (!iso) return '-';
  const [y,m,d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function fmtDateLong(iso: string | null | undefined) {
  if (!iso) return '-';
  const d = new Date(iso+'T00:00:00');
  return d.toLocaleDateString('pt-BR', { weekday:'long', day:'2-digit', month:'long', year:'numeric' });
}

export function age(birth: string) {
  if (!birth) return '';
  const d = new Date(birth);
  const diff = Date.now() - d.getTime();
  const a = new Date(diff);
  return Math.abs(a.getUTCFullYear() - 1970);
}

export function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0,2).map(p => p[0]).join('').toUpperCase();
}

export function todayISO() {
  const d = new Date();
  const pad = (n:number) => n.toString().padStart(2,'0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}

export function addDays(iso: string, delta: number) {
  const d = new Date(iso+'T00:00:00');
  d.setDate(d.getDate()+delta);
  const pad = (n:number) => n.toString().padStart(2,'0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}

export function minutesBetween(a: string | null | undefined, b: string | null | undefined) {
  if (!a || !b) return 0;
  const [ah,am] = a.split(':').map(Number);
  const [bh,bm] = b.split(':').map(Number);
  return (bh*60+bm) - (ah*60+am);
}

export function formatPhone(phone: string) {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`;
  }
  return phone;
}
