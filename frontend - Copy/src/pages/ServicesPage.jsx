import { useEffect, useMemo, useState } from 'react';
import SectionTitle from '../components/SectionTitle';
import { apiRequest } from '../utils/api';

function formatPrice(service) {
  return service.priceMin === service.priceMax ? `${service.priceMin} RON` : `${service.priceMin} - ${service.priceMax} RON`;
}

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest('/services').then(setServices).catch((err) => setError(err.message));
  }, []);

  const groupedServices = useMemo(() => services.reduce((acc, service) => {
    const categoryName = service.category.name;
    if (!acc[categoryName]) acc[categoryName] = [];
    acc[categoryName].push(service);
    return acc;
  }, {}), [services]);

  return (
    <div className="page-section container">
      <SectionTitle title="Servicii" subtitle="Alege categoria care te interesează și descoperă serviciile disponibile în salon." />
      {error ? <p className="form-error">{error}</p> : null}
      {Object.entries(groupedServices).map(([categoryName, items]) => (
        <section key={categoryName} className="service-section">
          <h3>{categoryName}</h3>
          <div className="grid-3">
            {items.map((service) => (
              <div key={service.id} className="card service-card">
                <h4>{service.name}</h4>
                <p>{service.description}</p>
                <p><strong>Durată:</strong> {service.durationMinutes} minute</p>
                <p><strong>Preț:</strong> {formatPrice(service)}</p>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
