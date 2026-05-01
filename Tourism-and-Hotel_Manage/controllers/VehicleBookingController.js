import VehicleBooking from "../models/VehicleBooking.js";
import Vehicle from "../models/Vehicle.js";

function normalizePhone(value) {
    return `${value ?? ""}`.trim().replace(/\s+/g, "");
}

function isValidPhone(value) {
    return /^\+?[0-9\-()]{7,20}$/.test(normalizePhone(value));
}

// Create a new booking
export async function createBooking(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Please login to create a safari vehicle booking."
            });
        }

        const bookingData = req.body;
        const validPaymentMethods = ["online", "bank_deposit"];

        // Validate required fields
        const requiredFields = [
            'vehicleId', 'startDate', 'endDate',
            'passengers', 'customerName', 'customerPhone'
        ];

        const missingFields = [];
        for (const field of requiredFields) {
            if (!bookingData[field] && bookingData[field] !== 0) {
                missingFields.push(field);
            }
        }

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(", ")}`
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const emailToValidate = `${bookingData.customerEmail || req.user.email || ""}`.trim().toLowerCase();

        if (!emailRegex.test(emailToValidate)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email format."
            });
        }

        // Validate dates
        const startDate = new Date(bookingData.startDate);
        const endDate = new Date(bookingData.endDate);
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Invalid date format. Please use YYYY-MM-DD."
            });
        }
        
        if (endDate <= startDate) {
            return res.status(400).json({
                success: false,
                message: "End date must be after start date."
            });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (startDate < today) {
            return res.status(400).json({
                success: false,
                message: "Pickup date cannot be in the past."
            });
        }

        const passengers = Number(bookingData.passengers);
        if (!Number.isInteger(passengers) || passengers <= 0) {
            return res.status(400).json({
                success: false,
                message: "Passenger count must be a positive number."
            });
        }

        // Check if vehicle exists and is available
        const vehicle = await Vehicle.findById(bookingData.vehicleId);
        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: "Vehicle not found."
            });
        }

        if (!vehicle.availability) {
            return res.status(400).json({
                success: false,
                message: "Vehicle is currently not available for booking."
            });
        }

        if (vehicle.capacity && passengers > Number(vehicle.capacity)) {
            return res.status(400).json({
                success: false,
                message: `This vehicle supports up to ${vehicle.capacity} passengers.`
            });
        }

        const paymentMethod = validPaymentMethods.includes(bookingData.paymentMethod)
            ? bookingData.paymentMethod
            : "online";

        if (!isValidPhone(bookingData.customerPhone)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid contact number."
            });
        }

        // Check for overlapping bookings
        const overlappingBooking = await VehicleBooking.findOne({
            vehicleId: bookingData.vehicleId,
            status: { $in: ["Pending", "Confirmed"] },
            startDate: { $lt: endDate },
            endDate: { $gt: startDate }
        });

        if (overlappingBooking) {
            return res.status(400).json({
                success: false,
                message: `Vehicle is already booked for the selected dates.`
            });
        }

        const millisecondsPerDay = 1000 * 60 * 60 * 24;
        const normalizedStartDate = new Date(startDate);
        const normalizedEndDate = new Date(endDate);
        normalizedStartDate.setHours(0, 0, 0, 0);
        normalizedEndDate.setHours(0, 0, 0, 0);
        const totalDays = Math.max(
            Math.round((normalizedEndDate.getTime() - normalizedStartDate.getTime()) / millisecondsPerDay),
            1
        );
        const totalPrice = Number(vehicle.pricePerDay || 0) * totalDays;

        // Create the booking
        const newBooking = new VehicleBooking({
            vehicleId: vehicle._id,
            vehicleName: vehicle.name,
            regNo: vehicle.registrationNumber,
            vehicleType: vehicle.type,
            capacity: vehicle.capacity,
            pricePerDay: vehicle.pricePerDay,
            userId: req.user.userId,
            customerName: bookingData.customerName || `${req.user.firstName || ""} ${req.user.lastName || ""}`.trim(),
            customerEmail: emailToValidate,
            customerPhone: bookingData.customerPhone || req.user.phone || "",
            specialRequests: bookingData.specialRequests || "",
            paymentMethod,
            paymentStatus: bookingData.paymentStatus || "pending",
            passengers,
            startDate,
            endDate,
            totalDays,
            totalPrice,
            bookingDate: new Date(),
            status: "Pending"
        });

        const savedBooking = await newBooking.save();

        res.status(201).json({
            success: true,
            message: "Booking created successfully!",
            booking: savedBooking
        });

    } catch (error) {
        console.error("Error creating booking:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to create booking."
        });
    }
}

// Get all bookings (admin only)
export async function getAllBookings(req, res) {
    try {
        if (!req.user || req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to view all bookings."
            });
        }

        const bookings = await VehicleBooking.find()
            .sort({ createdAt: -1 })
            .populate('vehicleId', 'name registrationNumber');

        res.json({
            success: true,
            count: bookings.length,
            bookings
        });
    } catch (error) {
        console.error("Error fetching bookings:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch bookings."
        });
    }
}

// Get bookings for a specific user by email
export async function getUserBookings(req, res) {
    try {
        const email = req.user?.email || req.query.email;
        const userId = req.user?.userId;
        
        if (!email && !userId) {
            return res.status(400).json({
                success: false,
                message: "User identity is required."
            });
        }

        const filters = [];

        if (userId) {
            filters.push({ userId });
        }

        if (email) {
            filters.push({ customerEmail: email.toLowerCase() });
        }

        const bookings = await VehicleBooking.find(
            filters.length === 1 ? filters[0] : { $or: filters }
        )
            .sort({ createdAt: -1 })
            .populate('vehicleId', 'name registrationNumber image');

        res.json({
            success: true,
            count: bookings.length,
            bookings
        });
    } catch (error) {
        console.error("Error fetching user bookings:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch bookings."
        });
    }
}

// Get a single booking by ID
export async function getBookingById(req, res) {
    try {
        const { id } = req.params;
        
        if (!id || id === "undefined") {
            return res.status(400).json({
                success: false,
                message: "Invalid booking ID."
            });
        }

        const booking = await VehicleBooking.findById(id).populate('vehicleId', 'name registrationNumber image');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found."
            });
        }

        res.json({
            success: true,
            booking
        });
    } catch (error) {
        console.error("Error fetching booking:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch booking."
        });
    }
}

// Update booking status (admin only)
export async function updateBookingStatus(req, res) {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!req.user || req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to update booking status."
            });
        }

        const validStatuses = ["Pending", "Confirmed", "Cancelled", "Completed"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`
            });
        }

        const booking = await VehicleBooking.findByIdAndUpdate(
            id,
            { 
                status,
                updatedAt: Date.now()
            },
            { new: true, runValidators: true }
        );

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found."
            });
        }

        res.json({
            success: true,
            message: "Booking status updated successfully.",
            booking
        });
    } catch (error) {
        console.error("Error updating booking:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update booking status."
        });
    }
}

