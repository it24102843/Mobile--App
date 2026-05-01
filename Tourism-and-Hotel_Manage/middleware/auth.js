// middleware/auth.js

// Middleware to check if user is authenticated
export const protect = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: "Not authorized, please login first"
        });
    }
    next();
};

// Middleware to check user roles (admin, customer, etc.)
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Not authorized, please login first"
            });
        }
        
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role ${req.user.role} is not authorized to access this route`
            });
        }
        next();
    };
};

// Middleware to check if user is admin (simpler version)
export const isAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: "Not authorized, please login first"
        });
    }
    
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: "Admin access required"
        });
    }
    next();
};

// Middleware to check if user is customer
export const isCustomer = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: "Not authorized, please login first"
        });
    }
    
    if (req.user.role !== 'customer') {
        return res.status(403).json({
            success: false,
            message: "Customer access required"
        });
    }
    next();
};