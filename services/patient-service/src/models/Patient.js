import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
  // link to the auth user account (optional - patient may not have login)
  userId: { type: String },

  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, lowercase: true, trim: true },
  phone: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  gender: { type: String, enum: ['male', 'female', 'other'], required: true },
  bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },

  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },

  emergencyContact: {
    name: String,
    relation: String,
    phone: String
  },

  // basic medical history
  allergies: [String],
  chronicConditions: [String],

  insurance: {
    provider: String,
    policyNumber: String,
    validTill: Date
  },

  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// hide __v in response
patientSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

export default mongoose.model('Patient', patientSchema);
