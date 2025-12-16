import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { db } from "../services/mockDb";
import { City, Kendra, User } from "../types";
import {
  Trash2,
  Users,
  Edit2,
  X,
  Check,
  MapPin,
  Building2,
  Lock,
  Search,
  Filter,
} from "lucide-react";

const AdminManagement = () => {
  const location = useLocation();
  // Determine the current view based on the URL path segment (cities, kendras, or users)
  const currentView = location.pathname.split("/").pop() || "cities";

  const [cities, setCities] = useState<City[]>([]);
  const [kendras, setKendras] = useState<Kendra[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // --- Search & Filter State ---
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCityId, setFilterCityId] = useState("");
  const [filterKendraId, setFilterKendraId] = useState("");

  // --- City Form State ---
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [cityName, setCityName] = useState("");
  const [cityPin, setCityPin] = useState("");

  // --- Kendra Form State ---
  const [editingKendra, setEditingKendra] = useState<Kendra | null>(null);
  const [kendraName, setKendraName] = useState("");
  const [kendraCityId, setKendraCityId] = useState("");

  // --- User Form State ---
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userRole, setUserRole] = useState<"admin" | "member">("member");
  const [userKendraId, setUserKendraId] = useState("");

  useEffect(() => {
    loadData();
    resetForms();
    // Reset filters when switching views
    setSearchQuery("");
    setFilterCityId("");
    setFilterKendraId("");
  }, [currentView]);

  const loadData = async () => {
    const [c, k, u] = await Promise.all([
      db.getCities(),
      db.getKendras(),
      db.getUsers(),
    ]);
    setCities(c);
    setKendras(k);
    setUsers(u);
  };

  const resetForms = () => {
    setEditingCity(null);
    setCityName("");
    setCityPin("");

    setEditingKendra(null);
    setKendraName("");
    setKendraCityId("");

    setEditingUser(null);
    setUserName("");
    setUserEmail("");
    setUserPassword("");
    setUserRole("member");
    setUserKendraId("");
  };

  // --- Filter Logic ---
  const getFilteredCities = () => {
    return cities.filter(
      (c) =>
        c.city_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.pin_code.includes(searchQuery)
    );
  };

  const getFilteredKendras = () => {
    return kendras.filter((k) => {
      const matchesSearch = k.kendra_name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCity = filterCityId ? k.city_id === filterCityId : true;
      return matchesSearch && matchesCity;
    });
  };

  const getFilteredUsers = () => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase());

      let matchesKendra = true;
      if (filterKendraId) {
        matchesKendra = u.kendra_id === filterKendraId;
      }

      let matchesCity = true;
      if (filterCityId) {
        // If user has a kendra, check if that kendra is in the filtered city
        if (u.kendra_id) {
          const k = kendras.find((k) => k.id === u.kendra_id);
          matchesCity = k?.city_id === filterCityId;
        } else {
          // Admins or unassigned users don't match city filter strictly
          matchesCity = false;
        }
      }

      return matchesSearch && matchesKendra && matchesCity;
    });
  };

  // --- City Handlers ---
  const handleCitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingCity) {
        await db.updateCity({
          id: editingCity.id,
          city_name: cityName,
          pin_code: cityPin,
        });
      } else {
        await db.addCity({ city_name: cityName, pin_code: cityPin });
      }
      resetForms();
      loadData();
    } catch (err) {
      alert("Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleEditCity = (city: City) => {
    setEditingCity(city);
    setCityName(city.city_name);
    setCityPin(city.pin_code);
  };

  const handleDeleteCity = async (id: string) => {
    if (confirm("Delete city? This might affect linked Kendras.")) {
      await db.deleteCity(id);
      loadData();
    }
  };

  // --- Kendra Handlers ---
  const handleKendraSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kendraCityId) {
      alert("Please select a city.");
      return;
    }

    setLoading(true);
    try {
      if (editingKendra) {
        await db.updateKendra({
          id: editingKendra.id,
          kendra_name: kendraName,
          city_id: kendraCityId,
        });
      } else {
        await db.addKendra({ kendra_name: kendraName, city_id: kendraCityId });
      }
      resetForms();
      loadData();
    } catch (err) {
      alert("Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleEditKendra = (kendra: Kendra) => {
    setEditingKendra(kendra);
    setKendraName(kendra.kendra_name);
    setKendraCityId(kendra.city_id);
  };

  const handleDeleteKendra = async (id: string) => {
    if (confirm("Delete Kendra?")) {
      await db.deleteKendra(id);
      loadData();
    }
  };

  // --- User Handlers ---
  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (userRole === "member" && !userKendraId) {
      alert("Please assign a Kendra to the member.");
      return;
    }

    if (!editingUser && !userPassword) {
      alert("Password is required for new users.");
      return;
    }

    setLoading(true);

    const payload = {
      name: userName,
      email: userEmail,
      role: userRole,
      kendra_id: userRole === "member" ? userKendraId : undefined,
    };

    try {
      if (editingUser) {
        await db.updateUser({ ...payload, id: editingUser.id });
      } else {
        await db.addUser(payload, userPassword);
      }

      resetForms();
      loadData();
    } catch (err: any) {
      alert(`Error: ${err.message || "Failed to save user"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserName(user.name);
    setUserEmail(user.email);
    setUserRole(user.role);
    setUserKendraId(user.kendra_id || "");
    setUserPassword("");
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      await db.deleteUser(id);
      loadData();
    }
  };

  const getPageTitle = () => {
    switch (currentView) {
      case "cities":
        return "City Management";
      case "kendras":
        return "Kendra Management";
      case "users":
        return "User Management";
      default:
        return "System Management";
    }
  };

  // Helper for Kendra dropdown in User form
  const getKendraOptionsForForm = () => {
    return kendras;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">{getPageTitle()}</h2>

      {/* Content */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        {/* --- Cities Tab --- */}
        {currentView === "cities" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              {/* Search Bar */}
              <div className="relative w-full md:max-w-xs">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search cities..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <form
              onSubmit={handleCitySubmit}
              className="flex flex-col md:flex-row gap-4 items-end bg-gray-50 p-4 rounded-lg border border-gray-100">
              <div className="flex-1 w-full">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  {editingCity ? "Edit City Name" : "New City Name"}
                </label>
                <input
                  className="w-full px-3 py-2 border rounded-md bg-white text-gray-900"
                  value={cityName}
                  onChange={(e) => setCityName(e.target.value)}
                  placeholder="e.g. Mumbai"
                  required
                />
              </div>
              <div className="w-full md:w-32">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  PIN Code
                </label>
                <input
                  className="w-full px-3 py-2 border rounded-md bg-white text-gray-900"
                  value={cityPin}
                  onChange={(e) => setCityPin(e.target.value)}
                  placeholder="400001"
                  required
                />
              </div>
              <div className="flex gap-2">
                {editingCity && (
                  <button
                    type="button"
                    onClick={resetForms}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300">
                    <X size={18} />
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-2">
                  {editingCity ? <Check size={18} /> : <MapPin size={18} />}
                  {editingCity ? "Update" : "Add"}
                </button>
              </div>
            </form>

            <ul className="divide-y divide-gray-100">
              {getFilteredCities().map((city) => (
                <li
                  key={city.id}
                  className="py-3 flex justify-between items-center group">
                  <div>
                    <p className="font-medium text-gray-800">
                      {city.city_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      PIN: {city.pin_code}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditCity(city)}
                      className="text-indigo-600 hover:text-indigo-800 p-2 hover:bg-indigo-50 rounded transition-colors"
                      title="Edit">
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteCity(city.id)}
                      className="text-gray-400 hover:text-red-600 p-2 hover:bg-red-50 rounded transition-colors"
                      title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              ))}
              {getFilteredCities().length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">
                  No cities found.
                </p>
              )}
            </ul>
          </div>
        )}

        {/* --- Kendras Tab --- */}
        {currentView === "kendras" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              {/* Filters */}
              <div className="flex flex-1 gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:max-w-xs">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="Search kendras..."
                    className="w-full pl-10 pr-4 py-2 border rounded-lg bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <select
                  className="px-3 py-2 border rounded-lg bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={filterCityId}
                  onChange={(e) => setFilterCityId(e.target.value)}>
                  <option value="">All Cities</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.city_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <form
              onSubmit={handleKendraSubmit}
              className="flex flex-col md:flex-row gap-4 items-end bg-gray-50 p-4 rounded-lg border border-gray-100">
              <div className="flex-1 w-full">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  {editingKendra ? "Edit Kendra Name" : "New Kendra Name"}
                </label>
                <input
                  className="w-full px-3 py-2 border rounded-md bg-white text-gray-900"
                  value={kendraName}
                  onChange={(e) => setKendraName(e.target.value)}
                  placeholder="e.g. Dadar West"
                  required
                />
              </div>
              <div className="flex-1 w-full">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  City
                </label>
                <select
                  className="w-full px-3 py-2 border rounded-md bg-white text-gray-900"
                  value={kendraCityId}
                  onChange={(e) => setKendraCityId(e.target.value)}
                  required>
                  <option value="" disabled>
                    Select City
                  </option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.city_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                {editingKendra && (
                  <button
                    type="button"
                    onClick={resetForms}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300">
                    <X size={18} />
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-2">
                  {editingKendra ? (
                    <Check size={18} />
                  ) : (
                    <Building2 size={18} />
                  )}
                  {editingKendra ? "Update" : "Add"}
                </button>
              </div>
            </form>

            <ul className="divide-y divide-gray-100">
              {getFilteredKendras().map((kendra) => (
                <li
                  key={kendra.id}
                  className="py-3 flex justify-between items-center group">
                  <div>
                    <p className="font-medium text-gray-800">
                      {kendra.kendra_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      City:{" "}
                      {cities.find((c) => c.id === kendra.city_id)?.city_name}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditKendra(kendra)}
                      className="text-indigo-600 hover:text-indigo-800 p-2 hover:bg-indigo-50 rounded transition-colors"
                      title="Edit">
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteKendra(kendra.id)}
                      className="text-gray-400 hover:text-red-600 p-2 hover:bg-red-50 rounded transition-colors"
                      title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              ))}
              {getFilteredKendras().length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">
                  No Kendras found.
                </p>
              )}
            </ul>
          </div>
        )}

        {/* --- Users Tab --- */}
        {currentView === "users" && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col lg:flex-row gap-3 items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
              <div className="relative flex-1 w-full">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search users..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2 w-full lg:w-auto">
                <select
                  className="flex-1 px-3 py-2 border rounded-lg bg-white text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={filterCityId}
                  onChange={(e) => {
                    setFilterCityId(e.target.value);
                    setFilterKendraId(""); // Reset Kendra filter when city changes
                  }}>
                  <option value="">All Cities</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.city_name}
                    </option>
                  ))}
                </select>

                <select
                  className="flex-1 px-3 py-2 border rounded-lg bg-white text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={filterKendraId}
                  onChange={(e) => setFilterKendraId(e.target.value)}>
                  <option value="">All Kendras</option>
                  {kendras
                    .filter((k) => !filterCityId || k.city_id === filterCityId)
                    .map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.kendra_name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* User Form */}
            <form
              onSubmit={handleUserSubmit}
              className="bg-gray-50 p-4 rounded-lg space-y-4 border border-gray-100">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-gray-700 flex items-center gap-2">
                  {editingUser ? <Edit2 size={16} /> : <Users size={16} />}
                  {editingUser ? "Edit User" : "Create New User"}
                </h3>
                {editingUser && (
                  <button
                    type="button"
                    onClick={resetForms}
                    className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm">
                    <X size={14} /> Cancel Edit
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Full Name
                  </label>
                  <input
                    className="w-full px-3 py-2 border rounded-md bg-white text-gray-900"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border rounded-md bg-white text-gray-900"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="john@example.com"
                    required
                  />
                </div>

                {!editingUser && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full px-3 py-2 border rounded-md bg-white text-gray-900"
                        value={userPassword}
                        onChange={(e) => setUserPassword(e.target.value)}
                        placeholder="Set initial password"
                        required={!editingUser}
                        minLength={6}
                      />
                      <Lock
                        className="absolute right-3 top-2.5 text-gray-400"
                        size={14}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Role
                  </label>
                  <select
                    className="w-full px-3 py-2 border rounded-md bg-white text-gray-900"
                    value={userRole}
                    onChange={(e) =>
                      setUserRole(e.target.value as "admin" | "member")
                    }>
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                {userRole === "member" && (
                  <div className={!editingUser ? "md:col-span-2" : ""}>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Assign Kendra
                    </label>
                    <select
                      className="w-full px-3 py-2 border rounded-md bg-white text-gray-900"
                      value={userKendraId}
                      onChange={(e) => setUserKendraId(e.target.value)}
                      required={userRole === "member"}>
                      <option value="">Select Kendra</option>
                      {getKendraOptionsForForm().map((k) => (
                        <option key={k.id} value={k.id}>
                          {k.kendra_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-2">
                  {editingUser ? <Check size={16} /> : <Users size={16} />}
                  {loading
                    ? "Processing..."
                    : editingUser
                    ? "Update User"
                    : "Create User & Login"}
                </button>
              </div>
            </form>

            <table className="w-full text-left">
              <thead>
                <tr className="text-xs text-gray-500 uppercase border-b">
                  <th className="py-2">Name</th>
                  <th className="py-2">Role</th>
                  <th className="py-2">Assigned Kendra</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredUsers().map((u) => (
                  <tr
                    key={u.id}
                    className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-3 font-medium text-gray-800">
                      {u.name}
                      <div className="text-xs text-gray-500 font-normal">
                        {u.email}
                      </div>
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          u.role === "admin"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                        }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 text-sm text-gray-600">
                      {kendras.find((k) => k.id === u.kendra_id)?.kendra_name ||
                        "-"}
                    </td>
                    <td className="py-3 text-right space-x-2">
                      <button
                        onClick={() => handleEditUser(u)}
                        className="text-indigo-600 hover:text-indigo-800 p-1 hover:bg-indigo-50 rounded"
                        title="Edit User">
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded"
                        title="Delete User">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {getFilteredUsers().length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-4 text-center text-gray-500 text-sm">
                      No users found matching filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminManagement;
