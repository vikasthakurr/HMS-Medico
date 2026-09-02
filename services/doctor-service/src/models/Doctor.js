import mongoose from 'mongoose';

// availability slot for a single day
const availabilitySchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  },
  startTime: String, // e.g "09:00"
  endTime: String,   // e.g "17:00"
  isAvailable: { type: Boolean, default: true }
}, { _id: false });

const doctorSchema = new mongoose.Schema({
  // link to the auth user account
  userId: { type: String },

  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, required: true },

  // staff type - doctor, nurse etc
  staffType: {
    type: String,
    enum: ['doctor', 'nurse', 'lab_technician', 'pharmacist'],
    default: 'doctor'
  },

  specialization: { type: String }, // cardiology, ortho etc
  department: { type: String },
  qualifications: [String], // MBBS, MD etc
  experienceYears: { type: Number, default: 0 },
  licenseNumber: { type: String },

  consultationFee: { type: Number, default: 0 },

  // weekly availability
  availability: [availabilitySchema],

  isActive: { type: Boolean, default: true }
}, { timestamps: true });

doctorSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

export default mongoose.model('Doctor', doctorSchema);
