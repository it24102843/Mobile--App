import express from "express";
import { addVehicle, deleteVehicle, getVehicle, getVehicles, updateVehicle } from "../controllers/VehicleController.js";

const vehicleRouter = express.Router();

vehicleRouter.post("/", addVehicle);
vehicleRouter.get("/", getVehicles);
vehicleRouter.get("/:id", getVehicle);
vehicleRouter.put("/:id", updateVehicle);
vehicleRouter.delete("/:id", deleteVehicle);

export default vehicleRouter;