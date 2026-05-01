import express from "express";
import {
    createBooking,
    getAllBookings,
    getUserBookings,
    getBookingById,
    updateBookingStatus,
    cancelBooking,
    hardDeleteBooking,
    getBookingStats
} from "../controllers/VehicleBookingController.js";
import { verifyToken } from "../middleware/auth1.js";

const vehicleBookingRouter = express.Router();

// Protected client routes
vehicleBookingRouter.post("/", verifyToken, createBooking);  // Create a new booking
vehicleBookingRouter.get("/user", verifyToken, getUserBookings);  // Get bookings for logged-in user
vehicleBookingRouter.put("/:id/cancel", verifyToken, cancelBooking);  // Cancel own booking

// Hard Delete - Permanently remove booking (Public access - no auth required)
// For production, you may want to add authentication
vehicleBookingRouter.delete("/:id/permanent", hardDeleteBooking);

// Protected routes (require authentication - admin only)
vehicleBookingRouter.get("/stats", verifyToken, getBookingStats);  // Admin - statistics
vehicleBookingRouter.get("/", verifyToken, getAllBookings);  // Admin - get all bookings
vehicleBookingRouter.put("/:id/status", verifyToken, updateBookingStatus);  // Admin - update status

// Booking details
vehicleBookingRouter.get("/:id", getBookingById);  // Get single booking by ID

export default vehicleBookingRouter;
