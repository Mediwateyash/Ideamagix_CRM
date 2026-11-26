
const express = require("express");
const multer = require("multer");
const router = express.Router();

const { importLeads, exportLeads } = require("../controllers/excelController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        const allowed = [
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-excel"
        ];

        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Only Excel files are allowed"));
        }
    }
});

router.use(protect);

router.post(
    "/import",
    authorizeRoles("super_admin", "sub_admin"),
    upload.single("file"),
    importLeads
);

router.get(
    "/export",
    authorizeRoles("super_admin", "sub_admin", "support_agent"),
    exportLeads
);

module.exports = router;
