
const User = require("../models/user");
const Lead = require("../models/Lead");
const Activity = require("../models/Activity");
const bcrypt = require("bcryptjs");

// CREATE USER
const createUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        if (!["sub_admin", "support_agent"].includes(role)) {
            return res.status(400).json({
                message: "Invalid role"
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must be at least 8 characters"
            });
        }

        const existingUser = await User.findOne({
            email: email.toLowerCase().trim()
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Email already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role
        });

        await Activity.create({
            user: req.user._id,
            action: "CREATE_USER",
            description: `Created ${role}: ${user.name}`
        });

        res.status(201).json({
            message: "User created successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

// GET ALL USERS
const getUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select("-password")
            .sort({ createdAt: -1 });

        res.status(200).json({
            count: users.length,
            users
        });

    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

// UPDATE USER
const updateUser = async (req, res) => {
    try {
        const { name, email, role, isActive } = req.body;

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (user.role === "super_admin") {
            return res.status(403).json({
                message: "Super Admin account cannot be modified here"
            });
        }

        if (role && !["sub_admin", "support_agent"].includes(role)) {
            return res.status(400).json({
                message: "Invalid role"
            });
        }

        if (email) {
            const normalizedEmail = email.toLowerCase().trim();

            const duplicate = await User.findOne({
                email: normalizedEmail,
                _id: { $ne: user._id }
            });

            if (duplicate) {
                return res.status(409).json({
                    message: "Email already exists"
                });
            }

            user.email = normalizedEmail;
        }

        if (name !== undefined) user.name = name;
        if (role !== undefined) user.role = role;
        if (isActive !== undefined) user.isActive = isActive;

        await user.save();

        await Activity.create({
            user: req.user._id,
            action: "UPDATE_USER",
            description: `Updated user: ${user.name}`
        });

        res.status(200).json({
            message: "User updated successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isActive: user.isActive
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

// DELETE USER
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (user.role === "super_admin") {
            return res.status(403).json({
                message: "Super Admin cannot be deleted"
            });
        }

        // Remove assignments belonging to this user
        await Lead.updateMany(
            { assignedTo: user._id },
            { $set: { assignedTo: null } }
        );

        await Activity.create({
            user: req.user._id,
            action: "DELETE_USER",
            description: `Deleted user: ${user.name}`
        });

        await User.findByIdAndDelete(user._id);

        res.status(200).json({
            message: "User deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

module.exports = {
    createUser,
    getUsers,
    updateUser,
    deleteUser
};
