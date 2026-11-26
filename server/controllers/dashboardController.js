
const Lead = require("../models/Lead");
const User = require("../models/user");
const Activity = require("../models/Activity");

const getDashboardStats = async (req, res) => {
  try {
    const isSupportAgent = req.user.role === "support_agent";

    // Support Agents only see their assigned leads
    const leadFilter = isSupportAgent
      ? { assignedTo: req.user._id }
      : {};

    // Fetch total leads
    const totalLeads = await Lead.countDocuments(leadFilter);

    // Fetch lead counts by status
    const statusDistribution = await Lead.aggregate([
      { $match: leadFilter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          status: "$_id",
          count: 1,
        },
      },
    ]);

    // Recent activity
    const activityFilter = isSupportAgent
      ? { user: req.user._id }
      : {};

    const recentActivity = await Activity.find(activityFilter)
      .populate("user", "name email role")
      .populate("lead", "name")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Actual performance statistics for each Support Agent
    let agentPerformance = [];

    if (!isSupportAgent) {
      const agents = await User.find({
        role: "support_agent",
      })
        .select("name email isActive")
        .lean();

      const performanceData = await Lead.aggregate([
        {
          $match: {
            assignedTo: { $ne: null },
          },
        },
        {
          $group: {
            _id: "$assignedTo",
            totalAssigned: { $sum: 1 },

            won: {
              $sum: {
                $cond: [{ $eq: ["$status", "Won"] }, 1, 0],
              },
            },

            lost: {
              $sum: {
                $cond: [{ $eq: ["$status", "Lost"] }, 1, 0],
              },
            },

            pending: {
              $sum: {
                $cond: [
                  {
                    $in: [
                      "$status",
                      ["New", "Contacted", "Qualified"],
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]);

      const performanceMap = new Map(
        performanceData.map((item) => [
          item._id.toString(),
          item,
        ])
      );

      agentPerformance = agents.map((agent) => {
        const stats = performanceMap.get(agent._id.toString());

        const totalAssigned = stats?.totalAssigned || 0;
        const won = stats?.won || 0;

        const conversionRate =
          totalAssigned > 0
            ? Number(
                ((won / totalAssigned) * 100).toFixed(2)
              )
            : 0;

        return {
          _id: agent._id,
          name: agent.name,
          email: agent.email,
          isActive: agent.isActive,
          totalAssigned,
          won,
          lost: stats?.lost || 0,
          pending: stats?.pending || 0,
          conversionRate,
        };
      });
    }

    return res.status(200).json({
      totalLeads,
      statusDistribution,
      recentActivity,
      agentPerformance,
    });
  } catch (error) {
    console.error("Dashboard error:", error);

    return res.status(500).json({
      message: "Failed to load dashboard statistics.",
      error: error.message,
    });
  }
};

module.exports = {
  getDashboardStats,
};
