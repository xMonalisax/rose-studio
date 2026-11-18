import SectionTitle from '../components/SectionTitle';

export default function AboutPage() {
  return (
    <div className="page-section container">
      <SectionTitle title="Despre noi" subtitle="Rose Studio este un salon modern care pune accent pe eleganță, atenție la detalii și o experiență plăcută pentru fiecare clientă." />
      <div className="two-column">
        <div className="card"><h3>Misiunea noastră</h3><p>Ne dorim să oferim servicii de înfrumusețare într-un mod organizat și accesibil, astfel încât fiecare clientă să poată vedea serviciile, prețurile și programările într-un singur loc.</p></div>
        <div className="card"><h3>Ce ne diferențiază</h3><p>Platforma Rose Studio este gândită simplu și clar, cu accent pe programări online, afișarea prețurilor și gestionarea eficientă a activității salonului.</p></div>
      </div>
    </div>
  );
}
