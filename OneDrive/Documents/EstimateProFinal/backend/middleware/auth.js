const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    // Get token from header (try both Authorization and x-auth-token)
    let token = null;
    
    // Try Authorization header first
    const authHeader = req.header("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7); // Remove "Bearer " prefix
    }
    
    // Fallback to x-auth-token header
    if (!token) {
      token = req.header("x-auth-token");
    }
    
    console.log('🔍 Auth middleware - Token found:', !!token);
    console.log('🔍 Auth middleware - Auth header:', authHeader);
    console.log('🔍 Auth middleware - x-auth-token header:', req.header("x-auth-token"));
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Access denied. No token provided."
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    
    // Get user from database
    const user = await User.findById(decoded.id).select("-password");
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Token is valid but user not found."
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        error: "Invalid token."
      });
    } else if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        error: "Token expired."
      });
    }
    
    res.status(500).json({
      success: false,
      error: "Server error in authentication."
    });
  }
};

module.exports = auth;
