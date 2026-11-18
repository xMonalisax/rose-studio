import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SectionTitle from '../components/SectionTitle';

export default function RegisterPage() {
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) navigate('/client');
  }, [user, navigate]);

  const handleChange = (event) => setFormData({ ...formData, [event.target.name]: event.target.value });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!formData.name || !formData.email || !formData.password) {
      setError('Completează toate câmpurile obligatorii.');
      return;
    }
    try {
      await register(formData);
      navigate('/client');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page-section container small-container">
      <SectionTitle title="Creează cont" subtitle="După înregistrare vei putea vedea serviciile și îți vei putea face programări online." />
      <form className="card form-card" onSubmit={handleSubmit}>
        <label>Nume complet<input type="text" name="name" value={formData.name} onChange={handleChange} /></label>
        <label>Email<input type="email" name="email" value={formData.email} onChange={handleChange} /></label>
        <label>Telefon<input type="text" name="phone" value={formData.phone} onChange={handleChange} /></label>
        <label>Parolă<input type="password" name="password" value={formData.password} onChange={handleChange} /></label>
        {error ? <p className="form-error">{error}</p> : null}
        <button className="button button-primary" type="submit">Creează cont</button>
        <Link className="button button-light button-full" to="/login">Ai deja cont? Login</Link>
      </form>
    </div>
  );
}
