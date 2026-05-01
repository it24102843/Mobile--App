import express from "express";
import {
    createPackageBooking,
    getPackageBookings,
    getMyBookings,
    getPackageBookingById,
    updatePackageBookingStatus,
    deletePackageBooking,
    getPackageBookingNotifications,
    getPackageBookingNotificationUnreadCount,
    markPackageBookingNotificationRead,
    markAllPackageBookingNotificationsRead,
} from "../controllers/packageBookingController.js";

const packageBookingRouter = express.Router();

packageBookingRouter.post("/", createPackageBooking);
packageBookingRouter.get("/my", getMyBookings);
packageBookingRouter.get("/notifications", getPackageBookingNotifications);
packageBookingRouter.get("/notifications/unread-count", getPackageBookingNotificationUnreadCount);
packageBookingRouter.patch("/notifications/read-all", markAllPackageBookingNotificationsRead);
packageBookingRouter.patch("/notifications/:notificationId/read", markPackageBookingNotificationRead);
packageBookingRouter.get("/", getPackageBookings);
packageBookingRouter.get("/:bookingId", getPackageBookingById);
packageBookingRouter.put("/:bookingId/status", updatePackageBookingStatus);
packageBookingRouter.delete("/:bookingId", deletePackageBooking);

export default packageBookingRouter;
