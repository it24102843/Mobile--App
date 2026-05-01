import express from "express";
import {
    getAllEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent,
    getUpcomingEvents,
    getEventsByMonth
} from "../controllers/eventController.js";
import { protect, authorize, isAdmin } from "../middleware/auth.js";

const router = express.Router();

// Public routes (no authentication needed)
router.get('/', getAllEvents);
router.get('/upcoming', getUpcomingEvents);
router.get('/calendar/:year/:month', getEventsByMonth);
router.get('/:id', getEventById);

// Protected routes with role-based access
router.post('/', protect, authorize('admin'), createEvent);        // Only admins
router.put('/:id', protect, authorize('admin'), updateEvent);      // Only admins
router.delete('/:id', protect, authorize('admin'), deleteEvent);   // Only admins

// Alternative using isAdmin middleware
// router.post('/', protect, isAdmin, createEvent);

export default router;