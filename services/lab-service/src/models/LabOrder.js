import mongoose from 'mongoose';

const labOrderSchema = new mongoose.Schema({
  // links to other services
  patientId: { type: String, required: true },
  patientName: { type: String },
  doctorId: { type: String },
  doctorName: { type: String },
  recordId: { type: String }, // link back to the EMR record

  testId: { type: String, required: true },
  testName: { type: String, required: true },

  // status workflow: ordered -> sample_collected -> completed
  status: {
    type: String,
    enum: ['ordered', 'sample_collected', 'completed', 'cancelled'],
    default: 'ordered'
  },

  sampleCollectedAt: { type: Date },

  // result details (filled when completed)
  result: { type: String },
  resultNotes: { type: String },
  resultDate: { type: Date }
}, { timestamps: true });

labOrderSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

export default mongoose.model('LabOrder', labOrderSchema);
