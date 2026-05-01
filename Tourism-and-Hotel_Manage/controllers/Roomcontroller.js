import Room from "../models/Room.js";
import RoomBooking from "../models/Roombooking.js";
import RoomBookingNotification from "../models/RoomBookingNotification.js";
import Hotel from "../models/Hotel.js";
import nodemailer from "nodemailer";

import { isItAdmin } from "./userController.js";

const DEFAULT_IMAGE =
    "https://www.shutterstock.com/image-vector/missing-picture-page-website-design-600nw-1552421075.jpg";

// ─── EMAIL TRANSPORTER ────────────────────────────────────
function createTransporter() {
    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
}

function getStartOfToday() {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

const ACTIVE_ROOM_BOOKING_STATUSES = ["pending", "confirmed", "approved"];

function parseBookingDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function calculateRoomBookingTotal(roomPrice, nights, taxRate = 0.10) {
    const subtotal = roomPrice * nights;
    const taxAmount = Math.round(subtotal * taxRate);

    return {
        subtotal,
        taxAmount,
        totalAmount: subtotal + taxAmount
    };
}

function buildActiveBookingConflictQuery(roomKey, checkIn, checkOut) {
    return {
        bookingStatus: { $in: ACTIVE_ROOM_BOOKING_STATUSES },
        checkInDate: { $lt: checkOut },
        checkOutDate: { $gt: checkIn },
        ...(roomKey ? { roomKey } : {})
    };
}

function getHoursBetween(fromDate, toDate) {
    return (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60);
}

function getBookingCreatedAt(booking) {
    return booking.createdAt || booking.bookingDate || new Date();
}

function normalizeText(value) {
    return `${value ?? ""}`.trim();
}

function normalizeName(value) {
    return normalizeText(value).toLowerCase();
}

function normalizeRoomTypeValue(value = "") {
    return String(value)
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/room/g, "")
        .trim();
}

function normalizeImageList(images) {
    if (!Array.isArray(images)) {
        return [DEFAULT_IMAGE];
    }

    const validImages = images
        .filter((image) => typeof image === "string" && image.trim())
        .map((image) => image.trim());

    return validImages.length > 0 ? validImages : [DEFAULT_IMAGE];
}

function normalizeBoolean(value, fallback = true) {
    if (typeof value === "boolean") return value;
    if (value === "true") return true;
    if (value === "false") return false;
    return fallback;
}

async function createRoomBookingCancellationNotification(booking) {
    if (!booking?.bookingId || !booking?.email) {
        return null;
    }

    return RoomBookingNotification.create({
        type: "room_booking_cancelled",
        bookingId: booking.bookingId,
        userId: booking.userId || null,
        email: booking.email,
        bookingSnapshot: {
            room: {
                hotelName: booking.room?.hotelName || "",
                roomType: booking.room?.roomType || "",
                roomNumber: booking.room?.roomNumber || "",
                image: booking.room?.image || DEFAULT_IMAGE
            },
            checkInDate: booking.checkInDate || null,
            checkOutDate: booking.checkOutDate || null,
            numberOfGuests: booking.numberOfGuests || 0,
            numberOfNights: booking.numberOfNights || 0,
            totalAmount: booking.totalAmount || 0,
            paymentMethod: booking.paymentMethod || "",
            refundMessage: booking.refundMessage || "",
            refundStatus: booking.refundStatus || ""
        },
        cancellationDate: booking.cancellationDate || new Date(),
        notificationMessage: "A room booking was cancelled by the customer."
    });
}

