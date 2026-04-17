export const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

export const sendError = (res, error) => {
  const rawStatusCode = Number(error?.statusCode);
  const statusCode =
    Number.isInteger(rawStatusCode) && rawStatusCode >= 400 && rawStatusCode < 600
      ? rawStatusCode
      : 500;

  const isClientError = statusCode >= 400 && statusCode < 500;
  const message = isClientError
    ? error?.message || "Request failed"
    : "Internal server error";

  if (!isClientError) {
    console.error("Unhandled server error", {
      message: error?.message,
      stack: error?.stack,
      statusCode,
    });
  }

  return res.status(statusCode).json({
    success: false,
    message,
  });
};