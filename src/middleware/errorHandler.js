export const errorHandler = (err, req, res, next) => {
  // Payme TransactionError uchun JSON-RPC format
  if (err.isTransactionError) {
    return res.status(200).json({
      jsonrpc: "2.0",
      error: {
        code: err.transactionErrorCode,
        message: err.transactionErrorMessage,
        data: err.transactionData,
      },
      id: err.transactionId,
    });
  }

  let statusCode = err.statusCode || 500;
  let message = err.message || "Server xatosi";

  // Mongoose CastError (noto'g'ri ObjectId)
  if (err.name === "CastError") {
    statusCode = 400;
    message = "Noto'g'ri ID format";
  }

  // Mongoose ValidationError
  if (err.name === "ValidationError") {
    statusCode = 400;
    const errors = Object.values(err.errors).map((e) => e.message);
    message = errors.join(", ");
  }

  // Mongoose Duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `${field} allaqachon mavjud`;
  }

  if (process.env.NODE_ENV === "development") {
    console.error("❌ Error:", err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
