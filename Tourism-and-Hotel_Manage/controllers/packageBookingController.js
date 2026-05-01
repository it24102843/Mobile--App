import PackageBooking from "../models/PackageBooking.js";
import PackageBookingNotification from "../models/PackageBookingNotification.js";
import Package from "../models/package.js";
import PackageVehicle from "../models/PackageVehicle.js";
import Addon from "../models/Addon.js";

const STATUS_OPTIONS = ["Pending", "Confirmed", "Cancelled", "Completed"];
const BREAKFAST_PRICE = 550;
const LUNCH_PRICE = 650;

const isAdmin = (req) => req.user?.role === "admin";
const isLoggedIn = (req) => req.user != null;

function normalizeMatchValues(values) {
    return values
        .map((value) => `${value || ""}`.trim().toLowerCase())
        .filter(Boolean);
}

function vehicleMatchesPackage(vehicle, pkg) {
    const assignedPackages = Array.isArray(vehicle?.assignedPackages)
        ? vehicle.assignedPackages.map((item) => `${item || ""}`.trim().toLowerCase()).filter(Boolean)
        : [];

    if (!assignedPackages.length) {
        return true;
    }

    const matchValues = normalizeMatchValues([
        pkg?.packageId,
        pkg?.name,
    ]);

    return assignedPackages.some((item) => matchValues.includes(item));
}

async function createPackageBookingNotification(booking, type, note = "") {
    if (!booking?.bookingId) {
        return;
    }

    try {
        await PackageBookingNotification.create({
            bookingId: booking.bookingId,
            userId: booking.userId || null,
            userName: booking.userName || "Guest",
            userEmail: booking.userEmail || "",
            packageId: booking.packageId || "",
            packageName: booking.packageName || "Package Booking",
            tourDate: booking.tourDate || null,
            guests: Number(booking.guests || 0),
            totalAmount: Number(booking.totalPrice || 0),
            paymentMethod: booking.paymentMethod || "checkout",
            status: booking.status || "Pending",
            type,
            note,
            isRead: false,
        });
    } catch (error) {
        console.error("Failed to create package booking notification:", error.message);
    }
}

