
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserRound,
  Tags,
  FileSpreadsheet,
  LogOut,
  UserCircle,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isAdmin = ["super_admin", "sub_admin"].includes(user?.role);

  const navItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
      show: true,
    },
    {
      name: "Leads",
      path: "/leads",
      icon: UserRound,
      show: true,
    },
    {
      name: "User Management",
      path: "/users",
      icon: Users,
      show: user?.role === "super_admin",
    },
    {
      name: "Tags",
      path: "/tags",
      icon: Tags,
      show: true,
    },
    {
      name: "Excel Import / Export",
      path: "/excel",
      icon: FileSpreadsheet,
      show: true,
    },
  ];

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <aside className="w-64 min-h-screen bg-white border-r flex flex-col">
      {/* Logo / Brand */}
      <div className="p-5 border-b">
        <h1 className="text-xl font-bold text-blue-700">
          Ideamagix CRM
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Lead Management System
        </p>
      </div>

      {/* User Information */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <UserCircle size={35} className="text-gray-500" />

          <div className="min-w-0">
            <p className="font-medium text-sm truncate">
              {user?.name || "User"}
            </p>
            <p className="text-xs text-gray-500">
              {user?.role?.replace("_", " ")}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        <p className="text-xs font-semibold text-gray-400 uppercase px-3 py-2">
          Main Menu
        </p>

        {navItems
          .filter((item) => item.show)
          .map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-3 rounded text-sm transition ${
                    isActive
                      ? "bg-blue-100 text-blue-700 font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                  }`
                }
              >
                <Icon size={19} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 text-red-600 hover:bg-red-50 rounded text-sm"
        >
          <LogOut size={19} />
          Logout
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
