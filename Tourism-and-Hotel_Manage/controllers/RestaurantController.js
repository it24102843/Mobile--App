import Restaurant from "../models/Restaurant.js";
import Menu from "../models/FoodMenu.js";
import FoodItem from "../models/Fooditem.js";
import { isItAdmin } from "./userController.js";

const FALLBACK_RESTAURANT_IMAGE =
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80";

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
    return images.length ? images : [FALLBACK_RESTAURANT_IMAGE];
}

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

function buildRestaurantPayload(data) {
    return {
        name: `${data.name || ""}`.trim(),
        address: `${data.address || ""}`.trim(),
        phone: `${data.phone || ""}`.trim(),
        description: `${data.description || ""}`.trim(),
        openingHours: `${data.openingHours || ""}`.trim(),
        isActive: normalizeBoolean(data.isActive, true),
        image: normalizeImageArray(data.image ?? data.images),
    };
}

async function validateRestaurantPayload(payload, options = {}) {
    const errors = {};

    if (!payload.name) {
        errors.name = "Restaurant name is required.";
    }

    if (!payload.address) {
        errors.address = "Address is required.";
    }

    if (!payload.description) {
        errors.description = "Description is required.";
    }

    if (payload.phone && !/^[0-9+\-\s()]{7,20}$/.test(payload.phone)) {
        errors.phone = "Phone number is invalid.";
    }

    const duplicateRestaurant = await Restaurant.findOne({
        name: {
            $regex: `^${payload.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
            $options: "i"
        }
    });

    if (duplicateRestaurant && `${duplicateRestaurant._id}` !== `${options.currentRestaurantId || ""}`) {
        errors.name = "A restaurant with this name already exists.";
    }

    return errors;
}

function sendValidationError(res, errors) {
    return res.status(400).json({
        message: "Please correct the highlighted restaurant fields and try again.",
        errors
    });
}

async function enrichRestaurant(restaurant) {
    const restaurantObject = typeof restaurant.toObject === "function" ? restaurant.toObject() : { ...restaurant };
    const [menuCount, foodItemCount] = await Promise.all([
        Menu.countDocuments({ restaurantId: restaurantObject._id }),
        FoodItem.countDocuments({ restaurantId: restaurantObject._id }),
    ]);

    return {
        ...restaurantObject,
        menuCount,
        foodItemCount
    };
}

export async function addRestaurant(req, res) {
    if (req.user == null) {
        return res.status(401).json({ message: "Please login and try again" });
    }

    if (!isItAdmin(req)) {
        return res.status(403).json({ message: "You are not authorized to perform this action" });
    }

    try {
        const payload = buildRestaurantPayload(req.body);
        const errors = await validateRestaurantPayload(payload);

        if (Object.keys(errors).length > 0) {
            return sendValidationError(res, errors);
        }

        const newRestaurant = new Restaurant(payload);
        await newRestaurant.save();

        return res.json({
            message: "Restaurant added successfully",
            restaurant: await enrichRestaurant(newRestaurant)
        });
    } catch (error) {
        console.log("Restaurant save error:", error.message);
        return res.status(500).json({ error: error.message || "Restaurant addition failed" });
    }
}

export async function getRestaurants(req, res) {
    try {
        const filter = isItAdmin(req) ? {} : { isActive: true };
        const restaurants = await Restaurant.find(filter).sort({ createdAt: -1, _id: -1 });
        const enrichedRestaurants = await Promise.all(restaurants.map(enrichRestaurant));
        return res.json(enrichedRestaurants);
    } catch (e) {
        return res.status(500).json({ message: "Failed to get restaurants" });
    }
}

export async function getRestaurant(req, res) {
    try {
        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) {
            return res.status(404).json({ message: "Restaurant not found" });
        }
        return res.json(await enrichRestaurant(restaurant));
    } catch (e) {
        return res.status(500).json({ message: "Failed to get restaurant" });
    }
}

export async function updateRestaurant(req, res) {
    try {
        if (!isItAdmin(req)) {
            return res.status(403).json({ message: "You are not authorized to perform this action" });
        }

        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) {
            return res.status(404).json({ message: "Restaurant not found" });
        }

        const payload = buildRestaurantPayload(req.body);
        const errors = await validateRestaurantPayload(payload, {
            currentRestaurantId: req.params.id
        });

        if (Object.keys(errors).length > 0) {
            return sendValidationError(res, errors);
        }

        const updatedRestaurant = await Restaurant.findByIdAndUpdate(req.params.id, payload, {
            new: true,
            runValidators: true
        });

        return res.json({
            message: "Restaurant updated successfully",
            restaurant: await enrichRestaurant(updatedRestaurant)
        });
    } catch (e) {
        return res.status(500).json({ message: "Failed to update restaurant" });
    }
}

export async function deleteRestaurant(req, res) {
    try {
        if (!isItAdmin(req)) {
            return res.status(403).json({ message: "You are not authorized to perform this action" });
        }

        const id = req.params.id;
        const restaurant = await Restaurant.findById(id);

        if (!restaurant) {
            return res.status(404).json({ message: "Restaurant not found" });
        }

        await FoodItem.deleteMany({ restaurantId: id });
        await Menu.deleteMany({ restaurantId: id });
        await Restaurant.deleteOne({ _id: id });

        return res.json({ message: "Restaurant deleted successfully" });
    } catch (e) {
        return res.status(500).json({ message: "Failed to delete restaurant" });
    }
}
