import { useEffect, useMemo, useState } from 'react';
import SectionTitle from '../components/SectionTitle';
import AppointmentCard from '../components/AppointmentCard';
import { apiRequest } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function EmployeeDashboardPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadAppointments = () =>
    apiRequest('/appointments/my')
      .then(setAppointments)
      .catch((err) => setError(err.message));

  useEffect(() => {
    loadAppointments();
  }, []);

  const summary = useMemo(() => {
    const pending = appointments.filter((appointment) => appointment.status === 'pending').length;
    const todayLabel = new Date().toLocaleDateString('ro-RO');
    const todayAppointments = appointments.filter(
      (appointment) =>
        new Date(appointment.appointmentDate).toLocaleDateString('ro-RO') === todayLabel
    ).length;

    return { pending, todayAppointments };
  }, [appointments]);

  const updateStatus = async (appointmentId, status) => {
    setMessage('');
    setError('');

    try {
      const data = await apiRequest(`/appointments/${appointmentId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      setMessage(data.message);
      loadAppointments();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page-section container">
      <SectionTitle
        title={`Dashboard angajat - ${user?.name || ''}`}
        subtitle="Vezi programările tale și actualizează statusul fiecărei programări."
      />

      <div className="stats-overview three-compact-columns">
        <div className="card stat-card">
          <h3>{summary.todayAppointments}</h3>
          <p>Programări azi</p>
        </div>

        <div className="card stat-card">
          <h3>{summary.pending}</h3>
          <p>În așteptare</p>
        </div>

        <div className="card stat-card">
          <h3>{user?.workStart} - {user?.workEnd}</h3>
          <p>Program de lucru</p>
        </div>
      </div>

      <div className="card profile-card">
        <h3>Program personal</h3>
        <p><strong>Interval:</strong> {user?.workStart} - {user?.workEnd}</p>
        {user?.breakStart && user?.breakEnd ? (
          <p><strong>Pauză:</strong> {user.breakStart} - {user.breakEnd}</p>
        ) : (
          <p>Nu este setată o pauză.</p>
        )}
      </div>

      {message ? <p className="form-success">{message}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}

      <div className="dashboard-grid">
        {appointments.map((appointment) => (
          <AppointmentCard
            key={appointment.id}
            appointment={appointment}
            actions={
              <>
                <button
                  className="button button-primary"
                  onClick={() => updateStatus(appointment.id, 'accepted')}
                >
                  Acceptă
                </button>

                <button
                  className="button button-light"
                  onClick={() => updateStatus(appointment.id, 'rejected')}
                >
                  Respinge
                </button>

                <button
                  className="button button-light"
                  onClick={() => updateStatus(appointment.id, 'completed')}
                >
                  Finalizează
                </button>

                <button
                  className="button button-light"
                  onClick={() => updateStatus(appointment.id, 'no_show')}
                >
                  Neprezentat
                </button>
              </>
            }
          />
        ))}

        {!appointments.length ? <p>Nu există programări momentan.</p> : null}
      </div>
    </div>
  );
}