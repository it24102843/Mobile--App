import express from "express";
import {
    addVehicle,
    getVehicles,
    getVehicleById,
    updateVehicle,
    deleteVehicle,
    assignVehicleToPackages,
} from "../controllers/PackageVehicleController.js";

const packageVehicleRouter = express.Router();

packageVehicleRouter.post("/",                                addVehicle);
packageVehicleRouter.get("/",                                 getVehicles);          // ?packageId=PKG-xxx for filtered
packageVehicleRouter.get("/:vehicleId",                       getVehicleById);
packageVehicleRouter.put("/:vehicleId",                       updateVehicle);
packageVehicleRouter.put("/:vehicleId/assign-packages",       assignVehicleToPackages);
packageVehicleRouter.delete("/:vehicleId",                    deleteVehicle);

export default packageVehicleRouter;
