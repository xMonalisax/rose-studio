import { useEffect, useMemo, useState } from 'react';
import SectionTitle from '../components/SectionTitle';
import { apiRequest } from '../utils/api';

const extraItems = [
  { category: 'Materiale informative', name: 'Vopsea 1 tub', price: '100 RON' },
  { category: 'Materiale informative', name: '10 grame Decolorant', price: '20 RON' }
];

function formatPrice(service) {
  return service.priceMin === service.priceMax ? `${service.priceMin} RON` : `${service.priceMin} - ${service.priceMax} RON`;
}

export default function PriceListPage() {
  const [services, setServices] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest('/services').then(setServices).catch((err) => setError(err.message));
  }, []);

  const grouped = useMemo(() => {
    const result = services.reduce((acc, service) => {
      const categoryName = service.category.name;
      if (!acc[categoryName]) acc[categoryName] = [];
      acc[categoryName].push({ name: service.name, price: formatPrice(service) });
      return acc;
    }, {});
    extraItems.forEach((item) => {
      if (!result[item.category]) result[item.category] = [];
      result[item.category].push({ name: item.name, price: item.price });
    });
    return result;
  }, [services]);

  return (
    <div className="page-section container">
      <SectionTitle title="Lista de prețuri" subtitle="Aici poți vedea toate serviciile și prețurile afișate clar, pe categorii." />
      {error ? <p className="form-error">{error}</p> : null}
      <div className="price-list-grid">
        {Object.entries(grouped).map(([categoryName, items]) => (
          <div key={categoryName} className="card">
            <h3>{categoryName}</h3>
            <div className="price-list">
              {items.map((item) => (
                <div className="price-row" key={`${categoryName}-${item.name}`}>
                  <span>{item.name}</span>
                  <strong>{item.price}</strong>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
