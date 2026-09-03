import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  // who gets it
  recipientId: { type: String },   // user/patient id
  recipient: { type: String, required: true }, // email address or phone number

  channel: {
    type: String,
    enum: ['email', 'sms'],
    default: 'email'
  },

  // what kind of notification (for filtering/reporting)
  type: {
    type: String,
    enum: ['appointment_reminder', 'lab_result', 'payment', 'general'],
    default: 'general'
  },

  subject: { type: String }, // used for email
  message: { type: String, required: true },

  status: {
    type: String,
    enum: ['pending', 'sent', 'failed'],
    default: 'pending'
  },

  sentAt: { type: Date },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

notificationSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

export default mongoose.model('Notification', notificationSchema);
