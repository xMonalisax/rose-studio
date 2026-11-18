const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');
const { timeToMinutes } = require('../utils/time');

const router = express.Router();
const prisma = new PrismaClient();

function getServiceAveragePrice(service) {
  return (service.priceMin + service.priceMax) / 2;
}

function getEmployeeDailyMinutes(employee) {
  const workStart = timeToMinutes(employee.workStart || '09:00');
  const workEnd = timeToMinutes(employee.workEnd || '20:00');

  let breakMinutes = 0;
  if (employee.breakStart && employee.breakEnd) {
    breakMinutes = Math.max(
      0,
      timeToMinutes(employee.breakEnd) - timeToMinutes(employee.breakStart)
    );
  }

  return Math.max(0, workEnd - workStart - breakMinutes);
}

function getMonthLabel(dateValue) {
  const date = new Date(dateValue);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${year}`;
}

function sortMonthEntries(entries) {
  return entries.sort((a, b) => {
    const [monthA, yearA] = a[0].split('/').map(Number);
    const [monthB, yearB] = b[0].split('/').map(Number);

    const dateA = new Date(yearA, monthA - 1, 1).getTime();
    const dateB = new Date(yearB, monthB - 1, 1).getTime();

    return dateA - dateB;
  });
}

function isSameMonth(dateValue, month, year) {
  const date = new Date(dateValue);
  return date.getMonth() === month && date.getFullYear() === year;
}

router.get('/summary', authMiddleware, authorizeRoles('admin'), async (req, res) => {
  try {
    const [appointments, services, employees] = await Promise.all([
      prisma.appointment.findMany({
        include: {
          service: true,
          employee: true,
          client: true
        }
      }),
      prisma.service.findMany({
        where: { isActive: true }
      }),
      prisma.user.findMany({
        where: { role: 'employee', isActive: true },
        include: { employeeDayOffs: true }
      })
    ]);

    const appointmentsByStatus = {};
    const serviceCounts = {};
    const employeeCounts = {};
    const clientStats = {};
    const monthlyCounts = {};
    const monthlyRevenue = {};
    const revenueByServiceMap = {};

    let estimatedRevenue = 0;

    appointments.forEach((appointment) => {
      const serviceName = appointment.service.name;
      const employeeName = appointment.employee.name;
      const clientName = appointment.client.name;
      const monthLabel = getMonthLabel(appointment.appointmentDate);

      appointmentsByStatus[appointment.status] =
        (appointmentsByStatus[appointment.status] || 0) + 1;

      serviceCounts[serviceName] = (serviceCounts[serviceName] || 0) + 1;
      employeeCounts[employeeName] = (employeeCounts[employeeName] || 0) + 1;
      monthlyCounts[monthLabel] = (monthlyCounts[monthLabel] || 0) + 1;

      if (!clientStats[clientName]) {
        clientStats[clientName] = {
          appointments: 0,
          totalSpent: 0
        };
      }

      clientStats[clientName].appointments += 1;

      const averagePrice = getServiceAveragePrice(appointment.service);

      if (['accepted', 'completed'].includes(appointment.status)) {
        estimatedRevenue += averagePrice;
      }

      if (['accepted', 'completed'].includes(appointment.status)) {
        monthlyRevenue[monthLabel] = (monthlyRevenue[monthLabel] || 0) + averagePrice;
        revenueByServiceMap[serviceName] =
          (revenueByServiceMap[serviceName] || 0) + averagePrice;
        clientStats[clientName].totalSpent += averagePrice;
      }
    });

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const occupancyByEmployee = employees.map((employee) => {
      const employeeAppointments = appointments.filter(
        (appointment) =>
          appointment.employeeId === employee.id &&
          ['pending', 'accepted', 'completed'].includes(appointment.status) &&
          isSameMonth(appointment.appointmentDate, currentMonth, currentYear)
      );

      const bookedMinutes = employeeAppointments.reduce((sum, appointment) => {
        return sum + (timeToMinutes(appointment.endTime) - timeToMinutes(appointment.startTime));
      }, 0);

      const workDaysSoFar = Math.max(1, Math.min(now.getDate(), 26));
      const availableMinutes = getEmployeeDailyMinutes(employee) * workDaysSoFar;

      const percent = availableMinutes
        ? Math.round((bookedMinutes / availableMinutes) * 100)
        : 0;

      return {
        label: employee.name,
        value: percent
      };
    });

    const topServices = Object.entries(serviceCounts)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    const topClients = Object.entries(clientStats)
      .map(([label, value]) => ({
        label,
        value: value.appointments,
        totalSpent: Number(value.totalSpent.toFixed(0))
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const appointmentsByMonth = sortMonthEntries(Object.entries(monthlyCounts)).map(
      ([label, value]) => ({
        label,
        value
      })
    );

    const revenueByMonth = sortMonthEntries(Object.entries(monthlyRevenue)).map(
      ([label, value]) => ({
        label,
        value: Number(value.toFixed(0))
      })
    );

    const revenueByService = Object.entries(revenueByServiceMap)
      .map(([label, value]) => ({
        label,
        value: Number(value.toFixed(0))
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    const efficiencyByStatus = [
      { label: 'completed', value: appointmentsByStatus.completed || 0 },
      { label: 'cancelled', value: appointmentsByStatus.cancelled || 0 },
      { label: 'no_show', value: appointmentsByStatus.no_show || 0 }
    ];

    res.json({
      totalAppointments: appointments.length,
      totalServices: services.length,
      totalEmployees: employees.length,
      estimatedRevenue: Number(estimatedRevenue.toFixed(0)),
      appointmentsByStatus,
      topServices,
      appointmentsByEmployee: Object.entries(employeeCounts)
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value),
      appointmentsByMonth,
      revenueByMonth,
      revenueByService,
      efficiencyByStatus,
      topClients,
      occupancyByEmployee
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Nu am putut prelua statisticile.' });
  }
});

module.exports = router;