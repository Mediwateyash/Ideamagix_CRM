
const Lead = require("../models/Lead");
const User = require("../models/user");
const Activity = require("../models/Activity");
const Tag = require("../models/Tag");
const adminRoles = ["super_admin", "sub_admin"];

// CREATE LEAD
const createLead = async (req, res) => {
    try {
        const { name, email, phone, source, status, assignedTo, tags } = req.body;

        if (!name || !phone) {
            return res.status(400).json({
                message: "Name and phone are required"
            });
        }

        let agentId = null;

        if (assignedTo) {
            const agent = await User.findOne({
                _id: assignedTo,
                role: "support_agent",
                isActive: true
            });

            if (!agent) {
                return res.status(400).json({
                    message: "Invalid or inactive support agent"
                });
            }

            agentId = agent._id;
        }

        const lead = await Lead.create({
            name,
            email,
            phone,
            source,
            status,
            assignedTo: agentId,
            tags,
            createdBy: req.user._id
        });

        await Activity.create({
            user: req.user._id,
            action: "CREATE_LEAD",
            description: `Created lead: ${lead.name}`,
            lead: lead._id
        });

        res.status(201).json({
            message: "Lead created successfully",
            lead
        });

    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

// GET ALL LEADS (role-based)
const getLeads = async (req, res) => {
    try {
        const filter = {};

        if (req.user.role === "support_agent") {
            filter.assignedTo = req.user._id;
        } else if (!adminRoles.includes(req.user.role)) {
            return res.status(403).json({ message: "Access denied" });
        }

        const leads = await Lead.find(filter)
            .populate("assignedTo", "name email")
            .populate("createdBy", "name email")
            .populate("tags", "name color")
            .sort({ createdAt: -1 });

        res.status(200).json({
            count: leads.length,
            leads
        });

    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

// GET SINGLE LEAD
const getLeadById = async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.id)
            .populate("assignedTo", "name email")
            .populate("createdBy", "name email")
            .populate("tags", "name color");

        if (!lead) {
            return res.status(404).json({ message: "Lead not found" });
        }

        if (
            req.user.role === "support_agent" &&
            String(lead.assignedTo?._id) !== String(req.user._id)
        ) {
            return res.status(403).json({ message: "Access denied" });
        }

        if (!["super_admin", "sub_admin", "support_agent"].includes(req.user.role)) {
            return res.status(403).json({ message: "Access denied" });
        }

        res.status(200).json({ lead });

    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

// UPDATE LEAD
const updateLead = async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.id);

        if (!lead) {
            return res.status(404).json({ message: "Lead not found" });
        }

        const isAdmin = adminRoles.includes(req.user.role);
        const isAssignedAgent =
            req.user.role === "support_agent" &&
            String(lead.assignedTo) === String(req.user._id);

        if (!isAdmin && !isAssignedAgent) {
            return res.status(403).json({ message: "Access denied" });
        }

        const { name, email, phone, source, status, assignedTo, tags } = req.body;

        // Agents can update customer details and status, but cannot reassign leads.
        if (req.user.role === "support_agent" && assignedTo !== undefined) {
            return res.status(403).json({
                message: "Agents cannot reassign leads"
            });
        }

        if (assignedTo !== undefined && assignedTo !== null && assignedTo !== "") {
            const agent = await User.findOne({
                _id: assignedTo,
                role: "support_agent",
                isActive: true
            });

            if (!agent) {
                return res.status(400).json({
                    message: "Invalid or inactive support agent"
                });
            }

            lead.assignedTo = agent._id;
        } else if (assignedTo === null || assignedTo === "") {
            lead.assignedTo = null;
        }

        if (name !== undefined) lead.name = name;
        if (email !== undefined) lead.email = email;
        if (phone !== undefined) lead.phone = phone;
        if (source !== undefined) lead.source = source;
        if (status !== undefined) lead.status = status;
        if (tags !== undefined) lead.tags = tags;

        await lead.save();

        await Activity.create({
            user: req.user._id,
            action: "UPDATE_LEAD",
            description: `Updated lead: ${lead.name}`,
            lead: lead._id
        });

        res.status(200).json({
            message: "Lead updated successfully",
            lead
        });

    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

// DELETE LEAD (admins only)
const deleteLead = async (req, res) => {
    try {
        if (!adminRoles.includes(req.user.role)) {
            return res.status(403).json({ message: "Access denied" });
        }

        const lead = await Lead.findById(req.params.id);

        if (!lead) {
            return res.status(404).json({ message: "Lead not found" });
        }

        await Activity.create({
            user: req.user._id,
            action: "DELETE_LEAD",
            description: `Deleted lead: ${lead.name}`,
            lead: null
        });

        await lead.deleteOne();

        res.status(200).json({
            message: "Lead deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

module.exports = {
    createLead,
    getLeads,
    getLeadById,
    updateLead,
    deleteLead
};
