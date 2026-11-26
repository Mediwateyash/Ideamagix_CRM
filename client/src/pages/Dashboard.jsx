
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
          err.response?.data?.message || "Unable to load dashboard data"
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

  // Read lead counts from the status distribution
  const distribution = stats.statusDistribution || [];

  const getCount = (status) => {
    const item = distribution.find(
      (item) => item._id === status
    );
    return item ? item.count : 0;
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>

      {/* Summary Cards */}
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

      {/* Lead Status */}
      <div className="bg-white border rounded p-5 mt-6">
        <h2 className="font-semibold mb-4">
          Lead Status Distribution
        </h2>

        {distribution.length > 0 ? (
          distribution.map((item) => (
            <div
              key={item._id}
              className="flex justify-between border-b py-3"
            >
              <span>{item._id}</span>
              <span>{item.count}</span>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No lead data available.</p>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-white border rounded p-5 mt-6">
        <h2 className="font-semibold mb-4">Recent Activity</h2>

        {stats.recentActivity?.length > 0 ? (
          stats.recentActivity.map((activity) => (
            <div key={activity._id} className="border-b py-3">
              <p>{activity.description}</p>

              <p className="text-sm text-gray-500 mt-1">
                {activity.user?.name || "Unknown user"} -{" "}
                {new Date(activity.createdAt).toLocaleString()}
              </p>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No recent activity.</p>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
