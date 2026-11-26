
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

// Every route requires Super Admin authentication
router.use(protect, authorizeRoles("super_admin"));

router.post("/", createUser);
router.get("/", getUsers);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

module.exports = router;
