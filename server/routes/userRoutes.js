
const express = require("express");
const router = express.Router();

const {
    createUser,
    getUsers,
    updateUser,
    deleteUser
} = require("../controllers/userController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

// All routes require authentication
router.use(protect);

// Super Admin and Sub Admin can view users
router.get("/", authorizeRoles("super_admin", "sub_admin"), getUsers);

// Only Super Admin can create, update and delete users
router.post("/", authorizeRoles("super_admin"), createUser);
router.put("/:id", authorizeRoles("super_admin"), updateUser);
router.delete("/:id", authorizeRoles("super_admin"), deleteUser);

module.exports = router;
