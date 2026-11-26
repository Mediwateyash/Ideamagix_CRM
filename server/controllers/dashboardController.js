
const Lead = require("../models/Lead");
const Activity = require("../models/Activity");
const User = require("../models/user");

const getDashboardStats = async (req, res) => {
  try {
    const isAgent = req.user.role === "support_agent";

    const leadFilter = isAgent
      ? { assignedTo: req.user._id }
      : {};

    const totalLeads = await Lead.countDocuments(leadFilter);

    const statusDistribution = await Lead.aggregate([
      { $match: isAgent ? { assignedTo: req.user._id } : {} },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const recentActivity = await Activity.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(5);

    let agentPerformance = [];

    if (!isAgent) {
      agentPerformance = await User.find({
        role: "support_agent",
        isActive: true,
      }).select("name email");
    }

    res.status(200).json({
      totalLeads,
      statusDistribution,
      recentActivity,
      agentPerformance,
    });
  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({
      message: "Failed to fetch dashboard statistics",
      error: error.message,
    });
  }
};

module.exports = { getDashboardStats };
