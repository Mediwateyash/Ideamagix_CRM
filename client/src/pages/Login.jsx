
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const demoAccounts = [
    {
      role: "Super Admin",
      email: "admin@example.com",
      password: "admin@123",
    },
    {
      role: "Sub Admin",
      email: "subadmin@example.com",
      password: "subadmin@123",
    },
    {
      role: "Support Agent",
      email: "sales@support.com",
      password: "support@123",
    },
  ];

  const handleDemoFill = (account) => {
    setEmail(account.email);
    setPassword(account.password);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await API.post("/auth/login", {
        email,
        password,
      });

      login(response.data);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white border rounded-lg p-8 w-full max-w-md"
      >
        <h1 className="text-2xl font-semibold mb-2">CRM Login</h1>
        <p className="text-gray-500 mb-6">Sign in to your account</p>

        {error && <p className="text-red-600 mb-4">{error}</p>}

        <label className="block text-sm mb-2">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded p-2 mb-4"
          placeholder="Enter email"
          required
        />

        <label className="block text-sm mb-2">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded p-2 mb-5"
          placeholder="Enter password"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white rounded p-2 hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {/* Demo Credentials */}
        <div className="mt-6 border-t pt-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            Demo Credentials
          </h2>

          {demoAccounts.map((account) => (
            <div
              key={account.role}
              className="flex items-center justify-between gap-2 py-2 border-b last:border-b-0 text-xs"
            >
              <div>
                <p className="font-semibold text-gray-700">
                  {account.role}
                </p>
                <p className="text-gray-500">{account.email}</p>
                <p className="text-gray-500">{account.password}</p>
              </div>

              <button
                type="button"
                onClick={() => handleDemoFill(account)}
                className="text-blue-600 hover:underline whitespace-nowrap"
              >
                Click here to fill
              </button>
            </div>
          ))}

          <p className="text-xs text-gray-400 mt-3">
            For testing and evaluation purposes only.
          </p>
        </div>
      </form>
    </div>
  );
}

export default Login;
