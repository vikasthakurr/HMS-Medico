import LabTest from '../models/LabTest.js';
import LabOrder from '../models/LabOrder.js';
import { asyncHandler, AppError } from 'hms-shared';

/* ---------- Test Catalog ---------- */

// add a test to the catalog
export const createTest = asyncHandler(async (req, res, next) => {
  const { name } = req.body;
  if (!name) return next(new AppError('Test name is required', 400));

  const test = await LabTest.create(req.body);
  res.status(201).json({
    status: 'success',
    message: 'Test added to catalog',
    data: { test }
  });
});

// list all tests in catalog (optional search + category filter)
export const getTests = asyncHandler(async (req, res) => {
  const { search, category } = req.query;

  const query = { isActive: true };
  if (category) query.category = category;
  if (search) query.name = { $regex: search, $options: 'i' };

  const tests = await LabTest.find(query).sort({ name: 1 });

  res.json({
    status: 'success',
    results: tests.length,
    data: { tests }
  });
});

// update a test
export const updateTest = asyncHandler(async (req, res, next) => {
  const test = await LabTest.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  if (!test) return next(new AppError('Test not found', 404));

  res.json({ status: 'success', message: 'Test updated', data: { test } });
});

/* ---------- Lab Orders ---------- */

// create a lab order (order a test for a patient)
export const createOrder = asyncHandler(async (req, res, next) => {
  const { patientId, testId, testName } = req.body;
  if (!patientId || !testId || !testName) {
    return next(new AppError('patientId, testId and testName are required', 400));
  }

  const order = await LabOrder.create(req.body);
  res.status(201).json({
    status: 'success',
    message: 'Lab order created',
    data: { order }
  });
});

// list lab orders (filter by patient or status)
export const getOrders = asyncHandler(async (req, res) => {
  const { patientId, status, page = 1, limit = 10 } = req.query;

  const query = {};
  if (patientId) query.patientId = patientId;
  if (status) query.status = status;

  const skip = (page - 1) * limit;
  const orders = await LabOrder.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await LabOrder.countDocuments(query);

  res.json({
    status: 'success',
    results: orders.length,
    total,
    page: Number(page),
    data: { orders }
  });
});

// get single order
export const getOrder = asyncHandler(async (req, res, next) => {
  const order = await LabOrder.findById(req.params.id);
  if (!order) return next(new AppError('Order not found', 404));

  res.json({ status: 'success', data: { order } });
});

// mark sample as collected
export const collectSample = asyncHandler(async (req, res, next) => {
  const order = await LabOrder.findById(req.params.id);
  if (!order) return next(new AppError('Order not found', 404));

  if (order.status !== 'ordered') {
    return next(new AppError('Sample can only be collected for ordered tests', 400));
  }

  order.status = 'sample_collected';
  order.sampleCollectedAt = new Date();
  await order.save();

  res.json({ status: 'success', message: 'Sample collected', data: { order } });
});

// enter the result and mark completed
export const enterResult = asyncHandler(async (req, res, next) => {
  const { result, resultNotes } = req.body;
  if (!result) return next(new AppError('result is required', 400));

  const order = await LabOrder.findById(req.params.id);
  if (!order) return next(new AppError('Order not found', 404));

  if (order.status === 'cancelled') {
    return next(new AppError('Cannot add result to a cancelled order', 400));
  }

  order.result = result;
  order.resultNotes = resultNotes;
  order.resultDate = new Date();
  order.status = 'completed';
  await order.save();

  res.json({ status: 'success', message: 'Result entered', data: { order } });
});

// cancel an order
export const cancelOrder = asyncHandler(async (req, res, next) => {
  const order = await LabOrder.findById(req.params.id);
  if (!order) return next(new AppError('Order not found', 404));

  if (order.status === 'completed') {
    return next(new AppError('Cannot cancel a completed order', 400));
  }

  order.status = 'cancelled';
  await order.save();

  res.json({ status: 'success', message: 'Order cancelled' });
});
