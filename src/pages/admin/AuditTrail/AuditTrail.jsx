import { useEffect, useState } from "react";
import {
  Search, Filter, Calendar, Download, RefreshCw, ChevronLeft, ChevronRight,
  FileText, Briefcase, Home, Bus, Shield, Clock, CheckCircle, XCircle,
  AlertTriangle, User, Users, Activity, Eye, X, ChevronDown, Loader2,
  LogIn, LogOut, UserPlus, ClipboardList
} from "lucide-react";

const ACTION_ICONS = {
  "login": LogIn,
  "logout": LogOut,
  "registration": UserPlus,
  "account registration": UserPlus,
  "permit submission": ClipboardList,
  "permit approved": CheckCircle,
  "permit rejected": XCircle,
  "for compliance": AlertTriangle,
  "under review": Eye,
  "profile update": User,
  "password change": Shield,
  "page visit": Eye,
};

const CATEGORY_STYLES = {
  account: { bg: "bg-cyan-100 dark:bg-cyan-900/30", text: "text-cyan-700 dark:text-cyan-300", label: "Account" },
  permit: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300", label: "Permit" },
  navigation: { bg: "bg-slate-100 dark:bg-slate-700", text: "text-slate-600 dark:text-slate-300", label: "Navigation" },
  system: { bg: "bg-gray-100 dark:bg-gray-900/30", text: "text-gray-700 dark:text-gray-300", label: "System" },
};

