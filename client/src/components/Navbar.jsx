
import { useAuth } from "../context/AuthContext";

function Navbar() {
    const { user } = useAuth();

    return (
        <header className="bg-white border-b px-6 py-4 flex justify-between">
            <h2 className="font-semibold text-gray-800">
                Customer Lead Management
            </h2>

            <div className="text-sm text-gray-600">
                Welcome, <strong>{user?.name}</strong>
            </div>
        </header>
    );
}

export default Navbar;
