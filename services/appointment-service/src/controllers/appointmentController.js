import Appointment from '../models/Appointment.js';
import { asyncHandler, AppError } from 'hms-shared';

// helper - check if two time slots overlap (times like "10:00")
const isOverlapping = (start1, end1, start2, end2) => {
  return start1 < end2 && start2 < end1;
};

// mongo throws code 11000 when the unique index is violated (concurrent double-booking)
const isDuplicateKeyError = (err) => err && err.code === 11000;

// book a new appointment
export const bookAppointment = asyncHandler(async (req, res, next) => {
  const { patientId, patientName, doctorId, doctorName, date, startTime, endTime, reason } = req.body;

  if (!patientId || !doctorId || !date || !startTime || !endTime) {
    return next(new AppError('patientId, doctorId, date, startTime and endTime are required', 400));
  }

  // find all appointments for this doctor on the same day (not cancelled)
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const sameDay = await Appointment.find({
    doctorId,
    date: { $gte: dayStart, $lte: dayEnd },
    status: 'scheduled'
  });

  // check for slot conflict
  const conflict = sameDay.find(appt =>
    isOverlapping(startTime, endTime, appt.startTime, appt.endTime)
  );

  if (conflict) {
    return next(new AppError('Doctor already has an appointment in this slot', 409));
  }

  // the app-level check above handles the common case, but two requests can race
  // past it. the unique index is the real guard - catch its error and return 409.
  let appointment;
  try {
    appointment = await Appointment.create({
      patientId,
      patientName,
      doctorId,
      doctorName,
      date,
      startTime,
      endTime,
      reason,
      bookedBy: req.user.id
    });
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      return next(new AppError('Doctor already has an appointment in this slot', 409));
    }
    throw err;
  }

  res.status(201).json({
    status: 'success',
    message: 'Appointment booked',
    data: { appointment }
  });
});

// get appointments (filter by patient, doctor, status, date)
export const getAppointments = asyncHandler(async (req, res) => {
  const { patientId, doctorId, status, date, page = 1, limit = 10 } = req.query;

  const query = {};
  if (patientId) query.patientId = patientId;
  if (doctorId) query.doctorId = doctorId;
  if (status) query.status = status;

  if (date) {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    query.date = { $gte: dayStart, $lte: dayEnd };
  }

  const skip = (page - 1) * limit;
  const appointments = await Appointment.find(query)
    .sort({ date: 1, startTime: 1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Appointment.countDocuments(query);

  res.json({
    status: 'success',
    results: appointments.length,
    total,
    page: Number(page),
    data: { appointments }
  });
});

// get single appointment
export const getAppointment = asyncHandler(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) return next(new AppError('Appointment not found', 404));

  res.json({ status: 'success', data: { appointment } });
});

// reschedule - change date/time (checks conflict again)
export const rescheduleAppointment = asyncHandler(async (req, res, next) => {
  const { date, startTime, endTime } = req.body;
  if (!date || !startTime || !endTime) {
    return next(new AppError('date, startTime and endTime are required', 400));
  }

  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) return next(new AppError('Appointment not found', 404));

  if (appointment.status !== 'scheduled') {
    return next(new AppError('Only scheduled appointments can be rescheduled', 400));
  }

  // check conflict for the new slot (ignore this same appointment)
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const sameDay = await Appointment.find({
    _id: { $ne: appointment._id },
    doctorId: appointment.doctorId,
    date: { $gte: dayStart, $lte: dayEnd },
    status: 'scheduled'
  });

  const conflict = sameDay.find(appt =>
    isOverlapping(startTime, endTime, appt.startTime, appt.endTime)
  );

  if (conflict) {
    return next(new AppError('Doctor already has an appointment in this slot', 409));
  }

  appointment.date = date;
  appointment.startTime = startTime;
  appointment.endTime = endTime;

  // guard the new slot at the db level too (race-safe)
  try {
    await appointment.save();
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      return next(new AppError('Doctor already has an appointment in this slot', 409));
    }
    throw err;
  }

  res.json({
    status: 'success',
    message: 'Appointment rescheduled',
    data: { appointment }
  });
});

// cancel appointment
export const cancelAppointment = asyncHandler(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) return next(new AppError('Appointment not found', 404));

  if (appointment.status === 'cancelled') {
    return next(new AppError('Appointment is already cancelled', 400));
  }

  appointment.status = 'cancelled';
  await appointment.save();

  res.json({ status: 'success', message: 'Appointment cancelled' });
});

// update status (completed / no_show) + optional notes
export const updateStatus = asyncHandler(async (req, res, next) => {
  const { status, notes } = req.body;

  if (!['completed', 'no_show', 'scheduled'].includes(status)) {
    return next(new AppError('Invalid status', 400));
  }

  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) return next(new AppError('Appointment not found', 404));

  appointment.status = status;
  if (notes !== undefined) appointment.notes = notes;
  await appointment.save();

  res.json({
    status: 'success',
    message: 'Status updated',
    data: { appointment }
  });
});
