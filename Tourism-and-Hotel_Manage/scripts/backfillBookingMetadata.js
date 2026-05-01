import dotenv from "dotenv";
import mongoose from "mongoose";

import Order from "../models/order.js";
import PackageBooking from "../models/PackageBooking.js";
import RoomBooking from "../models/Roombooking.js";
import User from "../models/user.js";
import VehicleBooking from "../models/VehicleBooking.js";

dotenv.config();

const mongoUrl = process.env.MONGO_URL_STANDARD || process.env.MONGO_URL;

function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function buildUserMap(users) {
  return new Map(
    users
      .filter((user) => user?.email)
      .map((user) => [
        normalizeEmail(user.email),
        {
          mongoId: user._id,
          userId: user.userId || null,
          email: user.email,
          fullName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
          phone: user.phone || "",
        },
      ])
  );
}

async function backfillRoomBookings(userMap) {
  const bookings = await RoomBooking.find();
  let updated = 0;

  for (const booking of bookings) {
    let changed = false;
    const matchedUser = userMap.get(normalizeEmail(booking.email));

    if ((!booking.userId || booking.userId === null) && matchedUser?.mongoId) {
      booking.userId = matchedUser.mongoId;
      changed = true;
    }

    if (!booking.paymentMethod) {
      booking.paymentMethod = "checkout";
      changed = true;
    }

    if (!booking.paymentStatus) {
      booking.paymentStatus = "pending";
      changed = true;
    }

    if (!booking.bookingStatus) {
      booking.bookingStatus = "pending";
      changed = true;
    }

    if (!booking.refundStatus) {
      booking.refundStatus = "not_applicable";
      changed = true;
    }

    if (changed) {
      await booking.save();
      updated += 1;
    }
  }

  return updated;
}

async function backfillPackageBookings(userMap) {
  const bookings = await PackageBooking.find();
  let updated = 0;

  for (const booking of bookings) {
    let changed = false;
    const matchedUser = userMap.get(normalizeEmail(booking.userEmail));

    if (!booking.userId && matchedUser?.userId) {
      booking.userId = matchedUser.userId;
      changed = true;
    }

    if ((!booking.userEmail || !booking.userEmail.trim()) && matchedUser?.email) {
      booking.userEmail = matchedUser.email;
      changed = true;
    }

    if ((!booking.userName || !booking.userName.trim()) && matchedUser?.fullName) {
      booking.userName = matchedUser.fullName;
      changed = true;
    }

    if ((!booking.userPhone || !booking.userPhone.trim()) && matchedUser?.phone) {
      booking.userPhone = matchedUser.phone;
      changed = true;
    }

    if (!booking.paymentMethod) {
      booking.paymentMethod = "checkout";
      changed = true;
    }

    if (!booking.paymentStatus) {
      booking.paymentStatus = "pending";
      changed = true;
    }

    if (!booking.refundStatus) {
      booking.refundStatus = "not_applicable";
      changed = true;
    }

    if (changed) {
      await booking.save();
      updated += 1;
    }
  }

  return updated;
}

async function backfillVehicleBookings(userMap) {
  const bookings = await VehicleBooking.find();
  let updated = 0;

  for (const booking of bookings) {
    let changed = false;
    const matchedUser = userMap.get(normalizeEmail(booking.customerEmail));

    if (!booking.userId && matchedUser?.userId) {
      booking.userId = matchedUser.userId;
      changed = true;
    }

    if ((!booking.customerName || !booking.customerName.trim()) && matchedUser?.fullName) {
      booking.customerName = matchedUser.fullName;
      changed = true;
    }

    if ((!booking.customerPhone || !booking.customerPhone.trim()) && matchedUser?.phone) {
      booking.customerPhone = matchedUser.phone;
      changed = true;
    }

    if (!booking.paymentMethod) {
      booking.paymentMethod = "checkout";
      changed = true;
    }

    if (!booking.paymentStatus) {
      booking.paymentStatus = "pending";
      changed = true;
    }

    if (!booking.refundStatus) {
      booking.refundStatus = "not_applicable";
      changed = true;
    }

    if (changed) {
      await booking.save();
      updated += 1;
    }
  }

  return updated;
}

async function backfillStorageOrders(userMap) {
  const orders = await Order.find();
  let updated = 0;

  for (const order of orders) {
    let changed = false;
    const matchedUser = userMap.get(normalizeEmail(order.email));

    if (!order.userId && matchedUser?.userId) {
      order.userId = matchedUser.userId;
      changed = true;
    }

    if (!order.paymentMethod) {
      order.paymentMethod = "checkout";
      changed = true;
    }

    if (!order.paymentStatus) {
      order.paymentStatus = "pending";
      changed = true;
    }

    if (!order.refundStatus) {
      order.refundStatus = "not_applicable";
      changed = true;
    }

    if (changed) {
      await order.save();
      updated += 1;
    }
  }

  return updated;
}

async function run() {
  if (!mongoUrl) {
    throw new Error("MONGO_URL or MONGO_URL_STANDARD is missing from .env");
  }

  await mongoose.connect(mongoUrl, {
    family: 4,
    serverSelectionTimeoutMS: 15000,
  });

  console.log("Connected to MongoDB for booking backfill");

  const users = await User.find({}, "_id userId email firstName lastName phone");
  const userMap = buildUserMap(users);

  const [roomsUpdated, packagesUpdated, vehiclesUpdated, storageUpdated] =
    await Promise.all([
      backfillRoomBookings(userMap),
      backfillPackageBookings(userMap),
      backfillVehicleBookings(userMap),
      backfillStorageOrders(userMap),
    ]);

  console.log("Booking metadata backfill complete:");
  console.log(`- Room bookings updated: ${roomsUpdated}`);
  console.log(`- Package bookings updated: ${packagesUpdated}`);
  console.log(`- Safari vehicle bookings updated: ${vehiclesUpdated}`);
  console.log(`- Storage / equipment bookings updated: ${storageUpdated}`);

  await mongoose.disconnect();
}

run()
  .then(() => {
    console.log("Disconnected from MongoDB");
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Booking backfill failed:", error.message);

    try {
      await mongoose.disconnect();
    } catch {}

    process.exit(1);
  });
