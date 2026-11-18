import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SectionTitle from '../components/SectionTitle';

function getDashboardPath(role) {
  if (role === 'client') return '/client';
  if (role === 'employee') return '/employee';
  return '/admin';
}

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) navigate(getDashboardPath(user.role));
  }, [user, navigate]);

  const handleChange = (event) => setFormData({ ...formData, [event.target.name]: event.target.value });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    try {
      const data = await login(formData.email, formData.password);
      setSuccess(data.message);
      navigate(getDashboardPath(data.user.role));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page-section container small-container">
      <SectionTitle title="Login" subtitle="Autentifică-te pentru a vedea serviciile, a face programări sau a intra în dashboard." />
      <form className="card form-card" onSubmit={handleSubmit}>
        <label>Email<input type="email" name="email" value={formData.email} onChange={handleChange} /></label>
        <label>Parolă<input type="password" name="password" value={formData.password} onChange={handleChange} /></label>
        {error ? <p className="form-error">{error}</p> : null}
        {success ? <p className="form-success">{success}</p> : null}
        <button className="button button-primary" type="submit">Autentificare</button>
        <Link className="button button-light button-full" to="/register">Nu ai cont? Creează unul</Link>
      </form>
    </div>
  );
}
