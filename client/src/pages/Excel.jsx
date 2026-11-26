
import { useEffect, useState } from "react";
import {
  Download,
  Upload,
  FileSpreadsheet,
  RefreshCw,
} from "lucide-react";

import API from "../services/api";
import { useAuth } from "../context/AuthContext";

const Excel = () => {
  const { user } = useAuth();

  const isAdmin =
    user?.role === "super_admin" ||
    user?.role === "sub_admin";

  const [file, setFile] = useState(null);

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    source: "",
    assignedTo: "",
    tag: "",
    dateFrom: "",
    dateTo: "",
  });

  const [agents, setAgents] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // FETCH AGENTS AND TAGS
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const tagResponse = await API.get("/tags");

        setTags(
          tagResponse.data.tags || tagResponse.data || []
        );

        if (isAdmin) {
          const userResponse = await API.get("/users");

          const users =
            userResponse.data.users || userResponse.data || [];

          setAgents(
            users.filter(
              (item) =>
                item.role === "support_agent" &&
                item.isActive
            )
          );
        }
      } catch (err) {
        console.error("Error fetching filters:", err);
      }
    };

    fetchOptions();
  }, [isAdmin]);

  // FILTER CHANGE
  const handleFilterChange = (e) => {
    const { name, value } = e.target;

    setFilters((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // IMPORT EXCEL
  const handleImport = async (e) => {
    e.preventDefault();

    if (!file) {
      setError("Please select an Excel file.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await API.post(
        "/excel/import",
        formData
      );

      setMessage(
        `Import completed. ${
          response.data.importedCount || 0
        } leads imported. ${
          response.data.errorCount || 0
        } rows failed.`
      );

      setFile(null);
      e.target.reset();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Excel import failed."
      );
    } finally {
      setLoading(false);
    }
  };

  // EXPORT ALL LEADS WITH FILTERS
  const handleExport = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const params = {};

      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params[key] = value;
        }
      });

      const response = await API.get("/excel/export", {
        params,
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const downloadUrl =
        window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = downloadUrl;
      link.download = "CRM_Leads.xlsx";

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(downloadUrl);

      setMessage(
        "Excel file downloaded successfully."
      );
    } catch (err) {
      setError("Unable to download Excel file.");
      console.error("Export error:", err);
    } finally {
      setLoading(false);
    }
  };

  // CLEAR FILTERS
  const clearFilters = () => {
    setFilters({
      search: "",
      status: "",
      source: "",
      assignedTo: "",
      tag: "",
      dateFrom: "",
      dateTo: "",
    });
  };

  return (
    <div className="space-y-6">

      {/* PAGE HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Excel Management
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Import and export your CRM leads.
        </p>
      </div>

      {/* SUCCESS MESSAGE */}
      {message && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {message}
        </div>
      )}

      {/* ERROR MESSAGE */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* IMPORT SECTION */}
      {isAdmin && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
              <Upload size={22} />
            </div>

            <div>
              <h2 className="font-semibold text-gray-800">
                Import Leads
              </h2>

              <p className="text-sm text-gray-500">
                Upload leads using an Excel file.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleImport}
            className="space-y-4"
          >
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) =>
                setFile(e.target.files?.[0] || null)
              }
              className="block w-full rounded-lg border border-gray-300 p-3 text-sm"
            />

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Upload size={17} />

              {loading ? "Importing..." : "Import Excel"}
            </button>
          </form>
        </div>
      )}

      {/* EXPORT SECTION */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-lg bg-green-50 p-3 text-green-600">
            <FileSpreadsheet size={22} />
          </div>

          <div>
            <h2 className="font-semibold text-gray-800">
              Export Leads
            </h2>

            <p className="text-sm text-gray-500">
              Filter leads and download all their details.
            </p>
          </div>
        </div>

        {/* FILTERS */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">

          {/* SEARCH */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Search
            </label>

            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Name, email or phone"
              className="w-full rounded-lg border border-gray-300 p-2.5 text-sm outline-none focus:border-blue-500"
            />
          </div>

          {/* STATUS */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Lead Status
            </label>

            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full rounded-lg border border-gray-300 p-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Qualified">Qualified</option>
              <option value="Lost">Lost</option>
              <option value="Won">Won</option>
            </select>
          </div>

          {/* SOURCE */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Source
            </label>

            <input
              type="text"
              name="source"
              value={filters.source}
              onChange={handleFilterChange}
              placeholder="Website, Referral, etc."
              className="w-full rounded-lg border border-gray-300 p-2.5 text-sm outline-none focus:border-blue-500"
            />
          </div>

          {/* AGENT */}
          {isAdmin && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Assigned Agent
              </label>

              <select
                name="assignedTo"
                value={filters.assignedTo}
                onChange={handleFilterChange}
                className="w-full rounded-lg border border-gray-300 p-2.5 text-sm outline-none focus:border-blue-500"
              >
                <option value="">All Agents</option>
                <option value="unassigned">
                  Unassigned
                </option>

                {agents.map((agent) => (
                  <option
                    key={agent._id}
                    value={agent._id}
                  >
                    {agent.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* TAG */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Tag
            </label>

            <select
              name="tag"
              value={filters.tag}
              onChange={handleFilterChange}
              className="w-full rounded-lg border border-gray-300 p-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="">All Tags</option>

              {tags.map((tag) => (
                <option key={tag._id} value={tag._id}>
                  {tag.name}
                </option>
              ))}
            </select>
          </div>

          {/* DATE FROM */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Date From
            </label>

            <input
              type="date"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleFilterChange}
              className="w-full rounded-lg border border-gray-300 p-2.5 text-sm outline-none focus:border-blue-500"
            />
          </div>

          {/* DATE TO */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Date To
            </label>

            <input
              type="date"
              name="dateTo"
              value={filters.dateTo}
              onChange={handleFilterChange}
              className="w-full rounded-lg border border-gray-300 p-2.5 text-sm outline-none focus:border-blue-500"
            />
          </div>

        </div>

        {/* ACTION BUTTONS */}
        <div className="mt-6 flex flex-wrap gap-3">

          <button
            type="button"
            onClick={handleExport}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={18} />

            {loading
              ? "Please wait..."
              : "Download All Leads"}
          </button>

          <button
            type="button"
            onClick={clearFilters}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw size={16} />
            Clear Filters
          </button>

        </div>

        <p className="mt-4 text-xs text-gray-500">
          The downloaded Excel file includes all lead fields,
          tags, notes, comments, assigned agent and timestamps.
        </p>

      </div>
    </div>
  );
};

export default Excel;
