const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

function dateFromToday(offsetDays) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  return date;
}

function addAppointment(date, startTime, endTime, status, clientId, employeeId, serviceId, notes = null) {
  return {
    appointmentDate: date,
    startTime,
    endTime,
    status,
    clientId,
    employeeId,
    serviceId,
    notes
  };
}

async function main() {
  await prisma.employeeDayOff.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.service.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const categories = await prisma.$transaction([
    prisma.category.create({ data: { name: 'Păr / Coafat' } }),
    prisma.category.create({ data: { name: 'Tratamente păr' } }),
    prisma.category.create({ data: { name: 'Manichiură / Pedichiură' } }),
    prisma.category.create({ data: { name: 'Machiaj' } })
  ]);

  const categoryMap = Object.fromEntries(categories.map((category) => [category.name, category.id]));

  const adminPassword = await bcrypt.hash('admin123', 10);
  const employeePassword = await bcrypt.hash('employee123', 10);
  const clientPassword = await bcrypt.hash('client123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Admin Rose Studio',
      email: 'admin@rosestudio.ro',
      password: adminPassword,
      phone: '0700000000',
      role: 'admin'
    }
  });

  const hairEmployee = await prisma.user.create({
    data: {
      name: 'Andreea Hair',
      email: 'hair@rosestudio.ro',
      password: employeePassword,
      phone: '0711111111',
      role: 'employee',
      specialization: 'hair',
      workStart: '09:00',
      workEnd: '18:00',
      breakStart: '13:00',
      breakEnd: '13:30'
    }
  });

  const nailsEmployee = await prisma.user.create({
    data: {
      name: 'Bianca Nails',
      email: 'nails@rosestudio.ro',
      password: employeePassword,
      phone: '0722222222',
      role: 'employee',
      specialization: 'nails',
      workStart: '10:00',
      workEnd: '19:00',
      breakStart: '14:00',
      breakEnd: '14:30'
    }
  });

  const makeupEmployee = await prisma.user.create({
    data: {
      name: 'Cristina Makeup',
      email: 'makeup@rosestudio.ro',
      password: employeePassword,
      phone: '0733333333',
      role: 'employee',
      specialization: 'makeup',
      workStart: '11:00',
      workEnd: '19:00',
      breakStart: '15:00',
      breakEnd: '15:20'
    }
  });

  const client = await prisma.user.create({
    data: {
      name: 'Client Demo',
      email: 'client@rosestudio.ro',
      password: clientPassword,
      phone: '0744444444',
      role: 'client'
    }
  });

  const secondClient = await prisma.user.create({
    data: {
      name: 'Maria Popescu',
      email: 'maria@rosestudio.ro',
      password: clientPassword,
      phone: '0755555555',
      role: 'client'
    }
  });

  const services = [
    ['Păr / Coafat', 'Tuns', 'Tuns simplu pentru păr scurt sau mediu.', 80, 80, 60, 'hair', true],
    ['Păr / Coafat', 'Tuns / Spălat / Uscat – Păr scurt', 'Include tuns, spălat și uscat pentru păr scurt.', 110, 110, 90, 'hair', true],
    ['Păr / Coafat', 'Tuns / Spălat / Uscat – Păr mediu', 'Include tuns, spălat și uscat pentru păr mediu.', 120, 120, 90, 'hair', true],
    ['Păr / Coafat', 'Tuns / Spălat / Uscat – Păr lung', 'Include tuns, spălat și uscat pentru păr lung.', 130, 130, 100, 'hair', true],
    ['Păr / Coafat', 'Tuns / Spălat / Uscat – Păr foarte lung', 'Include tuns, spălat și uscat pentru păr foarte lung.', 150, 150, 110, 'hair', true],
    ['Păr / Coafat', 'Tuns / Spălat / Uscat – Schimbare formă', 'Transformare completă de look.', 200, 200, 120, 'hair', true],
    ['Păr / Coafat', 'Spălat / Coafat', 'Coafat în funcție de lungime și complexitate.', 80, 150, 60, 'hair', true],
    ['Păr / Coafat', 'Manoperă Vopsit', 'Serviciu de colorare.', 60, 80, 120, 'hair', true],
    ['Păr / Coafat', 'Manoperă Decolorat', 'Serviciu de decolorare.', 120, 250, 150, 'hair', true],
    ['Tratamente păr', 'Hidratare', 'Tratament pentru hidratarea intensă a părului.', 130, 250, 60, 'hair', true],
    ['Tratamente păr', 'Reconstrucție', 'Tratament pentru păr deteriorat.', 130, 250, 60, 'hair', true],
    ['Tratamente păr', 'Anti-cădere', 'Tratament pentru stimularea rădăcinii firului de păr.', 130, 250, 50, 'hair', true],
    ['Tratamente păr', 'Scalp sensibil', 'Tratament pentru calmarea scalpului sensibil.', 130, 250, 50, 'hair', true],
    ['Tratamente păr', 'Detox / Peeling Scalp', 'Curățare și detoxifiere a scalpului.', 130, 250, 50, 'hair', true],
    ['Tratamente păr', 'Anti-sebum', 'Tratament pentru reglarea sebumului.', 130, 250, 50, 'hair', true],
    ['Manichiură / Pedichiură', 'Manichiură clasică', 'Manichiură simplă.', 30, 30, 45, 'nails', true],
    ['Manichiură / Pedichiură', 'Manichiură spa', 'Manichiură cu tratament spa.', 40, 40, 50, 'nails', true],
    ['Manichiură / Pedichiură', 'Manichiură cu ojă semipermanentă', 'Aplicare ojă semipermanentă.', 60, 60, 70, 'nails', true],
    ['Manichiură / Pedichiură', 'Gel pe unghia naturală', 'Aplicare gel pe unghia naturală.', 70, 70, 80, 'nails', true],
    ['Manichiură / Pedichiură', 'Unghii tehnice', 'Construcție unghii tehnice.', 100, 100, 120, 'nails', true],
    ['Manichiură / Pedichiură', 'Unghii tehnice forme extreme (lungime XXL)', 'Construcție lungime XXL.', 200, 200, 150, 'nails', true],
    ['Manichiură / Pedichiură', 'Întreținere unghii tehnice', 'Întreținere clasică.', 80, 80, 90, 'nails', true],
    ['Manichiură / Pedichiură', 'Întreținere unghii tehnice peste 5 săptămâni', 'Întreținere pentru unghii după peste 5 săptămâni.', 90, 90, 100, 'nails', true],
    ['Manichiură / Pedichiură', 'Înlocuire unghie ruptă', 'Preț per unghie.', 8, 8, 20, 'nails', true],
    ['Manichiură / Pedichiură', 'Îndepărtat unghii tehnice + ojat', 'Îndepărtare și aplicare oja.', 45, 45, 50, 'nails', true],
    ['Manichiură / Pedichiură', 'Împachetare mâini parafină', 'Tratament hidratant pentru mâini.', 10, 10, 20, 'nails', true],
    ['Manichiură / Pedichiură', 'Pedichiură clasică', 'Pedichiură simplă.', 40, 40, 50, 'nails', true],
    ['Manichiură / Pedichiură', 'Pedichiură cu ojă semipermanentă', 'Pedichiură cu oja semipermanentă.', 70, 70, 70, 'nails', true],
    ['Manichiură / Pedichiură', 'Pedichiură spa', 'Pedichiură cu tratament spa.', 60, 60, 60, 'nails', true],
    ['Manichiură / Pedichiură', 'Pedichiură cu gel', 'Pedichiură cu gel.', 75, 75, 80, 'nails', true],
    ['Manichiură / Pedichiură', 'Împachetare picioare parafină', 'Tratament hidratant pentru picioare.', 15, 15, 20, 'nails', true],
    ['Manichiură / Pedichiură', 'Pachet manichiură + pedichiură clasică', 'Pachet promoțional.', 65, 65, 90, 'nails', true],
    ['Manichiură / Pedichiură', 'Pachet manichiură + pedichiură spa', 'Pachet promoțional spa.', 85, 85, 100, 'nails', true],
    ['Machiaj', 'Machiaj de ocazie', 'Machiaj pentru evenimente.', 250, 250, 100, 'makeup', true],
    ['Machiaj', 'Machiaj mireasă', 'Machiaj pentru ziua nunții.', 360, 360, 130, 'makeup', true],
    ['Machiaj', 'Probă mireasă', 'Probă machiaj mireasă.', 180, 180, 75, 'makeup', true],
    ['Machiaj', 'Machiaj de zi', 'Machiaj lejer de zi.', 160, 160, 50, 'makeup', true],
    ['Machiaj', 'Machiaj ședință foto', 'Machiaj pentru ședințe foto.', 250, 350, 100, 'makeup', true],
    ['Machiaj', 'Gene false', 'Aplicare gene false.', 50, 50, 15, 'makeup', true]
  ];

  const createdServices = [];
  for (const service of services) {
    const [categoryName, name, description, priceMin, priceMax, durationMinutes, specialization, isBookable] = service;
    const created = await prisma.service.create({
      data: {
        categoryId: categoryMap[categoryName],
        name,
        description,
        priceMin,
        priceMax,
        durationMinutes,
        specialization,
        isBookable
      }
    });
    createdServices.push(created);
  }

  const serviceByName = Object.fromEntries(createdServices.map((service) => [service.name, service.id]));

  await prisma.employeeDayOff.createMany({
    data: [
      { employeeId: hairEmployee.id, date: dateFromToday(6), reason: 'Training produs nou' },
      { employeeId: nailsEmployee.id, date: dateFromToday(3), reason: 'Concediu' }
    ]
  });

  const appointments = [
    addAppointment(dateFromToday(-24), '10:00', '11:30', 'completed', client.id, hairEmployee.id, serviceByName['Tuns / Spălat / Uscat – Păr mediu'], 'Client fidel'),
    addAppointment(dateFromToday(-20), '12:00', '13:10', 'completed', secondClient.id, nailsEmployee.id, serviceByName['Manichiură cu ojă semipermanentă']),
    addAppointment(dateFromToday(-18), '11:00', '12:40', 'completed', client.id, makeupEmployee.id, serviceByName['Machiaj de ocazie']),
    addAppointment(dateFromToday(-14), '09:30', '10:30', 'completed', secondClient.id, hairEmployee.id, serviceByName['Spălat / Coafat']),
    addAppointment(dateFromToday(-11), '15:00', '16:10', 'completed', client.id, nailsEmployee.id, serviceByName['Pedichiură cu ojă semipermanentă']),
    addAppointment(dateFromToday(-9), '11:30', '12:20', 'cancelled', secondClient.id, hairEmployee.id, serviceByName['Anti-sebum']),
    addAppointment(dateFromToday(-7), '10:00', '11:40', 'completed', client.id, makeupEmployee.id, serviceByName['Machiaj ședință foto']),
    addAppointment(dateFromToday(-5), '16:00', '17:30', 'completed', secondClient.id, hairEmployee.id, serviceByName['Manoperă Vopsit']),
    addAppointment(dateFromToday(-2), '10:30', '11:40', 'accepted', client.id, nailsEmployee.id, serviceByName['Gel pe unghia naturală']),
    addAppointment(dateFromToday(1), '11:00', '12:00', 'pending', secondClient.id, hairEmployee.id, serviceByName['Hidratare'], 'Prefer dimineața'),
    addAppointment(dateFromToday(2), '14:30', '15:20', 'pending', client.id, nailsEmployee.id, serviceByName['Manichiură spa']),
    addAppointment(dateFromToday(4), '12:00', '13:40', 'accepted', secondClient.id, makeupEmployee.id, serviceByName['Machiaj de ocazie'])
  ];

  await prisma.appointment.createMany({ data: appointments });

  console.log('Seed completed successfully.');
  console.log('Conturi demo:');
  console.log(`Admin: ${admin.email} / admin123`);
  console.log(`Hair: ${hairEmployee.email} / employee123`);
  console.log(`Nails: ${nailsEmployee.email} / employee123`);
  console.log(`Makeup: ${makeupEmployee.email} / employee123`);
  console.log(`Client: ${client.email} / client123`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
