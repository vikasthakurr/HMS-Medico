import mongoose from 'mongoose';

// a single drug dispensed (part of a dispense record)
const dispenseItemSchema = new mongoose.Schema({
  drugId: { type: String, required: true },
  drugName: { type: String },
  quantity: { type: Number, required: true },
  price: { type: Number },      // price per unit at time of dispense
  subtotal: { type: Number }    // quantity * price
}, { _id: false });

// a record of drugs dispensed to a patient
const dispenseSchema = new mongoose.Schema({
  patientId: { type: String, required: true },
  patientName: { type: String },
  recordId: { type: String }, // link to the EMR record / prescription

  items: [dispenseItemSchema],
  totalAmount: { type: Number, default: 0 },

  dispensedBy: { type: String } // pharmacist user id
}, { timestamps: true });

dispenseSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

export default mongoose.model('Dispense', dispenseSchema);
