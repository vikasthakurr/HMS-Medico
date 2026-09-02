import mongoose from 'mongoose';

// a single prescribed medicine
const prescriptionSchema = new mongoose.Schema({
  medicine: { type: String, required: true },
  dosage: String,      // e.g "500mg"
  frequency: String,   // e.g "twice a day"
  duration: String,    // e.g "5 days"
  notes: String
}, { _id: false });

// a lab test ordered during the visit
const labOrderSchema = new mongoose.Schema({
  testName: { type: String, required: true },
  status: {
    type: String,
    enum: ['ordered', 'completed'],
    default: 'ordered'
  },
  result: String
}, { _id: false });

const medicalRecordSchema = new mongoose.Schema({
  // links to other services
  patientId: { type: String, required: true },
  patientName: { type: String },
  doctorId: { type: String, required: true },
  doctorName: { type: String },
  appointmentId: { type: String }, // optional link to the appointment

  visitDate: { type: Date, default: Date.now },

  // vitals recorded at visit
  vitals: {
    bloodPressure: String, // "120/80"
    temperature: String,   // "98.6F"
    pulse: String,         // "72 bpm"
    weight: String,        // "70kg"
    height: String         // "170cm"
  },

  symptoms: [String],
  diagnosis: { type: String },

  prescriptions: [prescriptionSchema],
  labOrders: [labOrderSchema],

  notes: { type: String },
  followUpDate: { type: Date }
}, { timestamps: true });

medicalRecordSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

export default mongoose.model('MedicalRecord', medicalRecordSchema);