// ─── CHECKOUT BILL EMAIL ──────────────────────────────────
function buildCheckoutEmailHTML(booking) {
    const checkIn  = new Date(booking.checkInDate).toLocaleDateString("en-US", { weekday:"long", year:"numeric", month:"long", day:"numeric" });
    const checkOut = new Date(booking.checkOutDate).toLocaleDateString("en-US", { weekday:"long", year:"numeric", month:"long", day:"numeric" });
    const today    = new Date().toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" });
    const roomPrice   = booking.room.price;
    const nights      = booking.numberOfNights;
    const roomTotal   = roomPrice * nights;
    const taxRate     = 0.15;
    const taxAmount   = Math.round(roomTotal * taxRate);
    const grandTotal  = roomTotal + taxAmount;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Checkout Bill - ${booking.bookingId}</title>
</head>
<body style="margin:0;padding:0;background:#f4f1eb;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<div style="max-width:620px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.12);">

  <!-- HEADER -->
  <div style="background:linear-gradient(135deg,#1a0a00 0%,#3d1a00 100%);padding:36px 40px;text-align:center;">
    <div style="display:inline-block;background:rgba(245,166,35,0.15);border:1px solid rgba(245,166,35,0.4);border-radius:50%;width:60px;height:60px;line-height:60px;font-size:26px;margin-bottom:16px;">🏨</div>
    <h1 style="margin:0;color:#F5A623;font-size:28px;font-weight:700;letter-spacing:1px;">Kadiraa Resort</h1>
    <p style="margin:6px 0 0;color:rgba(255,255,255,0.6);font-size:13px;letter-spacing:2px;text-transform:uppercase;">Tourism &amp; Hotel</p>
    <div style="margin:20px auto 0;width:60px;height:2px;background:linear-gradient(90deg,transparent,#F5A623,transparent);"></div>
    <p style="margin:16px 0 0;color:rgba(255,255,255,0.85);font-size:15px;">Checkout Bill &amp; Payment Notice</p>
  </div>

  <!-- GREETING -->
  <div style="padding:32px 40px 0;border-bottom:1px solid #f0ebe0;">
    <p style="margin:0 0 12px;color:#5a4a3a;font-size:15px;">Dear Guest,</p>
    <p style="margin:0 0 20px;color:#5a4a3a;font-size:14px;line-height:1.7;">
      Thank you for staying with us at <strong style="color:#d97706;">Kadiraa Resort</strong>.
      Your checkout date is approaching and we've prepared your detailed bill below.
      Please review and complete the payment at the front desk or via our online portal.
    </p>
    <p style="margin:0 0 24px;color:#5a4a3a;font-size:13px;">Bill generated: <strong>${today}</strong></p>
  </div>

  <!-- BOOKING INFO -->
  <div style="padding:28px 40px;background:#fdfaf5;border-bottom:1px solid #f0ebe0;">
    <h2 style="margin:0 0 20px;color:#1a0a00;font-size:16px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Booking Details</h2>
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="padding:8px 0;color:#8a7a6a;font-size:13px;width:45%;">Booking ID</td>
        <td style="padding:8px 0;color:#1a0a00;font-size:13px;font-weight:600;font-family:monospace;">${booking.bookingId}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#8a7a6a;font-size:13px;">Hotel</td>
        <td style="padding:8px 0;color:#1a0a00;font-size:13px;font-weight:600;">${booking.room.hotelName}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#8a7a6a;font-size:13px;">Room Number</td>
        <td style="padding:8px 0;color:#1a0a00;font-size:13px;font-weight:600;">${booking.room.roomNumber}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#8a7a6a;font-size:13px;">Room Type</td>
        <td style="padding:8px 0;color:#1a0a00;font-size:13px;font-weight:600;">${booking.room.roomType}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#8a7a6a;font-size:13px;">Guests</td>
        <td style="padding:8px 0;color:#1a0a00;font-size:13px;font-weight:600;">${booking.numberOfGuests} person(s)</td>
      </tr>
    </table>
  </div>

  <!-- STAY PERIOD -->
  <div style="padding:24px 40px;border-bottom:1px solid #f0ebe0;">
    <div style="display:flex;gap:16px;">
      <div style="flex:1;background:#f8f4ee;border-radius:12px;padding:16px;border-left:3px solid #22c55e;">
        <p style="margin:0 0 4px;color:#8a7a6a;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Check-In</p>
        <p style="margin:0;color:#1a0a00;font-size:13px;font-weight:600;">${checkIn}</p>
      </div>
      <div style="flex:1;background:#f8f4ee;border-radius:12px;padding:16px;border-left:3px solid #ef4444;">
        <p style="margin:0 0 4px;color:#8a7a6a;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Check-Out</p>
        <p style="margin:0;color:#1a0a00;font-size:13px;font-weight:600;">${checkOut}</p>
      </div>
    </div>
    <p style="margin:14px 0 0;text-align:center;color:#d97706;font-weight:600;font-size:14px;">
      Total Stay: ${nights} Night${nights !== 1 ? "s" : ""}
    </p>
  </div>

  <!-- BILL BREAKDOWN -->
  <div style="padding:28px 40px;border-bottom:1px solid #f0ebe0;">
    <h2 style="margin:0 0 20px;color:#1a0a00;font-size:16px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Bill Summary</h2>
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="border-bottom:2px solid #f0ebe0;">
          <th style="padding:10px 0;text-align:left;color:#8a7a6a;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Description</th>
          <th style="padding:10px 0;text-align:center;color:#8a7a6a;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Nights</th>
          <th style="padding:10px 0;text-align:center;color:#8a7a6a;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Rate/Night</th>
          <th style="padding:10px 0;text-align:right;color:#8a7a6a;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr style="border-bottom:1px solid #f8f4ee;">
          <td style="padding:14px 0;color:#1a0a00;font-size:14px;">${booking.room.roomType} — Room ${booking.room.roomNumber}</td>
          <td style="padding:14px 0;text-align:center;color:#1a0a00;font-size:14px;">${nights}</td>
          <td style="padding:14px 0;text-align:center;color:#1a0a00;font-size:14px;">LKR ${roomPrice.toLocaleString()}</td>
          <td style="padding:14px 0;text-align:right;color:#1a0a00;font-size:14px;font-weight:600;">LKR ${roomTotal.toLocaleString()}</td>
        </tr>
        <tr style="border-bottom:1px solid #f8f4ee;">
          <td style="padding:12px 0;color:#8a7a6a;font-size:13px;" colspan="3">Tax &amp; Service Charge (15%)</td>
          <td style="padding:12px 0;text-align:right;color:#8a7a6a;font-size:13px;">LKR ${taxAmount.toLocaleString()}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr style="background:#fdf8ef;border-radius:8px;">
          <td colspan="3" style="padding:16px 14px;color:#1a0a00;font-size:16px;font-weight:700;border-radius:8px 0 0 8px;">TOTAL AMOUNT DUE</td>
          <td style="padding:16px 14px;text-align:right;color:#d97706;font-size:18px;font-weight:700;border-radius:0 8px 8px 0;">LKR ${grandTotal.toLocaleString()}</td>
        </tr>
      </tfoot>
    </table>
  </div>

  <!-- PAYMENT INFO -->
  <div style="padding:28px 40px;background:#fdf8ef;border-bottom:1px solid #f0ebe0;">
    <h2 style="margin:0 0 16px;color:#1a0a00;font-size:16px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Payment at Checkout</h2>
    <p style="margin:0 0 14px;color:#5a4a3a;font-size:14px;line-height:1.7;">
      You have chosen the <strong style="color:#d97706;">Pay at Checkout</strong> option.
      Please settle the full amount at the front desk on or before your checkout date.
    </p>
    <div style="background:#fff;border:1px solid #f0ebe0;border-radius:12px;padding:18px;">
      <p style="margin:0 0 10px;color:#d97706;font-weight:700;font-size:14px;">Accepted Payment Methods at Front Desk:</p>
      <p style="margin:4px 0;color:#5a4a3a;font-size:13px;">✅ Cash (LKR)</p>
      <p style="margin:4px 0;color:#5a4a3a;font-size:13px;">✅ Credit / Debit Card (Visa, Master)</p>
      <p style="margin:4px 0;color:#5a4a3a;font-size:13px;">✅ Bank Transfer</p>
    </div>
  </div>

  ${booking.specialRequests ? `
  <!-- SPECIAL REQUESTS -->
  <div style="padding:24px 40px;border-bottom:1px solid #f0ebe0;">
    <h2 style="margin:0 0 12px;color:#1a0a00;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Special Requests</h2>
    <p style="margin:0;color:#5a4a3a;font-size:13px;line-height:1.7;font-style:italic;">"${booking.specialRequests}"</p>
  </div>
  ` : ""}

  <!-- FOOTER -->
  <div style="padding:28px 40px;text-align:center;background:#1a0a00;">
    <p style="margin:0 0 8px;color:#F5A623;font-weight:700;font-size:16px;">Kadiraa Resort & Tourism</p>
    <p style="margin:0 0 6px;color:rgba(255,255,255,0.5);font-size:12px;">For any queries, please contact our front desk</p>
    <p style="margin:0;color:rgba(255,255,255,0.4);font-size:11px;">This is an automated bill notification. Please do not reply to this email.</p>
  </div>

