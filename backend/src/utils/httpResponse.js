export const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

export const sendError = (res, error) => {
  const statusCode = error?.statusCode || 500;
  const message = error?.message || "Internal server error";

  return res.status(statusCode).json({
    success: false,
    message,
  });
};