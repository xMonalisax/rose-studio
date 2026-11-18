import { useEffect, useMemo, useState } from 'react';
import SectionTitle from '../components/SectionTitle';
import AppointmentCard from '../components/AppointmentCard';
import { apiRequest } from '../utils/api';

function DoughnutChart({ title, data }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const colors = [
    '#d86b9a',
    '#f3bfd4',
    '#b95c86',
    '#8e4a68',
    '#e9a7c4',
    '#c86f98'
  ];

  let current = 0;
  const gradientParts = data.map((item, index) => {
    const start = total ? (current / total) * 360 : 0;
    current += item.value;
    const end = total ? (current / total) * 360 : 0;
    return `${colors[index % colors.length]} ${start}deg ${end}deg`;
  });

  const chartStyle = {
    background: total ? `conic-gradient(${gradientParts.join(', ')})` : '#f3e3eb'
  };

  return (
    <div className="card chart-card">
      <h3>{title}</h3>

      {!data.length ? <p>Nu există date.</p> : null}

      {data.length ? (
        <div className="doughnut-layout">
          <div className="doughnut-chart" style={chartStyle}>
            <div className="doughnut-center">
              <strong>{total}</strong>
              <span>total</span>
            </div>
          </div>

          <div className="doughnut-legend">
            {data.map((item, index) => (
              <div key={item.label} className="legend-row">
                <div className="legend-left">
                  <span
                    className="legend-dot"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  ></span>
                  <span>{item.label}</span>
                </div>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SimpleBarChart({ title, data, suffix = '' }) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="card chart-card">
      <h3>{title}</h3>

      {data.length === 0 ? <p>Nu există date.</p> : null}

      <div className="chart-list">
        {data.map((item) => (
          <div key={item.label} className="chart-row">
            <span>{item.label}</span>
            <div className="chart-bar-wrapper">
              <div
                className="chart-bar"
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              ></div>
            </div>
            <strong>
              {item.value}
              {suffix}
            </strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    priceMin: '',
    priceMax: '',
    durationMinutes: '',
    specialization: 'hair',
    categoryId: ''
  });

  const [employeeForm, setEmployeeForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    specialization: 'hair',
    workStart: '09:00',
    workEnd: '18:00',
    breakStart: '13:00',
    breakEnd: '13:30'
  });

  const [dayOffForm, setDayOffForm] = useState({
    employeeId: '',
    date: '',
    reason: ''
  });

  const loadAll = async () => {
    try {
      const [
        servicesData,
        categoriesData,
        employeesData,
        appointmentsData,
        statsData
      ] = await Promise.all([
        apiRequest('/services'),
        apiRequest('/categories'),
        apiRequest('/users/employees'),
        apiRequest('/appointments'),
        apiRequest('/stats/summary')
      ]);

      setServices(servicesData);
      setCategories(categoriesData);
      setEmployees(employeesData);
      setAppointments(appointmentsData);
      setStats(statsData);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const appointmentsByStatusArray = useMemo(() => {
    if (!stats?.appointmentsByStatus) return [];
    return Object.entries(stats.appointmentsByStatus).map(([label, value]) => ({
      label,
      value
    }));
  }, [stats]);

  const handleServiceChange = (event) => {
    setServiceForm({ ...serviceForm, [event.target.name]: event.target.value });
  };

  const handleEmployeeChange = (event) => {
    setEmployeeForm({ ...employeeForm, [event.target.name]: event.target.value });
  };

  const handleDayOffChange = (event) => {
    setDayOffForm({ ...dayOffForm, [event.target.name]: event.target.value });
  };

  const addService = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    try {
      await apiRequest('/services', {
        method: 'POST',
        body: JSON.stringify(serviceForm)
      });

      setMessage('Serviciul a fost adăugat.');
      setServiceForm({
        name: '',
        description: '',
        priceMin: '',
        priceMax: '',
        durationMinutes: '',
        specialization: 'hair',
        categoryId: ''
      });

      loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const addEmployee = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    try {
      await apiRequest('/users/employees', {
        method: 'POST',
        body: JSON.stringify(employeeForm)
      });

      setMessage('Angajatul a fost adăugat.');
      setEmployeeForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        specialization: 'hair',
        workStart: '09:00',
        workEnd: '18:00',
        breakStart: '13:00',
        breakEnd: '13:30'
      });

      loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const addDayOff = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    try {
      await apiRequest(`/users/employees/${dayOffForm.employeeId}/dayoffs`, {
        method: 'POST',
        body: JSON.stringify({
          date: dayOffForm.date,
          reason: dayOffForm.reason
        })
      });

      setMessage('Ziua liberă a fost adăugată.');
      setDayOffForm({
        employeeId: '',
        date: '',
        reason: ''
      });

      loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteService = async (id) => {
    try {
      const data = await apiRequest(`/services/${id}`, { method: 'DELETE' });
      setMessage(data.message);
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteEmployee = async (id) => {
    try {
      const data = await apiRequest(`/users/employees/${id}`, { method: 'DELETE' });
      setMessage(data.message);
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteDayOff = async (employeeId, dayOffId) => {
    try {
      const data = await apiRequest(
        `/users/employees/${employeeId}/dayoffs/${dayOffId}`,
        { method: 'DELETE' }
      );
      setMessage(data.message);
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page-section container">
      <SectionTitle
        title="Dashboard administrator"
        subtitle="Administrează serviciile, angajații, zilele indisponibile și urmărește situația programărilor."
      />

      {message ? <p className="form-success">{message}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}

      <div className="stats-overview four-columns">
        <div className="card stat-card">
          <h3>{stats?.totalAppointments || 0}</h3>
          <p>Programări totale</p>
        </div>

        <div className="card stat-card">
          <h3>{stats?.totalServices || 0}</h3>
          <p>Servicii active</p>
        </div>

        <div className="card stat-card">
          <h3>{stats?.totalEmployees || 0}</h3>
          <p>Angajați activi</p>
        </div>

        <div className="card stat-card">
          <h3>{stats?.estimatedRevenue || 0} RON</h3>
          <p>Venit estimat</p>
        </div>
      </div>

      <div className="admin-grid">
        <form className="card form-card" onSubmit={addService}>
          <h3>Adaugă serviciu</h3>

          <label>
            Nume
            <input name="name" value={serviceForm.name} onChange={handleServiceChange} />
          </label>

          <label>
            Descriere
            <textarea
              name="description"
              value={serviceForm.description}
              onChange={handleServiceChange}
              rows="3"
            />
          </label>

          <div className="mini-form-grid">
            <label>
              Preț minim
              <input
                name="priceMin"
                type="number"
                value={serviceForm.priceMin}
                onChange={handleServiceChange}
              />
            </label>

            <label>
              Preț maxim
              <input
                name="priceMax"
                type="number"
                value={serviceForm.priceMax}
                onChange={handleServiceChange}
              />
            </label>
          </div>

          <div className="mini-form-grid">
            <label>
              Durată (minute)
              <input
                name="durationMinutes"
                type="number"
                value={serviceForm.durationMinutes}
                onChange={handleServiceChange}
              />
            </label>

            <label>
              Specializare
              <select
                name="specialization"
                value={serviceForm.specialization}
                onChange={handleServiceChange}
              >
                <option value="hair">Hair</option>
                <option value="nails">Nails</option>
                <option value="makeup">Makeup</option>
              </select>
            </label>
          </div>

          <label>
            Categorie
            <select
              name="categoryId"
              value={serviceForm.categoryId}
              onChange={handleServiceChange}
            >
              <option value="">Alege categoria</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <button className="button button-primary" type="submit">
            Adaugă serviciu
          </button>
        </form>

        <form className="card form-card" onSubmit={addEmployee}>
          <h3>Adaugă angajat</h3>

          <label>
            Nume
            <input name="name" value={employeeForm.name} onChange={handleEmployeeChange} />
          </label>

          <label>
            Email
            <input
              name="email"
              type="email"
              value={employeeForm.email}
              onChange={handleEmployeeChange}
            />
          </label>

          <label>
            Telefon
            <input name="phone" value={employeeForm.phone} onChange={handleEmployeeChange} />
          </label>

          <label>
            Parolă
            <input
              name="password"
              type="password"
              value={employeeForm.password}
              onChange={handleEmployeeChange}
            />
          </label>

          <div className="mini-form-grid">
            <label>
              Specializare
              <select
                name="specialization"
                value={employeeForm.specialization}
                onChange={handleEmployeeChange}
              >
                <option value="hair">Hair</option>
                <option value="nails">Nails</option>
                <option value="makeup">Makeup</option>
              </select>
            </label>

            <label>
              Început program
              <input
                name="workStart"
                type="time"
                value={employeeForm.workStart}
                onChange={handleEmployeeChange}
              />
            </label>
          </div>

          <div className="mini-form-grid">
            <label>
              Final program
              <input
                name="workEnd"
                type="time"
                value={employeeForm.workEnd}
                onChange={handleEmployeeChange}
              />
            </label>

            <label>
              Pauză start
              <input
                name="breakStart"
                type="time"
                value={employeeForm.breakStart}
                onChange={handleEmployeeChange}
              />
            </label>
          </div>

          <label>
            Pauză final
            <input
              name="breakEnd"
              type="time"
              value={employeeForm.breakEnd}
              onChange={handleEmployeeChange}
            />
          </label>

          <button className="button button-primary" type="submit">
            Adaugă angajat
          </button>
        </form>
      </div>

      <form className="card form-card full-width-card" onSubmit={addDayOff}>
        <h3>Setează zi indisponibilă</h3>

        <label>
          Angajat
          <select
            name="employeeId"
            value={dayOffForm.employeeId}
            onChange={handleDayOffChange}
          >
            <option value="">Alege angajatul</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Data
          <input
            name="date"
            type="date"
            value={dayOffForm.date}
            onChange={handleDayOffChange}
          />
        </label>

        <label>
          Motiv
          <textarea
            name="reason"
            value={dayOffForm.reason}
            onChange={handleDayOffChange}
            rows="3"
          />
        </label>

        <button className="button button-primary" type="submit">
          Salvează ziua liberă
        </button>
      </form>

      <div className="admin-grid">
        <div className="card">
          <h3>Servicii existente</h3>
          <div className="table-like-list">
            {services.map((service) => (
              <div className="list-row" key={service.id}>
                <div>
                  <strong>{service.name}</strong>
                  <p>
                    {service.category.name} · {service.durationMinutes} min
                  </p>
                </div>

                <button
                  className="button button-light"
                  onClick={() => deleteService(service.id)}
                >
                  Dezactivează
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3>Angajați</h3>
          <div className="table-like-list">
            {employees.map((employee) => (
              <div className="list-row" key={employee.id}>
                <div>
                  <strong>{employee.name}</strong>
                  <p>
                    {employee.specialization} · {employee.workStart} - {employee.workEnd}
                  </p>
                </div>

                <button
                  className="button button-light"
                  onClick={() => deleteEmployee(employee.id)}
                >
                  Dezactivează
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card full-width-card">
        <h3>Zile indisponibile</h3>

        <div className="table-like-list">
          {employees.flatMap((employee) =>
            employee.employeeDayOffs.map((dayOff) => (
              <div className="list-row" key={dayOff.id}>
                <div>
                  <strong>{employee.name}</strong>
                  <p>
                    {new Date(dayOff.date).toLocaleDateString('ro-RO')} ·{' '}
                    {dayOff.reason || 'Fără motiv specificat'}
                  </p>
                </div>

                <button
                  className="button button-light"
                  onClick={() => deleteDayOff(employee.id, dayOff.id)}
                >
                  Șterge
                </button>
              </div>
            ))
          )}

          {!employees.some((employee) => employee.employeeDayOffs.length) ? (
            <p>Nu există zile indisponibile setate.</p>
          ) : null}
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card full-width-card">
          <h3>Toate programările</h3>
          <div className="dashboard-grid">
            {appointments.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))}
          </div>
        </div>
      </div>

      <div className="admin-grid">
        <DoughnutChart
          title="Programări pe status"
          data={appointmentsByStatusArray}
        />

        <SimpleBarChart
          title="Grad de ocupare al angajaților"
          data={stats?.occupancyByEmployee || []}
          suffix="%"
        />
      </div>

      <div className="admin-grid">
        <SimpleBarChart
          title="Venit estimat pe luni"
          data={stats?.revenueByMonth || []}
          suffix=" RON"
        />

        <SimpleBarChart
          title="Top servicii după venit"
          data={stats?.revenueByService || []}
          suffix=" RON"
        />
      </div>

      <div className="admin-grid">
        <DoughnutChart
          title="Rata de anulare / neprezentare"
          data={stats?.efficiencyByStatus || []}
        />
      </div>
    </div>
  );
}