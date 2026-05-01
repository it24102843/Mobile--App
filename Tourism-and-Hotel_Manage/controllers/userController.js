import User from "../models/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import axios from "axios";
import mongoose from "mongoose";
import { randomUUID } from "crypto";

const DEFAULT_PROFILE_PICTURE =
  "https://img.freepik.com/premium-vector/avatar-profile-icon-flat-style-female-user-profile-vector-illustration-isolated-background-women-profile-sign-business-concept_157943-38866.jpg";

const VALID_ROLES = ["admin", "customer"];

function normalizeString(value) {
  return `${value ?? ""}`.trim();
}

function normalizeEmail(value) {
  return normalizeString(value).toLowerCase();
}

function normalizePhone(value) {
  return normalizeString(value).replace(/\s+/g, "");
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
  return /^\+?[0-9\-()]{7,20}$/.test(phone);
}

function isStrongPassword(password) {
  return typeof password === "string" && password.length >= 6 && /\d/.test(password);
}

function escapeRegex(value) {
  return `${value ?? ""}`.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sanitizeUser(userDoc) {
  if (!userDoc) {
    return null;
  }

  const user = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
  delete user.password;
  return user;
}

function resolveUserRole(userDoc) {
  const normalizedRole = normalizeString(userDoc?.role).toLowerCase();

  if (normalizedRole === "admin" || userDoc?.isAdmin === true) {
    return "admin";
  }

  if (VALID_ROLES.includes(normalizedRole)) {
    return normalizedRole;
  }

  return "customer";
}

function serializeUser(userDoc) {
  const user = sanitizeUser(userDoc);

  if (!user) {
    return null;
  }

  return {
    ...user,
    id: user.userId || user._id,
    name: `${normalizeString(user.firstName)} ${normalizeString(user.lastName)}`.trim() || user.email,
    email: user.email,
    role: resolveUserRole(user),
    isAdmin: resolveUserRole(user) === "admin",
  };
}

function buildTokenPayload(user) {
  return {
    userId: user.userId,
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: resolveUserRole(user),
    isAdmin: resolveUserRole(user) === "admin",
    profilePicture: user.profilePicture,
    phone: user.phone,
  };
}

function buildUserPayload(data, options = {}) {
  const {
    allowRole = false,
    existingUser = null,
    requirePassword = false,
  } = options;

  const payload = {
    firstName: normalizeString(data.firstName ?? existingUser?.firstName),
    lastName: normalizeString(data.lastName ?? existingUser?.lastName),
    email: normalizeEmail(data.email ?? existingUser?.email),
    phone: normalizePhone(data.phone ?? existingUser?.phone),
    address: normalizeString(data.address ?? existingUser?.address),
    profilePicture:
      normalizeString(data.profilePicture ?? existingUser?.profilePicture) ||
      DEFAULT_PROFILE_PICTURE,
  };

  if (allowRole) {
    payload.role =
      normalizeString(data.role ?? resolveUserRole(existingUser)).toLowerCase() || "customer";
  }

  if (requirePassword) {
    payload.password = normalizeString(data.password);
  }

  return payload;
}

function validateUserPayload(payload, options = {}) {
  const { validateRole = false, requirePassword = false } = options;

  if (!payload.firstName) {
    return "First name is required.";
  }

  if (payload.firstName.length < 3) {
    return "First name must be at least 3 characters long.";
  }

  if (!payload.email) {
    return "Email is required.";
  }

  if (!isValidEmail(payload.email)) {
    return "Please enter a valid email address.";
  }

  if (!payload.phone) {
    return "Phone number is required.";
  }

  if (!isValidPhone(payload.phone)) {
    return "Please enter a valid phone number.";
  }

  if (!payload.address) {
    return "Address is required.";
  }

  if (requirePassword) {
    if (!payload.password) {
      return "Password is required.";
    }

    if (!isStrongPassword(payload.password)) {
      return "Password must be at least 6 characters long and include at least one number.";
    }
  }

  if (validateRole && !VALID_ROLES.includes(payload.role)) {
    return `Role must be one of: ${VALID_ROLES.join(", ")}.`;
  }

  return null;
}

async function findUserByIdentifier(identifier) {
  const normalizedIdentifier = normalizeString(identifier);

  if (!normalizedIdentifier) {
    return null;
  }

  if (mongoose.Types.ObjectId.isValid(normalizedIdentifier)) {
    const byMongoId = await User.findById(normalizedIdentifier);
    if (byMongoId) {
      return byMongoId;
    }
  }

  return User.findOne({ userId: normalizedIdentifier });
}

async function findUserByEmail(email) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return null;
  }

  let user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    user = await User.findOne({
      email: {
        $regex: `^${escapeRegex(normalizedEmail)}$`,
        $options: "i",
      },
    });
  }

  return user;
}

export function isItAdmin(req) {
  return normalizeString(req.user?.role).toLowerCase() === "admin" || req.user?.isAdmin === true;
}

export function isItCustomer(req) {
  return resolveUserRole(req.user) === "customer";
}

export async function registerUser(req, res) {
  try {
    const payload = buildUserPayload(req.body, { requirePassword: true });
    const validationError = validateUserPayload(payload, { requirePassword: true });

    if (validationError) {
      res.status(400).json({ error: validationError });
      return;
    }

    const existingUser = await findUserByEmail(payload.email);
    if (existingUser) {
      res.status(409).json({ error: "An account with this email already exists." });
      return;
    }

    const newUser = new User({
      ...payload,
      userId: randomUUID(),
      role: "customer",
      isAdmin: false,
      password: bcrypt.hashSync(payload.password, 10),
    });

    await newUser.save();
    res.status(201).json({
      message: "User registered successfully",
      user: serializeUser(newUser),
    });
  } catch (error) {
    res.status(500).json({ error: "User registration failed" });
  }
}

