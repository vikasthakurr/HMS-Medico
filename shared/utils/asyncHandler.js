// wraps async route handlers so we dont need try-catch everywhere
const asyncHandler = (fn) => (req, res, next) => {
  fn(req, res, next).catch(next);
};

export default asyncHandler;
