
import { useEffect, useState } from "react";
import API from "../services/api";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "support_agent",
};

function Users() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/users");
      const data = response.data;

      setUsers(Array.isArray(data) ? data : data.users || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = { ...form };

      if (editingId && !payload.password.trim()) {
        delete payload.password;
      }

      if (editingId) {
        await API.put(`/users/${editingId}`, payload);
      } else {
        await API.post("/users", payload);
      }

      resetForm();
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save user");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (user) => {
    setEditingId(user._id);
    setForm({
      name: user.name || "",
      email: user.email || "",
      password: "",
      role: user.role,
    });
    setShowForm(true);
    setError("");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      setError("");
      await API.delete(`/users/${id}`);
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete user");
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      setError("");

      await API.put(`/users/${user._id}`, {
        isActive: !user.isActive,
      });

      await fetchUsers();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to change user status"
      );
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center flex-wrap gap-3 mb-6">
        <h1 className="text-2xl font-semibold">User Management</h1>

        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          + Add User
        </button>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border rounded p-5 mb-6"
        >
          <h2 className="font-semibold text-lg mb-4">
            {editingId ? "Edit User" : "Create User"}
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
              placeholder="Email Address"
              value={form.email}
              onChange={handleChange}
              className="border rounded p-2"
              required
            />

            <input
              name="password"
              type="password"
              placeholder={
                editingId
                  ? "New password (leave blank to keep current)"
                  : "Password"
              }
              value={form.password}
              onChange={handleChange}
              className="border rounded p-2"
              required={!editingId}
              minLength={6}
            />

            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="border rounded p-2"
            >
              <option value="support_agent">Support Agent</option>
              <option value="sub_admin">Sub-Admin</option>
            </select>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              type="submit"
              disabled={saving}
              className="bg-green-600 text-white px-5 py-2 rounded"
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Update User"
                  : "Create User"}
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="border px-5 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border rounded overflow-x-auto">
        {loading ? (
          <p className="p-5">Loading users...</p>
        ) : users.length === 0 ? (
          <p className="p-5 text-gray-500">No users found.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Role</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="border-t">
                  <td className="p-3 font-medium">{user.name}</td>
                  <td className="p-3">{user.email}</td>
                  <td className="p-3">{user.role}</td>
                  <td className="p-3">
                    {user.isActive ? "Active" : "Inactive"}
                  </td>

                  <td className="p-3 whitespace-nowrap">
                    {user.role !== "super_admin" && (
                      <>
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-blue-600 mr-3"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleToggleStatus(user)}
                          className="text-orange-600 mr-3"
                        >
                          {user.isActive ? "Deactivate" : "Activate"}
                        </button>

                        <button
                          onClick={() => handleDelete(user._id)}
                          className="text-red-600"
                        >
                          Delete
                        </button>
                      </>
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

export default Users;
