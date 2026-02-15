const User = require("../models/User");
const Company = require("../models/Company");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/**
 * REGISTER
 */
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, companyName, role } = req.body;

    if (!name || !email || !password || !companyName) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Check company (case-insensitive)
    let company = await Company.findOne({
      name: companyName.toLowerCase(),
    });

    let finalRole;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    if (!company) {
      // Company does not exist → create new
      company = await Company.create({
        name: companyName.toLowerCase(),
      });

      finalRole = "admin";
    } else {
      // Company exists → force member
      finalRole = "member";
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: finalRole,
      company: company._id,
    });

    // If new company, set createdBy
    if (finalRole === "admin") {
      company.createdBy = user._id;
      await company.save();
    }

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: company.name,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * LOGIN
 */
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email & password required" });
    }

    const user = await User.findOne({ email }).populate("company");

    if (!user) {
      return res.status(400).json({ message: "EMAIL_NOT_FOUND" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "User account is disabled" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "PASSWORD_INCORRECT" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const isProduction = process.env.NODE_ENV === "production";

    res
      .cookie("token", token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({
        message: "Login successful",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          company: user.company.name,
          companyId: user.company._id,
        },
      });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * LOGOUT
 */
exports.logoutUser = (req, res) => {
  const isProduction = process.env.NODE_ENV === "production";

  res.clearCookie("token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
  });

  res.json({ message: "Logged out successfully" });
};