</div>
</body>
</html>`;
}

// ─── ROOM CRUD ────────────────────────────────────────────

export async function addRoom(req, res) {
    if (req.user == null) {
        return res.status(401).json({ message: "Please login and try again" });
    }
    if (req.user.role != "admin") {
        return res.status(403).json({ message: "You are not authorized to perform this action" });
    }

    try {
        const key = normalizeText(req.body.key);
        const roomNumber = normalizeText(req.body.roomNumber);
        const hotelName = normalizeText(req.body.hotelName);
        const roomType = normalizeText(req.body.roomType);
        const description = normalizeText(req.body.description);
        const price = Number(req.body.price);
        const capacity = Number(req.body.capacity);
        const availability = normalizeBoolean(req.body.availability, true);
        const status = normalizeText(req.body.status || "Available");

        if (!key) {
            return res.status(400).json({ message: "Room key is required" });
        }
        if (!roomNumber) {
            return res.status(400).json({ message: "Room number is required" });
        }
        if (!Number.isInteger(Number(roomNumber)) || Number(roomNumber) <= 0) {
            return res.status(400).json({ message: "Room number must be a positive whole number" });
        }
        if (!hotelName) {
            return res.status(400).json({ message: "Hotel is required" });
        }
        if (!roomType) {
            return res.status(400).json({ message: "Room type is required" });
        }
        if (!description) {
            return res.status(400).json({ message: "Room description is required" });
        }
        if (!Number.isFinite(price) || price <= 0) {
            return res.status(400).json({ message: "Room price must be greater than 0" });
        }
        if (!Number.isFinite(capacity) || capacity < 1) {
            return res.status(400).json({ message: "Room capacity must be at least 1" });
        }
        if (!["Available", "Booked", "Maintenance"].includes(status)) {
            return res.status(400).json({ message: "Room status is invalid" });
        }

        const hotel = await Hotel.findOne({ name: hotelName });
        if (!hotel) {
            return res.status(400).json({ message: "Selected hotel does not exist" });
        }

        const duplicateRoomKey = await Room.findOne({ key });
        if (duplicateRoomKey) {
            return res.status(409).json({ message: "A room with this key already exists" });
        }

        const duplicateRoom = await Room.findOne({ hotelName, roomNumber });
        if (duplicateRoom) {
            return res.status(409).json({ message: "This room number already exists in the selected hotel" });
        }

        const data = {
            ...req.body,
            key,
            roomNumber,
            hotelName,
            roomType,
            description,
            price,
            capacity,
            availability,
            status,
            images: normalizeImageList(req.body.images)
        };

        const newRoom = new Room(data);
        await newRoom.save();
        return res.json({ message: "Room added successfully" });
    } catch (e) {
        return res.status(500).json({ error: "Room addition failed", detail: e.message });
    }
}

export async function getRooms(req, res) {
    try {
        if (isItAdmin(req)) {
            const rooms = await Room.find();
            res.json(rooms);
        } else {
            const rooms = await Room.find({
                status: { $not: /^maintenance$/i }
            });
            res.json(rooms);
        }
    } catch (e) {
        res.status(500).json({ message: "Failed to get rooms" });
    }
}

export async function getRoom(req, res) {
    try {
        const key = req.params.key;
        const room = await Room.findOne({ key: key });
        if (room == null) {
            return res.status(404).json({ message: "Room not found" });
        }
        res.json(room);
    } catch (e) {
        res.status(500).json({ message: "Failed to get room" });
    }
}

export async function updateRoom(req, res) {
    try {
        if (isItAdmin(req)) {
            const key = req.params.key;
            const existingRoom = await Room.findOne({ key });
            if (existingRoom == null) {
                return res.status(404).json({ message: "Room not found" });
            }

            const roomNumber =
                req.body.roomNumber !== undefined ? normalizeText(req.body.roomNumber) : existingRoom.roomNumber;
            const hotelName =
                req.body.hotelName !== undefined ? normalizeText(req.body.hotelName) : existingRoom.hotelName;
            const roomType =
                req.body.roomType !== undefined ? normalizeText(req.body.roomType) : existingRoom.roomType;
            const description =
                req.body.description !== undefined ? normalizeText(req.body.description) : existingRoom.description;
            const price =
                req.body.price !== undefined ? Number(req.body.price) : existingRoom.price;
            const capacity =
                req.body.capacity !== undefined ? Number(req.body.capacity) : existingRoom.capacity;
            const availability =
                req.body.availability !== undefined
                    ? normalizeBoolean(req.body.availability, existingRoom.availability)
                    : existingRoom.availability;
            const status =
                req.body.status !== undefined ? normalizeText(req.body.status) : existingRoom.status;

            if (!roomNumber) {
                return res.status(400).json({ message: "Room number is required" });
            }
            if (!Number.isInteger(Number(roomNumber)) || Number(roomNumber) <= 0) {
                return res.status(400).json({ message: "Room number must be a positive whole number" });
            }
            if (!hotelName) {
                return res.status(400).json({ message: "Hotel is required" });
            }
            if (!roomType) {
                return res.status(400).json({ message: "Room type is required" });
            }
            if (!description) {
                return res.status(400).json({ message: "Room description is required" });
            }
            if (!Number.isFinite(price) || price <= 0) {
                return res.status(400).json({ message: "Room price must be greater than 0" });
            }
            if (!Number.isFinite(capacity) || capacity < 1) {
                return res.status(400).json({ message: "Room capacity must be at least 1" });
            }
            if (!["Available", "Booked", "Maintenance"].includes(status)) {
                return res.status(400).json({ message: "Room status is invalid" });
            }

            const hotel = await Hotel.findOne({ name: hotelName });
            if (!hotel) {
                return res.status(400).json({ message: "Selected hotel does not exist" });
            }

            const duplicateRoom = await Room.findOne({
                key: { $ne: key },
                hotelName,
                roomNumber
            });
            if (duplicateRoom) {
                return res.status(409).json({ message: "This room number already exists in the selected hotel" });
            }

            const data = {
                ...req.body,
                roomNumber,
                hotelName,
                roomType,
                description,
                price,
                capacity,
                availability,
                status
            };

            if (req.body.images !== undefined) {
                data.images = normalizeImageList(req.body.images);
            }

            await Room.updateOne({ key: key }, data);
            res.json({ message: "Room updated successfully" });
        } else {
            res.status(403).json({ message: "You are not authorized to perform this action" });
        }
    } catch (e) {
        res.status(500).json({ message: "Failed to update room" });
    }
}

export async function deleteRoom(req, res) {
    try {
        if (isItAdmin(req)) {
            const key = req.params.key;

            const bookingHistory = await RoomBooking.findOne({ roomKey: key });
            if (bookingHistory) {
                return res.status(409).json({
                    message: "This room cannot be deleted because it has booking history. You can mark it as inactive instead."
                });
            }

            await Room.deleteOne({ key: key });
            res.json({ message: "Room deleted successfully" });
        } else {
            res.status(403).json({ message: "You are not authorized to perform this action" });
        }
    } catch (e) {
        res.status(500).json({ message: "Failed to delete room" });
    }
}

// Search available rooms by date range + filters
export async function searchAvailableRooms(req, res) {
    try {
        const { checkIn, checkOut, guests, roomType, hotelName } = req.query;
        const parsedGuests = guests ? Number(guests) : null;
        const normalizedRoomType = normalizeText(roomType);
        const requestedRoomType = normalizeRoomTypeValue(roomType);
        const today = getStartOfToday();

        console.log("[RoomSearch] Query params", {
            checkIn,
            checkOut,
            guests,
            roomType,
            normalizedRoomType,
            requestedRoomType,
            hotelName
        });

        // Build room filter.
        // Date-range availability should be driven by overlapping bookings,
        // not only by the static availability flag, because a room may still
        // be bookable for a future date range even if it is currently marked booked.
        let roomFilter = {
            status: { $not: /^maintenance$/i }
        };
        if (hotelName)  roomFilter.hotelName = { $regex: normalizeText(hotelName), $options: "i" };
        if (guests) {
            if (!Number.isInteger(parsedGuests) || parsedGuests < 1) {
                return res.status(400).json({ message: "Guests must be at least 1." });
            }
            roomFilter.capacity = { $gte: parsedGuests };
        }

        let rooms = await Room.find(roomFilter);
        console.log("[RoomSearch] Rooms before date filtering", rooms.length);
        console.log("[RoomSearch] Room types from data", rooms.map((room) => room.roomType || room.type || room.category || room.room_type));

        // If date range provided, exclude rooms that have overlapping bookings
        if (checkIn && checkOut) {
            const checkInDate = parseBookingDate(checkIn);
            const checkOutDate = parseBookingDate(checkOut);

            if (!checkInDate || !checkOutDate) {
                return res.status(400).json({ message: "Please use valid check-in and check-out dates." });
            }

            if (checkOutDate <= checkInDate) {
                return res.status(400).json({ message: "Check-in date must be earlier than check-out date." });
            }

            if (checkInDate < today) {
                return res.status(400).json({ message: "Check-in date cannot be in the past." });
            }

            const conflictingBookings = await RoomBooking.find({
                ...buildActiveBookingConflictQuery(null, checkInDate, checkOutDate)
            }).distinct("roomKey");

            rooms = rooms.filter(r => !conflictingBookings.includes(r.key));
            console.log("[RoomSearch] Conflicting bookings", conflictingBookings.length);
        }

        if (requestedRoomType && requestedRoomType !== "anytype") {
            rooms = rooms.filter((room) => {
                const candidateRoomType = normalizeRoomTypeValue(
                    room.roomType || room.type || room.category || room.room_type
                );

                return candidateRoomType === requestedRoomType;
            });
        }

        console.log("[RoomSearch] Final rooms returned", rooms.length);
        res.json(rooms);
    } catch (e) {
        res.status(500).json({ message: "Failed to search rooms" });
    }
}

// ─── BOOKING CRUD ─────────────────────────────────────────

export async function createBooking(req, res) {
    if (req.user == null) {
        return res.status(401).json({ message: "Please login and try again" });
    }
    try {
        const data = req.body;
        const guests = Number(data.numberOfGuests || 1);
        const checkIn = parseBookingDate(data.checkInDate);
        const checkOut = parseBookingDate(data.checkOutDate);
        const paymentMethod = normalizeText(data.paymentMethod);

        const room = await Room.findOne({ key: data.roomKey });
        if (!room) return res.status(404).json({ message: "Room not found" });
        if (!room.availability) return res.status(400).json({ message: "Room is not available" });

        if (!checkIn || !checkOut) {
            return res.status(400).json({ message: "Please enter valid check-in and check-out dates." });
        }

        if (checkOut <= checkIn) {
            return res.status(400).json({ message: "Check-in date must be earlier than check-out date." });
        }

        if (checkIn < getStartOfToday()) {
            return res.status(400).json({ message: "Check-in date cannot be in the past." });
        }

        if (!Number.isInteger(guests) || guests < 1) {
            return res.status(400).json({ message: "Please enter a valid guest count." });
        }

        if (guests > room.capacity) {
            return res.status(400).json({ message: `This room allows up to ${room.capacity} guests only.` });
        }

        if (!paymentMethod) {
            return res.status(400).json({ message: "Please select a payment method for this room booking." });
        }

        if (!["bank_deposit", "online", "checkout"].includes(paymentMethod)) {
            return res.status(400).json({ message: "Selected payment method is invalid for room bookings." });
        }

        const conflict = await RoomBooking.findOne({
            ...buildActiveBookingConflictQuery(data.roomKey, checkIn, checkOut)
        });
        if (conflict) {
            return res.status(400).json({
                message: "This room is already booked for the selected date range. Please choose different dates."
            });
        }

        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        if (nights < 1) {
            return res.status(400).json({ message: "Your booking must be at least 1 night." });
        }

        const pricing = calculateRoomBookingTotal(room.price, nights);

        const booking = new RoomBooking({
            bookingId: "BK-" + Date.now(),
            userId: req.user._id || null,
            email: req.user.email,
            roomKey: data.roomKey,
            room: {
                key:        room.key,
                roomNumber: room.roomNumber,
                hotelName:  room.hotelName,
                roomType:   room.roomType,
                image:      room.images?.[0] || "https://www.shutterstock.com/image-vector/missing-picture-page-website-design-600nw-1552421075.jpg",
                price:      room.price
            },
            checkInDate:     checkIn,
            checkOutDate:    checkOut,
            numberOfGuests:  guests,
            numberOfNights:  nights,
            specialRequests: data.specialRequests || "",
            paymentMethod,
            totalAmount:     pricing.totalAmount,
            bookingStatus:   paymentMethod === "checkout" ? "confirmed" : "pending",
            // Auto-approve checkout payment bookings (pay on arrival)
            isApproved:      paymentMethod === "checkout" ? true : false,
            paymentStatus:   "pending"
        });

        await booking.save();
        res.json({
            message: "Booking created successfully",
            bookingId: booking.bookingId,
            numberOfNights: nights,
            subtotal: pricing.subtotal,
            taxAmount: pricing.taxAmount,
            totalAmount: pricing.totalAmount
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Failed to create booking" });
    }
}

export async function getMyBookings(req, res) {
    if (req.user == null) {
        return res.status(401).json({ message: "Please login and try again" });
    }
    try {
        const bookings = await RoomBooking.find({ email: req.user.email }).sort({ bookingDate: -1 });
        res.json(bookings);
    } catch (e) {
        res.status(500).json({ message: "Failed to get bookings" });
    }
}

export async function getBookingById(req, res) {
    if (req.user == null) {
        return res.status(401).json({ message: "Please login and try again" });
    }

    try {
        const { bookingId } = req.params;
        const query = isItAdmin(req)
            ? { bookingId }
            : { bookingId, email: req.user.email };

        const booking = await RoomBooking.findOne(query);

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        res.json(booking);
    } catch (e) {
        res.status(500).json({ message: "Failed to get booking details" });
    }
}

export async function getAllBookings(req, res) {
    try {
        if (!isItAdmin(req)) {
            return res.status(403).json({ message: "You are not authorized to perform this action" });
        }
        const bookings = await RoomBooking.find().sort({ bookingDate: -1 });
        res.json(bookings);
    } catch (e) {
        res.status(500).json({ message: "Failed to get bookings" });
    }
}

export async function approveBooking(req, res) {
    try {
        if (!isItAdmin(req)) {
            return res.status(403).json({ message: "You are not authorized to perform this action" });
        }
        const { bookingId } = req.params;
        const booking = await RoomBooking.findOne({ bookingId: bookingId });
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }
        if (booking.bookingStatus === "cancelled") {
            return res.status(400).json({ message: "Cancelled bookings cannot be approved" });
        }
        if (booking.bookingStatus === "confirmed") {
            return res.status(400).json({ message: "This booking is already confirmed" });
        }

        await RoomBooking.updateOne(
            { bookingId: bookingId },
            { isApproved: true, paymentStatus: "verified", bookingStatus: "confirmed" }
        );
        res.json({ message: "Booking approved successfully" });
    } catch (e) {
        res.status(500).json({ message: "Failed to approve booking" });
    }
}

export async function rejectBooking(req, res) {
    try {
        if (!isItAdmin(req)) {
            return res.status(403).json({ message: "You are not authorized to perform this action" });
        }
        const { bookingId } = req.params;
        const booking = await RoomBooking.findOne({ bookingId: bookingId });
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }
        if (booking.bookingStatus === "cancelled") {
            return res.status(400).json({ message: "This booking is already cancelled" });
        }
        if (booking.bookingStatus === "confirmed") {
            return res.status(400).json({ message: "Confirmed bookings cannot be rejected from this action" });
        }

        await RoomBooking.updateOne(
            { bookingId: bookingId },
            {
                isApproved: false,
                paymentStatus: "rejected",
                bookingStatus: "cancelled",
                cancellationDate: new Date(),
                cancellationMessage: "Booking was rejected by the administrator."
            }
        );
        res.json({ message: "Booking rejected" });
    } catch (e) {
        res.status(500).json({ message: "Failed to reject booking" });
    }
}

export async function uploadPaymentSlip(req, res) {
    if (req.user == null) {
        return res.status(401).json({ message: "Please login and try again" });
    }
    try {
        const { bookingId } = req.params;
        const { paymentSlip } = req.body;
        await RoomBooking.updateOne(
            { bookingId: bookingId, email: req.user.email },
            { paymentSlip: paymentSlip, paymentStatus: "pending", bookingStatus: "pending" }
        );
        res.json({ message: "Payment slip uploaded successfully" });
    } catch (e) {
        res.status(500).json({ message: "Failed to upload payment slip" });
    }
}

export async function cancelBooking(req, res) {
    if (req.user == null) {
        return res.status(401).json({ message: "Please login and try again" });
    }
    try {
        if (isItAdmin(req)) {
            return res.status(403).json({
                message: "Room bookings cannot be deleted by admin. Use status update instead."
            });
        }

        const { bookingId } = req.params;
        const booking = await RoomBooking.findOne({ bookingId: bookingId, email: req.user.email });
        if (!booking) return res.status(404).json({ message: "Booking not found" });

        if (booking.bookingStatus === "cancelled") {
            return res.status(400).json({ message: "This booking has already been cancelled." });
        }

        if (booking.bookingStatus === "completed") {
            return res.status(400).json({
                message: "This booking is no longer eligible for cancellation."
            });
        }

        const now = new Date();
        const createdAt = getBookingCreatedAt(booking);
        const checkInDate = new Date(booking.checkInDate);
        const paymentMethod = booking.paymentMethod;

        if (now >= checkInDate) {
            return res.status(400).json({
                message: "This booking is no longer eligible for cancellation."
            });
        }

        let updateData = {
            bookingStatus: "cancelled",
            cancellationDate: now,
            cancellationReason: paymentMethod === "checkout"
                ? "Cancelled by customer before arrival"
                : "Cancelled by customer"
        };

        if (paymentMethod === "checkout") {
            const bookingAgeHours = getHoursBetween(createdAt, now);

            if (bookingAgeHours > 48) {
                return res.status(400).json({
                    message: "Pay at Check-out bookings can only be cancelled within 48 hours of booking."
                });
            }

            updateData = {
                ...updateData,
                refundEligible: false,
                refundStatus: "not_required",
                refundAmount: 0,
                refundMessage: "No refund is required because payment was not made yet.",
                cancellationMessage: "Your cancellation is successful. No refund is required because this booking used Pay at Check-out."
            };
        } else if (paymentMethod === "online" || paymentMethod === "bank_deposit") {
            const hoursUntilCheckIn = getHoursBetween(now, checkInDate);

            if (hoursUntilCheckIn < 72) {
                return res.status(400).json({
                    message: "Online or bank paid bookings can be cancelled only at least 3 days before arrival."
                });
            }

            updateData = {
                ...updateData,
                refundEligible: true,
                refundStatus: "pending_admin_refund",
                refundAmount: booking.totalAmount,
                refundRequestedAt: now,
                refundMessage: "Admin will process your refund.",
                cancellationMessage: "Your cancellation is successful. Refund is pending admin approval."
            };
        } else {
            return res.status(400).json({
                message: "This booking is no longer eligible for cancellation."
            });
        }

        await RoomBooking.updateOne({ bookingId: bookingId }, updateData);

        const updatedBooking = await RoomBooking.findOne({ bookingId: bookingId, email: req.user.email });

        if (updatedBooking) {
            await createRoomBookingCancellationNotification(updatedBooking);
        }

        res.json({
            message: updatedBooking?.cancellationMessage || "Booking cancelled successfully",
            booking: updatedBooking
        });
    } catch (e) {
        res.status(500).json({ message: "Failed to cancel booking" });
    }
}

export async function updateRefundStatus(req, res) {
    try {
        if (!isItAdmin(req)) {
            return res.status(403).json({ message: "You are not authorized to perform this action" });
        }

        const { bookingId } = req.params;
        const { refundStatus, refundAmount, refundMessage } = req.body;

        const allowedStatuses = ["pending_admin_refund", "processing", "refunded", "not_required", "not_eligible"];

        if (!allowedStatuses.includes(refundStatus)) {
            return res.status(400).json({ message: "Invalid refund status supplied." });
        }

        const booking = await RoomBooking.findOne({ bookingId });

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (refundStatus === "refunded") {
            if (booking.bookingStatus !== "cancelled") {
                return res.status(400).json({ message: "Only cancelled bookings can be marked as refunded." });
            }

            if (booking.refundEligible !== true && booking.refundStatus !== "pending_admin_refund" && booking.refundStatus !== "processing") {
                return res.status(400).json({ message: "This booking does not require a refund." });
            }
        }

        const updateData = {
            refundStatus,
            refundMessage: refundMessage || booking.refundMessage || ""
        };

        if (typeof refundAmount === "number" && refundAmount >= 0) {
            updateData.refundAmount = refundAmount;
        }

        if (refundStatus === "refunded") {
            updateData.refundedAt = new Date();
        }

        await RoomBooking.updateOne({ bookingId }, updateData);

        const updatedBooking = await RoomBooking.findOne({ bookingId });

        res.json({
            message: "Refund status updated successfully",
            booking: updatedBooking
        });
    } catch (e) {
        res.status(500).json({ message: "Failed to update refund status" });
    }
}

export async function getRoomBookingNotifications(req, res) {
    try {
        if (!isItAdmin(req)) {
            return res.status(403).json({ message: "You are not authorized to perform this action" });
        }

        const notifications = await RoomBookingNotification
            .find({ type: "room_booking_cancelled" })
            .sort({ createdAt: -1 });

        const unreadCount = notifications.filter((notification) => notification.isRead !== true).length;

        res.json({
            notifications,
            unreadCount
        });
    } catch (e) {
        res.status(500).json({ message: "Failed to get room booking notifications" });
    }
}

export async function getRoomBookingNotificationUnreadCount(req, res) {
    try {
        if (!isItAdmin(req)) {
            return res.status(403).json({ message: "You are not authorized to perform this action" });
        }

        const unreadCount = await RoomBookingNotification.countDocuments({
            type: "room_booking_cancelled",
            isRead: false
        });

        res.json({ unreadCount });
    } catch (e) {
        res.status(500).json({ message: "Failed to get unread room booking notification count" });
    }
}

export async function markRoomBookingNotificationRead(req, res) {
    try {
        if (!isItAdmin(req)) {
            return res.status(403).json({ message: "You are not authorized to perform this action" });
        }

        const { notificationId } = req.params;
        const notification = await RoomBookingNotification.findById(notificationId);

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        if (notification.isRead) {
            return res.json({ message: "Notification already marked as read", notification });
        }

        notification.isRead = true;
        notification.readAt = new Date();
        await notification.save();

        res.json({
            message: "Notification marked as read",
            notification
        });
    } catch (e) {
        res.status(500).json({ message: "Failed to mark notification as read" });
    }
}

export async function markAllRoomBookingNotificationsRead(req, res) {
    try {
        if (!isItAdmin(req)) {
            return res.status(403).json({ message: "You are not authorized to perform this action" });
        }

        await RoomBookingNotification.updateMany(
            { type: "room_booking_cancelled", isRead: false },
            { isRead: true, readAt: new Date() }
        );

        res.json({ message: "All room booking notifications marked as read" });
    } catch (e) {
        res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
}

// ─── SEND CHECKOUT BILL EMAIL (Admin only) ─────────────────
export async function sendCheckoutEmail(req, res) {
    try {
        if (!isItAdmin(req)) {
            return res.status(403).json({ message: "You are not authorized to perform this action" });
        }

        const { bookingId } = req.params;
        const forceResend = req.body?.forceResend === true;
        const booking = await RoomBooking.findOne({ bookingId });
        if (!booking) return res.status(404).json({ message: "Booking not found" });
        if (booking.paymentMethod !== "checkout") {
            return res.status(400).json({ message: "This booking does not use the checkout payment method" });
        }
        if (!booking.email) {
            return res.status(400).json({ message: "Booking email is missing" });
        }
        if (booking.checkoutEmailSent && !forceResend) {
            return res.status(400).json({
                message: "Checkout bill email was already sent. Use resend if you need to send it again."
            });
        }

        const transporter = createTransporter();

        const roomPrice  = booking.room.price;
        const nights     = booking.numberOfNights;
        const roomTotal  = roomPrice * nights;
        const taxAmount  = Math.round(roomTotal * 0.15);
        const grandTotal = roomTotal + taxAmount;
        const checkOut   = new Date(booking.checkOutDate).toLocaleDateString("en-US", {
            weekday: "long", year: "numeric", month: "long", day: "numeric"
        });

        const mailOptions = {
            from: `"Kadiraa Resort" <${process.env.EMAIL_USER}>`,
            to: booking.email,
            subject: `Checkout Bill — Booking ${booking.bookingId} | Kadiraa Resort`,
            html: buildCheckoutEmailHTML(booking),
            text: `
Dear Guest,

Your checkout bill for Booking ID: ${booking.bookingId}

Hotel: ${booking.room.hotelName}
Room: ${booking.room.roomNumber} (${booking.room.roomType})
Check-Out Date: ${checkOut}
Total Nights: ${nights}

--- Bill Summary ---
Room Charges (${nights} nights × LKR ${roomPrice.toLocaleString()}): LKR ${roomTotal.toLocaleString()}
Tax & Service Charge (15%): LKR ${taxAmount.toLocaleString()}
TOTAL AMOUNT DUE: LKR ${grandTotal.toLocaleString()}

Payment is due at checkout. Please visit the front desk.

Thank you for staying with Kadiraa Resort.
            `.trim()
        };

        await transporter.sendMail(mailOptions);

        // Mark email as sent
        await RoomBooking.updateOne(
            { bookingId },
            { checkoutEmailSent: true, checkoutEmailSentAt: new Date() }
        );

        res.json({
            message: "Checkout bill email sent successfully",
            sentTo: booking.email,
            totalAmount: grandTotal
        });
    } catch (e) {
        console.error("Email error:", e);
        res.status(500).json({ message: "Failed to send checkout email", error: e.message });
    }
}
