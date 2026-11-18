const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');
const { timeToMinutes, minutesToTime, isValidTime } = require('../utils/time');

const router = express.Router();
const prisma = new PrismaClient();

const SALON_OPEN = '09:00';
const SALON_CLOSE = '20:00';
const BUFFER_MINUTES = 10;
const CANCELLATION_LIMIT_HOURS = 4;
const BLOCKING_STATUSES = ['pending', 'accepted', 'completed'];

function isOverlapping(startA, endA, startB, endB) {
  return timeToMinutes(startA) < timeToMinutes(endB) && timeToMinutes(endA) > timeToMinutes(startB);
}

function dayRange(dateValue) {
  const start = new Date(dateValue);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

function combineDateAndTime(dateValue, time) {
  const date = new Date(dateValue);
  const [hours, minutes] = time.split(':').map(Number);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function isSunday(dateValue) {
  return new Date(dateValue).getDay() === 0;
}

function normalizeBreak(employee) {
  if (!employee.breakStart || !employee.breakEnd) return null;
  return { start: employee.breakStart, end: employee.breakEnd };
}

function slotBlockedByBreak(startTime, endTime, employee) {
  const breakSlot = normalizeBreak(employee);
  if (!breakSlot) return false;
  return isOverlapping(startTime, endTime, breakSlot.start, breakSlot.end);
}

function slotBlockedByAppointments(startTime, endTime, appointments) {
  return appointments.some((appointment) => {
    const expandedStart = minutesToTime(Math.max(0, timeToMinutes(appointment.startTime) - BUFFER_MINUTES));
    const expandedEnd = minutesToTime(timeToMinutes(appointment.endTime) + BUFFER_MINUTES);
    return isOverlapping(startTime, endTime, expandedStart, expandedEnd);
  });
}

async function loadScheduleData(employeeId, appointmentDate) {
  const { start, end } = dayRange(appointmentDate);
  const [appointments, dayOff] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        employeeId: Number(employeeId),
        appointmentDate: { gte: start, lt: end },
        status: { in: BLOCKING_STATUSES }
      },
      orderBy: { startTime: 'asc' }
    }),
    prisma.employeeDayOff.findFirst({
      where: {
        employeeId: Number(employeeId),
        date: { gte: start, lt: end }
      }
    })
  ]);

  return { appointments, dayOff };
}

function validateBookingRequest({ service, employee, requestedDate, startTime, appointments, dayOff }) {
  if (isSunday(requestedDate)) {
    return 'Salonul nu preia programări duminica.';
  }

  if (dayOff) {
    return 'Specialistul ales este indisponibil în această zi.';
  }

  if (timeToMinutes(startTime) < timeToMinutes(SALON_OPEN) || timeToMinutes(startTime) < timeToMinutes(employee.workStart)) {
    return 'Ora aleasă este înainte de programul permis.';
  }

  const endMinutes = timeToMinutes(startTime) + service.durationMinutes;
  const endTime = minutesToTime(endMinutes);

  if (endMinutes > timeToMinutes(employee.workEnd || SALON_CLOSE) || endMinutes > timeToMinutes(SALON_CLOSE)) {
    return 'Programarea depășește programul de lucru al specialistului.';
  }

  if (slotBlockedByBreak(startTime, endTime, employee)) {
    return 'Intervalul selectat se suprapune cu pauza specialistului.';
  }

  if (slotBlockedByAppointments(startTime, endTime, appointments)) {
    return 'Acest interval nu mai este disponibil.';
  }

  return null;
}

