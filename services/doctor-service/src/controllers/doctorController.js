import Doctor from '../models/Doctor.js';
import { asyncHandler, AppError } from 'hms-shared';

// create a new doctor/staff
export const createDoctor = asyncHandler(async (req, res, next) => {
  const doctor = await Doctor.create(req.body);
  res.status(201).json({
    status: 'success',
    message: 'Doctor created',
    data: { doctor }
  });
});

// get all doctors (with optional search + filters + pagination)
export const getDoctors = asyncHandler(async (req, res) => {
  const { search, specialization, department, staffType, page = 1, limit = 10 } = req.query;

  const query = { isActive: true };

  if (specialization) query.specialization = specialization;
  if (department) query.department = department;
  if (staffType) query.staffType = staffType;

  // search by name or email
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (page - 1) * limit;
  const doctors = await Doctor.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Doctor.countDocuments(query);

  res.json({
    status: 'success',
    results: doctors.length,
    total,
    page: Number(page),
    data: { doctors }
  });
});

// get single doctor by id
export const getDoctor = asyncHandler(async (req, res, next) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) return next(new AppError('Doctor not found', 404));

  res.json({ status: 'success', data: { doctor } });
});

// update doctor
export const updateDoctor = asyncHandler(async (req, res, next) => {
  const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  if (!doctor) return next(new AppError('Doctor not found', 404));

  res.json({
    status: 'success',
    message: 'Doctor updated',
    data: { doctor }
  });
});

// update just the availability schedule
export const updateAvailability = asyncHandler(async (req, res, next) => {
  const { availability } = req.body;
  if (!availability) return next(new AppError('Availability is required', 400));

  const doctor = await Doctor.findByIdAndUpdate(
    req.params.id,
    { availability },
    { new: true }
  );
  if (!doctor) return next(new AppError('Doctor not found', 404));

  res.json({
    status: 'success',
    message: 'Availability updated',
    data: { availability: doctor.availability }
  });
});

// soft delete doctor
export const deleteDoctor = asyncHandler(async (req, res, next) => {
  const doctor = await Doctor.findByIdAndUpdate(req.params.id, { isActive: false });
  if (!doctor) return next(new AppError('Doctor not found', 404));

  res.json({ status: 'success', message: 'Doctor deleted' });
});
