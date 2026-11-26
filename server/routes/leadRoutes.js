
const express = require("express");
const router = express.Router();

const {
    createLead,
    getLeads,
    getLeadById,
    updateLead,
    deleteLead
} = require("../controllers/leadController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

router.use(protect);
router.use(authorizeRoles("super_admin", "sub_admin", "support_agent"));

router.post("/", authorizeRoles("super_admin", "sub_admin"), createLead);
router.get("/", getLeads);
router.get("/:id", getLeadById);
router.put("/:id", updateLead);
router.delete("/:id", authorizeRoles("super_admin", "sub_admin"), deleteLead);

module.exports = router;
