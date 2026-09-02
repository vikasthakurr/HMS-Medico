import Patient from '../models/Patient.js';
import { asyncHandler, AppError } from 'hms-shared';

// create a new patient
export const createPatient = asyncHandler(async (req, res, next) => {
  const patient = await Patient.create(req.body);
  res.status(201).json({
    status: 'success',
    message: 'Patient created',
    data: { patient }
  });
});

// get all patients (with optional search + pagination)
export const getPatients = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 10 } = req.query;

  const query = { isActive: true };

  // search by name, email or phone
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (page - 1) * limit;
  const patients = await Patient.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Patient.countDocuments(query);

  res.json({
    status: 'success',
    results: patients.length,
    total,
    page: Number(page),
    data: { patients }
  });
});

// get single patient by id
export const getPatient = asyncHandler(async (req, res, next) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) return next(new AppError('Patient not found', 404));

  res.json({ status: 'success', data: { patient } });
});

// update patient
export const updatePatient = asyncHandler(async (req, res, next) => {
  const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  if (!patient) return next(new AppError('Patient not found', 404));

  res.json({
    status: 'success',
    message: 'Patient updated',
    data: { patient }
  });
});

// soft delete patient (just mark inactive)
export const deletePatient = asyncHandler(async (req, res, next) => {
  const patient = await Patient.findByIdAndUpdate(req.params.id, { isActive: false });
  if (!patient) return next(new AppError('Patient not found', 404));

  res.json({ status: 'success', message: 'Patient deleted' });
});
