import { Search, Bell, MessageCircle, HelpCircle, ChevronDown, Check, CircleUser } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useStore, actions } from '../lib/store';
import { cls } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

export default function Topbar() {
  const clinic = useStore(s => s.clinic);
  const units = useStore(s => s.units);
  const activeUnitId = useStore(s => s.activeUnitId);
  const user = useStore(s => s.user);
  const notifications = useStore(s => s.notifications);
  const patients = useStore(s => s.patients);
  const activeUnit = units.find(u => u.id === activeUnitId);
  const unread = notifications.filter(n => !n.read).length;

  const [unitOpen, setUnitOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setUnitOpen(false); setNotifOpen(false); setProfileOpen(false); setSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const searchResults = search.length >= 2
    ? patients.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.cpf.includes(search) ||
        p.code.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 6)
    : [];

  return (
    <header ref={containerRef} className="sticky top-0 z-30 glass border-b border-ink-100">
      <div className="flex items-center gap-4 px-5 h-16">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-ink-400">Clínica</div>
          <div className="text-sm font-semibold text-ink-800 leading-none">{clinic.name}</div>
        </div>

        {/* Unit switcher */}
        <div className="relative">
          <button
            onClick={() => setUnitOpen(o => !o)}
            className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-lg bg-white border border-ink-100 text-sm text-ink-700 hover:border-brand-300"
          >
            <span className="size-1.5 rounded-full bg-grass-500" />
            <span className="font-medium">{activeUnit?.name}</span>
            <ChevronDown className="size-3.5 text-ink-400" />
          </button>
          {unitOpen && (
            <div className="absolute left-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl ring-1 ring-ink-100 overflow-hidden">
              <div className="px-4 py-3 text-[11px] uppercase tracking-wider text-ink-400 border-b border-ink-100">Unidades</div>
              {units.map(u => (
                <button key={u.id} onClick={() => { actions.setActiveUnit(u.id); setUnitOpen(false); }}
                  className="w-full flex items-start gap-3 px-4 py-3 hover:bg-ink-50 text-left">
                  <div className={cls('mt-1 size-2 rounded-full', u.id === activeUnitId ? 'bg-grass-500' : 'bg-ink-200')} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink-800">{u.name}</div>
                    <div className="text-xs text-ink-500 truncate">{u.address}</div>
                  </div>
                  {u.id === activeUnitId && <Check className="size-4 text-grass-500" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-ink-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
            placeholder="Buscar paciente, prontuário, agendamento…"
            className="w-full h-10 pl-10 pr-4 rounded-lg bg-white border border-ink-100 text-sm text-ink-800 placeholder:text-ink-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-ink-400 bg-ink-50 px-1.5 py-0.5 rounded border border-ink-100">⌘K</kbd>
          {searchOpen && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-xl ring-1 ring-ink-100 overflow-hidden">
              <div className="px-4 py-2 text-[11px] uppercase tracking-wider text-ink-400 border-b border-ink-100">Pacientes</div>
              {searchResults.map(p => (
                <button key={p.id} onClick={() => { navigate(`/pacientes/${p.id}`); setSearchOpen(false); setSearch(''); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-ink-50 text-left">
                  <div className="size-8 rounded-full bg-brand-50 text-brand-700 grid place-items-center text-xs font-semibold">
                    {p.name.split(' ').slice(0,2).map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-ink-800 truncate">{p.name}</div>
                    <div className="text-xs text-ink-400">{p.code} · {p.cpf}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button className="relative size-10 rounded-lg hover:bg-ink-100 grid place-items-center text-ink-500" title="Mensagens">
            <MessageCircle className="size-5" />
            <span className="absolute top-2 right-2 size-1.5 rounded-full bg-aqua-500" />
          </button>
          <div className="relative">
            <button onClick={() => setNotifOpen(o => !o)} className="relative size-10 rounded-lg hover:bg-ink-100 grid place-items-center text-ink-500" title="Notificações">
              <Bell className="size-5" />
              {unread > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 rounded-full bg-flame-500 text-white text-[10px] font-semibold grid place-items-center">{unread}</span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-xl ring-1 ring-ink-100 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-ink-100">
                  <div className="text-sm font-semibold text-ink-800">Notificações</div>
                  <button onClick={() => actions.markAllRead()} className="text-xs text-brand-600 hover:text-brand-700">Marcar todas como lidas</button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map(n => (
                    <button key={n.id} onClick={() => actions.markNotificationRead(n.id)}
                      className={cls('w-full text-left px-4 py-3 hover:bg-ink-50 flex items-start gap-3', !n.read && 'bg-brand-50/30')}>
                      <div className={cls('mt-1 size-2 rounded-full',
                        n.kind === 'success' && 'bg-grass-500',
                        n.kind === 'warn' && 'bg-honey-500',
                        n.kind === 'info' && 'bg-brand-500',
                      )} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-ink-800">{n.title}</div>
                        <div className="text-xs text-ink-500 mt-0.5">{n.body}</div>
                        <div className="text-[11px] text-ink-400 mt-1">{n.at}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button className="size-10 rounded-lg hover:bg-ink-100 grid place-items-center text-ink-500" title="Ajuda">
            <HelpCircle className="size-5" />
          </button>

          <div className="relative">
            <button onClick={() => setProfileOpen(o => !o)} className="ml-2 flex items-center gap-2 pr-3 pl-1 py-1 rounded-full hover:bg-ink-100">
              <div className="size-8 rounded-full bg-gradient-to-br from-aqua-400 to-brand-500 grid place-items-center text-white text-xs font-semibold">HA</div>
              <div className="text-left">
                <div className="text-sm font-medium text-ink-800 leading-none">{user.name.split(' ').slice(0,2).join(' ')}</div>
                <div className="text-[11px] text-ink-400">Médico · Admin</div>
              </div>
              <ChevronDown className="size-3.5 text-ink-400" />
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl ring-1 ring-ink-100 overflow-hidden">
                <div className="px-4 py-3 border-b border-ink-100">
                  <div className="text-sm font-semibold text-ink-800">{user.name}</div>
                  <div className="text-xs text-ink-500">{user.email}</div>
                </div>
                <button onClick={() => navigate('/configuracoes')} className="w-full text-left px-4 py-2.5 text-sm hover:bg-ink-50 flex items-center gap-2">
                  <CircleUser className="size-4 text-ink-500" /> Meu perfil
                </button>
                <button onClick={() => { actions.resetDemo(); window.location.reload(); }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-ink-50 text-flame-600">
                  Restaurar dados demo
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
