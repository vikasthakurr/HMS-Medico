import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  // ids come from patient service and doctor service
  patientId: { type: String, required: true },
  patientName: { type: String }, // stored for quick display

  doctorId: { type: String, required: true },
  doctorName: { type: String },

  // date of appointment + time slot
  date: { type: Date, required: true },
  startTime: { type: String, required: true }, // "10:00"
  endTime: { type: String, required: true },   // "10:30"

  reason: { type: String }, // why patient is visiting

  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'no_show'],
    default: 'scheduled'
  },

  notes: { type: String }, // doctor notes after visit

  // who booked it
  bookedBy: { type: String }
}, { timestamps: true });

appointmentSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

// prevent double-booking at the database level.
// only enforced for scheduled appointments so a cancelled slot can be rebooked.
appointmentSchema.index(
  { doctorId: 1, date: 1, startTime: 1 },
  { unique: true, partialFilterExpression: { status: 'scheduled' } }
);

export default mongoose.model('Appointment', appointmentSchema);
