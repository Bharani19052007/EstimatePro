const express = require("express");
const User = require("../models/User");
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { google } = require('googleapis');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Signup user
router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  // Basic validation
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Please provide all required fields" });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = await User.create({
      name,
      email,
      password: hashedPassword
    });

    // Don't send password back
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json(userResponse);
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ 
      error: "Server error during signup",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Login user
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ error: "Please provide email and password" });
  }

  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Don't send password back
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      user: userResponse,
      token
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      error: "Server error during login",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Get user profile
router.get("/profile", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Convert avatar to base64 if exists
    if (user.avatar && user.avatar.data) {
      const userObj = user.toObject();
      userObj.avatar = {
        data: user.avatar.data.toString('base64'),
        contentType: user.avatar.contentType,
        filename: user.avatar.filename
      };
      return res.status(200).json({ user: userObj });
    }

    res.status(200).json({ user });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ 
      error: "Server error while fetching profile",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Update user profile
router.put("/profile", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const { name, location, bio, profileVisibility, showEmail, showLocation } = req.body;

    console.log('Profile update request:', { name, location, bio, profileVisibility, showEmail, showLocation });

    const updateData = {};
    if (name) updateData.name = name;
    if (location !== undefined) updateData.location = location;
    if (bio !== undefined) updateData.bio = bio;
    if (profileVisibility) updateData.profileVisibility = profileVisibility;
    if (showEmail !== undefined) updateData.showEmail = showEmail;
    if (showLocation !== undefined) updateData.showLocation = showLocation;

    console.log('Update data:', updateData);

    const user = await User.findByIdAndUpdate(
      decoded.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    console.log('Updated user:', user.toObject());

    res.status(200).json({ 
      message: "Profile updated successfully",
      user 
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ 
      error: "Server error while updating profile",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Update avatar
router.put("/avatar", upload.single('avatar'), async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const user = await User.findByIdAndUpdate(
      decoded.id,
      {
        avatar: {
          data: req.file.buffer,
          contentType: req.file.mimetype,
          filename: req.file.originalname
        }
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Convert avatar to base64 for response
    const userObj = user.toObject();
    if (userObj.avatar && userObj.avatar.data) {
      userObj.avatar = {
        data: userObj.avatar.data.toString('base64'),
        contentType: userObj.avatar.contentType,
        filename: userObj.avatar.filename
      };
    }

    res.status(200).json({ 
      message: "Avatar updated successfully",
      user: userObj 
    });
  } catch (err) {
    console.error('Update avatar error:', err);
    res.status(500).json({ 
      error: "Server error while updating avatar",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Change password
router.put("/password", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters long" });
    }

    // Get user with password
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await User.findByIdAndUpdate(decoded.id, { password: hashedPassword });

    res.status(200).json({ 
      message: "Password changed successfully" 
    });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ 
      error: "Server error while changing password",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Google OAuth routes
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Google OAuth login route
router.get('/auth/google', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email'],
    redirect_uri: process.env.GOOGLE_REDIRECT_URI
  });
  res.redirect(url);
});

// Google OAuth callback route
router.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();
    
    // Check if user exists
    let user = await User.findOne({ email: data.email });
    
    if (!user) {
      // Create new user
      user = await User.create({
        name: data.name,
        email: data.email,
        avatar: {
          data: Buffer.from(data.picture.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64'),
          contentType: 'image/jpeg',
          filename: 'google-avatar.jpg'
        }
      });
    } else {
      // Update avatar if not exists
      if (!user.avatar || !user.avatar.data) {
        user.avatar = {
          data: Buffer.from(data.picture.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64'),
          contentType: 'image/jpeg',
          filename: 'google-avatar.jpg'
        };
        await user.save();
      }
    }
    
    // Create JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    // Don't send password back
    const userResponse = user.toObject();
    delete userResponse.password;
    
    // Convert avatar to base64 if exists
    if (userResponse.avatar && userResponse.avatar.data) {
      userResponse.avatar = {
        data: userResponse.avatar.data.toString('base64'),
        contentType: userResponse.avatar.contentType,
        filename: userResponse.avatar.filename
      };
    }
    
    // Redirect to frontend with token and user data
    const userDataParam = encodeURIComponent(JSON.stringify(userResponse));
    res.redirect(`${process.env.GOOGLE_REDIRECT_URI}?token=${token}&userData=${userDataParam}`);
    
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.redirect(`${process.env.GOOGLE_REDIRECT_URI}?error=auth_failed`);
  }
});

module.exports = router;