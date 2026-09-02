import Drug from '../models/Drug.js';
import Dispense from '../models/Dispense.js';
import { asyncHandler, AppError } from 'hms-shared';

/* ---------- Drug Inventory ---------- */

// add a drug to inventory
export const createDrug = asyncHandler(async (req, res, next) => {
  const { name } = req.body;
  if (!name) return next(new AppError('Drug name is required', 400));

  const drug = await Drug.create(req.body);
  res.status(201).json({
    status: 'success',
    message: 'Drug added to inventory',
    data: { drug }
  });
});

// list drugs (optional search + category filter)
export const getDrugs = asyncHandler(async (req, res) => {
  const { search, category } = req.query;

  const query = { isActive: true };
  if (category) query.category = category;
  if (search) query.name = { $regex: search, $options: 'i' };

  const drugs = await Drug.find(query).sort({ name: 1 });

  res.json({
    status: 'success',
    results: drugs.length,
    data: { drugs }
  });
});

// get single drug
export const getDrug = asyncHandler(async (req, res, next) => {
  const drug = await Drug.findById(req.params.id);
  if (!drug) return next(new AppError('Drug not found', 404));

  res.json({ status: 'success', data: { drug } });
});

// update a drug (details or restock)
export const updateDrug = asyncHandler(async (req, res, next) => {
  const drug = await Drug.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  if (!drug) return next(new AppError('Drug not found', 404));

  res.json({ status: 'success', message: 'Drug updated', data: { drug } });
});

// add stock (restock)
export const addStock = asyncHandler(async (req, res, next) => {
  const { quantity } = req.body;
  if (!quantity || quantity <= 0) {
    return next(new AppError('quantity must be a positive number', 400));
  }

  const drug = await Drug.findById(req.params.id);
  if (!drug) return next(new AppError('Drug not found', 404));

  drug.stock += quantity;
  await drug.save();

  res.json({
    status: 'success',
    message: 'Stock added',
    data: { drug }
  });
});

// list drugs that are low on stock (at or below reorder level)
export const getLowStock = asyncHandler(async (req, res) => {
  const drugs = await Drug.find({
    isActive: true,
    $expr: { $lte: ['$stock', '$reorderLevel'] }
  }).sort({ stock: 1 });

  res.json({
    status: 'success',
    results: drugs.length,
    data: { drugs }
  });
});

/* ---------- Dispensing ---------- */

// dispense drugs to a patient (decrements stock)
export const dispenseDrugs = asyncHandler(async (req, res, next) => {
  const { patientId, patientName, recordId, items } = req.body;

  if (!patientId || !items || !items.length) {
    return next(new AppError('patientId and at least one item are required', 400));
  }

  // first pass - validate stock for all items before changing anything
  const dispenseItems = [];
  let totalAmount = 0;

  for (const item of items) {
    const drug = await Drug.findById(item.drugId);
    if (!drug) return next(new AppError(`Drug ${item.drugId} not found`, 404));

    if (drug.stock < item.quantity) {
      return next(new AppError(`Not enough stock for ${drug.name}. Available: ${drug.stock}`, 400));
    }

    const subtotal = drug.price * item.quantity;
    totalAmount += subtotal;

    dispenseItems.push({
      drugId: drug._id.toString(),
      drugName: drug.name,
      quantity: item.quantity,
      price: drug.price,
      subtotal,
      _drug: drug // keep reference for the second pass
    });
  }

  // second pass - decrement stock now that all items are valid
  for (const di of dispenseItems) {
    di._drug.stock -= di.quantity;
    await di._drug.save();
    delete di._drug; // don't store the mongoose doc in the dispense record
  }

  const dispense = await Dispense.create({
    patientId,
    patientName,
    recordId,
    items: dispenseItems,
    totalAmount,
    dispensedBy: req.user.id
  });

  res.status(201).json({
    status: 'success',
    message: 'Drugs dispensed',
    data: { dispense }
  });
});

// list dispense records (filter by patient)
export const getDispenses = asyncHandler(async (req, res) => {
  const { patientId, page = 1, limit = 10 } = req.query;

  const query = {};
  if (patientId) query.patientId = patientId;

  const skip = (page - 1) * limit;
  const dispenses = await Dispense.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Dispense.countDocuments(query);

  res.json({
    status: 'success',
    results: dispenses.length,
    total,
    page: Number(page),
    data: { dispenses }
  });
});
