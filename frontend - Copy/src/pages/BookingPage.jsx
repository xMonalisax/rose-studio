import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SectionTitle from '../components/SectionTitle';
import { apiRequest } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function BookingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [slots, setSlots] = useState([]);
  const [schedule, setSchedule] = useState(null);
  const [availabilityMessage, setAvailabilityMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({ serviceId: '', employeeId: '', appointmentDate: '', startTime: '', notes: '' });

  useEffect(() => {
    apiRequest('/services').then((data) => setServices(data.filter((item) => item.isBookable))).catch((err) => setError(err.message));
  }, []);

  const selectedService = useMemo(() => services.find((service) => service.id === Number(formData.serviceId)), [services, formData.serviceId]);

  useEffect(() => {
    if (!selectedService) {
      setEmployees([]);
      setFormData((prev) => ({ ...prev, employeeId: '', startTime: '' }));
      return;
    }
    apiRequest(`/users/employees?specialization=${selectedService.specialization}`).then(setEmployees).catch((err) => setError(err.message));
  }, [selectedService]);

  useEffect(() => {
    if (!formData.serviceId || !formData.employeeId || !formData.appointmentDate) {
      setSlots([]);
      setSchedule(null);
      setAvailabilityMessage('');
      return;
    }

    apiRequest(`/appointments/availability?serviceId=${formData.serviceId}&employeeId=${formData.employeeId}&appointmentDate=${formData.appointmentDate}`)
      .then((data) => {
        setSlots(data.slots || []);
        setSchedule(data.schedule || null);
        setAvailabilityMessage(data.message || '');
      })
      .catch((err) => {
        setSlots([]);
        setSchedule(null);
        setAvailabilityMessage('');
        setError(err.message);
      });
  }, [formData.serviceId, formData.employeeId, formData.appointmentDate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

const handleSubmit = async (event) => {
  event.preventDefault();
  setError('');
  setSuccess('');
  if (!user) {
    setError('Trebuie să fii autentificat pentru a face o programare.');
    navigate('/login');
    return;
  }
  try {
    const response = await apiRequest('/appointments', { method: 'POST', body: JSON.stringify(formData) });
    setSuccess(response.message);
    setFormData({ serviceId: '', employeeId: '', appointmentDate: '', startTime: '', notes: '' });
    setSlots([]);
    setSchedule(null);
    setAvailabilityMessage('');
  } catch (err) {
    setError(err.message);
  }
};

  return (
    <div className="page-section container">
      <SectionTitle title="Programare online" subtitle="Alege serviciul, specialistul și data, iar platforma îți recomandă intervalele disponibile. Plata se face în salon." />
      <div className="two-column booking-layout">
        <form className="card form-card" onSubmit={handleSubmit}>
          <label>
            Serviciu
            <select name="serviceId" value={formData.serviceId} onChange={handleChange}>
              <option value="">Alege un serviciu</option>
              {services.map((service) => <option key={service.id} value={service.id}>{service.name} ({service.priceMin === service.priceMax ? `${service.priceMin} RON` : `${service.priceMin}-${service.priceMax} RON`})</option>)}
            </select>
          </label>
          <label>
            Specialist
            <select name="employeeId" value={formData.employeeId} onChange={handleChange} disabled={!selectedService}>
              <option value="">Alege specialistul</option>
              {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}
            </select>
          </label>
          <label>Data<input type="date" name="appointmentDate" value={formData.appointmentDate} onChange={handleChange} /></label>
          <label>Ora selectată<input type="time" name="startTime" value={formData.startTime} onChange={handleChange} min="09:00" max="19:45" /></label>
          <label>Observații<textarea name="notes" value={formData.notes} onChange={handleChange} rows="4" placeholder="Preferințe, observații sau detalii utile" /></label>
          {selectedService ? (
            <div className="card info-box">
              <p><strong>Durată estimată:</strong> {selectedService.durationMinutes} minute</p>
              <p><strong>Preț:</strong> {selectedService.priceMin === selectedService.priceMax ? `${selectedService.priceMin} RON` : `${selectedService.priceMin}-${selectedService.priceMax} RON`}</p>
            </div>
          ) : null}
          {error ? <p className="form-error">{error}</p> : null}
          {success ? <p className="form-success">{success}</p> : null}
          <button className="button button-primary" type="submit">Trimite programarea</button>
        </form>

        <div className="card availability-card">
          <h3>Intervale recomandate</h3>
          <p>Platforma ține cont de durata serviciului, programul specialistului, pauze și suprapuneri.</p>
          {schedule ? (
            <div className="schedule-card muted-box">
              <p><strong>Program specialist:</strong> {schedule.workStart} - {schedule.workEnd}</p>
              {schedule.breakStart && schedule.breakEnd ? <p><strong>Pauză:</strong> {schedule.breakStart} - {schedule.breakEnd}</p> : null}
              <p><strong>Pauză automată între programări:</strong> 10 minute</p>
            </div>
          ) : null}
          {availabilityMessage ? <p className="form-error">{availabilityMessage}</p> : null}
          <div className="slots-grid">
            {slots.map((slot) => (
              <button type="button" key={slot.startTime} className={`slot-button ${formData.startTime === slot.startTime ? 'selected' : ''}`} onClick={() => setFormData((prev) => ({ ...prev, startTime: slot.startTime }))}>
                <strong>{slot.startTime}</strong>
                <span>până la {slot.endTime}</span>
              </button>
            ))}
          </div>
          {!slots.length && formData.serviceId && formData.employeeId && formData.appointmentDate && !availabilityMessage ? <p>Nu există încă recomandări pentru combinația selectată.</p> : null}
        </div>
      </div>
    </div>
  );
}
