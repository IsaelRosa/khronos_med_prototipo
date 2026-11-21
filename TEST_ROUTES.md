# Teste Completo de Rotas - Khronos Medical

## Rotas Públicas
- [ ] `/login` - Página de Login
- [ ] `/agendar/:clinicSlug` - Agendamento Público (ex: `/agendar/instituto-khronos`)

## Rotas Privadas (dentro do Layout)
- [ ] `/painel` - Dashboard Principal
- [ ] `/agenda` - Agenda/Agendamentos
- [ ] `/pacientes` - Lista de Pacientes
- [ ] `/pacientes/:id` - Detalhes do Paciente
- [ ] `/prontuarios` - Prontuários
- [ ] `/atendimento` - Atendimento
- [ ] `/atendimento/:appointmentId` - Detalhes do Atendimento
- [ ] `/prescricoes` - Prescrições
- [ ] `/exames` - Exames
- [ ] `/teleconsulta` - Teleconsulta
- [ ] `/gestao` - Gestão
- [ ] `/financeiro` - Financeiro
- [ ] `/relatorios` - Relatórios
- [ ] `/comunicacao` - Comunicação
- [ ] `/configuracoes` - Configurações

## Status da Aplicação
**Versão**: 0.0.0
**Framework**: React 19 + TypeScript + Vite
**Roteamento**: React Router v7
**UI**: Tailwind CSS + Framer Motion

## Dados
- Usando localStorage com dados mockados
- Seed data em `src/lib/mock.ts`
- State management via `src/lib/store.ts`
