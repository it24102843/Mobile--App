import FoodItem from "../models/Fooditem.js";
import Menu from "../models/FoodMenu.js";
import Restaurant from "../models/Restaurant.js";
import { isItAdmin } from "./userController.js";

const FALLBACK_FOOD_IMAGE =
    "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80";

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
    return images.length ? images : [FALLBACK_FOOD_IMAGE];
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

function buildFoodItemPayload(data, defaults = {}) {
    const preparationTime = data.preparationTime === "" || data.preparationTime == null
        ? null
        : Number(data.preparationTime);

    return {
        restaurantId: data.restaurantId || defaults.restaurantId,
        menuId: data.menuId || defaults.menuId,
        name: `${data.name || ""}`.trim(),
        category: `${data.category || "Main Course"}`.trim(),
        price: Number(data.price ?? 0),
        description: `${data.description || ""}`.trim(),
        preparationTime,
        availability: normalizeBoolean(data.availability, true),
        image: normalizeImageArray(data.image ?? data.images),
    };
}

async function validateFoodItemPayload(payload, options = {}) {
    const errors = {};

    if (!payload.restaurantId) {
        errors.restaurantId = "Restaurant is required.";
    } else {
        const restaurant = await Restaurant.findById(payload.restaurantId);
        if (!restaurant) {
            errors.restaurantId = "Selected restaurant does not exist.";
        }
    }

    if (!payload.menuId) {
        errors.menuId = "Menu is required.";
    } else {
        const menu = await Menu.findById(payload.menuId);
        if (!menu) {
            errors.menuId = "Selected menu does not exist.";
        }
    }

    if (!payload.name) {
        errors.name = "Food item name is required.";
    }

    if (!payload.category) {
        errors.category = "Food category is required.";
    }

    if (!Number.isFinite(payload.price) || payload.price <= 0) {
        errors.price = "Price must be a positive number.";
    }

    if (!payload.description) {
        errors.description = "Description is required.";
    }

    if (payload.preparationTime !== null && (!Number.isFinite(payload.preparationTime) || payload.preparationTime < 0)) {
        errors.preparationTime = "Preparation time must be zero or a positive number.";
    }

    const duplicateFoodItem = await FoodItem.findOne({
        menuId: payload.menuId,
        name: {
            $regex: `^${payload.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
            $options: "i"
        }
    });

    if (duplicateFoodItem && `${duplicateFoodItem._id}` !== `${options.currentFoodItemId || ""}`) {
        errors.name = "A food item with this name already exists in this menu.";
    }

    return errors;
}

function sendValidationError(res, errors) {
    return res.status(400).json({
        message: "Please correct the highlighted food item fields and try again.",
        errors
    });
}

export async function addFoodItem(req, res) {
    if (req.user == null) {
        return res.status(401).json({ message: "Please login and try again" });
    }
    if (!isItAdmin(req)) {
        return res.status(403).json({ message: "You are not authorized to perform this action" });
    }

    try {
        const payload = buildFoodItemPayload(req.body);
        const errors = await validateFoodItemPayload(payload);

        if (Object.keys(errors).length > 0) {
            return sendValidationError(res, errors);
        }

        const newFoodItem = new FoodItem(payload);
        await newFoodItem.save();

        return res.json({
            message: "Food item added successfully",
            foodItem: newFoodItem
        });
    } catch (error) {
        console.log("Food item save error:", error.message);
        return res.status(500).json({ error: error.message || "Food item addition failed" });
    }
}

export async function getFoodItemsByMenu(req, res) {
    try {
        const menuId = req.params.menuId;
        const filters = isItAdmin(req)
            ? { menuId }
            : { menuId, availability: true };
        const foodItems = await FoodItem.find(filters).sort({ createdAt: -1, _id: -1 });
        return res.json(foodItems);
    } catch (e) {
        return res.status(500).json({ message: "Failed to get food items" });
    }
}

export async function getFoodItemsByRestaurant(req, res) {
    try {
        const restaurantId = req.params.restaurantId;
        const filters = isItAdmin(req)
            ? { restaurantId }
            : { restaurantId, availability: true };
        const foodItems = await FoodItem.find(filters)
            .sort({ createdAt: -1, _id: -1 })
            .populate("menuId", "name");
        return res.json(foodItems);
    } catch (e) {
        return res.status(500).json({ message: "Failed to get food items" });
    }
}

export async function getFoodItem(req, res) {
    try {
        const foodItem = await FoodItem.findById(req.params.id);
        if (!foodItem) {
            return res.status(404).json({ message: "Food item not found" });
        }
        return res.json(foodItem);
    } catch (e) {
        return res.status(500).json({ message: "Failed to get food item" });
    }
}

export async function updateFoodItem(req, res) {
    try {
        if (!isItAdmin(req)) {
            return res.status(403).json({ message: "You are not authorized to perform this action" });
        }

        const existingFoodItem = await FoodItem.findById(req.params.id);
        if (!existingFoodItem) {
            return res.status(404).json({ message: "Food item not found" });
        }

        const payload = buildFoodItemPayload(req.body, {
            restaurantId: existingFoodItem.restaurantId,
            menuId: existingFoodItem.menuId
        });
        const errors = await validateFoodItemPayload(payload, {
            currentFoodItemId: req.params.id
        });

        if (Object.keys(errors).length > 0) {
            return sendValidationError(res, errors);
        }

        const updatedFoodItem = await FoodItem.findByIdAndUpdate(req.params.id, payload, {
            new: true,
            runValidators: true
        });

        return res.json({
            message: "Food item updated successfully",
            foodItem: updatedFoodItem
        });
    } catch (e) {
        return res.status(500).json({ message: "Failed to update food item" });
    }
}

export async function deleteFoodItem(req, res) {
    try {
        if (!isItAdmin(req)) {
            return res.status(403).json({ message: "You are not authorized to perform this action" });
        }

        const deletedFoodItem = await FoodItem.findByIdAndDelete(req.params.id);
        if (!deletedFoodItem) {
            return res.status(404).json({ message: "Food item not found" });
        }

        return res.json({ message: "Food item deleted successfully" });
    } catch (e) {
        return res.status(500).json({ message: "Failed to delete food item" });
    }
}
