import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Agenda from './pages/Agenda';
import Patients from './pages/Patients';
import PatientDetail from './pages/PatientDetail';
import Records from './pages/Records';
import Attendance from './pages/Attendance';
import Prescriptions from './pages/Prescriptions';
import Exams from './pages/Exams';
import Telehealth from './pages/Telehealth';
import Management from './pages/Management';
import Financial from './pages/Financial';
import Reports from './pages/Reports';
import Communication from './pages/Communication';
import Settings from './pages/Settings';
import PublicBooking from './pages/PublicBooking';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/agendar/:clinicSlug" element={<PublicBooking />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/painel" replace />} />
          <Route path="painel" element={<Dashboard />} />
          <Route path="agenda" element={<Agenda />} />
          <Route path="pacientes" element={<Patients />} />
          <Route path="pacientes/:id" element={<PatientDetail />} />
          <Route path="prontuarios" element={<Records />} />
          <Route path="atendimento" element={<Attendance />} />
          <Route path="atendimento/:appointmentId" element={<Attendance />} />
          <Route path="prescricoes" element={<Prescriptions />} />
          <Route path="exames" element={<Exams />} />
          <Route path="teleconsulta" element={<Telehealth />} />
          <Route path="gestao" element={<Management />} />
          <Route path="financeiro" element={<Financial />} />
          <Route path="relatorios" element={<Reports />} />
          <Route path="comunicacao" element={<Communication />} />
          <Route path="configuracoes" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/painel" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
