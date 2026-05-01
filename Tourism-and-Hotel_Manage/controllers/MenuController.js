import Menu from "../models/FoodMenu.js";
import FoodItem from "../models/Fooditem.js";
import Restaurant from "../models/Restaurant.js";
import { isItAdmin } from "./userController.js";

const FALLBACK_MENU_IMAGE =
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
    return images.length ? images : [FALLBACK_MENU_IMAGE];
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

function buildMenuPayload(data, restaurantId) {
    return {
        restaurantId,
        name: `${data.name || ""}`.trim(),
        description: `${data.description || ""}`.trim(),
        image: normalizeImageArray(data.image ?? data.images),
        isActive: normalizeBoolean(data.isActive, true),
    };
}

async function validateMenuPayload(payload, options = {}) {
    const errors = {};

    if (!payload.restaurantId) {
        errors.restaurantId = "Restaurant is required.";
    } else {
        const restaurant = await Restaurant.findById(payload.restaurantId);
        if (!restaurant) {
            errors.restaurantId = "Selected restaurant does not exist.";
        }
    }

    if (!payload.name) {
        errors.name = "Menu name is required.";
    }

    const duplicateMenu = await Menu.findOne({
        restaurantId: payload.restaurantId,
        name: {
            $regex: `^${payload.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
            $options: "i"
        }
    });

    if (duplicateMenu && `${duplicateMenu._id}` !== `${options.currentMenuId || ""}`) {
        errors.name = "A menu with this name already exists for this restaurant.";
    }

    return errors;
}

function sendValidationError(res, errors) {
    return res.status(400).json({
        message: "Please correct the highlighted menu fields and try again.",
        errors
    });
}

async function attachMenuImage(menu) {
    const menuObject = typeof menu.toObject === "function" ? menu.toObject() : { ...menu };

    if (Array.isArray(menuObject.image) && menuObject.image.length > 0) {
        return {
            ...menuObject,
            coverImage: menuObject.image[0]
        };
    }

    const firstFoodItem = await FoodItem.findOne({ menuId: menuObject._id })
        .sort({ createdAt: 1 })
        .lean();

    const fallbackImage = Array.isArray(firstFoodItem?.image) && firstFoodItem.image.length > 0
        ? firstFoodItem.image[0]
        : FALLBACK_MENU_IMAGE;

    return {
        ...menuObject,
        coverImage: fallbackImage
    };
}

async function enrichMenu(menu) {
    const menuWithImage = await attachMenuImage(menu);
    const foodItemCount = await FoodItem.countDocuments({ menuId: menuWithImage._id });
    return {
        ...menuWithImage,
        foodItemCount
    };
}

export async function addMenu(req, res) {
    if (req.user == null) {
        return res.status(401).json({ message: "Please login and try again" });
    }
    if (!isItAdmin(req)) {
        return res.status(403).json({ message: "You are not authorized to perform this action" });
    }

    try {
        const payload = buildMenuPayload(req.body, req.params.restaurantId || req.body.restaurantId);
        const errors = await validateMenuPayload(payload);

        if (Object.keys(errors).length > 0) {
            return sendValidationError(res, errors);
        }

        const newMenu = new Menu(payload);
        await newMenu.save();

        return res.json({
            message: "Menu added successfully",
            menu: await enrichMenu(newMenu)
        });
    } catch (error) {
        console.log("Menu save error:", error.message);
        return res.status(500).json({ error: error.message || "Menu addition failed" });
    }
}

export async function getMenusByRestaurant(req, res) {
    try {
        const restaurantId = req.params.restaurantId;
        const filters = isItAdmin(req)
            ? { restaurantId }
            : { restaurantId, isActive: true };
        const menus = await Menu.find(filters).sort({ createdAt: -1, _id: -1 });
        const menusWithImages = await Promise.all(menus.map(enrichMenu));
        return res.json(menusWithImages);
    } catch (e) {
        return res.status(500).json({ message: "Failed to get menus" });
    }
}

export async function getMenu(req, res) {
    try {
        const menu = await Menu.findById(req.params.id);
        if (!menu) {
            return res.status(404).json({ message: "Menu not found" });
        }
        return res.json(await enrichMenu(menu));
    } catch (e) {
        return res.status(500).json({ message: "Failed to get menu" });
    }
}

export async function updateMenu(req, res) {
    try {
        if (!isItAdmin(req)) {
            return res.status(403).json({ message: "You are not authorized to perform this action" });
        }

        const existingMenu = await Menu.findById(req.params.id);
        if (!existingMenu) {
            return res.status(404).json({ message: "Menu not found" });
        }

        const payload = buildMenuPayload(req.body, existingMenu.restaurantId);
        const errors = await validateMenuPayload(payload, { currentMenuId: req.params.id });

        if (Object.keys(errors).length > 0) {
            return sendValidationError(res, errors);
        }

        const updatedMenu = await Menu.findByIdAndUpdate(req.params.id, payload, {
            new: true,
            runValidators: true
        });

        return res.json({
            message: "Menu updated successfully",
            menu: await enrichMenu(updatedMenu)
        });
    } catch (e) {
        return res.status(500).json({ message: "Failed to update menu" });
    }
}

export async function deleteMenu(req, res) {
    try {
        if (!isItAdmin(req)) {
            return res.status(403).json({ message: "You are not authorized to perform this action" });
        }

        const id = req.params.id;
        const menu = await Menu.findById(id);

        if (!menu) {
            return res.status(404).json({ message: "Menu not found" });
        }

        await FoodItem.deleteMany({ menuId: id });
        await Menu.deleteOne({ _id: id });

        return res.json({ message: "Menu deleted successfully" });
    } catch (e) {
        return res.status(500).json({ message: "Failed to delete menu" });
    }
}
