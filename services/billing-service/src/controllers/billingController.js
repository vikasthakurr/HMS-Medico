import Invoice from '../models/Invoice.js';
import { asyncHandler, AppError } from 'hms-shared';

// helper - work out amount for each line + subtotal
const buildItems = (items) => {
  let subtotal = 0;
  const built = items.map(item => {
    const quantity = item.quantity || 1;
    const amount = quantity * item.unitPrice;
    subtotal += amount;
    return {
      description: item.description,
      category: item.category,
      quantity,
      unitPrice: item.unitPrice,
      amount
    };
  });
  return { built, subtotal };
};

// helper - recalc paid/balance/status from payments
const recalcInvoice = (invoice) => {
  invoice.amountPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
  invoice.balance = invoice.totalAmount - invoice.amountPaid;

  if (invoice.status === 'cancelled') return;

  if (invoice.amountPaid <= 0) {
    invoice.status = 'unpaid';
  } else if (invoice.balance > 0) {
    invoice.status = 'partial';
  } else {
    invoice.status = 'paid';
  }
};

// create an invoice
export const createInvoice = asyncHandler(async (req, res, next) => {
  const { patientId, patientName, recordId, items, tax = 0, discount = 0 } = req.body;

  if (!patientId || !items || !items.length) {
    return next(new AppError('patientId and at least one item are required', 400));
  }

  const { built, subtotal } = buildItems(items);
  const totalAmount = subtotal + tax - discount;

  const invoice = await Invoice.create({
    patientId,
    patientName,
    recordId,
    items: built,
    subtotal,
    tax,
    discount,
    totalAmount,
    balance: totalAmount,
    status: 'unpaid',
    createdBy: req.user.id
  });

  res.status(201).json({
    status: 'success',
    message: 'Invoice created',
    data: { invoice }
  });
});

// list invoices (filter by patient or status)
export const getInvoices = asyncHandler(async (req, res) => {
  const { patientId, status, page = 1, limit = 10 } = req.query;

  const query = {};
  if (patientId) query.patientId = patientId;
  if (status) query.status = status;

  const skip = (page - 1) * limit;
  const invoices = await Invoice.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Invoice.countDocuments(query);

  res.json({
    status: 'success',
    results: invoices.length,
    total,
    page: Number(page),
    data: { invoices }
  });
});

// get single invoice
export const getInvoice = asyncHandler(async (req, res, next) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) return next(new AppError('Invoice not found', 404));

  res.json({ status: 'success', data: { invoice } });
});

// record a payment against an invoice
export const recordPayment = asyncHandler(async (req, res, next) => {
  const { amount, method, reference } = req.body;

  if (!amount || amount <= 0) {
    return next(new AppError('A positive payment amount is required', 400));
  }

  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) return next(new AppError('Invoice not found', 404));

  if (invoice.status === 'cancelled') {
    return next(new AppError('Cannot pay a cancelled invoice', 400));
  }

  if (invoice.status === 'paid') {
    return next(new AppError('Invoice is already fully paid', 400));
  }

  // dont allow overpaying
  if (amount > invoice.balance) {
    return next(new AppError(`Payment exceeds balance. Balance due: ${invoice.balance}`, 400));
  }

  invoice.payments.push({ amount, method, reference });
  recalcInvoice(invoice);
  await invoice.save();

  res.json({
    status: 'success',
    message: 'Payment recorded',
    data: { invoice }
  });
});

// cancel an invoice
export const cancelInvoice = asyncHandler(async (req, res, next) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) return next(new AppError('Invoice not found', 404));

  if (invoice.status === 'paid') {
    return next(new AppError('Cannot cancel a fully paid invoice', 400));
  }

  invoice.status = 'cancelled';
  await invoice.save();

  res.json({ status: 'success', message: 'Invoice cancelled' });
});
