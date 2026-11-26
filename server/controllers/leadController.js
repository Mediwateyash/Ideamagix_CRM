
const Lead = require("../models/Lead");
const User = require("../models/user");
const Activity = require("../models/Activity");
const Tag = require("../models/Tag");

const adminRoles = ["super_admin", "sub_admin"];

// Validate tags
const validateTags = async (tags) => {
  if (!Array.isArray(tags)) return false;
  if (tags.length === 0) return true;

  const uniqueTags = [...new Set(tags.map(String))];

  const validTags = await Tag.countDocuments({
    _id: { $in: uniqueTags },
  });

  return validTags === uniqueTags.length;
};

// CREATE LEAD
const createLead = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      source,
      status,
      assignedTo,
      tags = [],
    } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        message: "Name and phone are required",
      });
    }

    if (!await validateTags(tags)) {
      return res.status(400).json({
        message: "One or more tags are invalid",
      });
    }

    let agentId = null;

    if (assignedTo) {
      const agent = await User.findOne({
        _id: assignedTo,
        role: "support_agent",
        isActive: true,
      });

      if (!agent) {
        return res.status(400).json({
          message: "Invalid or inactive support agent",
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
      createdBy: req.user._id,
    });

    await Activity.create({
      user: req.user._id,
      action: "CREATE_LEAD",
      description: `Created lead: ${lead.name}`,
      lead: lead._id,
    });

    if (agentId) {
      await Activity.create({
        user: req.user._id,
        action: "ASSIGN_LEAD",
        description: `Assigned lead ${lead.name} to a support agent`,
        lead: lead._id,
      });
    }

    res.status(201).json({
      message: "Lead created successfully",
      lead,
    });
  } catch (error) {
    console.error("Create lead error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// GET ALL LEADS
const getLeads = async (req, res) => {
  try {
    const { search, status, source, assignedTo, tag } = req.query;

    const filter = {};

    if (req.user.role === "support_agent") {
      filter.assignedTo = req.user._id;
    } else if (adminRoles.includes(req.user.role)) {
      if (assignedTo) filter.assignedTo = assignedTo;
    } else {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    if (status) filter.status = status;
    if (source) filter.source = source;
    if (tag) filter.tags = tag;

    const leads = await Lead.find(filter)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .populate("tags", "name color")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: leads.length,
      leads,
    });
  } catch (error) {
    console.error("Get leads error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// GET SINGLE LEAD
const getLeadById = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .populate("tags", "name color")
      .populate("notes.addedBy", "name email");

    if (!lead) {
      return res.status(404).json({
        message: "Lead not found",
      });
    }

    if (
      req.user.role === "support_agent" &&
      String(lead.assignedTo?._id) !== String(req.user._id)
    ) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    if (!["super_admin", "sub_admin", "support_agent"].includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    res.status(200).json({ lead });
  } catch (error) {
    console.error("Get single lead error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// UPDATE LEAD
const updateLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({
        message: "Lead not found",
      });
    }

    const isAdmin = adminRoles.includes(req.user.role);

    const isAssignedAgent =
      req.user.role === "support_agent" &&
      String(lead.assignedTo) === String(req.user._id);

    if (!isAdmin && !isAssignedAgent) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    // Agents cannot reassign leads
    if (
      req.user.role === "support_agent" &&
      req.body.assignedTo !== undefined
    ) {
      return res.status(403).json({
        message: "Agents cannot reassign leads",
      });
    }

    const {
      name,
      email,
      phone,
      source,
      status,
      assignedTo,
      tags,
    } = req.body;

    // Build only the fields that should be updated.
    // Notes are deliberately excluded.
    const updateFields = {};

    if (name !== undefined) updateFields.name = name;
    if (email !== undefined) updateFields.email = email;
    if (phone !== undefined) updateFields.phone = phone;
    if (source !== undefined) updateFields.source = source;
    if (status !== undefined) updateFields.status = status;

    // Validate assignment
    if (assignedTo !== undefined) {
      if (assignedTo === null || assignedTo === "") {
        updateFields.assignedTo = null;
      } else {
        const agent = await User.findOne({
          _id: assignedTo,
          role: "support_agent",
          isActive: true,
        });

        if (!agent) {
          return res.status(400).json({
            message: "Invalid or inactive support agent",
          });
        }

        updateFields.assignedTo = agent._id;
      }
    }

    // Validate tags
    if (tags !== undefined) {
      if (!await validateTags(tags)) {
        return res.status(400).json({
          message: "One or more tags are invalid",
        });
      }

      updateFields.tags = tags;
    }

    const previousAssignedTo = lead.assignedTo
      ? String(lead.assignedTo)
      : null;

    // Update only selected fields without revalidating existing notes
    const updatedLead = await Lead.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("assignedTo", "name email")
      .populate("tags", "name color")
      .populate("createdBy", "name email");

    if (!updatedLead) {
      return res.status(404).json({
        message: "Lead not found",
      });
    }

    const newAssignedTo = updatedLead.assignedTo
      ? String(updatedLead.assignedTo._id)
      : null;

    const assignmentChanged =
      previousAssignedTo !== newAssignedTo;

    if (assignmentChanged) {
      let description;

      if (newAssignedTo) {
        description = `Assigned lead ${updatedLead.name} to ${updatedLead.assignedTo.name}`;
      } else {
        description = `Unassigned lead ${updatedLead.name}`;
      }

      await Activity.create({
        user: req.user._id,
        action: "ASSIGN_LEAD",
        description,
        lead: updatedLead._id,
      });
    } else {
      await Activity.create({
        user: req.user._id,
        action: "UPDATE_LEAD",
        description: `Updated lead: ${updatedLead.name}`,
        lead: updatedLead._id,
      });
    }

    res.status(200).json({
      message: "Lead updated successfully",
      lead: updatedLead,
    });
  } catch (error) {
    console.error("Update lead error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// DELETE LEAD
const deleteLead = async (req, res) => {
  try {
    if (!adminRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({
        message: "Lead not found",
      });
    }

    await Activity.create({
      user: req.user._id,
      action: "DELETE_LEAD",
      description: `Deleted lead: ${lead.name}`,
      lead: null,
    });

    await lead.deleteOne();

    res.status(200).json({
      message: "Lead deleted successfully",
    });
  } catch (error) {
    console.error("Delete lead error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ADD LEAD NOTE
const addLeadNote = async (req, res) => {
  try {
    const { comment } = req.body;

    if (!comment || !comment.trim()) {
      return res.status(400).json({
        message: "Comment is required",
      });
    }

    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({
        message: "Lead not found",
      });
    }

    const isAdmin = adminRoles.includes(req.user.role);

    const isAssignedAgent =
      req.user.role === "support_agent" &&
      String(lead.assignedTo) === String(req.user._id);

    if (!isAdmin && !isAssignedAgent) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    lead.notes.push({
      comment: comment.trim(),
      addedBy: req.user._id,
    });

    await lead.save();

    await Activity.create({
      user: req.user._id,
      action: "ADD_LEAD_NOTE",
      description: `Added a note to lead: ${lead.name}`,
      lead: lead._id,
    });

    res.status(201).json({
      message: "Note added successfully",
      notes: lead.notes,
    });
  } catch (error) {
    console.error("Add lead note error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  deleteLead,
  addLeadNote,
};
