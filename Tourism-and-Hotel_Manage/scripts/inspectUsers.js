import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

import User from "../models/user.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const mongoUrl = process.env.MONGO_URL_STANDARD || process.env.MONGO_URL;

function normalizeString(value) {
  return `${value ?? ""}`.trim();
}

function resolveRole(user) {
  const role = normalizeString(user?.role).toLowerCase();
  if (role === "admin" || user?.isAdmin === true) {
    return "admin";
  }
  return role || "customer";
}

async function main() {
  if (!mongoUrl) {
    console.error("MONGO_URL or MONGO_URL_STANDARD is missing from .env");
    process.exit(1);
  }

  await mongoose.connect(mongoUrl, {
    family: 4,
    serverSelectionTimeoutMS: 15000,
  });

  try {
    const users = await User.find().sort({ createdAt: -1 });
    const simplified = users.map((user) => ({
      id: user.userId || `${user._id}`,
      email: user.email,
      name: `${normalizeString(user.firstName)} ${normalizeString(user.lastName)}`.trim(),
      role: user.role,
      isAdmin: user.isAdmin,
      resolvedRole: resolveRole(user),
      isBlocked: user.isBlocked,
      createdAt: user.createdAt,
    }));

    console.log(JSON.stringify(simplified, null, 2));
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(async (error) => {
  console.error("Failed to inspect users.");
  console.error(error.message);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
