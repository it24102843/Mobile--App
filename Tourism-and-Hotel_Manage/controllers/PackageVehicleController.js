import PackageVehicle from "../models/PackageVehicle.js";

const VEHICLE_TYPES = [
    "Mahindra Jeep",
    "Toyota Hilux",
    "Safari Jeep",
    "Land Cruiser",
    "Minibus",
    "Van"
];

const STATUS_OPTIONS = ["Available", "On Trip", "Maintenance"];

const FALLBACK_VEHICLE_IMAGE =
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80";

const isAdmin = (req) => req.user?.role === "admin";

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

function buildNormalizedVehiclePayload(data, options = {}) {
    const normalizedName = `${data.name || ""}`.trim();
    const normalizedDriverName = `${data.driverName || ""}`.trim();
    const normalizedDriverPhone = `${data.driverPhone || ""}`.trim();
    const normalizedType = `${data.type || ""}`.trim();
    const normalizedRegistrationNumber = `${data.registrationNumber || ""}`.trim();
    const normalizedDescription = `${data.description || ""}`.trim();
    const normalizedStatus = `${data.status || "Available"}`.trim();
    const capacity = Number(data.capacity ?? 0);
    const pricePerDay = Number(data.pricePerDay ?? 0);
    const images = normalizeImageArray(data.images);
    const assignedPackages = normalizeStringArray(data.assignedPackages);
    const availability = normalizeBoolean(data.availability, normalizedStatus === "Available");

    return {
        vehicleId: options.existingVehicleId || null,
        name: normalizedName,
        driverName: normalizedDriverName,
        driverPhone: normalizedDriverPhone,
        type: normalizedType,
        registrationNumber: normalizedRegistrationNumber,
        capacity,
        pricePerDay,
        description: normalizedDescription,
        images,
        availability: normalizedStatus === "Available" ? true : availability,
        status: normalizedStatus,
        assignedPackages,
        features: {
            ac: normalizeBoolean(data?.features?.ac, false),
            openRoof: normalizeBoolean(data?.features?.openRoof, false),
            fourWheelDrive: normalizeBoolean(data?.features?.fourWheelDrive, false),
            wifi: normalizeBoolean(data?.features?.wifi, false),
            firstAidKit: normalizeBoolean(data?.features?.firstAidKit, true),
            coolerBox: normalizeBoolean(data?.features?.coolerBox, false),
        },
    };
}

