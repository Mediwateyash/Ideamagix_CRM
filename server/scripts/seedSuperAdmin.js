
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/user");

const createSuperAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);

        const existingAdmin = await User.findOne({
            role: "super_admin"
        });

        if (existingAdmin) {
            console.log("Super Admin already exists.");
            return;
        }

        const hashedPassword = await bcrypt.hash(
            process.env.ADMIN_PASSWORD,
            10
        );

        await User.create({
            name: process.env.ADMIN_NAME,
            email: process.env.ADMIN_EMAIL,
            password: hashedPassword,
            role: "super_admin"
        });

        console.log("Super Admin created successfully.");

    } catch (error) {
        console.error("Error:", error.message);
    } finally {
        await mongoose.disconnect();
    }
};

if (
    !process.env.ADMIN_NAME ||
    !process.env.ADMIN_EMAIL ||
    !process.env.ADMIN_PASSWORD ||
    !process.env.MONGO_URL
) {
    console.error("Required environment variables are missing.");
    process.exit(1);
}

createSuperAdmin();
