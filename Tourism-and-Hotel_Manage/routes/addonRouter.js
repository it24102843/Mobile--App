import express from "express";
import {
  addAddon,
  getAddons,
  getAddonById,
  updateAddon,
  deleteAddon,
} from "../controllers/addonController.js";

const addonRouter = express.Router();

addonRouter.post("/",             addAddon);       // admin only
addonRouter.get("/",              getAddons);      // public (available only) / admin (all)
addonRouter.get("/:addonId",      getAddonById);   // public
addonRouter.put("/:addonId",      updateAddon);    // admin only
addonRouter.delete("/:addonId",   deleteAddon);    // admin only

export default addonRouter;
