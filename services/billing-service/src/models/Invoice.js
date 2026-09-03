import mongoose from "mongoose";

// a single charge on the invoice
const lineItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true }, // "Consultation", "CBC test" etc
    category: { type: String }, // "consultation", "lab", "pharmacy", "other"
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number, required: true },
    amount: { type: Number, required: true }, // quantity * unitPrice
  },
  { _id: false },
);

// a payment made against the invoice
const paymentSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true },
    method: {
      type: String,
      enum: ["cash", "card", "upi", "insurance"],
      default: "cash",
    },
    paidAt: { type: Date, default: Date.now },
    reference: { type: String }, // txn id / receipt no
  },
  { _id: false },
);

const invoiceSchema = new mongoose.Schema(
  {
    patientId: { type: String, required: true },
    patientName: { type: String },
    recordId: { type: String }, // optional link to EMR record

    items: [lineItemSchema],

    subtotal: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },

    amountPaid: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ["unpaid", "partial", "paid", "cancelled"],
      default: "unpaid",
    },

    payments: [paymentSchema],

    createdBy: { type: String },
  },
  { timestamps: true },
);

invoiceSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

export default mongoose.model("Invoice", invoiceSchema);