export async function loginUser(req, res) {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = normalizeString(req.body?.password);

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required." });
      return;
    }

    const user = await findUserByEmail(email);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (user.email !== email) {
      const conflictingLowercaseUser = await User.findOne({ email });
      if (!conflictingLowercaseUser || `${conflictingLowercaseUser._id}` === `${user._id}`) {
        user.email = email;
        await user.save();
      }
    }

    if (user.isBlocked) {
      res.status(403).json({ error: "Your account is blocked. Please contact the admin." });
      return;
    }

    const isPasswordCorrect = bcrypt.compareSync(password, user.password);
    if (!isPasswordCorrect) {
      res.status(401).json({ error: "Login failed" });
      return;
    }

    const token = jwt.sign(buildTokenPayload(user), process.env.JWT_SECRET);
    res.json({
      message: "Login successful",
      token,
      user: serializeUser(user),
    });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
}

export async function getAllUsers(req, res) {
  if (!isItAdmin(req)) {
    res.status(403).json({ error: "Unauthorized" });
    return;
  }

  try {
    const users = await User.find().sort({ _id: -1 });
    res.json(users.map((user) => serializeUser(user)));
  } catch (error) {
    res.status(500).json({ error: "Failed to get users" });
  }
}

export async function getUserById(req, res) {
  if (!isItAdmin(req)) {
    res.status(403).json({ error: "Unauthorized" });
    return;
  }

  try {
    const user = await findUserByIdentifier(req.params.userId);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json(serializeUser(user));
  } catch (error) {
    res.status(500).json({ error: "Failed to get user" });
  }
}

export async function updateUserById(req, res) {
  if (!isItAdmin(req)) {
    res.status(403).json({ error: "Unauthorized" });
    return;
  }

  try {
    const user = await findUserByIdentifier(req.params.userId);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const payload = buildUserPayload(req.body, {
      allowRole: true,
      existingUser: user,
    });
    const validationError = validateUserPayload(payload, { validateRole: true });

    if (validationError) {
      res.status(400).json({ error: validationError });
      return;
    }

    const emailOwner = await findUserByEmail(payload.email);
    if (emailOwner && `${emailOwner._id}` !== `${user._id}`) {
      res.status(409).json({ error: "Another account already uses this email." });
      return;
    }

    if (req.user?.userId === user.userId && payload.role !== "admin") {
      res.status(400).json({ error: "You cannot remove your own admin access." });
      return;
    }

    Object.assign(user, payload, {
      role: payload.role,
      isAdmin: payload.role === "admin",
    });
    await user.save();

    res.json({
      message: "User updated successfully",
      user: serializeUser(user),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to update user" });
  }
}

export async function deleteUserById(req, res) {
  if (!isItAdmin(req)) {
    res.status(403).json({ error: "Unauthorized" });
    return;
  }

  try {
    const user = await findUserByIdentifier(req.params.userId);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (req.user?.userId === user.userId) {
      res.status(400).json({ error: "You cannot delete your own account." });
      return;
    }

    await User.deleteOne({ _id: user._id });
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete user" });
  }
}

export async function blockOrUnblockUser(req, res) {
  if (!isItAdmin(req)) {
    res.status(403).json({ error: "Unauthorized" });
    return;
  }

  try {
    const email = normalizeEmail(req.params.email);
    const user = await findUserByEmail(email);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (req.user?.email === user.email) {
      res.status(400).json({ error: "You cannot block your own account." });
      return;
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.json({
      message: user.isBlocked ? "User blocked successfully" : "User unblocked successfully",
      user: serializeUser(user),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to update user status" });
  }
}

export async function blockOrUnblockUserById(req, res) {
  if (!isItAdmin(req)) {
    res.status(403).json({ error: "Unauthorized" });
    return;
  }

  try {
    const user = await findUserByIdentifier(req.params.userId);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (req.user?.userId === user.userId) {
      res.status(400).json({ error: "You cannot block your own account." });
      return;
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.json({
      message: user.isBlocked ? "User blocked successfully" : "User unblocked successfully",
      user: serializeUser(user),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to update user status" });
  }
}

export async function getUser(req, res) {
  if (!req.user?.userId) {
    res.status(403).json({ error: "Unauthorized" });
    return;
  }

  try {
    const user = await User.findOne({ userId: req.user.userId });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (user.isBlocked) {
      res.status(403).json({ error: "Your account is blocked. Please contact the admin." });
      return;
    }

    res.json(serializeUser(user));
  } catch (error) {
    res.status(500).json({ error: "Failed to load user profile" });
  }
}

export async function loginWithGoogle(req, res) {
  const accessToken = req.body?.accessToken;

  if (!accessToken) {
    res.status(400).json({ error: "Google access token is required." });
    return;
  }

  try {
    const response = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const googleUser = response.data;
    const email = normalizeEmail(googleUser.email);

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        userId: randomUUID(),
        email,
        password: bcrypt.hashSync(randomUUID(), 10),
        firstName: normalizeString(googleUser.given_name) || "Google",
        lastName: normalizeString(googleUser.family_name),
        address: "Not Given",
        phone: "Not Given",
        profilePicture: normalizeString(googleUser.picture) || DEFAULT_PROFILE_PICTURE,
        role: "customer",
        isAdmin: false,
      });

      await user.save();
    }

    if (user.isBlocked) {
      res.status(403).json({ error: "Your account is blocked. Please contact the admin." });
      return;
    }

    const token = jwt.sign(buildTokenPayload(user), process.env.JWT_SECRET);
    res.json({
      message: "Login successful",
      token,
      user: serializeUser(user),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to login with Google" });
  }
}
