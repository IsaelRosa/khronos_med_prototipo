import { Activity, ArrowRight, Shield, Zap, Users } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/useAuth';

export default function Login() {
  const { login, loading, error } = useAuth();
  const [email, setEmail] = useState('helena@khronos.med.br');
  const [pass, setPass] = useState('');
  const [localError, setLocalError] = useState('');

  const handleLogin = async () => {
    setLocalError('');
    if (!email || !pass) {
      setLocalError('Por favor preencha todos os campos');
      return;
    }
    try {
      await login(email, pass);
    } catch (err: any) {
      setLocalError(err.message || 'Falha ao fazer login');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex items-center justify-center p-10">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-10">
            <div className="size-11 rounded-xl bg-brand-700 grid place-items-center"><Activity className="size-6 text-white" /></div>
            <div><div className="font-display text-2xl text-ink-900 leading-none">Khronos</div><div className="text-[11px] uppercase tracking-widest text-ink-500">Tecnologia e Sistemas</div></div>
          </div>
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700 mb-6">
            <span aria-hidden="true">←</span> Voltar ao início
          </Link>
          <h1 className="font-display text-[36px] leading-tight text-ink-900">Bem-vindo de volta</h1>
          <p className="text-ink-500 mt-2 mb-8">Acesse sua plataforma de gestão clínica.</p>

          <div className="space-y-4">
            {(error || localError) && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error || localError}
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-ink-600">E-mail</label>
              <input 
                value={email} 
                onChange={e => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                className="mt-1 w-full h-11 px-3 rounded-lg border border-ink-100 focus:border-brand-400 outline-none disabled:bg-ink-50" 
              />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-600">Senha</label>
              <input 
                type="password" 
                value={pass} 
                onChange={e => setPass(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                className="mt-1 w-full h-11 px-3 rounded-lg border border-ink-100 focus:border-brand-400 outline-none disabled:bg-ink-50" 
                placeholder="Digite sua senha"
              />
            </div>
            <button 
              onClick={handleLogin}
              disabled={loading}
              className="w-full h-11 rounded-lg bg-brand-500 text-white font-semibold hover:bg-brand-600 disabled:bg-ink-300 flex items-center justify-center gap-2 transition"
            >
              {loading ? 'Autenticando...' : 'Entrar'} 
              {!loading && <ArrowRight className="size-4" />}
            </button>
            <div className="text-center text-xs text-ink-400">Esqueceu a senha? <a className="text-brand-600 hover:text-brand-700 cursor-pointer">Recuperar</a></div>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex relative bg-gradient-to-br from-brand-700 via-brand-900 to-ink-900 text-white p-12 overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{backgroundImage:'radial-gradient(800px 400px at 80% 20%, rgba(34,211,238,0.3), transparent)'}} />
        <div className="absolute inset-0 khronos-grid opacity-20" />
        <div className="relative flex flex-col justify-between w-full">
          <div>
            <div className="text-xs text-brand-200 uppercase tracking-widest mb-3">· Plataforma SaaS Médica</div>
            <h2 className="font-display text-[44px] leading-[1.05]">A operação inteira da sua clínica em uma única plataforma.</h2>
            <p className="text-brand-100 mt-4 max-w-md">Agenda, prontuário, teleconsulta, financeiro e convênios integrados. Projetado por médicos para médicos.</p>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-10">
            {[
              [Shield,'LGPD + CFM','Auditoria completa'],
              [Zap,'Agendamento','Encaixes automáticos'],
              [Users,'Multi-unidade','Isolamento de dados'],
            ].map(([Icon, title, sub]: any) => (
              <div key={title} className="p-4 rounded-xl bg-white/5 ring-1 ring-white/10 backdrop-blur-sm">
                <Icon className="size-5 text-aqua-400 mb-2" />
                <div className="font-semibold text-sm">{title}</div>
                <div className="text-xs text-brand-200">{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
