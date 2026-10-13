import jwt from "jsonwebtoken";

import User from "../models/User.js";

import AppError from "../utils/AppError.js";

import asyncHandler from "../utils/asyncHandler.js";
export const protect = asyncHandler(async (req, res, next) => {
  let token = null;

  // 1. From cookie
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // 2. From Authorization header
  if (!token && req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new AppError("Not authorized. Please login.", 401));
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id).select("-password");

  if (!user) {
    return next(new AppError("User not found", 401));
  }

  req.user = user;
  next();
});