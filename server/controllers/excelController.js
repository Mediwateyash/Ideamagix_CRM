
const XLSX = require("xlsx");
const Lead = require("../models/Lead");
const User = require("../models/user");
const Activity = require("../models/Activity");

// IMPORT LEADS FROM EXCEL
const importLeads = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: "Please upload an Excel file"
            });
        }

        const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];

        const rows = XLSX.utils.sheet_to_json(sheet, {
            defval: ""
        });

        if (!rows.length) {
            return res.status(400).json({
                message: "Excel file is empty"
            });
        }

        const validStatuses = [
            "New", "Contacted", "Qualified", "Lost", "Won"
        ];

        const leadsToInsert = [];
        const errors = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];

            const name = String(row.name || "").trim();
            const phone = String(row.phone || "").trim();
            const email = String(row.email || "").trim().toLowerCase();
            const source = String(row.source || "Excel Import").trim();
            const status = String(row.status || "New").trim();

            if (!name || !phone) {
                errors.push(`Row ${i + 2}: Name and phone are required`);
                continue;
            }

            if (!validStatuses.includes(status)) {
                errors.push(`Row ${i + 2}: Invalid status`);
                continue;
            }

            let agentId = null;

            if (row.assignedTo) {
                const agent = await User.findOne({
                    _id: String(row.assignedTo).trim(),
                    role: "support_agent",
                    isActive: true
                });

                if (!agent) {
                    errors.push(`Row ${i + 2}: Invalid assignedTo agent ID`);
                    continue;
                }

                agentId = agent._id;
            }

            leadsToInsert.push({
                name,
                phone,
                email: email || undefined,
                source,
                status,
                assignedTo: agentId,
                createdBy: req.user._id
            });
        }

        let inserted = [];

        if (leadsToInsert.length) {
            inserted = await Lead.insertMany(leadsToInsert);

            await Activity.create({
                user: req.user._id,
                action: "IMPORT_LEADS",
                description: `Imported ${inserted.length} leads from Excel`
            });
        }

        res.status(200).json({
            message: "Excel import completed",
            importedCount: inserted.length,
            errorCount: errors.length,
            errors
        });

    } catch (error) {
        res.status(500).json({
            message: "Excel import failed",
            error: error.message
        });
    }
};


// EXPORT LEADS TO EXCEL
const exportLeads = async (req, res) => {
    try {
        const filter = {};

        // Agents can export only their assigned leads
        if (req.user.role === "support_agent") {
            filter.assignedTo = req.user._id;
        } else if (!["super_admin", "sub_admin"].includes(req.user.role)) {
            return res.status(403).json({
                message: "Access denied"
            });
        }

        // Optional status filter
        if (req.query.status) {
            filter.status = req.query.status;
        }

        const leads = await Lead.find(filter)
            .populate("assignedTo", "name")
            .sort({ createdAt: -1 });

        const data = leads.map(lead => ({
            Name: lead.name,
            Email: lead.email || "",
            Phone: lead.phone,
            Source: lead.source,
            Status: lead.status,
            AssignedAgent: lead.assignedTo?.name || "Unassigned",
            CreatedAt: lead.createdAt
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");

        const buffer = XLSX.write(workbook, {
            type: "buffer",
            bookType: "xlsx"
        });

        res.setHeader(
            "Content-Disposition",
            'attachment; filename="CRM_Leads.xlsx"'
        );

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        res.send(buffer);

    } catch (error) {
        res.status(500).json({
            message: "Excel export failed",
            error: error.message
        });
    }
};

module.exports = { importLeads, exportLeads };