async function validateVehiclePayload(payload, options = {}) {
    const errors = {};

    if (!payload.name) {
        errors.name = "Vehicle name is required.";
    }

    if (!payload.driverName) {
        errors.driverName = "Driver name is required.";
    }

    if (!payload.type) {
        errors.type = "Vehicle type is required.";
    } else if (!VEHICLE_TYPES.includes(payload.type)) {
        errors.type = "Vehicle type is invalid.";
    }

    if (!payload.registrationNumber) {
        errors.registrationNumber = "Registration number is required.";
    }

    if (!Number.isInteger(payload.capacity) || payload.capacity <= 0) {
        errors.capacity = "Capacity must be a positive whole number.";
    }

    if (!Number.isFinite(payload.pricePerDay) || payload.pricePerDay <= 0) {
        errors.pricePerDay = "Price per day must be a positive number.";
    }

    if (!STATUS_OPTIONS.includes(payload.status)) {
        errors.status = "Vehicle status is invalid.";
    }

    if (!Array.isArray(payload.images) || !payload.images.length) {
        errors.images = "At least one vehicle image is required.";
    }

    const duplicateRegistration = await PackageVehicle.findOne({
        registrationNumber: {
            $regex: `^${payload.registrationNumber.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
            $options: "i"
        }
    });
    if (duplicateRegistration && duplicateRegistration.vehicleId !== options.currentVehicleId) {
        errors.registrationNumber = "This registration number already exists.";
    }

    return errors;
}

function sendValidationError(res, errors) {
    return res.status(400).json({
        message: "Please correct the highlighted vehicle fields and try again.",
        errors
    });
}

export async function addVehicle(req, res) {
    if (!isAdmin(req)) {
        return res.status(403).json({ message: "Admin only" });
    }

    try {
        const vehicleId = `VEH-${Date.now().toString().slice(-5)}${Math.random()
            .toString(36)
            .slice(2, 4)
            .toUpperCase()}`;
        const payload = buildNormalizedVehiclePayload(req.body, { existingVehicleId: vehicleId });
        const errors = await validateVehiclePayload(payload);

        if (Object.keys(errors).length > 0) {
            return sendValidationError(res, errors);
        }

        const vehicle = new PackageVehicle(payload);
        await vehicle.save();
        return res.json({ message: "Vehicle added successfully", vehicle });
    } catch (e) {
        return res.status(500).json({ message: "Failed to add vehicle", error: e.message });
    }
}

export async function getVehicles(req, res) {
    try {
        const { packageId } = req.query;
        let filter = {};

        if (packageId) {
            filter = { assignedPackages: packageId, availability: true, status: "Available" };
        } else if (!isAdmin(req)) {
            filter = { availability: true };
        }

        const vehicles = await PackageVehicle.find(filter).sort({ createdAt: -1 });
        return res.json(vehicles);
    } catch (e) {
        return res.status(500).json({ message: "Failed to fetch vehicles", error: e.message });
    }
}

export async function getVehicleById(req, res) {
    try {
        const vehicle = await PackageVehicle.findOne({ vehicleId: req.params.vehicleId });
        if (!vehicle) {
            return res.status(404).json({ message: "Vehicle not found" });
        }

        return res.json(vehicle);
    } catch (e) {
        return res.status(500).json({ message: "Failed to fetch vehicle", error: e.message });
    }
}

export async function updateVehicle(req, res) {
    if (!isAdmin(req)) {
        return res.status(403).json({ message: "Admin only" });
    }

    try {
        const vehicleId = req.params.vehicleId;
        const existingVehicle = await PackageVehicle.findOne({ vehicleId });

        if (!existingVehicle) {
            return res.status(404).json({ message: "Vehicle not found" });
        }

        const payload = buildNormalizedVehiclePayload(req.body, {
            existingVehicleId: vehicleId
        });
        const errors = await validateVehiclePayload(payload, {
            currentVehicleId: vehicleId
        });

        if (Object.keys(errors).length > 0) {
            return sendValidationError(res, errors);
        }

        const vehicle = await PackageVehicle.findOneAndUpdate(
            { vehicleId },
            payload,
            { new: true }
        );

        return res.json({ message: "Vehicle updated", vehicle });
    } catch (e) {
        return res.status(500).json({ message: "Failed to update vehicle", error: e.message });
    }
}

export async function deleteVehicle(req, res) {
    if (!isAdmin(req)) {
        return res.status(403).json({ message: "Admin only" });
    }

    try {
        const vehicle = await PackageVehicle.findOneAndDelete({ vehicleId: req.params.vehicleId });
        if (!vehicle) {
            return res.status(404).json({ message: "Vehicle not found" });
        }

        return res.json({ message: "Vehicle deleted" });
    } catch (e) {
        return res.status(500).json({ message: "Failed to delete vehicle", error: e.message });
    }
}

export async function assignVehicleToPackages(req, res) {
    if (!isAdmin(req)) {
        return res.status(403).json({ message: "Admin only" });
    }

    try {
        const { packageIds } = req.body;
        const vehicle = await PackageVehicle.findOneAndUpdate(
            { vehicleId: req.params.vehicleId },
            { assignedPackages: normalizeStringArray(packageIds) },
            { new: true }
        );

        if (!vehicle) {
            return res.status(404).json({ message: "Vehicle not found" });
        }

        return res.json({ message: "Packages assigned", vehicle });
    } catch (e) {
        return res.status(500).json({ message: "Failed to assign packages", error: e.message });
    }
}
