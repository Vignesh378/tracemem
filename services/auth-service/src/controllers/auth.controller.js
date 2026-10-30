import bcrypt from "bcryptjs";

import User from "../models/User.js";

import generateToken from "../utils/generateToken.js";

import AppError from "../utils/AppError.js";

import asyncHandler from "../utils/asyncHandler.js";

import authService from "../services/auth.service.js";
const isProd = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000
};

export const register = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body || {};

  if (!name || !email || !password) {
    return next(new AppError("All fields are required", 400));
  }

  if (password.length < 6) {
    return next(new AppError("Password must be at least 6 characters", 400));
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return next(new AppError("User already exists", 400));
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashedPassword
  });

  const token = generateToken(user._id);
  res.cookie("token", token, cookieOptions);

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    user: {
      id: user._id,
      name: user.name,
      email: user.email
    }
  });
});

export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return next(new AppError("Email and password are required", 400));
  }

  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError("Invalid credentials", 400));
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return next(new AppError("Invalid credentials", 400));
  }

  const token = generateToken(user._id);

  res.cookie("token", token, cookieOptions);

  res.status(200).json({
    success: true,
    message: "Login successful",
    user: {
      id: user._id,
      name: user.name,
      email: user.email
    }
  });
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax"
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully"
  });
});



export const profile = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user._id);

  res.status(200).json({
    success: true,
    user
  });
});