// HARD DELETE - Permanently remove booking from database
export async function hardDeleteBooking(req, res) {
    try {
        const { id } = req.params;
        
        console.log(`Attempting to hard delete booking: ${id}`);
        
        // Find the booking first
        const booking = await VehicleBooking.findById(id);
        
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found."
            });
        }

        // Optional: Add authorization check (only admin or the customer who made the booking)
        // For public access, we'll allow deletion without authentication
        // If you want to restrict to admins only, uncomment the code below:
        /*
        if (!req.user || (req.user.role !== "admin" && booking.customerEmail !== req.user.email)) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to delete this booking."
            });
        }
        */

        // Permanently delete the booking
        await VehicleBooking.findByIdAndDelete(id);
        
        console.log(`Booking ${id} permanently deleted from database`);

        res.json({
            success: true,
            message: "Booking has been permanently deleted from the database.",
            deletedBookingId: id
        });
    } catch (error) {
        console.error("Error hard deleting booking:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to delete booking."
        });
    }
}

// Cancel booking (soft delete - just update status)
export async function cancelBooking(req, res) {
    try {
        const { id } = req.params;
        
        const booking = await VehicleBooking.findById(id);
        
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found."
            });
        }

        if (booking.status === "Cancelled") {
            return res.status(400).json({
                success: false,
                message: "Booking is already cancelled."
            });
        }

        if (booking.status === "Completed") {
            return res.status(400).json({
                success: false,
                message: "Cannot cancel a completed booking."
            });
        }

        if (booking.status === "Confirmed") {
            return res.status(400).json({
                success: false,
                message: "Confirmed safari bookings cannot be cancelled by the user."
            });
        }

        if (req.user && req.user.role !== "admin") {
            const sameUser = booking.userId
                ? booking.userId === req.user.userId
                : booking.customerEmail === req.user.email;

            if (!sameUser) {
                return res.status(403).json({
                    success: false,
                    message: "You are not authorized to cancel this booking."
                });
            }
        }

        booking.status = "Cancelled";
        booking.updatedAt = Date.now();
        await booking.save();

        res.json({
            success: true,
            message: "Booking cancelled successfully.",
            booking
        });
    } catch (error) {
        console.error("Error cancelling booking:", error);
        res.status(500).json({
            success: false,
            message: "Failed to cancel booking."
        });
    }
}

// Get booking statistics (admin only)
export async function getBookingStats(req, res) {
    try {
        if (!req.user || req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to view statistics."
            });
        }

        const totalBookings = await VehicleBooking.countDocuments();
        const pendingBookings = await VehicleBooking.countDocuments({ status: "Pending" });
        const confirmedBookings = await VehicleBooking.countDocuments({ status: "Confirmed" });
        const cancelledBookings = await VehicleBooking.countDocuments({ status: "Cancelled" });
        const completedBookings = await VehicleBooking.countDocuments({ status: "Completed" });

        const totalRevenue = await VehicleBooking.aggregate([
            { $match: { status: { $in: ["Confirmed", "Completed"] } } },
            { $group: { _id: null, total: { $sum: "$totalPrice" } } }
        ]);

        res.json({
            success: true,
            stats: {
                total: totalBookings,
                pending: pendingBookings,
                confirmed: confirmedBookings,
                cancelled: cancelledBookings,
                completed: completedBookings,
                totalRevenue: totalRevenue[0]?.total || 0
            }
        });
    } catch (error) {
        console.error("Error fetching booking stats:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch booking statistics."
        });
    }
}