export async function createPackageBooking(req, res) {
    if (!isLoggedIn(req)) {
        return res.status(401).json({ message: "Please login to book a package" });
    }

    try {
        const packageId = `${req.body.packageId || ""}`.trim();
        const tourDate = new Date(req.body.tourDate);
        const guests = Number(req.body.guests);
        const userPhone = `${req.body.userPhone || ""}`.trim();
        const paymentMethod = `${req.body.paymentMethod || "online"}`.trim();
        const requestedVehicleId = `${req.body?.selectedVehicle?.vehicleId || ""}`.trim();
        const requestedMealPackage = req.body?.mealPackage || {};
        const requestedAddOnIds = Array.isArray(req.body.addOns)
            ? req.body.addOns
                .map((item) => {
                    if (typeof item === "string") {
                        return item.trim();
                    }

                    return `${item?.addonId || item?.id || ""}`.trim();
                })
                .filter(Boolean)
            : [];

        if (!packageId) {
            return res.status(400).json({ message: "Package is required." });
        }

        const pkg = await Package.findOne({ packageId });
        if (!pkg) {
            return res.status(404).json({ message: "Selected package was not found." });
        }

        if (pkg.availability === false) {
            return res.status(400).json({ message: "This package is currently unavailable for booking." });
        }

        if (Number.isNaN(tourDate.getTime())) {
            return res.status(400).json({ message: "Tour date is required." });
        }

        const today = new Date();
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        if (tourDate < startOfToday) {
            return res.status(400).json({ message: "Tour date cannot be in the past." });
        }

        if (!Number.isInteger(guests) || guests < 1) {
            return res.status(400).json({ message: "Guest count must be at least 1." });
        }

        if (pkg.maxGroupSize && guests > pkg.maxGroupSize) {
            return res.status(400).json({ message: `This package allows up to ${pkg.maxGroupSize} guests only.` });
        }

        if (!userPhone) {
            return res.status(400).json({ message: "Contact number is required." });
        }

        if (!/^[0-9+\-\s()]{7,20}$/.test(userPhone)) {
            return res.status(400).json({ message: "Please enter a valid contact number." });
        }

        if (!["online", "bank_deposit"].includes(paymentMethod)) {
            return res.status(400).json({ message: "Package bookings require online payment or bank transfer." });
        }

        let selectedVehicle = null;
        let vehicleTotal = 0;
        let mealPackage = {
            breakfast: false,
            lunch: false,
            price: 0,
        };
        let addOns = [];
        let addOnTotal = 0;

        if (requestedVehicleId) {
            const vehicle = await PackageVehicle.findOne({ vehicleId: requestedVehicleId });

            if (!vehicle) {
                return res.status(404).json({ message: "Selected package vehicle was not found." });
            }

            if (vehicle.availability === false || vehicle.status !== "Available") {
                return res.status(400).json({ message: "Selected package vehicle is currently unavailable." });
            }

            if (!vehicleMatchesPackage(vehicle, pkg)) {
                return res.status(400).json({ message: "Selected vehicle is not assigned to this package." });
            }

            const durationDays = Math.max(Number(pkg?.duration?.days || 1), 1);
            vehicleTotal = Number(vehicle.pricePerDay || 0) * durationDays;
            selectedVehicle = {
                vehicleId: vehicle.vehicleId,
                vehicleName: vehicle.name,
                vehicleType: vehicle.type,
                vehiclePricePerDay: Number(vehicle.pricePerDay || 0),
            };
        }

        const breakfastSelected = Boolean(requestedMealPackage?.breakfast);
        const lunchSelected = Boolean(requestedMealPackage?.lunch);
        const expectedMealPrice =
            (breakfastSelected ? BREAKFAST_PRICE : 0) +
            (lunchSelected ? LUNCH_PRICE : 0);
        const submittedMealPrice = Number(requestedMealPackage?.price || 0);

        if (
            Object.prototype.hasOwnProperty.call(requestedMealPackage, "breakfast") ||
            Object.prototype.hasOwnProperty.call(requestedMealPackage, "lunch") ||
            Object.prototype.hasOwnProperty.call(requestedMealPackage, "price")
        ) {
            if (!Number.isFinite(submittedMealPrice) || submittedMealPrice < 0) {
                return res.status(400).json({ message: "Meal package price is invalid." });
            }

            if (submittedMealPrice !== expectedMealPrice) {
                mealPackage = {
                    breakfast: breakfastSelected,
                    lunch: lunchSelected,
                    price: expectedMealPrice,
                };
            } else {
                mealPackage = {
                    breakfast: breakfastSelected,
                    lunch: lunchSelected,
                    price: submittedMealPrice,
                };
            }
        }

        if (requestedAddOnIds.length) {
            const uniqueAddOnIds = [...new Set(requestedAddOnIds)];
            const addOnDocs = await Addon.find({ addonId: { $in: uniqueAddOnIds } });

            if (addOnDocs.length !== uniqueAddOnIds.length) {
                return res.status(404).json({ message: "One or more selected add-ons were not found." });
            }

            const addOnMap = new Map(addOnDocs.map((item) => [item.addonId, item]));
            addOns = uniqueAddOnIds.map((addonId) => {
                const item = addOnMap.get(addonId);

                return {
                    addonId: item.addonId,
                    name: item.name,
                    category: item.category,
                    description: item.description || "",
                    price: Number(item.price || 0),
                };
            });
            addOnTotal = addOns.reduce((sum, item) => sum + Number(item.price || 0), 0);
        }

        addOnTotal += Number(mealPackage.price || 0);

        const bookingId = `PB-${Date.now().toString().slice(-6)}${Math.random()
            .toString(36)
            .slice(2, 5)
            .toUpperCase()}`;

        const booking = new PackageBooking({
            ...req.body,
            bookingId,
            userId: req.user.userId,
            packageId: pkg.packageId,
            packageName: pkg.name,
            packageImage: Array.isArray(pkg.images) ? (pkg.images[0] || "") : "",
            userEmail: req.user.email,
            userName: `${req.user.firstName} ${req.user.lastName}`,
            userPhone,
            guests,
            tourDate,
            selectedVehicle,
            mealPackage,
            addOns,
            addOnTotal,
            vehicleTotal,
            basePricePerPerson: Number(pkg.price || 0),
            totalPrice: Number(req.body.totalPrice || 0),
            paymentMethod,
            paymentStatus: req.body.paymentStatus || "pending",
            refundStatus: req.body.refundStatus || "not_applicable",
        });

        const expectedTotal = (Number(pkg.price || 0) * guests) + vehicleTotal + addOnTotal;
        if (!Number.isFinite(booking.totalPrice) || booking.totalPrice <= 0) {
            return res.status(400).json({ message: "Total amount is invalid." });
        }

        if (booking.totalPrice !== expectedTotal) {
            booking.totalPrice = expectedTotal;
        }

        await booking.save();
        await createPackageBookingNotification(
            booking,
            "created",
            `A new package booking was created for ${booking.packageName}.`
        );

        return res.json({ message: "Booking created successfully", booking });
    } catch (e) {
        return res.status(500).json({ message: "Failed to create booking", error: e.message });
    }
}

export async function getPackageBookings(req, res) {
    if (!isLoggedIn(req)) {
        return res.status(401).json({ message: "Please login" });
    }

    try {
        const filter = isAdmin(req) ? {} : { userId: req.user.userId };
        const bookings = await PackageBooking.find(filter).sort({ createdAt: -1 });
        return res.json(bookings);
    } catch (e) {
        return res.status(500).json({ message: "Failed to fetch bookings", error: e.message });
    }
}

export async function getMyBookings(req, res) {
    if (!isLoggedIn(req)) {
        return res.status(401).json({ message: "Please login" });
    }

    try {
        const bookings = await PackageBooking.find({ userId: req.user.userId }).sort({ createdAt: -1 });
        return res.json(bookings);
    } catch (e) {
        return res.status(500).json({ message: "Failed to fetch bookings", error: e.message });
    }
}

