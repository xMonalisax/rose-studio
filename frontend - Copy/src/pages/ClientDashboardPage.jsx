import { useEffect, useMemo, useState } from 'react';
import SectionTitle from '../components/SectionTitle';
import AppointmentCard from '../components/AppointmentCard';
import { apiRequest } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function ClientDashboardPage() {
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
    const completed = appointments.filter((appointment) => appointment.status === 'completed');
    const upcoming = appointments.filter((appointment) =>
      ['pending', 'accepted'].includes(appointment.status)
    );

    const totalSpent = completed.reduce((sum, appointment) => {
      return sum + ((appointment.service.priceMin + appointment.service.priceMax) / 2);
    }, 0);

    const serviceCount = {};
    completed.forEach((appointment) => {
      serviceCount[appointment.service.name] = (serviceCount[appointment.service.name] || 0) + 1;
    });

    const favoriteService =
      Object.entries(serviceCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Nu există încă';

    const loyalty =
      completed.length >= 6 ? 'Gold' : completed.length >= 3 ? 'Silver' : 'Start';

    return {
      completedCount: completed.length,
      upcomingCount: upcoming.length,
      totalSpent: Math.round(totalSpent),
      favoriteService,
      loyalty
    };
  }, [appointments]);

  const handleCancel = async (appointmentId) => {
    setMessage('');
    setError('');

    try {
      const data = await apiRequest(`/appointments/${appointmentId}/cancel`, {
        method: 'PATCH'
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
        title={`Bun venit, ${user?.name || ''}`}
        subtitle="Aici vezi programările tale și istoricul serviciilor folosite."
      />

      <div className="stats-overview four-columns">
        <div className="card stat-card">
          <h3>{summary.upcomingCount}</h3>
          <p>Programări viitoare</p>
        </div>

        <div className="card stat-card">
          <h3>{summary.completedCount}</h3>
          <p>Programări finalizate</p>
        </div>

        <div className="card stat-card">
          <h3>{summary.totalSpent} RON</h3>
          <p>Cheltuit estimat</p>
        </div>

        <div className="card stat-card">
          <h3>{summary.loyalty}</h3>
          <p>Nivel fidelizare</p>
        </div>
      </div>

      <div className="card profile-card">
        <h3>Date cont</h3>
        <p><strong>Nume:</strong> {user?.name}</p>
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Telefon:</strong> {user?.phone || '-'}</p>
        <p><strong>Serviciu preferat:</strong> {summary.favoriteService}</p>
      </div>

      {message ? <p className="form-success">{message}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}

      <div className="dashboard-grid">
        {appointments.map((appointment) => (
          <AppointmentCard
            key={appointment.id}
            appointment={appointment}
            actions={
              appointment.status !== 'cancelled' &&
              appointment.status !== 'completed' &&
              appointment.status !== 'no_show' ? (
                <button
                  className="button button-light"
                  onClick={() => handleCancel(appointment.id)}
                >
                  Anulează
                </button>
              ) : null
            }
          />
        ))}

        {!appointments.length ? <p>Nu există programări momentan.</p> : null}
      </div>
    </div>
  );
}