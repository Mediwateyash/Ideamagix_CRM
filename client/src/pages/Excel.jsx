
import { useState } from "react";
import API from "../services/api";

function Excel() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState([]);
  const [status, setStatus] = useState("");

  const handleImport = async (e) => {
    e.preventDefault();

    if (!file) {
      setMessage("Please select an Excel file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      setMessage("");
      setErrors([]);

      const response = await API.post("/excel/import", formData);

      setMessage(
        `Import completed! ${response.data.importedCount} leads imported. ${response.data.errorCount} errors.`
      );

      setErrors(response.data.errors || []);
      setFile(null);

      e.target.reset();
    } catch (err) {
      setMessage(
        err.response?.data?.message || "Excel import failed."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      setMessage("");

      const response = await API.get("/excel/export", {
        params: status ? { status } : {},
        responseType: "blob",
      });

      const blob = new Blob(
        [response.data],
        {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }
      );

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "CRM_Leads.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      setMessage("Excel file downloaded successfully.");
    } catch (err) {
      setMessage("Failed to export leads. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">
        Excel Import & Export
      </h1>

      {message && (
        <div className="bg-blue-50 text-blue-700 border p-3 rounded mb-5">
          {message}
        </div>
      )}

      {/* Import */}
      <div className="bg-white border rounded p-5 mb-6">
        <h2 className="text-lg font-semibold mb-2">
          Import Leads
        </h2>

        <p className="text-sm text-gray-500 mb-4">
          Upload an Excel file (.xlsx or .xls) to import leads.
        </p>

        <form onSubmit={handleImport}>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setFile(e.target.files[0] || null)}
            className="border rounded p-2 w-full mb-4"
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-5 py-2 rounded disabled:opacity-50"
          >
            {loading ? "Please wait..." : "Import Excel"}
          </button>
        </form>

        {errors.length > 0 && (
          <div className="mt-5">
            <h3 className="font-semibold text-red-600 mb-2">
              Import Errors
            </h3>

            {errors.map((error, index) => (
              <p key={index} className="text-sm text-red-600 border-b py-2">
                {error.message || JSON.stringify(error)}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Export */}
      <div className="bg-white border rounded p-5">
        <h2 className="text-lg font-semibold mb-2">
          Export Leads
        </h2>

        <p className="text-sm text-gray-500 mb-4">
          Download your leads as an Excel spreadsheet.
        </p>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border rounded p-2 w-full md:w-64 mb-4"
        >
          <option value="">All Statuses</option>
          <option value="New">New</option>
          <option value="Contacted">Contacted</option>
          <option value="Qualified">Qualified</option>
          <option value="Lost">Lost</option>
          <option value="Won">Won</option>
        </select>

        <br />

        <button
          onClick={handleExport}
          disabled={loading}
          className="bg-green-600 text-white px-5 py-2 rounded disabled:opacity-50"
        >
          {loading ? "Please wait..." : "Download Excel"}
        </button>
      </div>
    </div>
  );
}

export default Excel;
