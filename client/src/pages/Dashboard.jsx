
import { useEffect, useState } from "react";
import API from "../services/api";
import StatCard from "../components/StatCard";
import Loading from "../components/Loading";

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await API.get("/dashboard/stats");
        setStats(response.data);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Unable to load dashboard data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) return <Loading />;

  if (error) {
    return <p className="text-red-600">{error}</p>;
  }

  const distribution = stats.statusDistribution || [];
  const agentPerformance = stats.agentPerformance || [];

  // Support both old and new backend response formats
  const getCount = (status) => {
    const item = distribution.find(
      (item) => (item.status || item._id) === status
    );

    return item ? item.count : 0;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Leads"
          value={stats.totalLeads || 0}
        />

        <StatCard
          title="New Leads"
          value={getCount("New")}
        />

        <StatCard
          title="Won Leads"
          value={getCount("Won")}
        />

        <StatCard
          title="Lost Leads"
          value={getCount("Lost")}
        />
      </div>

      {/* LEAD STATUS DISTRIBUTION */}
      <div className="bg-white border rounded-lg p-5">
        <h2 className="font-semibold mb-4">
          Lead Status Distribution
        </h2>

        {distribution.length > 0 ? (
          distribution.map((item) => (
            <div
              key={item.status || item._id}
              className="flex justify-between border-b py-3"
            >
              <span>{item.status || item._id}</span>
              <span className="font-medium">{item.count}</span>
            </div>
          ))
        ) : (
          <p className="text-gray-500">
            No lead data available.
          </p>
        )}
      </div>

      {/* AGENT PERFORMANCE */}
      {agentPerformance.length > 0 && (
        <div className="bg-white border rounded-lg p-5">
          <div className="mb-5">
            <h2 className="font-semibold text-lg">
              Agent Performance
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Overview of lead handling and conversion by agents.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="p-3">Agent</th>
                  <th className="p-3">Assigned</th>
                  <th className="p-3">Won</th>
                  <th className="p-3">Lost</th>
                  <th className="p-3">Pending</th>
                  <th className="p-3">Conversion Rate</th>
                  <th className="p-3">Account</th>
                </tr>
              </thead>

              <tbody>
                {agentPerformance.map((agent) => (
                  <tr
                    key={agent._id}
                    className="border-b hover:bg-gray-50"
                  >
                    <td className="p-3">
                      <div className="font-medium text-gray-800">
                        {agent.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {agent.email}
                      </div>
                    </td>

                    <td className="p-3">
                      {agent.totalAssigned || 0}
                    </td>

                    <td className="p-3 text-green-600 font-medium">
                      {agent.won || 0}
                    </td>

                    <td className="p-3 text-red-600 font-medium">
                      {agent.lost || 0}
                    </td>

                    <td className="p-3">
                      {agent.pending || 0}
                    </td>

                    <td className="p-3">
                      <span className="font-semibold">
                        {agent.conversionRate || 0}%
                      </span>
                    </td>

                    <td className="p-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          agent.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {agent.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RECENT ACTIVITY */}
      <div className="bg-white border rounded-lg p-5">
        <h2 className="font-semibold mb-4">
          Recent Activity
        </h2>

        {stats.recentActivity?.length > 0 ? (
          stats.recentActivity.map((activity) => (
            <div
              key={activity._id}
              className="border-b py-3"
            >
              <p>{activity.description}</p>

              <p className="text-sm text-gray-500 mt-1">
                {activity.user?.name || "Unknown user"} -{" "}
                {new Date(activity.createdAt).toLocaleString()}
              </p>
            </div>
          ))
        ) : (
          <p className="text-gray-500">
            No recent activity.
          </p>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
