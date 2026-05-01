import express from "express";
import {
    saveSelectedDestinations,
    getNearbyDestinations,
    getRouteDetails,
    generateRoute,
    sendRouteMap
} from "../controllers/mapController.js";
import { protect, authorize, isCustomer } from "../middleware/auth.js";

const router = express.Router();

// Routes that require authentication (any logged-in user)
router.post('/save-destinations', protect, saveSelectedDestinations);
router.get('/nearby-destinations', protect, getNearbyDestinations);
router.get('/route/:id', protect, getRouteDetails);
router.post('/route/:id/generate', protect, generateRoute);
router.post('/route/:id/send', protect, sendRouteMap);

// Route that requires customer role
// router.post('/save-destinations', protect, isCustomer, saveSelectedDestinations);

// Public route (no authentication needed)
router.get('/shared/:id', getRouteDetails);

export default router;