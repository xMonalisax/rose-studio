const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

function buildToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

const authUserSelect = {
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
  breakEnd: true
};

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Numele, emailul și parola sunt obligatorii.' });
    }

    if (!email.includes('@')) {
      return res.status(400).json({ message: 'Email invalid.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Parola trebuie să aibă cel puțin 6 caractere.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Există deja un cont cu acest email.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        role: 'client',
        specialization: 'none'
      },
      select: authUserSelect
    });

    const token = buildToken(user.id);
    res.status(201).json({ token, user, message: 'Cont creat cu succes.' });
  } catch (error) {
    res.status(500).json({ message: 'A apărut o eroare la înregistrare.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Emailul și parola sunt obligatorii.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Email sau parolă incorectă.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Email sau parolă incorectă.' });
    }

    const token = buildToken(user.id);
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        specialization: user.specialization,
        isActive: user.isActive,
        workStart: user.workStart,
        workEnd: user.workEnd,
        breakStart: user.breakStart,
        breakEnd: user.breakEnd
      },
      message: 'Autentificare reușită.'
    });
  } catch (error) {
    res.status(500).json({ message: 'A apărut o eroare la autentificare.' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  res.json(req.user);
});

module.exports = router;
