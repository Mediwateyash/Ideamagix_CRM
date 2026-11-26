
const express = require("express");
const router = express.Router();

const {
    createLead,
    getLeads,
    getLeadById,
    updateLead,
    deleteLead,
    addLeadNote
} = require("../controllers/leadController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

// Authentication
router.use(protect);

// Role authorization
router.use(
    authorizeRoles("super_admin", "sub_admin", "support_agent")
);

// Create lead
router.post(
    "/",
    authorizeRoles("super_admin", "sub_admin"),
    createLead
);

// Get all leads
router.get("/", getLeads);

// Get single lead
router.get("/:id", getLeadById);

// Update lead
router.put("/:id", updateLead);

// Delete lead
router.delete(
    "/:id",
    authorizeRoles("super_admin", "sub_admin"),
    deleteLead
);

// Add note to lead
router.post("/:id/notes", addLeadNote);

module.exports = router;
