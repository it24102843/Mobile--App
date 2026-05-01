import Vehicle from "../models/Vehicle.js";
import VehicleBooking from "../models/VehicleBooking.js";
import { isItAdmin } from "./userController.js";

const FALLBACK_VEHICLE_IMAGE =
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80";

function normalizeBoolean(value, fallback = false) {
    if (typeof value === "boolean") {
        return value;
    }

    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (normalized === "true") {
            return true;
        }

        if (normalized === "false") {
            return false;
        }
    }

    return fallback;
}

function normalizeStringArray(value) {
    if (Array.isArray(value)) {
        return value
            .map((item) => `${item ?? ""}`.trim())
            .filter(Boolean);
    }

    if (typeof value === "string") {
        return value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
    }

    return [];
}

function normalizeImageArray(value) {
    const images = normalizeStringArray(value).filter((image) => /^https?:\/\//i.test(image));
    return images.length ? images : [FALLBACK_VEHICLE_IMAGE];
}

function buildVehiclePayload(data) {
    const status = `${data.status || ""}`.trim();
    const availability = status
        ? status.toLowerCase() === "available"
        : normalizeBoolean(data.availability, true);

    return {
        registrationNumber: `${data.registrationNumber || ""}`.trim(),
        name: `${data.name || ""}`.trim(),
        type: `${data.type || "Safari Jeep"}`.trim(),
        capacity: Number(data.capacity ?? 0),
        pricePerDay: Number(data.pricePerDay ?? 0),
        description: `${data.description || ""}`.trim(),
        driverName: `${data.driverName || ""}`.trim(),
        driverContact: `${data.driverContact || ""}`.trim(),
        availability,
        image: normalizeImageArray(data.image ?? data.images),
    };
}

async function validateVehiclePayload(payload, options = {}) {
    const errors = {};

    if (!payload.registrationNumber) {
        errors.registrationNumber = "Registration number is required.";
    }

    if (!payload.name) {
        errors.name = "Vehicle name is required.";
    }

    if (!payload.type) {
        errors.type = "Vehicle type is required.";
    }

    if (!Number.isInteger(payload.capacity) || payload.capacity <= 0) {
        errors.capacity = "Capacity must be a positive whole number.";
    }

    if (!Number.isFinite(payload.pricePerDay) || payload.pricePerDay <= 0) {
        errors.pricePerDay = "Price must be a positive number.";
    }

    if (!payload.description) {
        errors.description = "Description is required.";
    }

    const duplicateVehicle = await Vehicle.findOne({
        registrationNumber: {
            $regex: `^${payload.registrationNumber.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
            $options: "i"
        }
    });

    if (duplicateVehicle && `${duplicateVehicle._id}` !== `${options.currentVehicleId || ""}`) {
        errors.registrationNumber = "This registration number already exists.";
    }

    return errors;
}

function sendValidationError(res, errors) {
    return res.status(400).json({
        message: "Please correct the highlighted transportation fields and try again.",
        errors
    });
}

export async function addVehicle(req, res) {
    if (req.user == null) {
        return res.status(401).json({
            message: "Please login and try again"
        });
    }

    if (!isItAdmin(req)) {
        return res.status(403).json({
            message: "You are not authorized to perform this action"
        });
    }

    try {
        const payload = buildVehiclePayload(req.body);
        const errors = await validateVehiclePayload(payload);

        if (Object.keys(errors).length > 0) {
            return sendValidationError(res, errors);
        }

        const newVehicle = new Vehicle(payload);
        await newVehicle.save();

        return res.json({
            message: "Vehicle added successfully",
            vehicle: newVehicle
        });
    } catch (error) {
        console.log("Vehicle save error:", error.message);
        return res.status(500).json({
            message: "Vehicle addition failed",
            error: error.message
        });
    }
}

export async function getVehicles(req, res) {
    try {
        const filter = isItAdmin(req) ? {} : { availability: true };
        const vehicles = await Vehicle.find(filter).sort({ createdAt: -1, _id: -1 });
        return res.json(vehicles);
    } catch (e) {
        return res.status(500).json({
            message: "Failed to get vehicles"
        });
    }
}

export async function getVehicle(req, res) {
    try {
        const id = req.params.id;
        const vehicle = await Vehicle.findById(id);

        if (vehicle == null) {
            return res.status(404).json({
                message: "Vehicle not found"
            });
        }

        return res.json(vehicle);
    } catch (e) {
        return res.status(500).json({
            message: "Failed to get vehicle"
        });
    }
}

export async function updateVehicle(req, res) {
    try {
        if (!isItAdmin(req)) {
            return res.status(403).json({
                message: "You are not authorized to perform this action"
            });
        }

        const id = req.params.id;
        const existingVehicle = await Vehicle.findById(id);

        if (!existingVehicle) {
            return res.status(404).json({
                message: "Vehicle not found"
            });
        }

        const payload = buildVehiclePayload(req.body);
        const errors = await validateVehiclePayload(payload, { currentVehicleId: id });

        if (Object.keys(errors).length > 0) {
            return sendValidationError(res, errors);
        }

        const vehicle = await Vehicle.findByIdAndUpdate(id, payload, {
            new: true,
            runValidators: true
        });

        return res.json({
            message: "Vehicle updated successfully",
            vehicle
        });
    } catch (e) {
        return res.status(500).json({
            message: "Failed to update vehicle",
            error: e.message
        });
    }
}

export async function deleteVehicle(req, res) {
    try {
        if (!isItAdmin(req)) {
            return res.status(403).json({
                message: "You are not authorized to perform this action"
            });
        }

        const id = req.params.id;
        const bookingCount = await VehicleBooking.countDocuments({ vehicleId: id });

        if (bookingCount > 0) {
            return res.status(409).json({
                message: "Cannot delete. This item is currently in use."
            });
        }

        const vehicle = await Vehicle.findByIdAndDelete(id);

        if (!vehicle) {
            return res.status(404).json({
                message: "Vehicle not found"
            });
        }

        return res.json({
            message: "Vehicle deleted successfully"
        });
    } catch (e) {
        return res.status(500).json({
            message: "Failed to delete vehicle"
        });
    }
}
