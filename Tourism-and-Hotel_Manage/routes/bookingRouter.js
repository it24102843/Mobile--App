import express from "express";
import {
    getMyUnifiedBookings,
    getUnifiedBookingById,
} from "../controllers/bookingController.js";

const bookingRouter = express.Router();

bookingRouter.get("/my", getMyUnifiedBookings);
bookingRouter.get("/my/:type/:bookingId", getUnifiedBookingById);

export default bookingRouter;
