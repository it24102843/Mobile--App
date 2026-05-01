import Hotel from "../models/Hotel.js";
import Room from "../models/Room.js";
import RoomBooking from "../models/Roombooking.js";
import { isItAdmin } from "./userController.js";

const DEFAULT_IMAGE =
    "https://www.shutterstock.com/image-vector/missing-picture-page-website-design-600nw-1552421075.jpg";

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone) {
    const digits = phone.replace(/[\s\-()+]/g, "");
    return /^\d{10}$/.test(digits);
}

function normalizeText(value) {
    return `${value ?? ""}`.trim();
}

function normalizeName(value) {
    return normalizeText(value).toLowerCase();
}

function normalizeBoolean(value, fallback = true) {
    if (typeof value === "boolean") return value;
    if (value === "true") return true;
    if (value === "false") return false;
    return fallback;
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

function parseStarRating(value) {
    const starRating = Number(value);

    if (!Number.isFinite(starRating) || starRating < 1 || starRating > 5) {
        return null;
    }

    return starRating;
}

export async function addHotel(req, res) {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Only admins can add hotels" });
    }

    const hotelId = normalizeText(req.body.hotelId);
    const name = normalizeText(req.body.name);
    const location = normalizeText(req.body.location);
    const description = normalizeText(req.body.description);
    const contactEmail = normalizeText(req.body.contactEmail);
    const contactPhone = normalizeText(req.body.contactPhone);
    const starRating = parseStarRating(req.body.starRating);

    if (!hotelId) {
        return res.status(400).json({ message: "Hotel ID is required" });
    }
    if (!name) {
        return res.status(400).json({ message: "Hotel name is required" });
    }
    if (!location) {
        return res.status(400).json({ message: "Location is required" });
    }
    if (!description) {
        return res.status(400).json({ message: "Description is required" });
    }
    if (starRating == null) {
        return res.status(400).json({ message: "Star rating must be between 1 and 5" });
    }
    if (contactEmail && !validateEmail(contactEmail)) {
        return res.status(400).json({
            message: "Invalid email address. Must include @ and a valid domain (e.g. info@hotel.com)"
        });
    }
    if (contactPhone && !validatePhone(contactPhone)) {
        return res.status(400).json({ message: "Phone number must be exactly 10 digits" });
    }

    try {
        const duplicateHotelId = await Hotel.findOne({ hotelId });
        if (duplicateHotelId) {
            return res.status(409).json({ message: "A hotel with this ID already exists" });
        }

        const existingHotels = await Hotel.find().select("name");
        const duplicateHotelName = existingHotels.find(
            (hotel) => normalizeName(hotel.name) === normalizeName(name)
        );
        if (duplicateHotelName) {
            return res.status(409).json({ message: "A hotel with this name already exists" });
        }

        const hotel = new Hotel({
            ...req.body,
            hotelId,
            name,
            location,
            description,
            contactEmail,
            contactPhone,
            starRating,
            images: normalizeImageList(req.body.images),
            isActive: normalizeBoolean(req.body.isActive, true)
        });

        await hotel.save();
        res.json({ message: "Hotel added successfully", hotel });
    } catch (e) {
        res.status(500).json({ error: "Failed to add hotel", detail: e.message });
    }
}

export async function getHotels(req, res) {
    try {
        let hotels;
        if (isItAdmin(req)) {
            hotels = await Hotel.find().sort({ name: 1 });
        } else {
            hotels = await Hotel.find({ isActive: true }).sort({ name: 1 });
        }
        res.json(hotels);
    } catch (e) {
        res.status(500).json({ message: "Failed to get hotels" });
    }
}

export async function getHotel(req, res) {
    try {
        const hotel = await Hotel.findOne({ hotelId: req.params.hotelId });
        if (!hotel) return res.status(404).json({ message: "Hotel not found" });
        res.json(hotel);
    } catch (e) {
        res.status(500).json({ message: "Failed to get hotel" });
    }
}

