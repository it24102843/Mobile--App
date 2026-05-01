import Addon from "../models/Addon.js";

const isAdmin = (req) => req.user?.role === "admin";

// ── CREATE ──────────────────────────────────────────────────────
export async function addAddon(req, res) {
  if (!isAdmin(req)) return res.status(403).json({ message: "Admin only" });
  try {
    const addonId = `ADDON-${Date.now().toString().slice(-6)}${Math.random()
      .toString(36)
      .slice(2, 5)
      .toUpperCase()}`;
    const addon = new Addon({ ...req.body, addonId });
    await addon.save();
    res.status(201).json({ message: "Addon created successfully", addon });
  } catch (e) {
    res.status(500).json({ message: "Failed to create addon", error: e.message });
  }
}

// ── GET ALL ─────────────────────────────────────────────────────
export async function getAddons(req, res) {
  try {
    const addons = await Addon.find({}).sort({ createdAt: -1 });
    res.json(addons);
  } catch (e) {
    res.status(500).json({ message: "Failed to fetch addons" });
  }
}

// ── GET ONE ─────────────────────────────────────────────────────
export async function getAddonById(req, res) {
  try {
    const addon = await Addon.findOne({ addonId: req.params.addonId });
    if (!addon) return res.status(404).json({ message: "Addon not found" });
    res.json(addon);
  } catch (e) {
    res.status(500).json({ message: "Failed to fetch addon" });
  }
}

// ── UPDATE ──────────────────────────────────────────────────────
export async function updateAddon(req, res) {
  if (!isAdmin(req)) return res.status(403).json({ message: "Admin only" });
  try {
    const addon = await Addon.findOneAndUpdate(
      { addonId: req.params.addonId },
      req.body,
      { new: true }
    );
    if (!addon) return res.status(404).json({ message: "Addon not found" });
    res.json({ message: "Addon updated", addon });
  } catch (e) {
    res.status(500).json({ message: "Failed to update addon", error: e.message });
  }
}

// ── DELETE ──────────────────────────────────────────────────────
export async function deleteAddon(req, res) {
  if (!isAdmin(req)) return res.status(403).json({ message: "Admin only" });
  try {
    const addon = await Addon.findOneAndDelete({ addonId: req.params.addonId });
    if (!addon) return res.status(404).json({ message: "Addon not found" });
    res.json({ message: "Addon deleted" });
  } catch (e) {
    res.status(500).json({ message: "Failed to delete addon", error: e.message });
  }
}
