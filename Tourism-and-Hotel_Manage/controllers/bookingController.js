import Order from "../models/order.js";
import Package from "../models/package.js";
import PackageBooking from "../models/PackageBooking.js";
import RoomBooking from "../models/Roombooking.js";
import Vehicle from "../models/Vehicle.js";
import VehicleBooking from "../models/VehicleBooking.js";

function getImageFromValue(value) {
    if (Array.isArray(value)) {
        return value.find((item) => typeof item === "string" && item.trim()) || "";
    }

    return typeof value === "string" ? value : "";
}

function normalizePaymentMethod(method) {
    switch (method) {
        case "bank_deposit":
            return "bank_deposit";
        case "online":
            return "online";
        case "checkout":
        default:
            return "checkout";
    }
}

function normalizePaymentStatus(status, fallback = "pending") {
    switch (status) {
        case "verified":
        case "rejected":
        case "refunded":
        case "pending":
            return status;
        default:
            return fallback;
    }
}

function normalizeRefundStatus(status) {
    switch (status) {
        case "pending_admin_refund":
        case "processing":
        case "refunded":
        case "not_eligible":
        case "pending":
            return status;
        default:
            return "not_applicable";
    }
}

function canCancelByDates(status, startDate) {
    if (["Cancelled", "Completed", "cancelled", "completed"].includes(status)) {
        return false;
    }

    if (!startDate) {
        return false;
    }

    return new Date() < new Date(startDate);
}

function normalizeRoomBooking(booking) {
    return {
        id: booking.bookingId,
        type: "room",
        typeLabel: "Room",
        title: `${booking.room?.roomType || "Room"} - ${booking.room?.roomNumber || ""}`.trim(),
        subtitle: booking.room?.hotelName || "Room Booking",
        image: booking.room?.image || "",
        bookingDate: booking.bookingDate || booking.createdAt || null,
        startDate: booking.checkInDate,
        endDate: booking.checkOutDate,
        totalAmount: booking.totalAmount || 0,
        paymentMethod: normalizePaymentMethod(booking.paymentMethod),
        paymentStatus: normalizePaymentStatus(booking.paymentStatus),
        bookingStatus: booking.bookingStatus || "pending",
        refundStatus: normalizeRefundStatus(booking.refundStatus),
        canCancel: booking.bookingStatus !== "cancelled" && canCancelByDates(booking.bookingStatus, booking.checkInDate),
        details: {
            bookingId: booking.bookingId,
            room: booking.room,
            numberOfGuests: booking.numberOfGuests,
            numberOfNights: booking.numberOfNights,
            specialRequests: booking.specialRequests || "",
            refundAmount: booking.refundAmount || 0,
            refundMessage: booking.refundMessage || "",
            cancellationMessage: booking.cancellationMessage || "",
        },
    };
}

function normalizePackageBooking(booking, packageImage = "") {
    return {
        id: booking.bookingId,
        type: "package",
        typeLabel: "Package / Adventure",
        title: booking.packageName,
        subtitle: booking.selectedVehicle?.vehicleName || "Adventure package booking",
        image: packageImage,
        bookingDate: booking.createdAt || null,
        startDate: booking.tourDate,
        endDate: booking.tourDate,
        totalAmount: booking.totalPrice || 0,
        paymentMethod: normalizePaymentMethod(booking.paymentMethod),
        paymentStatus: normalizePaymentStatus(booking.paymentStatus),
        bookingStatus: booking.status || "Pending",
        refundStatus: normalizeRefundStatus(booking.refundStatus),
        canCancel: !["Cancelled", "Completed"].includes(booking.status),
        details: {
            bookingId: booking.bookingId,
            packageId: booking.packageId,
            guests: booking.guests,
            userName: booking.userName,
            userPhone: booking.userPhone || "",
            selectedActivities: booking.selectedActivities || [],
            selectedVehicle: booking.selectedVehicle || null,
            addOns: booking.addOns || [],
            specialRequests: booking.specialRequests || "",
            basePricePerPerson: booking.basePricePerPerson || 0,
            vehicleTotal: booking.vehicleTotal || 0,
            addOnTotal: booking.addOnTotal || 0,
        },
    };
}

function normalizeVehicleBooking(booking, vehicleImage = "") {
    return {
        id: String(booking._id),
        type: "safari",
        typeLabel: "Safari Vehicle",
        title: booking.vehicleName || "Safari Vehicle Booking",
        subtitle: booking.vehicleType || "",
        image: vehicleImage,
        bookingDate: booking.bookingDate || booking.createdAt || null,
        startDate: booking.startDate,
        endDate: booking.endDate,
        totalAmount: booking.totalPrice || 0,
        paymentMethod: normalizePaymentMethod(booking.paymentMethod),
        paymentStatus: normalizePaymentStatus(booking.paymentStatus),
        bookingStatus: booking.status || "Pending",
        refundStatus: normalizeRefundStatus(booking.refundStatus),
        canCancel: canCancelByDates(booking.status, booking.startDate),
        details: {
            vehicleId: booking.vehicleId,
            regNo: booking.regNo,
            vehicleType: booking.vehicleType,
            capacity: booking.capacity,
            pricePerDay: booking.pricePerDay,
            totalDays: booking.totalDays,
            passengers: booking.passengers,
            customerName: booking.customerName,
            customerEmail: booking.customerEmail,
            customerPhone: booking.customerPhone,
            specialRequests: booking.specialRequests || "",
        },
    };
}

