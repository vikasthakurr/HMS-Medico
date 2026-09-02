import mongoose from 'mongoose';

// the catalog of tests the lab offers
const labTestSchema = new mongoose.Schema({
  name: { type: String, required: true }, // "Complete Blood Count"
  code: { type: String },                 // "CBC"
  category: { type: String },             // "Hematology", "Biochemistry" etc
  sampleType: { type: String },           // "blood", "urine" etc
  price: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

labTestSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

export default mongoose.model('LabTest', labTestSchema);
