import SectionTitle from '../components/SectionTitle';

export default function ContactPage() {
  return (
    <div className="page-section container">
      <SectionTitle title="Contact" subtitle="Ne poți contacta pentru informații suplimentare sau pentru a afla mai multe despre serviciile noastre." />
      <div className="two-column">
        <div className="card"><h3>Date de contact</h3><p><strong>Telefon:</strong> 0712 345 678</p><p><strong>Email:</strong> contact@rosestudio.ro</p><p><strong>Adresă:</strong> București, România</p></div>
        <div className="card"><h3>Program</h3><p>Luni - Sâmbătă: 09:00 - 20:00</p><p>Duminică: Închis</p><p>Programările se fac online, iar plata se realizează în salon.</p></div>
      </div>
    </div>
  );
}
