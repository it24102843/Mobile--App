import express from "express";
import { addHotel, getHotels, getHotel, updateHotel, deleteHotel } from "../controllers/hotelController.js";

const hotelRouter = express.Router();

hotelRouter.post("/",               addHotel);      // Admin: add hotel
hotelRouter.get("/",                getHotels);     // Get all hotels (admin: all, public: active only)
hotelRouter.get("/:hotelId",        getHotel);      // Get single hotel
hotelRouter.put("/:hotelId",        updateHotel);   // Admin: update hotel
hotelRouter.delete("/:hotelId",     deleteHotel);   // Admin: delete hotel

export default hotelRouter;
