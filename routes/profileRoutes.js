const express = require("express");
const router = express.Router();
const Profile = require("../models/Profile");
//const User = require("../models/User");

const requireAuth = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated" });
  next();
};

router.get("/:userId", requireAuth, async (req, res) => {
  try {
    console.log(`Fetching profile for user: ${req.params.userId}`);
    
    const profile = await Profile.findOne({ userId: req.params.userId })
      .populate('userId', 'name email');
    
    if (!profile) {
      console.log("No profile found, creating new one");
      const newProfile = await Profile.create({ 
        userId: req.params.userId 
      });
      
      const user = await User.findById(req.params.userId);
      
      return res.json({
        name: user?.name || "",
        email: user?.email || "",
        profile: {
          username: "",
          description: "",
          website: "",
          facebook: "",
          twitter: "",
          instagram: "",
          profileImage: ""
        }
      });
    }

    res.json({
      name: profile.userId.name,
      email: profile.userId.email,
      profile: {
        username: profile.username,
        description: profile.description,
        website: profile.website,
        facebook: profile.facebook,
        twitter: profile.twitter,
        instagram: profile.instagram,
        profileImage: profile.profileImage
      }
    });
  } catch (err) {
    console.error("Profile fetch error:", err);
    res.status(500).json({ 
      error: "Server error",
      details: err.message 
    });
  }
});

router.put("/:userId", requireAuth, async (req, res) => {
  try {
    console.log(`Updating profile for user: ${req.params.userId}`);
    console.log("Update data:", req.body);

    const updatedProfile = await Profile.findOneAndUpdate(
      { userId: req.params.userId },
      {
        username: req.body.username,
        description: req.body.description,
        website: req.body.website,
        facebook: req.body.facebook,
        twitter: req.body.twitter,
        instagram: req.body.instagram,
        profileImage: req.body.profileImage
      },
      { 
        new: true, 
        upsert: true,
        setDefaultsOnInsert: true 
      }
    ).populate('userId', 'name email');

    res.json({
      name: updatedProfile.userId.name,
      email: updatedProfile.userId.email,
      profile: {
        username: updatedProfile.username,
        description: updatedProfile.description,
        website: updatedProfile.website,
        facebook: updatedProfile.facebook,
        twitter: updatedProfile.twitter,
        instagram: updatedProfile.instagram,
        profileImage: updatedProfile.profileImage
      }
    });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ 
      error: "Failed to update profile",
      details: err.message 
    });
  }
});

module.exports = router;