export async function getPackageBookingById(req, res) {
    if (!isLoggedIn(req)) {
        return res.status(401).json({ message: "Please login" });
    }

    try {
        const booking = await PackageBooking.findOne({ bookingId: req.params.bookingId });
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (!isAdmin(req) && booking.userEmail !== req.user.email) {
            return res.status(403).json({ message: "Access denied" });
        }

        return res.json(booking);
    } catch (e) {
        return res.status(500).json({ message: "Failed to fetch booking", error: e.message });
    }
}

export async function updatePackageBookingStatus(req, res) {
    if (!isAdmin(req)) {
        return res.status(403).json({ message: "Admin only" });
    }

    try {
        const nextStatus = `${req.body.status || ""}`.trim();

        if (!STATUS_OPTIONS.includes(nextStatus)) {
            return res.status(400).json({ message: "Invalid booking status" });
        }

        const booking = await PackageBooking.findOne({ bookingId: req.params.bookingId });
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (booking.status === nextStatus) {
            return res.json({ message: `Booking is already marked as ${nextStatus}`, booking });
        }

        if (booking.status === "Completed" && nextStatus !== "Completed") {
            return res.status(400).json({ message: "Completed bookings cannot be changed" });
        }

        booking.status = nextStatus;
        await booking.save();

        if (nextStatus === "Confirmed" || nextStatus === "Cancelled") {
            await createPackageBookingNotification(
                booking,
                "updated",
                `Booking ${booking.bookingId} was marked as ${nextStatus}.`
            );
        }

        return res.json({ message: "Status updated", booking });
    } catch (e) {
        return res.status(500).json({ message: "Failed to update", error: e.message });
    }
}

export async function deletePackageBooking(req, res) {
    if (!isLoggedIn(req)) {
        return res.status(401).json({ message: "Please login" });
    }

    try {
        const booking = await PackageBooking.findOne({ bookingId: req.params.bookingId });
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (!isAdmin(req) && booking.userEmail !== req.user.email) {
            return res.status(403).json({ message: "Access denied" });
        }

        if (booking.status === "Cancelled") {
            return res.status(400).json({ message: "This booking is already cancelled" });
        }

        if (booking.status === "Confirmed") {
            return res.status(400).json({ message: "Confirmed bookings cannot be cancelled by the user" });
        }

        if (booking.status === "Completed") {
            return res.status(400).json({ message: "Completed bookings cannot be cancelled" });
        }

        const createdAtTime = new Date(booking.createdAt).getTime();
        const now = Date.now();
        const diffHours = (now - createdAtTime) / (1000 * 60 * 60);

        if (!Number.isFinite(createdAtTime) || diffHours > 24) {
            return res.status(403).json({
                message: "Package bookings can only be cancelled within 24 hours of booking.",
            });
        }

        booking.status = "Cancelled";
        booking.cancelledAt = new Date();
        await booking.save();
        await createPackageBookingNotification(
            booking,
            "cancelled",
            `Booking ${booking.bookingId} was cancelled.`
        );

        return res.json({ message: "Booking cancelled", booking });
    } catch (e) {
        return res.status(500).json({ message: "Failed to cancel booking", error: e.message });
    }
}

export async function getPackageBookingNotifications(req, res) {
    if (!isAdmin(req)) {
        return res.status(403).json({ message: "Admin only" });
    }

    try {
        const notifications = await PackageBookingNotification.find()
            .sort({ createdAt: -1 })
            .limit(50);
        const unreadCount = await PackageBookingNotification.countDocuments({ isRead: false });

        return res.json({ notifications, unreadCount });
    } catch (e) {
        return res.status(500).json({
            message: "Failed to fetch package booking notifications",
            error: e.message,
        });
    }
}

export async function getPackageBookingNotificationUnreadCount(req, res) {
    if (!isAdmin(req)) {
        return res.status(403).json({ message: "Admin only" });
    }

    try {
        const unreadCount = await PackageBookingNotification.countDocuments({ isRead: false });
        return res.json({ unreadCount });
    } catch (e) {
        return res.status(500).json({ message: "Failed to fetch unread count", error: e.message });
    }
}

export async function markPackageBookingNotificationRead(req, res) {
    if (!isAdmin(req)) {
        return res.status(403).json({ message: "Admin only" });
    }

    try {
        const notification = await PackageBookingNotification.findByIdAndUpdate(
            req.params.notificationId,
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        return res.json({ message: "Notification marked as read", notification });
    } catch (e) {
        return res.status(500).json({ message: "Failed to update notification", error: e.message });
    }
}

export async function markAllPackageBookingNotificationsRead(req, res) {
    if (!isAdmin(req)) {
        return res.status(403).json({ message: "Admin only" });
    }

    try {
        await PackageBookingNotification.updateMany({ isRead: false }, { isRead: true });
        return res.json({ message: "All notifications marked as read" });
    } catch (e) {
        return res.status(500).json({ message: "Failed to update notifications", error: e.message });
    }
}
