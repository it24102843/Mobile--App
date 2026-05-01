import FoodOrder from "../models/FoodOrder.js";
import FoodItem from "../models/Fooditem.js";
import Menu from "../models/FoodMenu.js";
import Restaurant from "../models/Restaurant.js";
import mongoose from "mongoose";
import { isItAdmin } from "./userController.js";

const VALID_STATUSES = ["Pending", "Confirmed", "Preparing", "Completed", "Cancelled"];
const VALID_FULFILLMENT_METHODS = ["Pickup", "Delivery"];
const USER_CANCELLABLE_STATUSES = ["Pending"];

function normalizeString(value) {
    return `${value ?? ""}`.trim();
}

function normalizeEmail(value) {
    return normalizeString(value).toLowerCase();
}

function normalizePhone(value) {
    return normalizeString(value).replace(/\s+/g, "");
}

function isValidPhone(phone) {
    return /^\+?[0-9\-()]{7,20}$/.test(phone);
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isOwnerFilter(req) {
    const filters = [];

    if (req.user?.userId) {
        filters.push({ userId: req.user.userId });
    }

    if (req.user?.email) {
        filters.push({ customerEmail: normalizeEmail(req.user.email) });
    }

    return filters;
}

function generateFoodOrderId() {
    const time = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `FO-${time}-${random}`;
}

function getNormalizedStatus(status) {
    return normalizeString(status).toLowerCase();
}

function canUserCancelOrder(status) {
    return USER_CANCELLABLE_STATUSES.some(
        (allowedStatus) => getNormalizedStatus(allowedStatus) === getNormalizedStatus(status)
    );
}

function serializeFoodOrder(foodOrderDoc) {
    if (!foodOrderDoc) {
        return null;
    }

    const order = foodOrderDoc.toObject ? foodOrderDoc.toObject() : { ...foodOrderDoc };

    return {
        ...order,
        id: order._id ? String(order._id) : order.orderId,
        foodImage: Array.isArray(order.foodImage) ? order.foodImage : [],
    };
}

async function resolveOrderDependencies(payload) {
    const restaurant = await Restaurant.findById(payload.restaurantId);
    if (!restaurant) {
        return { error: "Restaurant not found." };
    }

    const menu = await Menu.findById(payload.menuId);
    if (!menu) {
        return { error: "Menu not found." };
    }

    if (String(menu.restaurantId) !== String(restaurant._id)) {
        return { error: "This menu does not belong to the selected restaurant." };
    }

    const foodItem = await FoodItem.findById(payload.foodItemId);
    if (!foodItem) {
        return { error: "Food item not found." };
    }

    if (
        String(foodItem.restaurantId) !== String(restaurant._id) ||
        String(foodItem.menuId) !== String(menu._id)
    ) {
        return { error: "The selected food item does not match this restaurant menu." };
    }

    if (foodItem.availability === false) {
        return { error: "This food item is currently unavailable." };
    }

    return { restaurant, menu, foodItem };
}

export async function createFoodOrder(req, res) {
    if (!req.user?.userId) {
        return res.status(401).json({ message: "Please login and try again." });
    }

    try {
        const quantity = Number(req.body?.quantity);
        const customerName = normalizeString(req.body?.customerName) || normalizeString(`${req.user?.firstName || ""} ${req.user?.lastName || ""}`);
        const customerEmail = normalizeEmail(req.body?.customerEmail || req.user?.email);
        const customerPhone = normalizePhone(req.body?.customerPhone);
        const fulfillmentMethod = normalizeString(req.body?.fulfillmentMethod) || "Pickup";
        const specialNote = normalizeString(req.body?.specialNote);
        const restaurantId = normalizeString(req.body?.restaurantId);
        const menuId = normalizeString(req.body?.menuId);
        const foodItemId = normalizeString(req.body?.foodItemId);

        if (!restaurantId || !menuId || !foodItemId) {
            return res.status(400).json({ message: "Restaurant, menu, and food item are required." });
        }

        if (!Number.isFinite(quantity) || quantity <= 0) {
            return res.status(400).json({ message: "Quantity must be a positive number." });
        }

        if (!customerName) {
            return res.status(400).json({ message: "Customer name is required." });
        }

        if (!customerEmail) {
            return res.status(400).json({ message: "Customer email is required." });
        }

        if (!isValidEmail(customerEmail)) {
            return res.status(400).json({ message: "Please enter a valid email address." });
        }

        if (!customerPhone || !isValidPhone(customerPhone)) {
            return res.status(400).json({ message: "Please enter a valid contact number." });
        }

        if (!VALID_FULFILLMENT_METHODS.includes(fulfillmentMethod)) {
            return res.status(400).json({ message: "Please choose a valid delivery method." });
        }

        const { restaurant, menu, foodItem, error } = await resolveOrderDependencies({
            restaurantId,
            menuId,
            foodItemId,
        });

        if (error) {
            return res.status(400).json({ message: error });
        }

        const price = Number(foodItem.price) || 0;
        const totalAmount = price * quantity;

        const order = new FoodOrder({
            orderId: generateFoodOrderId(),
            userId: req.user.userId,
            restaurantId: restaurant._id,
            menuId: menu._id,
            foodItemId: foodItem._id,
            restaurantName: restaurant.name,
            menuName: menu.name,
            foodName: foodItem.name,
            foodImage: Array.isArray(foodItem.image) ? foodItem.image : [],
            quantity,
            price,
            totalAmount,
            customerName,
            customerEmail,
            customerPhone,
            fulfillmentMethod,
            specialNote,
            status: "Pending",
        });

        await order.save();

        return res.status(201).json({
            message: "Food order created successfully.",
            order: serializeFoodOrder(order),
        });
    } catch (error) {
        return res.status(500).json({ message: "Failed to create the food order." });
    }
}

export async function getMyFoodOrders(req, res) {
    if (!req.user?.userId) {
        return res.status(401).json({ message: "Please login and try again." });
    }

    try {
        const ownerFilters = isOwnerFilter(req);
        const orders = await FoodOrder.find({ $or: ownerFilters }).sort({ orderDate: -1, createdAt: -1 });
        return res.json(orders.map(serializeFoodOrder));
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch your food orders." });
    }
}

export async function cancelMyFoodOrder(req, res) {
    if (!req.user?.userId) {
        return res.status(401).json({ message: "Please login and try again." });
    }

    try {
        const filters = [];
        const isObjectId = mongoose.Types.ObjectId.isValid(req.params.id);
        const ownerFilter = { $or: isOwnerFilter(req) };

        if (isObjectId) {
            filters.push({ _id: req.params.id, ...ownerFilter });
        }

        filters.push({ orderId: req.params.id, ...ownerFilter });

        const order = await FoodOrder.findOne({ $or: filters });

        if (!order) {
            return res.status(404).json({ message: "Food order not found." });
        }

        if (getNormalizedStatus(order.status) === "cancelled") {
            return res.status(400).json({ message: "This food order is already cancelled." });
        }

        if (getNormalizedStatus(order.status) === "completed") {
            return res.status(400).json({ message: "Completed food orders cannot be cancelled." });
        }

        if (!canUserCancelOrder(order.status)) {
            return res.status(400).json({
                message: "Only pending food orders can be cancelled.",
            });
        }

        order.status = "Cancelled";
        await order.save();

        return res.json({
            message: "Your food order has been cancelled successfully.",
            order: serializeFoodOrder(order),
        });
    } catch (error) {
        return res.status(500).json({ message: "Failed to cancel this food order." });
    }
}

export async function getFoodOrders(req, res) {
    if (!isItAdmin(req)) {
        return res.status(403).json({ message: "Unauthorized" });
    }

    try {
        const orders = await FoodOrder.find().sort({ orderDate: -1, createdAt: -1 });
        return res.json(orders.map(serializeFoodOrder));
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch food orders." });
    }
}

export async function getFoodOrderById(req, res) {
    if (!req.user?.userId) {
        return res.status(401).json({ message: "Please login and try again." });
    }

    try {
        const filters = [];
        const isObjectId = mongoose.Types.ObjectId.isValid(req.params.id);

        if (isItAdmin(req)) {
            if (isObjectId) {
                filters.push({ _id: req.params.id });
            }

            filters.push({ orderId: req.params.id });
        } else {
            const ownerFilter = { $or: isOwnerFilter(req) };

            if (isObjectId) {
                filters.push({ _id: req.params.id, ...ownerFilter });
            }

            filters.push({ orderId: req.params.id, ...ownerFilter });
        }

        const order = await FoodOrder.findOne({ $or: filters });

        if (!order) {
            return res.status(404).json({ message: "Food order not found." });
        }

        return res.json({ order: serializeFoodOrder(order) });
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch this food order." });
    }
}

export async function updateFoodOrder(req, res) {
    if (!isItAdmin(req)) {
        return res.status(403).json({ message: "Unauthorized" });
    }

    try {
        const order = await FoodOrder.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: "Food order not found." });
        }

        const quantity = Number(req.body?.quantity);
        const customerName = normalizeString(req.body?.customerName || order.customerName);
        const customerEmail = normalizeEmail(req.body?.customerEmail || order.customerEmail);
        const customerPhone = normalizePhone(req.body?.customerPhone || order.customerPhone);
        const fulfillmentMethod = normalizeString(req.body?.fulfillmentMethod || order.fulfillmentMethod);
        const specialNote = normalizeString(req.body?.specialNote ?? order.specialNote);
        const status = normalizeString(req.body?.status || order.status);

        if (!Number.isFinite(quantity) || quantity <= 0) {
            return res.status(400).json({ message: "Quantity must be a positive number." });
        }

        if (!customerName) {
            return res.status(400).json({ message: "Customer name is required." });
        }

        if (!customerEmail) {
            return res.status(400).json({ message: "Customer email is required." });
        }

        if (!isValidEmail(customerEmail)) {
            return res.status(400).json({ message: "Please enter a valid email address." });
        }

        if (!customerPhone || !isValidPhone(customerPhone)) {
            return res.status(400).json({ message: "Please enter a valid contact number." });
        }

        if (!VALID_FULFILLMENT_METHODS.includes(fulfillmentMethod)) {
            return res.status(400).json({ message: "Please choose a valid delivery method." });
        }

        if (!VALID_STATUSES.includes(status)) {
            return res.status(400).json({ message: "Please choose a valid order status." });
        }

        order.quantity = quantity;
        order.totalAmount = (Number(order.price) || 0) * quantity;
        order.customerName = customerName;
        order.customerEmail = customerEmail;
        order.customerPhone = customerPhone;
        order.fulfillmentMethod = fulfillmentMethod;
        order.specialNote = specialNote;
        order.status = status;

        await order.save();

        return res.json({
            message: "Food order updated successfully.",
            order: serializeFoodOrder(order),
        });
    } catch (error) {
        return res.status(500).json({ message: "Failed to update this food order." });
    }
}

export async function updateFoodOrderStatus(req, res) {
    if (!isItAdmin(req)) {
        return res.status(403).json({ message: "Unauthorized" });
    }

    try {
        const status = normalizeString(req.body?.status);

        if (!VALID_STATUSES.includes(status)) {
            return res.status(400).json({ message: "Please choose a valid order status." });
        }

        const order = await FoodOrder.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: "Food order not found." });
        }

        order.status = status;
        await order.save();

        return res.json({
            message: "Food order status updated successfully.",
            order: serializeFoodOrder(order),
        });
    } catch (error) {
        return res.status(500).json({ message: "Failed to update food order status." });
    }
}

export async function deleteFoodOrder(req, res) {
    if (!isItAdmin(req)) {
        return res.status(403).json({ message: "Unauthorized" });
    }

    try {
        const order = await FoodOrder.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: "Food order not found." });
        }

        await FoodOrder.deleteOne({ _id: order._id });
        return res.json({ message: "Food order deleted successfully." });
    } catch (error) {
        return res.status(500).json({ message: "Failed to delete this food order." });
    }
}
