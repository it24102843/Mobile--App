import express from "express";
import {
    addPackage,
    getPackages,
    getPackageById,
    updatePackage,
    deletePackage
} from "../controllers/packageController.js";

const packageRouter = express.Router();

packageRouter.post("/",                      addPackage);
packageRouter.get("/",                       getPackages);
packageRouter.get("/:packageId",             getPackageById);
packageRouter.put("/:packageId",             updatePackage);
packageRouter.delete("/:packageId",          deletePackage);

export default packageRouter;
