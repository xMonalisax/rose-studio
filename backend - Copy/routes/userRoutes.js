const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

const employeeSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  specialization: true,
  isActive: true,
  workStart: true,
  workEnd: true,
  breakStart: true,
  breakEnd: true,
  employeeDayOffs: {
    orderBy: { date: 'asc' }
  }
};

function dayRange(dateValue) {
  const start = new Date(dateValue);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

router.get('/employees', async (req, res) => {
  try {
    const specialization = req.query.specialization;
    const employees = await prisma.user.findMany({
      where: {
        role: 'employee',
        isActive: true,
        ...(specialization ? { specialization } : {})
      },
      select: employeeSelect,
      orderBy: { name: 'asc' }
    });

    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: 'Nu am putut prelua angajații.' });
  }
});

router.post('/employees', authMiddleware, authorizeRoles('admin'), async (req, res) => {
  try {
    const { name, email, password, phone, specialization, workStart, workEnd, breakStart, breakEnd } = req.body;

    if (!name || !email || !password || !specialization) {
      return res.status(400).json({ message: 'Completează toate câmpurile obligatorii.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Există deja un utilizator cu acest email.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const employee = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        role: 'employee',
        specialization,
        workStart: workStart || '09:00',
        workEnd: workEnd || '20:00',
        breakStart: breakStart || null,
        breakEnd: breakEnd || null
      },
      select: employeeSelect
    });

    res.status(201).json(employee);
  } catch (error) {
    res.status(500).json({ message: 'Angajatul nu a putut fi adăugat.' });
  }
});

router.put('/employees/:id', authMiddleware, authorizeRoles('admin'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, email, phone, specialization, workStart, workEnd, breakStart, breakEnd, isActive } = req.body;

    const updatedEmployee = await prisma.user.update({
      where: { id },
      data: { name, email, phone, specialization, workStart, workEnd, breakStart: breakStart || null, breakEnd: breakEnd || null, isActive },
      select: employeeSelect
    });

    res.json(updatedEmployee);
  } catch (error) {
    res.status(500).json({ message: 'Angajatul nu a putut fi actualizat.' });
  }
});

router.post('/employees/:id/dayoffs', authMiddleware, authorizeRoles('admin'), async (req, res) => {
  try {
    const employeeId = Number(req.params.id);
    const { date, reason } = req.body;

    if (!date) {
      return res.status(400).json({ message: 'Data este obligatorie.' });
    }

    const employee = await prisma.user.findUnique({ where: { id: employeeId } });
    if (!employee || employee.role !== 'employee') {
      return res.status(404).json({ message: 'Angajatul nu a fost găsit.' });
    }

    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);

    const dayOff = await prisma.employeeDayOff.create({
      data: {
        employeeId,
        date: normalized,
        reason
      }
    });

    res.status(201).json(dayOff);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Există deja o zi liberă setată pentru această dată.' });
    }
    res.status(500).json({ message: 'Nu am putut salva ziua liberă.' });
  }
});

router.delete('/employees/:id/dayoffs/:dayOffId', authMiddleware, authorizeRoles('admin'), async (req, res) => {
  try {
    const dayOffId = Number(req.params.dayOffId);
    await prisma.employeeDayOff.delete({ where: { id: dayOffId } });
    res.json({ message: 'Ziua liberă a fost ștearsă.' });
  } catch (error) {
    res.status(500).json({ message: 'Ziua liberă nu a putut fi ștearsă.' });
  }
});

router.delete('/employees/:id', authMiddleware, authorizeRoles('admin'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.user.update({ where: { id }, data: { isActive: false } });
    res.json({ message: 'Angajatul a fost dezactivat.' });
  } catch (error) {
    res.status(500).json({ message: 'Angajatul nu a putut fi șters.' });
  }
});

module.exports = router;
