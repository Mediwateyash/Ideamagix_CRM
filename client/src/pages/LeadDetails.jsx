
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";

function LeadDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  // Fetch lead details
  const fetchLead = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get(`/leads/${id}`);
      setLead(response.data.lead || response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load lead");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLead();
  }, [id]);

  // Update form fields
  const handleChange = (e) => {
    setLead({
      ...lead,
      [e.target.name]: e.target.value,
    });
  };

  // Update lead
  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const { name, email, phone, source, status } = lead;

      await API.put(`/leads/${id}`, {
        name,
        email,
        phone,
        source,
        status,
      });

      setEditing(false);
      await fetchLead();
      alert("Lead updated successfully");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update lead");
    } finally {
      setSaving(false);
    }
  };

  // Add note
  const handleAddNote = async (e) => {
    e.preventDefault();

    if (!comment.trim()) return;

    try {
      await API.post(`/leads/${id}/notes`, {
        comment: comment.trim(),
      });

      setComment("");
      await fetchLead();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add note");
    }
  };

  if (loading) {
    return <p className="p-5">Loading lead details...</p>;
  }

  if (error && !lead) {
    return (
      <div className="p-5">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => navigate("/leads")}
          className="text-blue-600"
        >
          Back to Leads
        </button>
      </div>
    );
  }

  if (!lead) return <p>Lead not found.</p>;

  return (
    <div>
      <button
        onClick={() => navigate("/leads")}
        className="text-blue-600 mb-5"
      >
        ← Back to Leads
      </button>

      {error && (
        <p className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </p>
      )}

      {/* Lead Information */}
      <div className="bg-white border rounded p-5">
        <div className="flex justify-between items-center mb-5">
          <h1 className="text-2xl font-semibold">Lead Details</h1>

          <button
            onClick={() => setEditing(!editing)}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            {editing ? "Cancel" : "Edit Lead"}
          </button>
        </div>

        {editing ? (
          <form onSubmit={handleUpdate}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1">Name</label>
                <input
                  name="name"
                  value={lead.name || ""}
                  onChange={handleChange}
                  className="w-full border rounded p-2"
                  required
                />
              </div>

              <div>
                <label className="block mb-1">Email</label>
                <input
                  name="email"
                  type="email"
                  value={lead.email || ""}
                  onChange={handleChange}
                  className="w-full border rounded p-2"
                />
              </div>

              <div>
                <label className="block mb-1">Phone</label>
                <input
                  name="phone"
                  value={lead.phone || ""}
                  onChange={handleChange}
                  className="w-full border rounded p-2"
                  required
                />
              </div>

              <div>
                <label className="block mb-1">Source</label>
                <input
                  name="source"
                  value={lead.source || ""}
                  onChange={handleChange}
                  className="w-full border rounded p-2"
                />
              </div>

              <div>
                <label className="block mb-1">Status</label>
                <select
                  name="status"
                  value={lead.status}
                  onChange={handleChange}
                  className="w-full border rounded p-2"
                >
                  {["New", "Contacted", "Qualified", "Lost", "Won"].map(
                    (s) => (
                      <option key={s} value={s}>{s}</option>
                    )
                  )}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="bg-green-600 text-white px-5 py-2 rounded mt-5"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <p><strong>Name:</strong> {lead.name}</p>
            <p><strong>Email:</strong> {lead.email || "-"}</p>
            <p><strong>Phone:</strong> {lead.phone}</p>
            <p><strong>Source:</strong> {lead.source || "-"}</p>
            <p><strong>Status:</strong> {lead.status}</p>
            <p>
              <strong>Assigned To:</strong>{" "}
              {lead.assignedTo?.name || "Unassigned"}
            </p>
            <p>
              <strong>Created:</strong>{" "}
              {lead.createdAt
                ? new Date(lead.createdAt).toLocaleDateString()
                : "-"}
            </p>
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="bg-white border rounded p-5 mt-6">
        <h2 className="text-lg font-semibold mb-4">Notes & Comments</h2>

        <form onSubmit={handleAddNote}>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write a note about this lead..."
            className="w-full border rounded p-3"
            rows="3"
            required
          />

          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded mt-2"
          >
            Add Note
          </button>
        </form>

        <div className="mt-5">
          {lead.notes?.length > 0 ? (
            [...lead.notes].reverse().map((note, index) => (
              <div
                key={note._id || index}
                className="border-t py-3"
              >
                <p>{note.comment}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {note.addedBy?.name || "User"}{" "}
                  {note.createdAt &&
                    `• ${new Date(note.createdAt).toLocaleString()}`}
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No notes added yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default LeadDetails;