export async function updateHotel(req, res) {
    if (!isItAdmin(req)) {
        return res.status(403).json({ message: "Only admins can update hotels" });
    }

    const normalizedName =
        req.body.name !== undefined ? normalizeText(req.body.name) : undefined;
    const normalizedLocation =
        req.body.location !== undefined ? normalizeText(req.body.location) : undefined;
    const normalizedDescription =
        req.body.description !== undefined ? normalizeText(req.body.description) : undefined;
    const normalizedEmail =
        req.body.contactEmail !== undefined ? normalizeText(req.body.contactEmail) : undefined;
    const normalizedPhone =
        req.body.contactPhone !== undefined ? normalizeText(req.body.contactPhone) : undefined;
    const parsedStarRating =
        req.body.starRating !== undefined ? parseStarRating(req.body.starRating) : undefined;

    if (req.body.name !== undefined && !normalizedName) {
        return res.status(400).json({ message: "Hotel name cannot be empty" });
    }
    if (req.body.location !== undefined && !normalizedLocation) {
        return res.status(400).json({ message: "Location cannot be empty" });
    }
    if (req.body.description !== undefined && !normalizedDescription) {
        return res.status(400).json({ message: "Description cannot be empty" });
    }
    if (req.body.starRating !== undefined && parsedStarRating == null) {
        return res.status(400).json({ message: "Star rating must be between 1 and 5" });
    }
    if (normalizedEmail && !validateEmail(normalizedEmail)) {
        return res.status(400).json({
            message: "Invalid email address. Must include @ and a valid domain (e.g. info@hotel.com)"
        });
    }
    if (normalizedPhone && !validatePhone(normalizedPhone)) {
        return res.status(400).json({ message: "Phone number must be exactly 10 digits" });
    }

    try {
        const existingHotel = await Hotel.findOne({ hotelId: req.params.hotelId });
        if (!existingHotel) {
            return res.status(404).json({ message: "Hotel not found" });
        }

        if (
            normalizedName &&
            normalizeName(normalizedName) !== normalizeName(existingHotel.name)
        ) {
            const otherHotels = await Hotel.find({ hotelId: { $ne: req.params.hotelId } }).select("name");
            const duplicateHotelName = otherHotels.find(
                (hotel) => normalizeName(hotel.name) === normalizeName(normalizedName)
            );
            if (duplicateHotelName) {
                return res.status(409).json({ message: "A hotel with this name already exists" });
            }

            const linkedRoom = await Room.findOne({ hotelName: existingHotel.name });
            if (linkedRoom) {
                return res.status(400).json({
                    message: "This hotel name cannot be changed because rooms are already linked to it."
                });
            }
        }

        const updatePayload = {
            ...req.body
        };

        if (normalizedName !== undefined) updatePayload.name = normalizedName;
        if (normalizedLocation !== undefined) updatePayload.location = normalizedLocation;
        if (normalizedDescription !== undefined) updatePayload.description = normalizedDescription;
        if (normalizedEmail !== undefined) updatePayload.contactEmail = normalizedEmail;
        if (normalizedPhone !== undefined) updatePayload.contactPhone = normalizedPhone;
        if (parsedStarRating !== undefined) updatePayload.starRating = parsedStarRating;
        if (req.body.images !== undefined) updatePayload.images = normalizeImageList(req.body.images);
        if (req.body.isActive !== undefined) {
            updatePayload.isActive = normalizeBoolean(req.body.isActive, existingHotel.isActive);
        }

        await Hotel.updateOne({ hotelId: req.params.hotelId }, updatePayload);
        res.json({ message: "Hotel updated successfully" });
    } catch (e) {
        res.status(500).json({ message: "Failed to update hotel" });
    }
}

export async function deleteHotel(req, res) {
    if (!isItAdmin(req)) {
        return res.status(403).json({ message: "Only admins can delete hotels" });
    }
    try {
        const hotel = await Hotel.findOne({ hotelId: req.params.hotelId });
        if (!hotel) return res.status(404).json({ message: "Hotel not found" });

        const hotelRooms = await Room.find({ hotelName: hotel.name });
        const roomKeys = hotelRooms.map((room) => room.key);

        if (roomKeys.length > 0) {
            const bookingHistory = await RoomBooking.findOne({
                roomKey: { $in: roomKeys }
            });
            if (bookingHistory) {
                return res.status(409).json({
                    message: "This hotel cannot be deleted because one or more rooms have booking history. You can mark it as inactive instead."
                });
            }
        }

        await Hotel.deleteOne({ hotelId: req.params.hotelId });
        res.json({ message: "Hotel deleted successfully" });
    } catch (e) {
        res.status(500).json({ message: "Failed to delete hotel" });
    }
}
