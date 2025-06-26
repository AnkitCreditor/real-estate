// src/middlewares/authorize.middleware.js

import { CustomError } from "../utils/CustomError.js";

// Middleware to check if user has one of the allowed roles
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user?.role;

    if (!userRole || !allowedRoles.includes(userRole)) {
      return next(new CustomError("Access denied: Unauthorized role", 403));
    }

    next();
  };
};