export default function AuditTrail() {
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterUser, setFilterUser] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showFilters, setShowFilters] = useState(true);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [showUserPanel, setShowUserPanel] = useState(false);

  useEffect(() => {
    fetchAuditTrail();
  }, [currentPage, filterCategory, filterUser, itemsPerPage]);

  const fetchAuditTrail = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        mode: "all",
        page: currentPage,
        limit: itemsPerPage,
        category: filterCategory,
      });

      if (search) params.append("search", search);
      if (filterUser) params.append("filter_user", filterUser);
      if (dateFrom) params.append("date_from", dateFrom);
      if (dateTo) params.append("date_to", dateTo);

      const response = await fetch(`/backend/api/audit_trail.php?${params}`, {
        credentials: "include",
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      if (data.success) {
        setActivities(data.activities || []);
        setStats(data.stats || null);
        setPagination(data.pagination || null);
        if (data.users) setUsersList(data.users);
      } else {
        setError(data.message || "Failed to fetch audit trail");
      }
    } catch (err) {
      console.error("Audit trail fetch error:", err);
      setError("Failed to load audit trail. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchAuditTrail();
  };

  const handleDateFilter = () => {
    setCurrentPage(1);
    fetchAuditTrail();
  };

  const clearFilters = () => {
    setSearch("");
    setFilterCategory("all");
    setFilterUser("");
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
    setTimeout(() => fetchAuditTrail(), 0);
  };

  const selectUser = (email) => {
    setFilterUser(email);
    setCurrentPage(1);
    setShowUserPanel(false);
    setTimeout(() => fetchAuditTrail(), 0);
  };

  const getActionIcon = (action) => {
    const Icon = ACTION_ICONS[action?.toLowerCase()] || Activity;
    return Icon;
  };

  const getCategoryStyle = (cat) => {
    return CATEGORY_STYLES[cat] || CATEGORY_STYLES.system;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const exportCSV = () => {
    if (!activities.length) return;
    const headers = ["ID", "Date", "User", "Email", "Role", "Action", "Category", "Description", "Module", "Reference"];
    const rows = activities.map((a) => [
      a.id, a.date || "", a.user_name, a.user_email, a.user_role, a.action, a.action_category, a.description, a.module, a.reference_id,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${(c || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit_trail_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-full mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Activity className="w-7 h-7 text-[#4CAF50]" />
            Audit Activity Trail
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track every user action across the entire system
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowUserPanel(!showUserPanel)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <Users className="w-4 h-4" />
            Users ({usersList.length})
          </button>
          <button
            onClick={fetchAuditTrail}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-[#4CAF50] text-white rounded-xl text-sm hover:bg-[#43A047] transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 border border-blue-100 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <Activity className="w-5 h-5 text-blue-600" />
              <span className="text-2xl font-bold text-blue-600">{stats.total}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Total Activities</p>
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-4 border border-indigo-100 dark:border-indigo-800">
            <div className="flex items-center justify-between">
              <Users className="w-5 h-5 text-indigo-600" />
              <span className="text-2xl font-bold text-indigo-600">{stats.unique_users}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Unique Users</p>
          </div>
          <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-2xl p-4 border border-cyan-100 dark:border-cyan-800">
            <div className="flex items-center justify-between">
              <LogIn className="w-5 h-5 text-cyan-600" />
              <span className="text-2xl font-bold text-cyan-600">{stats.by_category?.account || 0}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Account Activities</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4 border border-green-100 dark:border-green-800">
            <div className="flex items-center justify-between">
              <ClipboardList className="w-5 h-5 text-green-600" />
              <span className="text-2xl font-bold text-green-600">{stats.by_category?.permit || 0}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Permit Activities</p>
          </div>
        </div>
      )}

      {/* Action breakdown */}
      {stats?.by_action && Object.keys(stats.by_action).length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Activity Breakdown</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.by_action).sort((a, b) => b[1] - a[1]).map(([action, count]) => {
              const Icon = getActionIcon(action);
              return (
                <span key={action} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-xs font-medium text-slate-700 dark:text-slate-300">
                  <Icon className="w-3.5 h-3.5" />
                  {action}
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold">{count}</span>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Users Side Panel */}
      {showUserPanel && usersList.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              System Users
            </h3>
            {filterUser && (
              <button
                onClick={() => selectUser("")}
                className="text-xs text-red-500 hover:underline"
              >
                Clear user filter
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
            {usersList.map((u) => (
              <button
                key={u.email}
                onClick={() => selectUser(u.email)}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${
                  filterUser === u.email
                    ? "bg-[#4CAF50]/10 border-[#4CAF50] ring-1 ring-[#4CAF50]"
                    : "border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-slate-500 dark:text-slate-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{u.name || u.email.split("@")[0]}</p>
                  <p className="text-xs text-slate-400 truncate">{u.email}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">
                  {u.activity_count}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filters Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200 w-full"
        >
          <Filter className="w-4 h-4" />
          Filters & Search
          {filterUser && <span className="ml-2 px-2 py-0.5 rounded-full bg-[#4CAF50]/10 text-[#4CAF50] text-xs">Filtered: {filterUser}</span>}
          <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${showFilters ? "rotate-180" : ""}`} />
        </button>

        {showFilters && (
          <div className="mt-4 space-y-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by user name, email, description..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4CAF50] dark:text-white"
                />
              </div>
              <button type="submit" className="px-4 py-2.5 bg-[#4CAF50] text-white rounded-xl text-sm hover:bg-[#43A047] transition-colors">
                Search
              </button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <select
                value={filterCategory}
                onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4CAF50] dark:text-white"
              >
                <option value="all">All Categories</option>
                <option value="account">Account (Login/Register/Logout)</option>
                <option value="permit">Permit Activities</option>
                <option value="navigation">Page Visits</option>
              </select>

              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4CAF50] dark:text-white" />
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4CAF50] dark:text-white" />
              </div>

              <div className="flex gap-2">
                <button onClick={handleDateFilter} className="flex-1 px-3 py-2.5 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 transition-colors">Apply</button>
                <button onClick={clearFilters} className="px-3 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">Clear</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Activities Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#4CAF50] animate-spin mb-3" />
            <p className="text-sm text-slate-500">Loading audit trail...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <XCircle className="w-8 h-8 text-red-400 mb-3" />
            <p className="text-sm text-red-500">{error}</p>
            <button onClick={fetchAuditTrail} className="mt-3 px-4 py-2 bg-[#4CAF50] text-white rounded-xl text-sm hover:bg-[#43A047]">Retry</button>
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <FileText className="w-8 h-8 text-slate-300 mb-3" />
            <p className="text-sm text-slate-500">No activities found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date & Time</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Module</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {activities.map((activity, idx) => {
                    const ActionIcon = getActionIcon(activity.action);
                    const catStyle = getCategoryStyle(activity.action_category);

                    return (
                      <tr
                        key={`${activity.id}-${idx}`}
                        className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                        onClick={() => setSelectedActivity(activity)}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm text-slate-700 dark:text-slate-300">{formatDate(activity.date)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                              <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{activity.user_name || "Unknown"}</p>
                              <p className="text-xs text-slate-400 truncate">{activity.user_email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-300">
                            <ActionIcon className="w-4 h-4 text-slate-400" />
                            {activity.action}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${catStyle.bg} ${catStyle.text}`}>
                            {catStyle.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xs truncate">{activity.description}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-slate-500 dark:text-slate-400">{activity.module || "—"}</span>
                        </td>
                        <td className="px-4 py-3">
                          <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                            <Eye className="w-4 h-4 text-slate-400" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && (
              <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700 gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-500">
                    Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{" "}
                    {Math.min(pagination.current_page * pagination.per_page, pagination.total_items)} of{" "}
                    {pagination.total_items}
                  </span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    className="px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg text-sm dark:text-white"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1}
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-600 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  </button>
                  {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                    let pageNum;
                    if (pagination.total_pages <= 5) pageNum = i + 1;
                    else if (currentPage <= 3) pageNum = i + 1;
                    else if (currentPage >= pagination.total_pages - 2) pageNum = pagination.total_pages - 4 + i;
                    else pageNum = currentPage - 2 + i;
                    return (
                      <button key={pageNum} onClick={() => setCurrentPage(pageNum)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${currentPage === pageNum ? "bg-[#4CAF50] text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"}`}>
                        {pageNum}
                      </button>
                    );
                  })}
                  <button onClick={() => setCurrentPage((p) => Math.min(pagination.total_pages, p + 1))} disabled={currentPage >= pagination.total_pages}
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-600 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selectedActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setSelectedActivity(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#4CAF50]" />
                Activity Details
              </h3>
              <button onClick={() => setSelectedActivity(null)} className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: "Activity ID", value: selectedActivity.id },
                { label: "Date & Time", value: formatDate(selectedActivity.date) },
                { label: "User", value: selectedActivity.user_name || "N/A" },
                { label: "Email", value: selectedActivity.user_email || "N/A" },
                { label: "Role", value: selectedActivity.user_role || "N/A" },
                { label: "Action", value: selectedActivity.action },
                { label: "Category", value: selectedActivity.action_category },
                { label: "Description", value: selectedActivity.description },
                { label: "Module", value: selectedActivity.module || "N/A" },
                { label: "Reference ID", value: selectedActivity.reference_id || "N/A" },
                { label: "IP Address", value: selectedActivity.ip_address || "N/A" },
              ].map((field, idx) => (
                <div key={idx} className="flex justify-between items-start">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400 w-32 shrink-0">{field.label}</span>
                  <span className="text-sm text-slate-800 dark:text-white text-right break-all">{field.value}</span>
                </div>
              ))}
              {selectedActivity.metadata && (
                <div>
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400 block mb-1">Metadata</span>
                  <pre className="text-xs bg-slate-50 dark:bg-slate-900 rounded-lg p-3 text-slate-600 dark:text-slate-400 overflow-auto max-h-32">
                    {JSON.stringify(selectedActivity.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end">
              <button onClick={() => setSelectedActivity(null)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
