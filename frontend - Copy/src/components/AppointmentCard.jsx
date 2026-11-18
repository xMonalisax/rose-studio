function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('ro-RO');
}

function formatStatus(status) {
  const labels = {
    pending: 'în așteptare',
    accepted: 'acceptată',
    rejected: 'respinsă',
    cancelled: 'anulată',
    completed: 'finalizată',
    no_show: 'neprezentat'
  };

  return labels[status] || status;
}

export default function AppointmentCard({ appointment, actions }) {
  const estimatedPrice = appointment.service.priceMin === appointment.service.priceMax
    ? `${appointment.service.priceMin} RON`
    : `${appointment.service.priceMin}-${appointment.service.priceMax} RON`;

  return (
    <div className="card appointment-card">
      <div className="appointment-header">
        <div>
          <h4>{appointment.service.name}</h4>
          <p className="appointment-category">{appointment.service.category?.name}</p>
        </div>
        <span className={`status-badge status-${appointment.status}`}>{formatStatus(appointment.status)}</span>
      </div>
      <p><strong>Data:</strong> {formatDate(appointment.appointmentDate)}</p>
      <p><strong>Interval:</strong> {appointment.startTime} - {appointment.endTime}</p>
      <p><strong>Durată:</strong> {appointment.service.durationMinutes} minute</p>
      <p><strong>Tarif estimat:</strong> {estimatedPrice}</p>
      <p><strong>Specialist:</strong> {appointment.employee?.name || '-'}</p>
      <p><strong>Client:</strong> {appointment.client?.name || '-'}</p>
      {appointment.notes ? <p><strong>Observații:</strong> {appointment.notes}</p> : null}
      {actions ? <div className="appointment-actions">{actions}</div> : null}
    </div>
  );
}
