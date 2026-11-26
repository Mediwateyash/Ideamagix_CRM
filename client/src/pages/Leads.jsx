
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";

function Leads() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [leads, setLeads] = useState([]);
  const [agents, setAgents] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [assigningId, setAssigningId] = useState(null);

  const isAdmin = ["super_admin", "sub_admin"].includes(user?.role);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    source: "Manual",
    status: "New",
    assignedTo: "",
  });

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/leads", {
        params: { search, status },
      });

      const data = response.data;
      setLeads(Array.isArray(data) ? data : data.leads || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load leads");
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    if (!isAdmin) return;

    try {
      const response = await API.get("/users");
      const data = response.data;
      const users = Array.isArray(data) ? data : data.users || [];

      setAgents(
        users.filter(
          (u) => u.role === "support_agent" && u.isActive
        )
      );
    } catch (err) {
      console.error("Failed to fetch agents:", err);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [search, status]);

  useEffect(() => {
    fetchAgents();
  }, [user?.role]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    try {
      setError("");

      const payload = { ...form };

      if (!payload.assignedTo) {
        delete payload.assignedTo;
      }

      await API.post("/leads", payload);

      setForm({
        name: "",
        email: "",
        phone: "",
        source: "Manual",
        status: "New",
        assignedTo: "",
      });

      setShowForm(false);
      await fetchLeads();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create lead");
    }
  };

  // Assign or reassign lead
  const handleAssignment = async (leadId, agentId) => {
    try {
      setError("");
      setAssigningId(leadId);

      await API.put(`/leads/${leadId}`, {
        assignedTo: agentId || null,
      });

      await fetchLeads();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to assign lead"
      );
    } finally {
      setAssigningId(null);
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this lead?"
    );

    if (!confirmDelete) return;

    try {
      await API.delete(`/leads/${id}`);
      await fetchLeads();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete lead");
    }
  };

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h1 className="text-2xl font-semibold">Leads Management</h1>

        {isAdmin && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            {showForm ? "Close Form" : "+ Add Lead"}
          </button>
        )}
      </div>

      {error && (
        <p className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </p>
      )}

      {showForm && isAdmin && (
        <form
          onSubmit={handleCreate}
          className="bg-white border rounded p-5 mb-6"
        >
          <h2 className="font-semibold text-lg mb-4">
            Add New Lead
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              name="name"
              placeholder="Full Name"
              value={form.name}
              onChange={handleChange}
              className="border rounded p-2"
              required
            />

            <input
              name="email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              className="border rounded p-2"
            />

            <input
              name="phone"
              placeholder="Phone Number"
              value={form.phone}
              onChange={handleChange}
              className="border rounded p-2"
              required
            />

            <input
              name="source"
              placeholder="Lead Source"
              value={form.source}
              onChange={handleChange}
              className="border rounded p-2"
            />

            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="border rounded p-2"
            >
              {["New", "Contacted", "Qualified", "Lost", "Won"].map(
                (s) => (
                  <option key={s} value={s}>{s}</option>
                )
              )}
            </select>

            <select
              name="assignedTo"
              value={form.assignedTo}
              onChange={handleChange}
              className="border rounded p-2"
            >
              <option value="">Unassigned</option>
              {agents.map((agent) => (
                <option key={agent._id} value={agent._id}>
                  {agent.name} ({agent.email})
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="bg-green-600 text-white px-5 py-2 rounded mt-4"
          >
            Save Lead
          </button>
        </form>
      )}

      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Search name, email or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded p-2 flex-1 min-w-60"
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border rounded p-2"
        >
          <option value="">All Statuses</option>
          {["New", "Contacted", "Qualified", "Lost", "Won"].map(
            (s) => (
              <option key={s} value={s}>{s}</option>
            )
          )}
        </select>
      </div>

      <div className="bg-white border rounded overflow-x-auto">
        {loading ? (
          <p className="p-5">Loading leads...</p>
        ) : leads.length === 0 ? (
          <p className="p-5 text-gray-500">No leads found.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Source</th>
                <th className="p-3">Status</th>
                <th className="p-3">Assigned To</th>
                <th className="p-3">Tags</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>

            <tbody>
              {leads.map((lead) => (
                <tr key={lead._id} className="border-t">
                  <td className="p-3 font-medium">{lead.name}</td>
                  <td className="p-3">{lead.email || "-"}</td>
                  <td className="p-3">{lead.phone}</td>
                  <td className="p-3">{lead.source || "-"}</td>
                  <td className="p-3">{lead.status}</td>

                  <td className="p-3">
                    {isAdmin ? (
                      <select
                        value={lead.assignedTo?._id || ""}
                        disabled={assigningId === lead._id}
                        onChange={(e) =>
                          handleAssignment(lead._id, e.target.value)
                        }
                        className="border rounded p-2 min-w-36 disabled:opacity-50"
                      >
                        <option value="">Unassigned</option>
                        {agents.map((agent) => (
                          <option key={agent._id} value={agent._id}>
                            {agent.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      lead.assignedTo?.name || "Unassigned"
                    )}
                    {assigningId === lead._id && (
                      <span className="block text-xs text-gray-500 mt-1">
                        Updating...
                      </span>
                    )}
                  </td>

                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {lead.tags?.length > 0 ? (
                        lead.tags.map((tag) => (
                          <span
                            key={tag._id}
                            className="rounded-full px-2 py-1 text-xs font-medium"
                            style={{
                              backgroundColor: `${tag.color}20`,
                              color: tag.color,
                            }}
                          >
                            {tag.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400">No tags</span>
                      )}
                    </div>
                  </td>

                  <td className="p-3 whitespace-nowrap">
                    <button
                      onClick={() => navigate(`/leads/${lead._id}`)}
                      className="text-blue-600 hover:underline mr-3"
                    >
                      View / Edit
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(lead._id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Leads;
