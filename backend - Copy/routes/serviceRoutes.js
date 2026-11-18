const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      include: { category: true },
      orderBy: [{ categoryId: 'asc' }, { name: 'asc' }]
    });

    res.json(services);
  } catch (error) {
    res.status(500).json({ message: 'Nu am putut prelua serviciile.' });
  }
});

router.post('/', authMiddleware, authorizeRoles('admin'), async (req, res) => {
  try {
    const {
      name,
      description,
      priceMin,
      priceMax,
      durationMinutes,
      specialization,
      isBookable,
      categoryId
    } = req.body;

    if (!name || !categoryId || !specialization) {
      return res.status(400).json({ message: 'Numele, categoria și specializarea sunt obligatorii.' });
    }

    const service = await prisma.service.create({
      data: {
        name,
        description,
        priceMin: Number(priceMin),
        priceMax: Number(priceMax),
        durationMinutes: Number(durationMinutes),
        specialization,
        isBookable: isBookable !== false,
        categoryId: Number(categoryId)
      },
      include: { category: true }
    });

    res.status(201).json(service);
  } catch (error) {
    res.status(500).json({ message: 'Serviciul nu a putut fi adăugat.' });
  }
});

router.put('/:id', authMiddleware, authorizeRoles('admin'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const {
      name,
      description,
      priceMin,
      priceMax,
      durationMinutes,
      specialization,
      isBookable,
      isActive,
      categoryId
    } = req.body;

    const updatedService = await prisma.service.update({
      where: { id },
      data: {
        name,
        description,
        priceMin: Number(priceMin),
        priceMax: Number(priceMax),
        durationMinutes: Number(durationMinutes),
        specialization,
        isBookable,
        isActive,
        categoryId: Number(categoryId)
      },
      include: { category: true }
    });

    res.json(updatedService);
  } catch (error) {
    res.status(500).json({ message: 'Serviciul nu a putut fi actualizat.' });
  }
});

router.delete('/:id', authMiddleware, authorizeRoles('admin'), async (req, res) => {
  try {
    const id = Number(req.params.id);

    await prisma.service.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({ message: 'Serviciul a fost dezactivat.' });
  } catch (error) {
    res.status(500).json({ message: 'Serviciul nu a putut fi șters.' });
  }
});

module.exports = router;
