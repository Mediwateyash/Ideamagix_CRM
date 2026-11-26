
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Sidebar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const isAdmin = ["super_admin", "sub_admin"].includes(user?.role);

    const linkStyle = ({ isActive }) =>
        `block px-4 py-2 rounded ${
            isActive
                ? "bg-blue-100 text-blue-800 font-semibold"
                : "text-gray-700 hover:bg-gray-100"
        }`;

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    return (
        <aside className="w-60 bg-white border-r min-h-screen p-4 flex flex-col">
            <h2 className="text-xl font-bold mb-8">
                Ideamagix CRM
            </h2>

            <nav className="space-y-2">
                <NavLink to="/dashboard" className={linkStyle}>
                    Dashboard
                </NavLink>

                <NavLink to="/leads" className={linkStyle}>
                    Leads
                </NavLink>

                {isAdmin && (
                    <NavLink to="/users" className={linkStyle}>
                        User Management
                    </NavLink>
                )}

                <NavLink to="/tags" className={linkStyle}>
                    Tags
                </NavLink>
            </nav>

            <div className="mt-auto border-t pt-4">
                <p className="font-medium">{user?.name}</p>
                <p className="text-sm text-gray-500 mb-3">
                    {user?.role}
                </p>

                <button
                    onClick={handleLogout}
                    className="text-red-600 hover:underline"
                >
                    Logout
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;
