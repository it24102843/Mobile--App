import express from "express";
import {
    addRoom, getRooms, getRoom, updateRoom, deleteRoom,
    searchAvailableRooms, createBooking, getMyBookings, getBookingById,
    getAllBookings, approveBooking, rejectBooking,
    uploadPaymentSlip, cancelBooking, sendCheckoutEmail, updateRefundStatus,
    getRoomBookingNotifications, getRoomBookingNotificationUnreadCount,
    markRoomBookingNotificationRead, markAllRoomBookingNotificationsRead
} from "../controllers/Roomcontroller.js";

const roomRouter = express.Router();

// ─── Booking routes (MUST come before /:key) ──────────────
roomRouter.post("/bookings/create",                       createBooking);
roomRouter.get("/bookings/my",                            getMyBookings);
roomRouter.get("/bookings/all",                           getAllBookings);
roomRouter.get("/bookings/notifications",                 getRoomBookingNotifications);
roomRouter.get("/bookings/notifications/unread-count",    getRoomBookingNotificationUnreadCount);
roomRouter.patch("/bookings/notifications/read-all",      markAllRoomBookingNotificationsRead);
roomRouter.patch("/bookings/notifications/:notificationId/read", markRoomBookingNotificationRead);
roomRouter.get("/bookings/:bookingId",                    getBookingById);
roomRouter.put("/bookings/:bookingId/approve",            approveBooking);
roomRouter.put("/bookings/:bookingId/reject",             rejectBooking);
roomRouter.put("/bookings/:bookingId/payment-slip",       uploadPaymentSlip);
roomRouter.put("/bookings/:bookingId/refund-status",      updateRefundStatus);
roomRouter.delete("/bookings/:bookingId/cancel",          cancelBooking);
roomRouter.post("/bookings/:bookingId/send-checkout-email", sendCheckoutEmail);

// ─── Room routes ───────────────────────────────────────────
roomRouter.post("/",         addRoom);
roomRouter.get("/",          getRooms);
roomRouter.get("/search",    searchAvailableRooms);
roomRouter.get("/:key",      getRoom);
roomRouter.put("/:key",      updateRoom);
roomRouter.delete("/:key",   deleteRoom);

export default roomRouter;
