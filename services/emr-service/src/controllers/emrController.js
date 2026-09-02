import MedicalRecord from '../models/MedicalRecord.js';
import { asyncHandler, AppError } from 'hms-shared';

// create a new medical record (a visit)
export const createRecord = asyncHandler(async (req, res, next) => {
  const { patientId, doctorId } = req.body;

  if (!patientId || !doctorId) {
    return next(new AppError('patientId and doctorId are required', 400));
  }

  const record = await MedicalRecord.create(req.body);
  res.status(201).json({
    status: 'success',
    message: 'Medical record created',
    data: { record }
  });
});

// get records (filter by patient or doctor)
export const getRecords = asyncHandler(async (req, res) => {
  const { patientId, doctorId, page = 1, limit = 10 } = req.query;

  const query = {};
  if (patientId) query.patientId = patientId;
  if (doctorId) query.doctorId = doctorId;

  const skip = (page - 1) * limit;
  const records = await MedicalRecord.find(query)
    .sort({ visitDate: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await MedicalRecord.countDocuments(query);

  res.json({
    status: 'success',
    results: records.length,
    total,
    page: Number(page),
    data: { records }
  });
});

// get patient history - all records for one patient
export const getPatientHistory = asyncHandler(async (req, res) => {
  const records = await MedicalRecord.find({ patientId: req.params.patientId })
    .sort({ visitDate: -1 });

  res.json({
    status: 'success',
    results: records.length,
    data: { records }
  });
});

// get single record
export const getRecord = asyncHandler(async (req, res, next) => {
  const record = await MedicalRecord.findById(req.params.id);
  if (!record) return next(new AppError('Record not found', 404));

  res.json({ status: 'success', data: { record } });
});

// update record (diagnosis, notes, vitals etc)
export const updateRecord = asyncHandler(async (req, res, next) => {
  const record = await MedicalRecord.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  if (!record) return next(new AppError('Record not found', 404));

  res.json({
    status: 'success',
    message: 'Record updated',
    data: { record }
  });
});

// add a prescription to an existing record
export const addPrescription = asyncHandler(async (req, res, next) => {
  const { medicine, dosage, frequency, duration, notes } = req.body;
  if (!medicine) return next(new AppError('medicine is required', 400));

  const record = await MedicalRecord.findById(req.params.id);
  if (!record) return next(new AppError('Record not found', 404));

  record.prescriptions.push({ medicine, dosage, frequency, duration, notes });
  await record.save();

  res.json({
    status: 'success',
    message: 'Prescription added',
    data: { prescriptions: record.prescriptions }
  });
});

// add a lab order to an existing record
export const addLabOrder = asyncHandler(async (req, res, next) => {
  const { testName } = req.body;
  if (!testName) return next(new AppError('testName is required', 400));

  const record = await MedicalRecord.findById(req.params.id);
  if (!record) return next(new AppError('Record not found', 404));

  record.labOrders.push({ testName });
  await record.save();

  res.json({
    status: 'success',
    message: 'Lab order added',
    data: { labOrders: record.labOrders }
  });
});
