import { useMemo, useState } from 'react';
import SectionTitle from '../components/SectionTitle';

const items = [
  { id: 1, category: 'Păr', title: 'Transformare păr', image: '/gallery/hair-1.png' },
  { id: 2, category: 'Păr', title: 'Coafură elegantă', image: '/gallery/hair-2.png' },
  { id: 3, category: 'Păr', title: 'Coafură pentru eveniment', image: '/gallery/hair-3.png' },
  { id: 4, category: 'Unghii', title: 'Manichiură french roz', image: '/gallery/nails-1.png' },
  { id: 5, category: 'Unghii', title: 'Manichiură sidefată', image: '/gallery/nails-2.png' },
  { id: 6, category: 'Unghii', title: 'Manichiură închisă', image: '/gallery/nails-3.png' },
  { id: 7, category: 'Machiaj', title: 'Machiaj glam', image: '/gallery/makeup-1.png' },
  { id: 8, category: 'Machiaj', title: 'Machiaj soft glam', image: '/gallery/makeup-2.png' },
  { id: 9, category: 'Machiaj', title: 'Machiaj auriu', image: '/gallery/makeup-3.png' }
];

export default function GalleryPage() {
  const [filter, setFilter] = useState('Toate');
  const filteredItems = useMemo(() => filter === 'Toate' ? items : items.filter((item) => item.category === filter), [filter]);

  return (
    <div className="page-section container">
      <SectionTitle title="Galerie" subtitle="Descoperă câteva dintre modelele și stilurile realizate în salonul nostru." />
      <div className="filter-row">
        {['Toate', 'Păr', 'Unghii', 'Machiaj'].map((label) => (
          <button key={label} className={filter === label ? 'button' : 'button button-light'} onClick={() => setFilter(label)}>{label}</button>
        ))}
      </div>
      <div className="gallery-grid">
        {filteredItems.map((item) => (
          <div className="gallery-item" key={item.id}>
            <img src={item.image} alt={item.title} />
            <div className="gallery-caption"><h4>{item.title}</h4><p>{item.category}</p></div>
          </div>
        ))}
      </div>
    </div>
  );
}
