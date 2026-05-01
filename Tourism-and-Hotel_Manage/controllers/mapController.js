import BookingRoute from "../models/bookingRoute.js";
import axios from "axios";

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

export const saveSelectedDestinations = async (req, res) => {
    try {
        const { bookingId, hotelLocation, destinations } = req.body;
        
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Not authorized"
            });
        }
        
        let bookingRoute = await BookingRoute.findOne({ bookingId });
        
        if (bookingRoute) {
            bookingRoute.selectedDestinations = destinations;
            bookingRoute.hotelLocation = hotelLocation;
            bookingRoute.status = "pending";
            await bookingRoute.save();
        } else {
            bookingRoute = await BookingRoute.create({
                bookingId,
                userId: req.user.id,
                hotelLocation,
                selectedDestinations: destinations
            });
        }
        
        res.status(200).json({
            success: true,
            bookingRoute
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const generateRoute = async (req, res) => {
    try {
        const { id } = req.params;
        const bookingRoute = await BookingRoute.findById(id);
        
        if (!bookingRoute) {
            return res.status(404).json({
                success: false,
                message: "Booking route not found"
            });
        }

        const origin = `${bookingRoute.hotelLocation.coordinates.lat},${bookingRoute.hotelLocation.coordinates.lng}`;
        const destinations = bookingRoute.selectedDestinations.map(d => 
            `${d.location.lat},${d.location.lng}`
        );
        
        const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destinations[destinations.length-1]}&waypoints=optimize:true|${destinations.slice(0, -1).join("|")}&key=${GOOGLE_MAPS_API_KEY}`;
        
        const response = await axios.get(directionsUrl);
        
        if (response.data.status === "OK") {
            const route = response.data.routes[0];
            
            bookingRoute.optimizedRoute = {
                waypoints: route.legs.map(leg => ({
                    location: leg.end_address,
                    stopover: true
                })),
                totalDistance: route.legs.reduce((sum, leg) => sum + leg.distance.value, 0),
                totalDuration: route.legs.reduce((sum, leg) => sum + leg.duration.value, 0),
                polyline: route.overview_polyline.points
            };
            
            bookingRoute.status = "generated";
            await bookingRoute.save();
            
            const mapImageUrl = `https://maps.googleapis.com/maps/api/staticmap?size=600x400&path=enc:${route.overview_polyline.points}&key=${GOOGLE_MAPS_API_KEY}`;
            bookingRoute.mapImageUrl = mapImageUrl;
            await bookingRoute.save();
            
            res.status(200).json({
                success: true,
                route: bookingRoute.optimizedRoute,
                mapImageUrl,
                waypoints: route.waypoint_order
            });
        } else {
            throw new Error("Failed to generate route: " + response.data.status);
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getRouteDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const bookingRoute = await BookingRoute.findById(id)
            .populate("bookingId")
            .populate("userId", "name email");
        
        if (!bookingRoute) {
            return res.status(404).json({
                success: false,
                message: "Route not found"
            });
        }
        
        res.status(200).json({
            success: true,
            bookingRoute
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const sendRouteMap = async (req, res) => {
    try {
        const { id } = req.params;
        const bookingRoute = await BookingRoute.findById(id)
            .populate("userId");
        
        if (!bookingRoute) {
            return res.status(404).json({
                success: false,
                message: "Route not found"
            });
        }
        
        const shareableLink = `${req.protocol}://${req.get("host")}/api/maps/shared/${bookingRoute._id}`;
        bookingRoute.shareableLink = shareableLink;
        bookingRoute.status = "sent";
        await bookingRoute.save();
        
        res.status(200).json({
            success: true,
            message: "Route map sent successfully",
            shareableLink,
            mapImageUrl: bookingRoute.mapImageUrl
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getNearbyDestinations = async (req, res) => {
    try {
        const { lat, lng, radius = 5000, type = "tourist_attraction" } = req.query;
        
        if (!lat || !lng) {
            return res.status(400).json({
                success: false,
                message: "Latitude and longitude are required"
            });
        }
        
        const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${GOOGLE_MAPS_API_KEY}`;
        
        const response = await axios.get(placesUrl);
        
        if (response.data.status === "OK" || response.data.status === "ZERO_RESULTS") {
            const destinations = response.data.results.map(place => ({
                name: place.name,
                location: {
                    lat: place.geometry.location.lat,
                    lng: place.geometry.location.lng
                },
                address: place.vicinity,
                rating: place.rating || 0,
                totalRatings: place.user_ratings_total || 0,
                photos: place.photos ? place.photos[0].photo_reference : null,
                placeId: place.place_id
            }));
            
            res.status(200).json({
                success: true,
                destinations,
                status: response.data.status
            });
        } else {
            res.status(400).json({
                success: false,
                message: "Google Places API error: " + response.data.status
            });
        }
    } catch (error) {
        console.error("Google Places API error:", error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch nearby destinations",
            error: error.message
        });
    }
};