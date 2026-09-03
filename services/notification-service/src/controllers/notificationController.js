import Notification from '../models/Notification.js';
import { send } from '../utils/sender.js';
import { asyncHandler, AppError } from 'hms-shared';

// create a notification and try to send it right away
export const sendNotification = asyncHandler(async (req, res, next) => {
  const { recipientId, recipient, channel, type, subject, message } = req.body;

  if (!recipient || !message) {
    return next(new AppError('recipient and message are required', 400));
  }

  // save it first as pending
  const notification = await Notification.create({
    recipientId,
    recipient,
    channel,
    type,
    subject,
    message
  });

  // then try to send
  try {
    await send({ channel: notification.channel, recipient, subject, message });
    notification.status = 'sent';
    notification.sentAt = new Date();
  } catch (err) {
    notification.status = 'failed';
  }
  await notification.save();

  res.status(201).json({
    status: 'success',
    message: `Notification ${notification.status}`,
    data: { notification }
  });
});

// list notifications (filter by recipient, type, status)
export const getNotifications = asyncHandler(async (req, res) => {
  const { recipientId, type, status, page = 1, limit = 20 } = req.query;

  const query = {};
  if (recipientId) query.recipientId = recipientId;
  if (type) query.type = type;
  if (status) query.status = status;

  const skip = (page - 1) * limit;
  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Notification.countDocuments(query);

  res.json({
    status: 'success',
    results: notifications.length,
    total,
    page: Number(page),
    data: { notifications }
  });
});

// get single notification
export const getNotification = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) return next(new AppError('Notification not found', 404));

  res.json({ status: 'success', data: { notification } });
});

// mark a notification as read
export const markRead = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findByIdAndUpdate(
    req.params.id,
    { isRead: true },
    { new: true }
  );
  if (!notification) return next(new AppError('Notification not found', 404));

  res.json({ status: 'success', message: 'Marked as read', data: { notification } });
});

// retry a failed notification
export const retryNotification = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) return next(new AppError('Notification not found', 404));

  if (notification.status === 'sent') {
    return next(new AppError('Notification already sent', 400));
  }

  try {
    await send({
      channel: notification.channel,
      recipient: notification.recipient,
      subject: notification.subject,
      message: notification.message
    });
    notification.status = 'sent';
    notification.sentAt = new Date();
  } catch (err) {
    notification.status = 'failed';
  }
  await notification.save();

  res.json({
    status: 'success',
    message: `Notification ${notification.status}`,
    data: { notification }
  });
});
