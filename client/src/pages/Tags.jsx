
import { useEffect, useState } from "react";
import API from "../services/api";

function Tags() {
  const [tags, setTags] = useState([]);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3B82F6");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchTags = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/tags");
      const data = response.data;

      setTags(Array.isArray(data) ? data : data.tags || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load tags");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      await API.post("/tags", { name: name.trim(), color });

      setName("");
      setColor("#3B82F6");
      setMessage("Tag created successfully.");

      await fetchTags();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create tag");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Tags Management</h1>

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

      <form
        onSubmit={handleCreate}
        className="bg-white border rounded p-5 mb-6"
      >
        <h2 className="font-semibold text-lg mb-4">Create New Tag</h2>

        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-48">
            <label className="block text-sm mb-2">Tag Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Example: Hot Lead"
              className="border rounded p-2 w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-2">Tag Color</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="border rounded h-10 w-16 p-1"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-5 py-2 rounded disabled:opacity-50"
          >
            {saving ? "Saving..." : "Create Tag"}
          </button>
        </div>
      </form>

      <div className="bg-white border rounded p-5">
        <h2 className="font-semibold text-lg mb-4">All Tags</h2>

        {loading ? (
          <p>Loading tags...</p>
        ) : tags.length === 0 ? (
          <p className="text-gray-500">No tags created yet.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {tags.map((tag) => (
              <div
                key={tag._id}
                className="flex items-center gap-2 border rounded px-3 py-2"
              >
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: tag.color || "#3B82F6" }}
                />
                <span>{tag.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Tags;
