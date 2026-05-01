import Package from "../models/package.js";
import PackageBooking from "../models/PackageBooking.js";

const PACKAGE_CATEGORIES = [
    "Safari",
    "Wildlife",
    "Pilgrimage",
    "Adventure",
    "Cultural",
    "Nature",
    "Combined"
];

const FALLBACK_PACKAGE_IMAGE =
    "https://www.shutterstock.com/image-vector/missing-picture-page-website-design-600nw-1552421075.jpg";

function isAdmin(req) {
    return req.user && req.user.role === "admin";
}

function normalizeBoolean(value, fallback = true) {
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
    return images.length ? images : [FALLBACK_PACKAGE_IMAGE];
}

function buildNormalizedPackagePayload(data, options = {}) {
    const normalizedPackageId = `${options.existingPackageId || data.packageId || ""}`.trim();
    const normalizedName = `${data.name || ""}`.trim();
    const normalizedCategory = `${data.category || ""}`.trim();
    const normalizedDescription = `${data.description || ""}`.trim();
    const durationDays = Number(data?.duration?.days ?? data.durationDays ?? 0);
    const durationNights = Number(data?.duration?.nights ?? data.durationNights ?? 0);
    const price = Number(data.price ?? 0);
    const maxGroupSize = Number(data.maxGroupSize ?? 0);
    const meetingPoint = `${data.meetingPoint || "Kataragama Town Center"}`.trim();
    const rating = Number(data.rating ?? 0);

    return {
        packageId: normalizedPackageId,
        name: normalizedName,
        category: normalizedCategory,
        description: normalizedDescription,
        highlights: normalizeStringArray(data.highlights),
        duration: {
            days: durationDays,
            nights: durationNights
        },
        price,
        maxGroupSize,
        includes: normalizeStringArray(data.includes),
        excludes: normalizeStringArray(data.excludes),
        meetingPoint,
        availability: normalizeBoolean(data.availability, true),
        customizationEnabled: normalizeBoolean(data.customizationEnabled, true),
        images: normalizeImageArray(data.images),
        rating
    };
}

async function validatePackagePayload(payload, options = {}) {
    const errors = {};

    if (!payload.packageId) {
        errors.packageId = "Package ID is required.";
    }

    if (!payload.name) {
        errors.name = "Package name is required.";
    }

    if (!payload.category) {
        errors.category = "Package category is required.";
    } else if (!PACKAGE_CATEGORIES.includes(payload.category)) {
        errors.category = "Package category is invalid.";
    }

    if (!payload.description) {
        errors.description = "Package description is required.";
    }

    if (!Number.isFinite(payload.price) || payload.price <= 0) {
        errors.price = "Package price must be a positive number.";
    }

    if (!Number.isInteger(payload.duration.days) || payload.duration.days <= 0) {
        errors.durationDays = "Duration days must be at least 1.";
    }

    if (!Number.isInteger(payload.duration.nights) || payload.duration.nights < 0) {
        errors.durationNights = "Duration nights cannot be negative.";
    }

    if (!Number.isInteger(payload.maxGroupSize) || payload.maxGroupSize <= 0) {
        errors.maxGroupSize = "Maximum guest count must be at least 1.";
    }

    if (!payload.meetingPoint) {
        errors.meetingPoint = "Meeting point is required.";
    }

    if (!Array.isArray(payload.images) || !payload.images.length) {
        errors.images = "At least one package image is required.";
    }

    if (!Number.isFinite(payload.rating) || payload.rating < 0 || payload.rating > 5) {
        errors.rating = "Package rating must be between 0 and 5.";
    }

    const duplicateId = await Package.findOne({ packageId: payload.packageId });
    if (duplicateId && duplicateId.packageId !== options.currentPackageId) {
        errors.packageId = "This package ID already exists.";
    }

    const duplicateName = await Package.findOne({
        name: { $regex: `^${payload.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" }
    });
    if (duplicateName && duplicateName.packageId !== options.currentPackageId) {
        errors.name = "This package name already exists.";
    }

    return errors;
}

function sendValidationError(res, errors) {
    return res.status(400).json({
        message: "Please correct the highlighted package fields and try again.",
        errors
    });
}

export async function addPackage(req, res) {
    if (!req.user) {
        return res.status(401).json({ message: "Please login and try again" });
    }

    if (!isAdmin(req)) {
        return res.status(403).json({ message: "You are not authorized to perform this action" });
    }

    try {
        const payload = buildNormalizedPackagePayload(req.body);
        const errors = await validatePackagePayload(payload);

        if (Object.keys(errors).length > 0) {
            return sendValidationError(res, errors);
        }

        const newPackage = new Package(payload);
        await newPackage.save();

        return res.json({
            message: "Package added successfully",
            package: newPackage
        });
    } catch (e) {
        return res.status(500).json({ message: "Package addition failed", error: e.message });
    }
}

export async function getPackages(req, res) {
    try {
        const filters = isAdmin(req) ? {} : { availability: true };
        const packages = await Package.find(filters).sort({ createdAt: -1 });
        return res.json(packages);
    } catch (e) {
        return res.status(500).json({ message: "Failed to get packages" });
    }
}

export async function getPackageById(req, res) {
    try {
        const pkg = await Package.findOne({ packageId: req.params.packageId });
        if (!pkg) {
            return res.status(404).json({ message: "Package not found" });
        }

        return res.json(pkg);
    } catch (e) {
        return res.status(500).json({ message: "Failed to get package" });
    }
}

export async function updatePackage(req, res) {
    if (!req.user) {
        return res.status(401).json({ message: "Please login and try again" });
    }

    if (!isAdmin(req)) {
        return res.status(403).json({ message: "You are not authorized to perform this action" });
    }

    try {
        const { packageId } = req.params;
        const existingPackage = await Package.findOne({ packageId });

        if (!existingPackage) {
            return res.status(404).json({ message: "Package not found" });
        }

        const payload = buildNormalizedPackagePayload(req.body, {
            existingPackageId: packageId
        });
        const errors = await validatePackagePayload(payload, {
            currentPackageId: packageId
        });

        if (Object.keys(errors).length > 0) {
            return sendValidationError(res, errors);
        }

        const updated = await Package.findOneAndUpdate(
            { packageId },
            payload,
            { new: true }
        );

        return res.json({
            message: "Package updated successfully",
            package: updated
        });
    } catch (e) {
        return res.status(500).json({ message: "Failed to update package", error: e.message });
    }
}

export async function deletePackage(req, res) {
    if (!req.user) {
        return res.status(401).json({ message: "Please login and try again" });
    }

    if (!isAdmin(req)) {
        return res.status(403).json({ message: "You are not authorized to perform this action" });
    }

    try {
        const { packageId } = req.params;
        const bookingCount = await PackageBooking.countDocuments({ packageId });

        if (bookingCount > 0) {
            return res.status(409).json({
                message: "Cannot delete. This item is currently in use."
            });
        }

        const deleted = await Package.findOneAndDelete({ packageId });

        if (!deleted) {
            return res.status(404).json({ message: "Package not found" });
        }

        return res.json({ message: "Package deleted successfully" });
    } catch (e) {
        return res.status(500).json({ message: "Failed to delete package" });
    }
}
