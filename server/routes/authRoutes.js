const express = require("express");
const router = express.Router();

const { loginUser } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

router.post("/login", loginUser);

// Any logged-in user can access
router.get("/me", protect, (req, res) => {
    res.json({
        message: "Authenticated successfully",
        user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role
        }
    });
});

// Only Super Admin can access
router.get(
    "/admin-test",
    protect,
    authorizeRoles("super_admin"),
    (req, res) => {
        res.json({
            message: "Welcome Super Admin"
        });
    }
);

module.exports = router;