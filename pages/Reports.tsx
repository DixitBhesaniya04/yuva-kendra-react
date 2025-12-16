import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../services/AuthContext";
import { db } from "../services/mockDb";
import { WeeklyReport, Kendra, City } from "../types";
import {
  Plus,
  Download,
  Share2,
  Filter,
  Save,
  Search,
  FileText,
  Eye,
  X,
} from "lucide-react";

const Reports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [kendras, setKendras] = useState<Kendra[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // View Modal State
  const [viewReport, setViewReport] = useState<WeeklyReport | null>(null);

  // Export Menu State
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    kendra_id: "",
    week_start_date: "",
    yuva_kendra_attendance: "",
    bhavferni_attendance: "",
    pravachan_attendance: "",
    gender: "Male",
    description: "",
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCity, setFilterCity] = useState("all");
  const [filterKendra, setFilterKendra] = useState("all");
  const [filterGender, setFilterGender] = useState("all");

  useEffect(() => {
    fetchData();

    // Close export menu when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target as Node)
      ) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    const [allReports, allKendras, allCities] = await Promise.all([
      db.getReports(),
      db.getKendras(),
      db.getCities(),
    ]);

    if (user?.role === "admin") {
      setReports(allReports);
      setKendras(allKendras);
      setCities(allCities);
    } else {
      // Member view: Only their Kendra
      setReports(allReports.filter((r) => r.kendra_id === user?.kendra_id));
      setKendras(allKendras.filter((k) => k.id === user?.kendra_id));
      setCities(allCities);
    }
    setLoading(false);
  };

  const handleShareWhatsApp = (report: WeeklyReport) => {
    const kendra = kendras.find((k) => k.id === report.kendra_id);
    const kendraName = kendra?.kendra_name || "Unknown Kendra";
    const city = cities.find((c) => c.id === kendra?.city_id);
    const cityName = city?.city_name || "";

    const weekRange = `${new Date(
      report.week_start_date
    ).getDate()} - ${new Date(report.week_end_date).toLocaleDateString(
      undefined,
      { day: "numeric", month: "short" }
    )}`;

    const text =
      `*Yuva Kendra Reporting System*%0A` +
      `-----------------------%0A` +
      `*Kendra:* ${kendraName} (${cityName})%0A` +
      `*Gender:* ${report.gender}%0A` +
      `*Week:* ${weekRange}%0A` +
      `*Yuva Kendra Attendance:* ${report.yuva_kendra_attendance}%0A` +
      `*Bhavferni Attendance:* ${report.bhavferni_attendance}%0A` +
      `*Pravachan Attendance:* ${report.pravachan_attendance}%0A` +
      (report.description ? `*Note:* ${report.description}` : "");

    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handleExport = (type: "pdf" | "excel") => {
    setShowExportMenu(false);
    alert(
      `Mock Export: Generating ${type.toUpperCase()} file for ${
        reports.length
      } records...`
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Determine target Kendra
    // If admin, use selected form data. If member (legacy support), use user.kendra_id.
    const targetKendraId =
      user?.role === "admin" ? formData.kendra_id : user?.kendra_id;

    if (!targetKendraId) {
      alert("Please select a Kendra.");
      return;
    }

    const startDate = new Date(formData.week_start_date);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    try {
      await db.addReport({
        kendra_id: targetKendraId,
        week_start_date: formData.week_start_date,
        week_end_date: endDate.toISOString().split("T")[0],
        yuva_kendra_attendance: Number(formData.yuva_kendra_attendance),
        bhavferni_attendance: Number(formData.bhavferni_attendance),
        pravachan_attendance: Number(formData.pravachan_attendance),
        gender: formData.gender as "Male" | "Female",
        description: formData.description,
        created_by: user!.id,
      });

      setShowForm(false);
      setFormData({
        kendra_id: "",
        week_start_date: "",
        yuva_kendra_attendance: "",
        bhavferni_attendance: "",
        pravachan_attendance: "",
        gender: "Male",
        description: "",
      });
      fetchData();
    } catch (error: any) {
      alert(error.message || "Failed to create report. Please try again.");
    }
  };

  const filteredReports = reports.filter((r) => {
    // 1. Search Query (Check Kendra name OR Description/Note)
    const kendra = kendras.find((k) => k.id === r.kendra_id);
    const kendraName = kendra?.kendra_name.toLowerCase() || "";
    const note = r.description?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();

    if (searchQuery) {
      // Return true if EITHER name OR note includes the query
      if (!kendraName.includes(query) && !note.includes(query)) {
        return false;
      }
    }

    // 2. City Filter
    if (filterCity !== "all") {
      if (kendra?.city_id !== filterCity) return false;
    }

    // 3. Kendra Filter
    if (filterKendra !== "all") {
      if (r.kendra_id !== filterKendra) return false;
    }

    // 4. Gender Filter
    if (filterGender !== "all") {
      if (r.gender !== filterGender) return false;
    }

    return true;
  });

  // Helper to get city name for a report
  const getCityName = (kendraId: string) => {
    const kendra = kendras.find((k) => k.id === kendraId);
    if (!kendra) return "N/A";
    const city = cities.find((c) => c.id === kendra.city_id);
    return city?.city_name || "N/A";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Weekly Reports</h2>
          <p className="text-gray-500 text-sm">View attendance reports</p>
        </div>
        <div className="flex gap-2">
          {/* Export Dropdown - Fixed with Click Toggle */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1">
              <Download size={16} />
              Export
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-10 animation-fade-in">
                <button
                  onClick={() => handleExport("excel")}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700">
                  Excel (.xlsx)
                </button>
                <button
                  onClick={() => handleExport("pdf")}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700">
                  PDF Document
                </button>
              </div>
            )}
          </div>

          {/* New Report Button - ADMIN ONLY */}
          {user?.role === "admin" && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium">
              {showForm ? (
                "Cancel"
              ) : (
                <>
                  <Plus size={16} />
                  New Report
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-100 animation-fade-in">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Filter size={18} className="text-indigo-600" />
            Submit Weekly Data
          </h3>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Kendra Selection (Admin Only) */}
            {user?.role === "admin" && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Kendra
                </label>
                <select
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900"
                  value={formData.kendra_id}
                  onChange={(e) =>
                    setFormData({ ...formData, kendra_id: e.target.value })
                  }>
                  <option value="">-- Choose a Kendra --</option>
                  {kendras.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.kendra_name} ({getCityName(k.id)})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Week Start Date
              </label>
              <input
                type="date"
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white text-gray-900"
                value={formData.week_start_date}
                onChange={(e) =>
                  setFormData({ ...formData, week_start_date: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender Group
              </label>
              <select
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900"
                value={formData.gender}
                onChange={(e) =>
                  setFormData({ ...formData, gender: e.target.value })
                }>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div className="space-y-4 md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Yuva Kendra Attendance
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900"
                  value={formData.yuva_kendra_attendance}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      yuva_kendra_attendance: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bhavferni Attendance
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900"
                  value={formData.bhavferni_attendance}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bhavferni_attendance: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pravachan Attendance
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900"
                  value={formData.pravachan_attendance}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pravachan_attendance: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900"
                rows={3}
                placeholder="Optional report details..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
                <Save size={18} />
                Submit Report
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters (Admin Only) */}
      {user?.role === "admin" && (
        <div className="flex flex-col md:flex-row gap-3 items-center bg-white p-4 rounded-lg border border-gray-100">
          <div className="relative flex-1 w-full md:w-auto">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search Kendra or Notes..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <select
              className="flex-1 md:w-auto px-3 py-2 border rounded-lg bg-white text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={filterCity}
              onChange={(e) => {
                setFilterCity(e.target.value);
                setFilterKendra("all"); // Reset Kendra filter
              }}>
              <option value="all">All Cities</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.city_name}
                </option>
              ))}
            </select>

            <select
              className="flex-1 md:w-auto px-3 py-2 border rounded-lg bg-white text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={filterKendra}
              onChange={(e) => setFilterKendra(e.target.value)}>
              <option value="all">All Kendras</option>
              {kendras
                .filter((k) => filterCity === "all" || k.city_id === filterCity)
                .map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.kendra_name}
                  </option>
                ))}
            </select>

            <select
              className="flex-1 md:w-auto px-3 py-2 border rounded-lg bg-white text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}>
              <option value="all">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
        </div>
      )}

      {/* Reports List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold">
                <th className="px-6 py-4">Period</th>
                <th className="px-6 py-4">Kendra / City</th>
                <th className="px-6 py-4">Gender</th>
                <th className="px-6 py-4 text-center">Yuva</th>
                <th className="px-6 py-4 text-center">Bhavferni</th>
                <th className="px-6 py-4 text-center">Pravachan</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-gray-500">
                    Loading records...
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-gray-500">
                    No reports found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr
                    key={report.id}
                    className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(report.week_start_date).toLocaleDateString(
                          undefined,
                          { month: "short", day: "numeric" }
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        to{" "}
                        {new Date(report.week_end_date).toLocaleDateString(
                          undefined,
                          { month: "short", day: "numeric" }
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {kendras.find((k) => k.id === report.kendra_id)
                          ?.kendra_name || "N/A"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {getCityName(report.kendra_id)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          report.gender === "Male"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-pink-100 text-pink-700"
                        }`}>
                        {report.gender || "Male"}
                      </span>
                      {report.description && (
                        <div className="mt-1 text-xs text-gray-400 flex items-center gap-1">
                          <FileText size={10} /> Note present
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-medium text-indigo-600 bg-indigo-50/50 rounded-lg">
                      {report.yuva_kendra_attendance}
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-medium text-emerald-600 bg-emerald-50/50 rounded-lg">
                      {report.bhavferni_attendance}
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-medium text-amber-600 bg-amber-50/50 rounded-lg">
                      {report.pravachan_attendance}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => setViewReport(report)}
                        className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full transition-colors inline-block"
                        title="View Details">
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleShareWhatsApp(report)}
                        className="text-green-600 hover:text-green-700 p-2 hover:bg-green-50 rounded-full transition-colors inline-block"
                        title="Share on WhatsApp">
                        <Share2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW MODAL */}
      {viewReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 relative animate-[fadeIn_0.2s_ease-out]">
            <button
              onClick={() => setViewReport(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-full transition-colors">
              <X size={24} />
            </button>

            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                Report Details
              </h3>
              <p className="text-indigo-600 font-medium mt-1">
                {
                  kendras.find((k) => k.id === viewReport.kendra_id)
                    ?.kendra_name
                }
                <span className="text-gray-400 text-sm font-normal ml-2">
                  ({getCityName(viewReport.kendra_id)})
                </span>
              </p>
            </div>

            <div className="space-y-6">
              {/* Top Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-indigo-50 p-3 rounded-lg text-center border border-indigo-100">
                  <div className="text-2xl font-bold text-indigo-700">
                    {viewReport.yuva_kendra_attendance}
                  </div>
                  <div className="text-xs text-indigo-600 font-medium uppercase tracking-wide mt-1">
                    Yuva
                  </div>
                </div>
                <div className="bg-emerald-50 p-3 rounded-lg text-center border border-emerald-100">
                  <div className="text-2xl font-bold text-emerald-700">
                    {viewReport.bhavferni_attendance}
                  </div>
                  <div className="text-xs text-emerald-600 font-medium uppercase tracking-wide mt-1">
                    Bhavferni
                  </div>
                </div>
                <div className="bg-amber-50 p-3 rounded-lg text-center border border-amber-100">
                  <div className="text-2xl font-bold text-amber-700">
                    {viewReport.pravachan_attendance}
                  </div>
                  <div className="text-xs text-amber-600 font-medium uppercase tracking-wide mt-1">
                    Pravachan
                  </div>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Week Duration
                  </label>
                  <p className="text-gray-800 font-medium">
                    {new Date(viewReport.week_start_date).toLocaleDateString(
                      undefined,
                      { day: "numeric", month: "short" }
                    )}
                    {" - "}
                    {new Date(viewReport.week_end_date).toLocaleDateString(
                      undefined,
                      { day: "numeric", month: "short", year: "numeric" }
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Gender Group
                  </label>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      viewReport.gender === "Male"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-pink-100 text-pink-800"
                    }`}>
                    {viewReport.gender}
                  </span>
                </div>
              </div>

              {/* Note Section */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2 flex items-center gap-1">
                  <FileText size={12} /> Notes / Description
                </label>
                <div className="p-4 bg-gray-50 rounded-lg text-gray-700 text-sm whitespace-pre-wrap min-h-[100px] border border-gray-200">
                  {viewReport.description ? (
                    viewReport.description
                  ) : (
                    <span className="text-gray-400 italic">
                      No notes provided for this report.
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setViewReport(null)}
                className="px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium text-sm shadow-lg shadow-gray-200 transition-all transform active:scale-95">
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
