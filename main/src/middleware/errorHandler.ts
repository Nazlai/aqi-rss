import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = function (
  err,
  req,
  res,
  next,
) {
  if (res.headersSent) {
    return next(err);
  }

  if (err?.status >= 500) {
    console.error(err);
  }

  res.status(err.status || 500).json({
    status: "error",
    message: err.message || "Internal server error",
  });
};