router.get('/availability', async (req, res) => {
  try {
    const { employeeId, serviceId, appointmentDate } = req.query;

    if (!employeeId || !serviceId || !appointmentDate) {
      return res.status(400).json({ message: 'Completează serviciul, specialistul și data.' });
    }

    const [service, employee] = await Promise.all([
      prisma.service.findUnique({ where: { id: Number(serviceId) } }),
      prisma.user.findUnique({ where: { id: Number(employeeId) } })
    ]);

    if (!service || !employee || employee.role !== 'employee' || !employee.isActive) {
      return res.status(400).json({ message: 'Serviciul sau specialistul nu este valid.' });
    }

    const { appointments, dayOff } = await loadScheduleData(employeeId, appointmentDate);

    if (isSunday(appointmentDate)) {
      return res.json({ slots: [], message: 'Salonul este închis duminica.' });
    }

    if (dayOff) {
      return res.json({ slots: [], message: 'Specialistul este indisponibil în această zi.' });
    }

    const slots = [];
    const startMinutes = Math.max(timeToMinutes(SALON_OPEN), timeToMinutes(employee.workStart || SALON_OPEN));
    const endMinutes = Math.min(timeToMinutes(SALON_CLOSE), timeToMinutes(employee.workEnd || SALON_CLOSE));

    for (let current = startMinutes; current + service.durationMinutes <= endMinutes; current += 15) {
      const startTime = minutesToTime(current);
      const endTime = minutesToTime(current + service.durationMinutes);
      const validationError = validateBookingRequest({ service, employee, requestedDate: appointmentDate, startTime, appointments, dayOff });
      if (!validationError) {
        slots.push({ startTime, endTime });
      }
    }

    res.json({
      slots,
      schedule: {
        workStart: employee.workStart,
        workEnd: employee.workEnd,
        breakStart: employee.breakStart,
        breakEnd: employee.breakEnd
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Nu am putut calcula intervalele disponibile.' });
  }
});

router.post('/', authMiddleware, authorizeRoles('client'), async (req, res) => {
  try {
    const { employeeId, serviceId, appointmentDate, startTime, notes } = req.body;

    if (!employeeId || !serviceId || !appointmentDate || !startTime) {
      return res.status(400).json({ message: 'Completează toate câmpurile obligatorii.' });
    }

    if (!isValidTime(startTime)) {
      return res.status(400).json({ message: 'Ora introdusă nu este validă.' });
    }

    const [service, employee] = await Promise.all([
      prisma.service.findUnique({ where: { id: Number(serviceId) } }),
      prisma.user.findUnique({ where: { id: Number(employeeId) } })
    ]);

    if (!service || !service.isActive || !service.isBookable) {
      return res.status(400).json({ message: 'Serviciul selectat nu este disponibil.' });
    }

    if (!employee || employee.role !== 'employee' || !employee.isActive) {
      return res.status(400).json({ message: 'Angajatul selectat nu este valid.' });
    }

    if (employee.specialization !== service.specialization) {
      return res.status(400).json({ message: 'Specialistul ales nu poate presta acest serviciu.' });
    }

    const requestedDate = new Date(appointmentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (Number.isNaN(requestedDate.getTime())) {
      return res.status(400).json({ message: 'Data introdusă nu este validă.' });
    }

    if (requestedDate < today) {
      return res.status(400).json({ message: 'Nu poți face o programare în trecut.' });
    }

    const { appointments, dayOff } = await loadScheduleData(employeeId, appointmentDate);
    const validationError = validateBookingRequest({ service, employee, requestedDate, startTime, appointments, dayOff });
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const endTime = minutesToTime(timeToMinutes(startTime) + service.durationMinutes);

    const appointment = await prisma.appointment.create({
      data: {
        clientId: req.user.id,
        employeeId: Number(employeeId),
        serviceId: Number(serviceId),
        appointmentDate: dayRange(appointmentDate).start,
        startTime,
        endTime,
        status: 'pending',
        notes
      },
      include: {
        client: { select: { id: true, name: true, email: true, phone: true } },
        employee: { select: { id: true, name: true, specialization: true, workStart: true, workEnd: true, breakStart: true, breakEnd: true } },
        service: { select: { id: true, name: true, durationMinutes: true, category: true, priceMin: true, priceMax: true } }
      }
    });

    res.status(201).json({
      appointment,
      message: 'Programarea a fost trimisă și așteaptă confirmare.'
    });
  } catch (error) {
    res.status(500).json({ message: 'Programarea nu a putut fi salvată.' });
  }
});

router.get('/my', authMiddleware, async (req, res) => {
  try {
    const whereCondition = req.user.role === 'client'
      ? { clientId: req.user.id }
      : req.user.role === 'employee'
      ? { employeeId: req.user.id }
      : {};

    const appointments = await prisma.appointment.findMany({
      where: whereCondition,
      include: {
        client: { select: { id: true, name: true, email: true, phone: true } },
        employee: { select: { id: true, name: true, specialization: true, workStart: true, workEnd: true, breakStart: true, breakEnd: true } },
        service: { include: { category: true } }
      },
      orderBy: [{ appointmentDate: 'desc' }, { startTime: 'desc' }]
    });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Nu am putut prelua programările.' });
  }
});

router.get('/', authMiddleware, authorizeRoles('admin'), async (req, res) => {
  try {
    const appointments = await prisma.appointment.findMany({
      include: {
        client: { select: { id: true, name: true, email: true, phone: true } },
        employee: { select: { id: true, name: true, specialization: true, workStart: true, workEnd: true, breakStart: true, breakEnd: true } },
        service: { include: { category: true } }
      },
      orderBy: [{ appointmentDate: 'desc' }, { startTime: 'desc' }]
    });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Nu am putut prelua toate programările.' });
  }
});

router.patch('/:id/status', authMiddleware, authorizeRoles('employee', 'admin'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;
    const allowedStatuses = ['accepted', 'rejected', 'completed', 'cancelled', 'no_show'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Status invalid.' });
    }

    const appointment = await prisma.appointment.findUnique({ where: { id } });
    if (!appointment) {
      return res.status(404).json({ message: 'Programarea nu a fost găsită.' });
    }

    if (req.user.role === 'employee' && appointment.employeeId !== req.user.id) {
      return res.status(403).json({ message: 'Poți modifica doar programările tale.' });
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: { status },
      include: {
        client: { select: { id: true, name: true, email: true, phone: true } },
        employee: { select: { id: true, name: true, specialization: true, workStart: true, workEnd: true, breakStart: true, breakEnd: true } },
        service: { include: { category: true } }
      }
    });

    res.json({ updatedAppointment, message: 'Statusul programării a fost actualizat.' });
  } catch (error) {
    res.status(500).json({ message: 'Nu am putut actualiza statusul.' });
  }
});

router.patch('/:id/cancel', authMiddleware, authorizeRoles('client', 'admin'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const appointment = await prisma.appointment.findUnique({ where: { id } });

    if (!appointment) {
      return res.status(404).json({ message: 'Programarea nu a fost găsită.' });
    }

    if (req.user.role === 'client' && appointment.clientId !== req.user.id) {
      return res.status(403).json({ message: 'Poți anula doar programările tale.' });
    }

    if (req.user.role === 'client') {
      const appointmentDateTime = combineDateAndTime(appointment.appointmentDate, appointment.startTime);
      const hoursUntilAppointment = (appointmentDateTime.getTime() - Date.now()) / (1000 * 60 * 60);

      if (hoursUntilAppointment < CANCELLATION_LIMIT_HOURS) {
        return res.status(400).json({ message: `Programarea poate fi anulată cu minimum ${CANCELLATION_LIMIT_HOURS} ore înainte.` });
      }
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: { status: 'cancelled' },
      include: {
        client: { select: { id: true, name: true, email: true, phone: true } },
        employee: { select: { id: true, name: true, specialization: true, workStart: true, workEnd: true, breakStart: true, breakEnd: true } },
        service: { include: { category: true } }
      }
    });

    res.json({ updatedAppointment, message: 'Programarea a fost anulată.' });
  } catch (error) {
    res.status(500).json({ message: 'Programarea nu a putut fi anulată.' });
  }
});

module.exports = router;