function normalizeStorageBooking(order) {
    const firstItem = order.orderedItems?.[0];

    return {
        id: order.orderId,
        type: "storage",
        typeLabel: "Storage / Equipment",
        title: firstItem?.product?.name || "Equipment Rental",
        subtitle: `${order.orderedItems?.length || 0} selected item(s)`,
        image: firstItem?.product?.image || "",
        bookingDate: order.orderDate || order.createdAt || null,
        startDate: order.startingDate,
        endDate: order.endingDate,
        totalAmount: order.totalAmount || 0,
        paymentMethod: normalizePaymentMethod(order.paymentMethod),
        paymentStatus: normalizePaymentStatus(order.paymentStatus),
        bookingStatus: order.status || "Pending",
        refundStatus: normalizeRefundStatus(order.refundStatus),
        canCancel: canCancelByDates(order.status, order.startingDate),
        details: {
            orderId: order.orderId,
            days: order.days,
            orderedItems: order.orderedItems || [],
        },
    };
}

function applyOwnershipFilter(req) {
    return [
        { userId: req.user.userId },
        { email: req.user.email },
        { userEmail: req.user.email },
        { customerEmail: req.user.email },
    ];
}

export async function getMyUnifiedBookings(req, res) {
    if (!req.user) {
        return res.status(401).json({ message: "Please login and try again" });
    }

    try {
        const roomFilter = { $or: applyOwnershipFilter(req) };
        const packageFilter = { $or: [{ userId: req.user.userId }, { userEmail: req.user.email }] };
        const vehicleFilter = { $or: [{ userId: req.user.userId }, { customerEmail: req.user.email }] };
        const orderFilter = { $or: [{ userId: req.user.userId }, { email: req.user.email }] };

        const [rooms, packages, vehicles, orders] = await Promise.all([
            RoomBooking.find(roomFilter).sort({ bookingDate: -1 }),
            PackageBooking.find(packageFilter).sort({ createdAt: -1 }),
            VehicleBooking.find(vehicleFilter).sort({ createdAt: -1 }),
            Order.find(orderFilter).sort({ orderDate: -1 }),
        ]);

        const packageIds = packages.map((booking) => booking.packageId).filter(Boolean);
        const vehicleIds = vehicles.map((booking) => booking.vehicleId).filter(Boolean);

        const [packageDocs, vehicleDocs] = await Promise.all([
            packageIds.length ? Package.find({ packageId: { $in: packageIds } }) : [],
            vehicleIds.length ? Vehicle.find({ _id: { $in: vehicleIds } }) : [],
        ]);

        const packageImageMap = new Map(
            packageDocs.map((pkg) => [pkg.packageId, getImageFromValue(pkg.images)])
        );
        const vehicleImageMap = new Map(
            vehicleDocs.map((vehicle) => [String(vehicle._id), getImageFromValue(vehicle.image)])
        );

        const bookings = [
            ...rooms.map(normalizeRoomBooking),
            ...packages.map((booking) =>
                normalizePackageBooking(booking, packageImageMap.get(booking.packageId) || "")
            ),
            ...vehicles.map((booking) =>
                normalizeVehicleBooking(booking, vehicleImageMap.get(String(booking.vehicleId)) || "")
            ),
            ...orders.map(normalizeStorageBooking),
        ].sort((left, right) => {
            const leftTime = left.bookingDate ? new Date(left.bookingDate).getTime() : 0;
            const rightTime = right.bookingDate ? new Date(right.bookingDate).getTime() : 0;
            return rightTime - leftTime;
        });

        res.json({ bookings });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch unified bookings" });
    }
}

export async function getUnifiedBookingById(req, res) {
    if (!req.user) {
        return res.status(401).json({ message: "Please login and try again" });
    }

    try {
        const { type, bookingId } = req.params;

        if (type === "room") {
            const booking = await RoomBooking.findOne({
                bookingId,
                $or: applyOwnershipFilter(req),
            });

            if (!booking) {
                return res.status(404).json({ message: "Booking not found" });
            }

            return res.json({ booking: normalizeRoomBooking(booking) });
        }

        if (type === "package") {
            const booking = await PackageBooking.findOne({
                bookingId,
                $or: [{ userId: req.user.userId }, { userEmail: req.user.email }],
            });

            if (!booking) {
                return res.status(404).json({ message: "Booking not found" });
            }

            const pkg = await Package.findOne({ packageId: booking.packageId });
            return res.json({
                booking: normalizePackageBooking(booking, getImageFromValue(pkg?.images)),
            });
        }

        if (type === "safari") {
            const booking = await VehicleBooking.findOne({
                _id: bookingId,
                $or: [{ userId: req.user.userId }, { customerEmail: req.user.email }],
            });

            if (!booking) {
                return res.status(404).json({ message: "Booking not found" });
            }

            const vehicle = await Vehicle.findById(booking.vehicleId);
            return res.json({
                booking: normalizeVehicleBooking(booking, getImageFromValue(vehicle?.image)),
            });
        }

        if (type === "storage") {
            const booking = await Order.findOne({
                orderId: bookingId,
                $or: [{ userId: req.user.userId }, { email: req.user.email }],
            });

            if (!booking) {
                return res.status(404).json({ message: "Booking not found" });
            }

            return res.json({ booking: normalizeStorageBooking(booking) });
        }

        return res.status(400).json({ message: "Unsupported booking type" });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch booking details" });
    }
}
