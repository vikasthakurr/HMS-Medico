import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { asyncHandler, AppError } from 'hms-shared';

// helper to generate tokens
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
  return { accessToken, refreshToken };
};

// register new user
export const register = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, email, password, role, phone } = req.body;

  // check if user exists
  const existing = await User.findOne({ email });
  if (existing) {
    return next(new AppError('Email already registered', 409));
  }

  const user = await User.create({ firstName, lastName, email, password, role, phone });
  const tokens = generateTokens(user);

  // save refresh token
  user.refreshToken = tokens.refreshToken;
  await user.save({ validateBeforeSave: false });

  res.status(201).json({
    status: 'success',
    message: 'User registered',
    data: { user, ...tokens }
  });
});

// login
export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Email and password required', 400));
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Invalid email or password', 401));
  }

  if (!user.isActive) {
    return next(new AppError('Account deactivated', 403));
  }

  const tokens = generateTokens(user);
  user.lastLogin = new Date();
  user.refreshToken = tokens.refreshToken;
  await user.save({ validateBeforeSave: false });

  res.json({
    status: 'success',
    message: 'Login successful',
    data: { user, ...tokens }
  });
});

// refresh token
export const refreshToken = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return next(new AppError('Refresh token required', 400));
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken) {
      return next(new AppError('Invalid refresh token', 401));
    }

    const tokens = generateTokens(user);
    user.refreshToken = tokens.refreshToken;
    await user.save({ validateBeforeSave: false });

    res.json({ status: 'success', data: tokens });
  } catch (err) {
    return next(new AppError('Invalid refresh token', 401));
  }
});

// logout
export const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, { refreshToken: null });
  res.json({ status: 'success', message: 'Logged out' });
});

// get profile
export const getProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) return next(new AppError('User not found', 404));
  res.json({ status: 'success', data: { user } });
});

// change password
export const changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.comparePassword(currentPassword))) {
    return next(new AppError('Current password is wrong', 401));
  }

  user.password = newPassword;
  await user.save();

  res.json({ status: 'success', message: 'Password changed' });
});

// forgot password - generates reset token
export const forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return next(new AppError('No user with that email', 404));

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 min
  await user.save({ validateBeforeSave: false });

  // in production send this via email
  res.json({ status: 'success', message: 'Reset token generated', resetToken });
});

// reset password with token
export const resetPassword = asyncHandler(async (req, res, next) => {
  const { token, newPassword } = req.body;
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) return next(new AppError('Invalid or expired token', 400));

  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.json({ status: 'success', message: 'Password reset done' });
});
