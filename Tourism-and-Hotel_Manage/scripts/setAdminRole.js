import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

import User from "../models/user.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const mongoUrl = process.env.MONGO_URL_STANDARD || process.env.MONGO_URL;

function normalizeEmail(value) {
  return `${value ?? ""}`.trim().toLowerCase();
}

async function main() {
  const emails = process.argv.slice(2).map(normalizeEmail).filter(Boolean);

  if (!emails.length) {
    console.error("Usage: node scripts/setAdminRole.js <email1> [email2] [email3] [email4]");
    process.exit(1);
  }

  if (!mongoUrl) {
    console.error("MONGO_URL or MONGO_URL_STANDARD is missing from .env");
    process.exit(1);
  }

  await mongoose.connect(mongoUrl, {
    family: 4,
    serverSelectionTimeoutMS: 15000,
  });

  try {
    for (const email of emails) {
      const user = await User.findOne({ email });

      if (!user) {
        console.error(`No user found for email: ${email}`);
        process.exitCode = 1;
        continue;
      }

      user.role = "admin";
      user.isAdmin = true;
      user.isBlocked = false;
      await user.save();

      console.log(`Admin role granted successfully to ${email}`);
      console.log(`User ID: ${user.userId}`);
    }
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(async (error) => {
  console.error("Failed to update admin role.");
  console.error(error.message);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
