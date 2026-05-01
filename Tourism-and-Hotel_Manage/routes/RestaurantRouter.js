import express from "express";

import {
    addRestaurant,
    getRestaurants,
    getRestaurant,
    updateRestaurant,
    deleteRestaurant
} from "../controllers/RestaurantController.js";

import {
    addMenu,
    getMenusByRestaurant,
    getMenu,
    updateMenu,
    deleteMenu
} from "../controllers/MenuController.js";

import {
    addFoodItem,
    getFoodItemsByMenu,
    getFoodItemsByRestaurant,
    getFoodItem,
    updateFoodItem,
    deleteFoodItem
} from "../controllers/FooditemController.js";

const restaurantRouter = express.Router();

// ── Restaurant Routes ──
// GET  /api/restaurants          → get all restaurants
// POST /api/restaurants          → add restaurant
// GET  /api/restaurants/:id      → get single restaurant
// PUT  /api/restaurants/:id      → update restaurant
// DELETE /api/restaurants/:id    → delete restaurant + its menus + food items

restaurantRouter.post("/", addRestaurant);
restaurantRouter.get("/", getRestaurants);
restaurantRouter.get("/:id", getRestaurant);
restaurantRouter.put("/:id", updateRestaurant);
restaurantRouter.delete("/:id", deleteRestaurant);

// ── Menu Routes ──
// GET  /api/restaurants/:restaurantId/menus      → get all menus of a restaurant
// POST /api/restaurants/:restaurantId/menus      → add menu to a restaurant
// GET  /api/restaurants/menus/:id                → get single menu
// PUT  /api/restaurants/menus/:id                → update menu
// DELETE /api/restaurants/menus/:id              → delete menu + its food items

restaurantRouter.get("/:restaurantId/menus", getMenusByRestaurant);
restaurantRouter.post("/:restaurantId/menus", addMenu);
restaurantRouter.get("/menus/:id", getMenu);
restaurantRouter.put("/menus/:id", updateMenu);
restaurantRouter.delete("/menus/:id", deleteMenu);

// ── Food Item Routes ──
// GET  /api/restaurants/:restaurantId/fooditems         → get all food items of a restaurant
// GET  /api/restaurants/menus/:menuId/fooditems         → get all food items of a menu
// POST /api/restaurants/fooditems                       → add food item
// GET  /api/restaurants/fooditems/:id                   → get single food item
// PUT  /api/restaurants/fooditems/:id                   → update food item
// DELETE /api/restaurants/fooditems/:id                 → delete food item

restaurantRouter.get("/:restaurantId/fooditems", getFoodItemsByRestaurant);
restaurantRouter.get("/menus/:menuId/fooditems", getFoodItemsByMenu);
restaurantRouter.post("/fooditems", addFoodItem);
restaurantRouter.get("/fooditems/:id", getFoodItem);
restaurantRouter.put("/fooditems/:id", updateFoodItem);
restaurantRouter.delete("/fooditems/:id", deleteFoodItem);

export default restaurantRouter;