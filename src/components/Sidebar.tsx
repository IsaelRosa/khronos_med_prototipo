import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, Users, FileText, Stethoscope, PillBottle, Microscope,
  Video, Building2, Wallet, BarChart3, MessageSquare, Settings, ChevronsLeft, Activity
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { cls } from '../lib/utils';
import { useStore } from '../lib/store';

const nav = [
  { to:'/painel', label:'Painel', icon: LayoutDashboard },
  { to:'/agenda', label:'Agenda', icon: Calendar },
  { to:'/pacientes', label:'Pacientes', icon: Users },
  { to:'/prontuarios', label:'Prontuários', icon: FileText },
  { to:'/atendimento', label:'Atendimento', icon: Stethoscope },
  { to:'/prescricoes', label:'Prescrições', icon: PillBottle },
  { to:'/exames', label:'Exames', icon: Microscope },
  { to:'/teleconsulta', label:'Teleconsulta', icon: Video },
  { to:'/gestao', label:'Gestão', icon: Building2 },
  { to:'/financeiro', label:'Financeiro', icon: Wallet },
  { to:'/relatorios', label:'Relatórios', icon: BarChart3 },
  { to:'/comunicacao', label:'Comunicação', icon: MessageSquare },
  { to:'/configuracoes', label:'Configurações', icon: Settings },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const user = useStore(s => s.user);

  useEffect(() => {
    const saved = localStorage.getItem('khronos-sidebar');
    if (saved === '1') setCollapsed(true);
  }, []);
  useEffect(() => { localStorage.setItem('khronos-sidebar', collapsed ? '1' : '0'); }, [collapsed]);

  return (
    <aside className={cls(
      'relative bg-gradient-to-b from-brand-900 via-brand-800 to-brand-900 text-ink-100 flex flex-col',
      'transition-[width] duration-300 ease-out shrink-0',
      collapsed ? 'w-[72px]' : 'w-[248px]'
    )}>
      <div className="absolute inset-0 pointer-events-none opacity-30"
           style={{backgroundImage:'radial-gradient(1200px 400px at -10% -10%, rgba(255,255,255,0.08), transparent 50%)'}} />

      <div className={cls('relative flex items-center gap-3 px-4 pt-5 pb-6', collapsed && 'justify-center px-2')}>
        <div className="size-10 rounded-xl bg-white/10 backdrop-blur-sm grid place-items-center ring-1 ring-white/20">
          <Activity className="size-5 text-white" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="font-display text-lg leading-tight text-white tracking-tight">Khronos</div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-brand-200/80">Saúde · SaaS</div>
          </div>
        )}
      </div>

      <nav className="relative flex-1 overflow-y-auto no-scrollbar px-2 pb-6">
        <div className={cls('text-[11px] uppercase tracking-widest text-brand-300/70 px-3 mb-2', collapsed && 'sr-only')}>Principal</div>
        <ul className="space-y-0.5">
          {nav.map(item => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({isActive}) => cls(
                  'group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-medium',
                  'transition-colors',
                  isActive ? 'bg-white text-brand-900 shadow-sm' : 'text-brand-100/80 hover:bg-white/10 hover:text-white',
                  collapsed && 'justify-center px-2'
                )}
                end={item.to === '/painel'}
              >
                {({isActive}) => (
                  <>
                    <item.icon className={cls('size-[18px] shrink-0', isActive ? 'text-brand-600' : 'text-brand-200/80 group-hover:text-white')} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                    {isActive && !collapsed && <span className="ml-auto size-1.5 rounded-full bg-aqua-500" />}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className={cls('relative border-t border-white/10 p-3 flex items-center gap-3', collapsed && 'justify-center')}>
        <div className="size-9 rounded-full bg-gradient-to-br from-aqua-400 to-brand-500 grid place-items-center text-white text-sm font-semibold shrink-0">
          HA
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <div className="text-sm text-white truncate">{user.name}</div>
            <div className="text-[11px] text-brand-200/70 truncate">CRM-SP 128.441 · Cardiologia</div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          className={cls('ml-auto text-brand-200/70 hover:text-white p-1 rounded', collapsed && 'ml-0')}
          title={collapsed ? 'Expandir' : 'Recolher'}
        >
          <ChevronsLeft className={cls('size-4 transition-transform', collapsed && 'rotate-180')} />
        </button>
      </div>
    </aside>
  );
}
