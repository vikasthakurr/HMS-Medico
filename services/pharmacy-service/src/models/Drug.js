import mongoose from 'mongoose';

// a drug in the pharmacy inventory
const drugSchema = new mongoose.Schema({
  name: { type: String, required: true },
  brand: { type: String },
  category: { type: String }, // "antibiotic", "painkiller" etc

  stock: { type: Number, default: 0 },       // how many units in stock
  reorderLevel: { type: Number, default: 10 }, // alert when stock goes below this
  price: { type: Number, default: 0 },        // price per unit

  expiryDate: { type: Date },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

drugSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

export default mongoose.model('Drug', drugSchema);
