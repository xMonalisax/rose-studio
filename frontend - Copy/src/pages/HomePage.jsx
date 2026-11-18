import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

function getDashboardPath(role) {
  if (role === 'client') return '/client';
  if (role === 'employee') return '/employee';
  return '/admin';
}

export default function HomePage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      const data = await login(formData.email, formData.password);
      navigate(getDashboardPath(data.user.role));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <section className="hero hero-elevated">
        <div className="container hero-grid auth-hero-grid">
          <div>
            <p className="eyebrow">Rose Studio</p>
            <h1>Programări online, simplu și elegant</h1>
            <p className="hero-text">
              Descoperă serviciile salonului, inspiră-te din galerie și conectează-te rapid pentru a face o programare.
            </p>

            {!user ? (
              <div className="hero-actions">
                <Link className="button button-light" to="/about">Despre noi</Link>
                <Link className="button button-light" to="/gallery">Galerie</Link>
                <Link className="button button-light" to="/contact">Contact</Link>
              </div>
            ) : (
              <div className="hero-actions">
                <Link className="button button-primary" to={getDashboardPath(user.role)}>
                  Intră în contul tău
                </Link>
                {user.role === 'client' ? (
                  <Link className="button button-light" to="/booking">
                    Fă o programare
                  </Link>
                ) : null}
              </div>
            )}
          </div>

          {!user ? (
            <div className="card auth-card">
              <h3>Autentificare</h3>
              <p className="muted-text">
                Conectează-te sau creează-ți un cont nou.
              </p>

              <form className="form-card compact-form" onSubmit={handleSubmit}>
                <label>
                  Email
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="email@exemplu.ro"
                  />
                </label>

                <label>
                  Parolă
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                  />
                </label>

                {error ? <p className="form-error">{error}</p> : null}

                <button className="button button-primary" type="submit">
                  Login
                </button>

                <Link className="button button-light button-full" to="/register">
                  Creează cont
                </Link>
              </form>
            </div>
          ) : (
            <div className="card auth-card">
              <h3>Bine ai revenit, {user.name}!</h3>
              <p className="muted-text">
                Accesează dashboard-ul tău pentru a continua.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}