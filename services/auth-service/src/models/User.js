import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role: {
    type: String,
    enum: ['admin', 'doctor', 'nurse', 'receptionist', 'patient', 'lab_technician', 'pharmacist'],
    default: 'patient'
  },
  phone: { type: String },
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
  refreshToken: { type: String, select: false },
  passwordResetToken: { type: String, select: false },
  passwordResetExpires: { type: Date, select: false }
}, { timestamps: true });

// hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// hide sensitive fields in response
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  delete obj.__v;
  return obj;
};

export default mongoose.model('User', userSchema);
