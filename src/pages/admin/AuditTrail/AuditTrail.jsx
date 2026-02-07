import { useEffect, useState } from "react";
import {
  Search, Filter, Calendar, Download, RefreshCw, ChevronLeft, ChevronRight,
  FileText, Briefcase, Home, Bus, Shield, Clock, CheckCircle, XCircle,
  AlertTriangle, User, Activity, Eye, X, ChevronDown, Loader2
} from "lucide-react";

const PERMIT_COLORS = {
  business: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300", icon: Briefcase },
  barangay: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-300", icon: Home },
  franchise: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-300", icon: Bus },
  system: { bg: "bg-gray-100 dark:bg-gray-900/30", text: "text-gray-700 dark:text-gray-300", icon: Shield },
};

const STATUS_STYLES = {
  submitted: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-300", icon: Clock },
  approved: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-300", icon: CheckCircle },
  rejected: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-300", icon: XCircle },
  "for compliance": { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-300", icon: AlertTriangle },
  "under review": { bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-700 dark:text-indigo-300", icon: Eye },
  login: { bg: "bg-cyan-100 dark:bg-cyan-900/30", text: "text-cyan-700 dark:text-cyan-300", icon: User },
  registration: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300", icon: User },
  completed: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-300", icon: CheckCircle },
  pending: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-300", icon: Clock },
};

export default function AuditTrail() {
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showFilters, setShowFilters] = useState(true);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  useEffect(() => {
    fetchAuditTrail();
  }, [currentPage, filterType, filterStatus, itemsPerPage]);

  const fetchAuditTrail = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        mode: "all",
        page: currentPage,
        limit: itemsPerPage,
        type: filterType,
        status: filterStatus,
      });

      if (search) params.append("search", search);
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
    setFilterType("all");
    setFilterStatus("all");
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
    setTimeout(() => fetchAuditTrail(), 0);
  };

  const getStatusStyle = (action) => {
    return STATUS_STYLES[action?.toLowerCase()] || STATUS_STYLES.pending;
  };

  const getPermitStyle = (category) => {
    return PERMIT_COLORS[category] || PERMIT_COLORS.system;
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
    const headers = ["ID", "Date", "Applicant", "Email", "Permit Type", "Action", "Status", "Description"];
    const rows = activities.map((a) => [
      a.id, a.date || "", a.applicant_name, a.email, a.permit_type, a.action, a.status, a.action_description,
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
            Monitor all system activities and permit transactions
          </p>
        </div>
        <div className="flex items-center gap-2">
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
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Total Activities", value: stats.total, icon: Activity, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
            { label: "Submitted", value: stats.submitted, icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-900/20" },
            { label: "Approved", value: stats.approved, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20" },
            { label: "Rejected", value: stats.rejected, icon: XCircle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-900/20" },
            { label: "For Compliance", value: stats.compliance, icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-900/20" },
          ].map((stat, idx) => (
            <div key={idx} className={`${stat.bg} rounded-2xl p-4 border border-slate-100 dark:border-slate-700`}>
              <div className="flex items-center justify-between">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <span className={`text-2xl font-bold ${stat.color}`}>{stat.value}</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Type Distribution */}
      {stats?.by_type && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Business", value: stats.by_type.business, ...PERMIT_COLORS.business },
            { label: "Barangay", value: stats.by_type.barangay, ...PERMIT_COLORS.barangay },
            { label: "Franchise", value: stats.by_type.franchise, ...PERMIT_COLORS.franchise },
            { label: "System", value: stats.by_type.system, ...PERMIT_COLORS.system },
          ].map((item, idx) => (
            <div key={idx} className={`${item.bg} rounded-xl p-3 border border-slate-100 dark:border-slate-700 flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <item.icon className={`w-4 h-4 ${item.text}`} />
                <span className={`text-sm font-medium ${item.text}`}>{item.label}</span>
              </div>
              <span className={`text-lg font-bold ${item.text}`}>{item.value}</span>
            </div>
          ))}
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
          <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${showFilters ? "rotate-180" : ""}`} />
        </button>

        {showFilters && (
          <div className="mt-4 space-y-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, email, or business..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4CAF50] dark:text-white"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 bg-[#4CAF50] text-white rounded-xl text-sm hover:bg-[#43A047] transition-colors"
              >
                Search
              </button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Permit Type Filter */}
              <select
                value={filterType}
                onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4CAF50] dark:text-white"
              >
                <option value="all">All Permit Types</option>
                <option value="business">Business Permit</option>
                <option value="barangay">Barangay Permit</option>
                <option value="franchise">Franchise Permit</option>
              </select>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4CAF50] dark:text-white"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="for compliance">For Compliance</option>
              </select>

              {/* Date From */}
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4CAF50] dark:text-white"
                  placeholder="From"
                />
              </div>

              {/* Date To */}
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4CAF50] dark:text-white"
                  placeholder="To"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleDateFilter}
                  className="flex-1 px-3 py-2.5 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 transition-colors"
                >
                  Apply
                </button>
                <button
                  onClick={clearFilters}
                  className="px-3 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                  Clear
                </button>
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
            <button
              onClick={fetchAuditTrail}
              className="mt-3 px-4 py-2 bg-[#4CAF50] text-white rounded-xl text-sm hover:bg-[#43A047]"
            >
              Retry
            </button>
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
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">ID</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Applicant</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Permit Type</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {activities.map((activity, idx) => {
                    const statusStyle = getStatusStyle(activity.action);
                    const permitStyle = getPermitStyle(activity.permit_category);
                    const StatusIcon = statusStyle.icon;
                    const PermitIcon = permitStyle.icon;

                    return (
                      <tr
                        key={`${activity.id}-${idx}`}
                        className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                        onClick={() => setSelectedActivity(activity)}
                      >
                        <td className="px-4 py-3">
                          <span className="text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            {formatDate(activity.date)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-mono font-medium text-slate-700 dark:text-slate-300">
                            {activity.id}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-slate-800 dark:text-white">
                              {activity.applicant_name || "N/A"}
                            </p>
                            <p className="text-xs text-slate-400">{activity.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${permitStyle.bg} ${permitStyle.text}`}>
                            <PermitIcon className="w-3 h-3" />
                            {activity.permit_type}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                            <StatusIcon className="w-3 h-3" />
                            {activity.action}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            activity.status?.toLowerCase() === "approved" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" :
                            activity.status?.toLowerCase() === "rejected" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" :
                            activity.status?.toLowerCase() === "pending" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" :
                            "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                          }`}>
                            {activity.status}
                          </span>
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
                    {pagination.total_items} activities
                  </span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    className="px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg text-sm dark:text-white"
                  >
                    <option value={10}>10/page</option>
                    <option value={20}>20/page</option>
                    <option value={50}>50/page</option>
                    <option value={100}>100/page</option>
                  </select>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-600 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  </button>
                  {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                    let pageNum;
                    if (pagination.total_pages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= pagination.total_pages - 2) {
                      pageNum = pagination.total_pages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === pageNum
                            ? "bg-[#4CAF50] text-white"
                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(pagination.total_pages, p + 1))}
                    disabled={currentPage >= pagination.total_pages}
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-600 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
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
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#4CAF50]" />
                Activity Details
              </h3>
              <button
                onClick={() => setSelectedActivity(null)}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: "Activity ID", value: selectedActivity.id },
                { label: "Date & Time", value: formatDate(selectedActivity.date) },
                { label: "Applicant", value: selectedActivity.applicant_name || "N/A" },
                { label: "Email", value: selectedActivity.email || "N/A" },
                { label: "Business Name", value: selectedActivity.business_name || "N/A" },
                { label: "Permit Type", value: selectedActivity.permit_type },
                { label: "Application Type", value: selectedActivity.application_type || "N/A" },
                { label: "Action", value: selectedActivity.action },
                { label: "Status", value: selectedActivity.status },
                { label: "Description", value: selectedActivity.action_description },
                { label: "Remarks", value: selectedActivity.remarks || "None" },
              ].map((field, idx) => (
                <div key={idx} className="flex justify-between items-start">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400 w-36 shrink-0">{field.label}</span>
                  <span className="text-sm text-slate-800 dark:text-white text-right">{field.value}</span>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end">
              <button
                onClick={() => setSelectedActivity(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
