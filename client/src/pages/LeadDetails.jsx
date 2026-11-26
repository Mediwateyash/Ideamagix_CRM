
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";

function LeadDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [lead, setLead] = useState(null);
  const [allTags, setAllTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);

  const [comment, setComment] = useState("");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Fetch lead details
  const fetchLead = async () => {
    try {
      setError("");

      const response = await API.get(`/leads/${id}`);
      const data = response.data.lead || response.data;

      setLead(data);

      setSelectedTags(
        (data.tags || []).map((tag) =>
          typeof tag === "string" ? tag : tag._id
        )
      );
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load lead"
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch available tags
  const fetchTags = async () => {
    try {
      const response = await API.get("/tags");
      const data = response.data;

      setAllTags(
        Array.isArray(data) ? data : data.tags || []
      );
    } catch (err) {
      console.error("Failed to load tags:", err);
    }
  };

  useEffect(() => {
    fetchLead();
    fetchTags();
  }, [id]);

  // Handle input changes
  const handleChange = (e) => {
    setLead({
      ...lead,
      [e.target.name]: e.target.value,
    });
  };

  // Handle multiple tag selection
  const handleTagChange = (e) => {
    setSelectedTags(
      Array.from(
        e.target.selectedOptions,
        (option) => option.value
      )
    );
  };

  // Update lead
  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      await API.put(`/leads/${id}`, {
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        source: lead.source,
        status: lead.status,
        tags: selectedTags,
      });

      setEditing(false);
      setMessage("Lead updated successfully.");

      await fetchLead();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to update lead"
      );
    } finally {
      setSaving(false);
    }
  };

  // Add note
  const handleAddNote = async (e) => {
    e.preventDefault();

    if (!comment.trim()) return;

    try {
      setError("");

      await API.post(`/leads/${id}/notes`, {
        comment: comment.trim(),
      });

      setComment("");
      setMessage("Note added successfully.");

      await fetchLead();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to add note"
      );
    }
  };

  if (loading) {
    return <p className="p-5">Loading lead details...</p>;
  }

  if (!lead) {
    return (
      <div className="p-5">
        <p className="text-red-600">
          {error || "Lead not found"}
        </p>

        <button
          onClick={() => navigate("/leads")}
          className="text-blue-600 mt-3"
        >
          Back to Leads
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Back Button */}
      <button
        onClick={() => navigate("/leads")}
        className="text-blue-600 mb-5 hover:underline"
      >
        ← Back to Leads
      </button>

      {error && (
        <p className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </p>
      )}

      {message && (
        <p className="bg-green-100 text-green-700 p-3 rounded mb-4">
          {message}
        </p>
      )}

      {/* Lead Information */}
      <div className="bg-white border rounded p-5">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">
            Lead Details
          </h1>

          <button
            onClick={() => {
              setEditing(!editing);
              setMessage("");
              setError("");
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            {editing ? "Cancel Edit" : "Edit Lead"}
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
                  className="border rounded p-2 w-full"
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
                  className="border rounded p-2 w-full"
                />
              </div>

              <div>
                <label className="block mb-1">Phone</label>
                <input
                  name="phone"
                  value={lead.phone || ""}
                  onChange={handleChange}
                  className="border rounded p-2 w-full"
                  required
                />
              </div>

              <div>
                <label className="block mb-1">Source</label>
                <input
                  name="source"
                  value={lead.source || ""}
                  onChange={handleChange}
                  className="border rounded p-2 w-full"
                />
              </div>

              <div>
                <label className="block mb-1">Status</label>
                <select
                  name="status"
                  value={lead.status || "New"}
                  onChange={handleChange}
                  className="border rounded p-2 w-full"
                >
                  {[
                    "New",
                    "Contacted",
                    "Qualified",
                    "Lost",
                    "Won",
                  ].map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tag Selector */}
              <div>
                <label className="block mb-1">
                  Assign Tags
                </label>

                <select
                  multiple
                  value={selectedTags}
                  onChange={handleTagChange}
                  className="border rounded p-2 w-full min-h-28"
                >
                  {allTags.map((tag) => (
                    <option key={tag._id} value={tag._id}>
                      {tag.name}
                    </option>
                  ))}
                </select>

                <p className="text-xs text-gray-500 mt-1">
                  Hold Ctrl to select multiple tags.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="bg-green-600 text-white px-5 py-2 rounded mt-5 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            <p>
              <strong>Name:</strong> {lead.name}
            </p>

            <p>
              <strong>Email:</strong> {lead.email || "-"}
            </p>

            <p>
              <strong>Phone:</strong> {lead.phone}
            </p>

            <p>
              <strong>Source:</strong> {lead.source || "-"}
            </p>

            <p>
              <strong>Status:</strong> {lead.status}
            </p>

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

            {/* Display Assigned Tags */}
            <div className="md:col-span-2">
              <strong>Assigned Tags:</strong>

              <div className="flex flex-wrap gap-2 mt-2">
                {lead.tags?.length > 0 ? (
                  lead.tags.map((tag, index) => (
                    <span
                      key={tag._id || index}
                      className="px-3 py-1 rounded text-white text-sm"
                      style={{
                        backgroundColor:
                          tag.color || "#3B82F6",
                      }}
                    >
                      {tag.name || "Tag"}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500">
                    No tags assigned
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notes Section */}
      <div className="bg-white border rounded p-5 mt-6">
        <h2 className="text-lg font-semibold mb-4">
          Notes & Comments
        </h2>

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
                  {note.addedBy?.name || "User"}
                  {note.createdAt &&
                    ` • ${new Date(
                      note.createdAt
                    ).toLocaleString()}`}
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-500">
              No notes added yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default LeadDetails;