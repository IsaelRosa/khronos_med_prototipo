import { Activity, ArrowRight, CalendarDays, Check, ClipboardList, HeartPulse, LayoutDashboard, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import consultaMedica from '../assets/consulta-medica.png';

const features = [
  {
    icon: CalendarDays,
    title: 'Agenda em perspectiva',
    description: 'Visualize os horários da equipe e acompanhe os atendimentos do dia.',
    color: 'bg-blue-50 text-brand-600',
  },
  {
    icon: UsersRound,
    title: 'Pacientes organizados',
    description: 'Consulte cadastros e encontre informações para apoiar a rotina da clínica.',
    color: 'bg-teal-50 text-teal-700',
  },
  {
    icon: ClipboardList,
    title: 'Atendimento conectado',
    description: 'Acesse o histórico e registre rascunhos do atendimento em um só lugar.',
    color: 'bg-violet-50 text-violet-700',
  },
];

const plans = [
  { name: 'Starter', price: 90, description: 'Para iniciar a organização do consultório.', features: ['Agenda de atendimentos', 'Cadastro de pacientes', 'Acesso ao painel'] },
  { name: 'Plus', price: 119, description: 'Para apoiar uma rotina com mais atendimentos.', features: ['Agenda da equipe', 'Consulta de pacientes', 'Rascunhos de atendimento'] },
  { name: 'Pro', price: 149, description: 'Para clínicas que também acompanham a gestão financeira.', features: ['Organização da agenda', 'Histórico de atendimentos', 'Acesso para a equipe'] },
  { name: 'Premium', price: 259, description: 'Para clínicas com objetivos de crescimento.', features: ['Rotinas da clínica', 'Organização dos pacientes', 'Acompanhamento da equipe'] },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-ink-900">
      <header className="border-b border-ink-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link to="/" aria-label="Khronos Med, início" className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-brand-700 text-white"><Activity className="size-6" /></span>
            <span className="font-display text-2xl leading-none">Khronos <span className="text-brand-600">Med</span></span>
          </Link>
          <nav aria-label="Navegação principal" className="flex items-center gap-4 sm:gap-8">
            <a href="#recursos" className="hidden text-sm font-semibold text-ink-600 hover:text-brand-600 sm:inline">Recursos</a>
            <a href="#planos" className="text-sm font-semibold text-ink-600 hover:text-brand-600">Planos</a>
            <a href="#como-funciona" className="hidden text-sm font-semibold text-ink-600 hover:text-brand-600 md:inline">Como funciona</a>
            <Link to="/login" className="rounded-full bg-brand-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600">
              Acessar sistema
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="overflow-hidden bg-gradient-to-br from-ink-50 via-white to-blue-50">
          <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-2 lg:gap-16 lg:py-28">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-brand-700">
                <span className="size-2 rounded-full bg-teal-500" /> Gestão clínica em um só lugar
              </div>
              <h1 className="font-display text-5xl leading-[1.08] tracking-tight sm:text-6xl xl:text-7xl">
                Mais tempo para <span className="text-brand-600">cuidar de pessoas.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-ink-600">
                Organize a agenda, acompanhe seus pacientes e simplifique o dia a dia da sua equipe com o Khronos Med.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Link to="/login" className="inline-flex items-center gap-3 rounded-full bg-brand-700 px-7 py-4 text-sm font-bold text-white shadow-lg shadow-blue-900/15 transition hover:bg-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600">
                  Entrar na plataforma <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <a href="#recursos" className="inline-flex items-center gap-2 rounded-full px-4 py-4 text-sm font-bold text-ink-700 hover:text-brand-600">
                  Conhecer recursos <ArrowRight className="size-4" aria-hidden="true" />
                </a>
              </div>
              <p className="mt-7 text-sm text-ink-500">Um protótipo pensado para a rotina de clínicas e consultórios.</p>
            </div>

            <div className="relative mx-auto w-full max-w-xl">
              <div className="absolute -left-8 top-10 size-40 rounded-full bg-blue-200/50 blur-3xl" />
              <div className="absolute -right-8 bottom-0 size-48 rounded-full bg-teal-100 blur-3xl" />
              <div className="relative overflow-hidden rounded-3xl border-4 border-white shadow-[0_24px_70px_-20px_rgba(27,65,123,0.22)]">
                <img src={consultaMedica} alt="Profissional de saúde conversando com uma paciente no consultório" className="aspect-[4/3] w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-900/80 to-transparent px-6 pb-6 pt-16 text-white">
                  <p className="font-display text-2xl">Mais atenção ao que importa.</p>
                  <p className="mt-1 text-sm text-white/85">Tecnologia para apoiar o cuidado.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="recursos" className="mx-auto max-w-7xl scroll-mt-8 px-5 py-20 sm:px-8 sm:py-24">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">Feito para a sua rotina</p>
            <h2 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">Organização que aproxima o cuidado.</h2>
            <p className="mt-4 text-lg leading-8 text-ink-500">Ferramentas para apoiar cada etapa do atendimento, da recepção ao consultório.</p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {features.map(({ icon: Icon, title, description, color }) => (
              <article key={title} className="rounded-3xl border border-ink-100 bg-white p-7 shadow-sm">
                <div className={`grid size-12 place-items-center rounded-2xl ${color}`}><Icon className="size-6" aria-hidden="true" /></div>
                <h3 className="mt-6 text-lg font-bold">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-ink-500">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="planos" className="scroll-mt-8 bg-ink-50 px-5 py-20 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">Para diferentes rotinas</p>
              <h2 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">Planos para cada momento da sua clínica.</h2>
              <p className="mt-4 text-base leading-7 text-ink-600">Conheça os valores mensais por clínica.</p>
              <p className="mt-2 text-sm font-semibold text-ink-600">Contratação ainda não disponível. Os recursos de cada plano são ilustrativos.</p>
            </div>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {plans.map((plan, index) => (
                <article key={plan.name} className={`flex h-full flex-col rounded-3xl border bg-white p-6 shadow-sm ${index === 2 ? 'border-brand-500 ring-1 ring-brand-500' : 'border-ink-100'}`}>
                  <p className="text-xs font-bold uppercase tracking-widest text-brand-600">Plano {plan.name}</p>
                  <h3 className="mt-3 text-xl font-bold">{plan.name}</h3>
                  <p className="mt-3 min-h-16 text-sm leading-6 text-ink-500">{plan.description}</p>
                  <p className="mt-4 border-b border-ink-100 pb-5 text-2xl font-bold text-ink-900">
                    R$ {plan.price}<span className="text-sm font-normal text-ink-500"> /mês por clínica</span>
                  </p>
                  <ul className="mt-5 space-y-3">
                    {plan.features.map(feature => (
                      <li key={feature} className="flex gap-2 text-sm leading-6 text-ink-600"><Check className="mt-1 size-4 shrink-0 text-grass-600" aria-hidden="true" />{feature}</li>
                    ))}
                  </ul>
                  <p className="mt-auto pt-7 text-sm font-semibold text-ink-500">Contratação indisponível</p>
                </article>
              ))}
            </div>
            <p className="mt-6 text-center text-sm text-ink-500">Os recursos de cada plano são exemplos e ainda serão definidos.</p>
          </div>
        </section>

        <section id="como-funciona" className="scroll-mt-8 bg-ink-900 text-white">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-200">Simples para começar</p>
              <h2 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">Sua equipe, sua rotina, em um só lugar.</h2>
              <p className="mt-5 max-w-xl leading-7 text-ink-200">Entre com sua conta para acessar a agenda e as demais ferramentas disponíveis no protótipo.</p>
              <Link to="/login" className="mt-8 inline-flex items-center gap-3 rounded-full bg-white px-6 py-4 text-sm font-bold text-brand-800 hover:bg-brand-50">
                Acessar o Khronos Med <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6"><LayoutDashboard className="size-6 text-blue-200" aria-hidden="true" /><h3 className="mt-5 font-bold">Acesse sua conta</h3><p className="mt-2 text-sm leading-6 text-ink-200">Entre com suas credenciais para abrir o painel.</p></div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6"><HeartPulse className="size-6 text-teal-300" aria-hidden="true" /><h3 className="mt-5 font-bold">Organize o atendimento</h3><p className="mt-2 text-sm leading-6 text-ink-200">Acompanhe pacientes e agendamentos da equipe.</p></div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-sm text-ink-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span className="font-semibold text-ink-700">Khronos Med</span>
          <span>Protótipo de gestão para clínicas e consultórios.</span>
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">Acessar sistema</Link>
        </div>
      </footer>
    </div>
  );
}
