import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import {
  Search, Calendar, RefreshCw, ChevronLeft, ChevronRight,
  FileText, Briefcase, Home, Bus, Shield, Clock, CheckCircle, XCircle,
  AlertTriangle, User, Activity, Eye, X, Loader2, Filter, ChevronDown
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

export default function UserAuditTrail() {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    if (user?.email) fetchAuditTrail();
  }, [user, currentPage, filterType, filterStatus, itemsPerPage]);

  const fetchAuditTrail = async () => {
    if (!user?.email) {
      setError("User not authenticated");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        mode: "user",
        email: user.email,
        page: currentPage,
        limit: itemsPerPage,
        type: filterType,
        status: filterStatus,
      });

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
        setError(data.message || "Failed to fetch activity trail");
      }
    } catch (err) {
      console.error("Activity trail fetch error:", err);
      setError("Failed to load your activity trail. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDateFilter = () => {
    setCurrentPage(1);
    fetchAuditTrail();
  };

  const clearFilters = () => {
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

  const formatRelativeDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return formatDate(dateStr);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Activity className="w-7 h-7 text-[#4CAF50]" />
            My Activity Trail
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            View your permit application history and account activities
          </p>
        </div>
        <button
          onClick={fetchAuditTrail}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors self-start"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Activities", value: stats.total, icon: Activity, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-200 dark:border-blue-800" },
            { label: "Approved", value: stats.approved, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20", border: "border-green-200 dark:border-green-800" },
            { label: "Pending", value: stats.submitted, icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-900/20", border: "border-yellow-200 dark:border-yellow-800" },
            { label: "Rejected", value: stats.rejected, icon: XCircle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-900/20", border: "border-red-200 dark:border-red-800" },
          ].map((stat, idx) => (
            <div key={idx} className={`${stat.bg} rounded-2xl p-5 border ${stat.border}`}>
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <span className={`text-3xl font-bold ${stat.color}`}>{stat.value}</span>
              </div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200 w-full"
        >
          <Filter className="w-4 h-4" />
          Filters
          <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${showFilters ? "rotate-180" : ""}`} />
        </button>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <select
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4CAF50] dark:text-white"
            >
              <option value="all">All Types</option>
              <option value="business">Business</option>
              <option value="barangay">Barangay</option>
              <option value="franchise">Franchise</option>
            </select>

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

            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4CAF50] dark:text-white"
              />
            </div>

            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4CAF50] dark:text-white"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleDateFilter}
                className="flex-1 px-3 py-2.5 bg-[#4CAF50] text-white rounded-xl text-sm hover:bg-[#43A047] transition-colors"
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
        )}
      </div>

      {/* Activity Timeline */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-base font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            Activity Timeline
          </h2>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#4CAF50] animate-spin mb-3" />
            <p className="text-sm text-slate-500">Loading your activities...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <XCircle className="w-8 h-8 text-red-400 mb-3" />
            <p className="text-sm text-red-500">{error}</p>
            <button onClick={fetchAuditTrail} className="mt-3 px-4 py-2 bg-[#4CAF50] text-white rounded-xl text-sm">
              Retry
            </button>
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-base font-medium text-slate-500 dark:text-slate-400">No activities yet</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
              Your permit application activities will appear here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {activities.map((activity, idx) => {
              const statusStyle = getStatusStyle(activity.action);
              const permitStyle = getPermitStyle(activity.permit_category);
              const StatusIcon = statusStyle.icon;
              const PermitIcon = permitStyle.icon;

              return (
                <div
                  key={`${activity.id}-${idx}`}
                  className="flex items-start gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer"
                  onClick={() => setSelectedActivity(activity)}
                >
                  {/* Timeline Dot */}
                  <div className={`mt-1 w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${statusStyle.bg}`}>
                    <StatusIcon className={`w-5 h-5 ${statusStyle.text}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-white">
                          {activity.action_description}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${permitStyle.bg} ${permitStyle.text}`}>
                            <PermitIcon className="w-3 h-3" />
                            {activity.permit_type}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">{activity.id}</span>
                          {activity.business_name && (
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              &bull; {activity.business_name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          activity.status?.toLowerCase() === "approved" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" :
                          activity.status?.toLowerCase() === "rejected" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" :
                          activity.status?.toLowerCase() === "pending" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" :
                          "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                        }`}>
                          {activity.status}
                        </span>
                        <p className="text-xs text-slate-400 mt-1">{formatRelativeDate(activity.date)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.total_pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700">
            <span className="text-sm text-slate-500">
              Page {pagination.current_page} of {pagination.total_pages}
            </span>
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
      </div>

      {/* Detail Modal */}
      {selectedActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setSelectedActivity(null)}>
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
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
                { label: "Permit Type", value: selectedActivity.permit_type },
                { label: "Application Type", value: selectedActivity.application_type || "N/A" },
                { label: "Action", value: selectedActivity.action },
                { label: "Status", value: selectedActivity.status },
                { label: "Description", value: selectedActivity.action_description },
                { label: "Business Name", value: selectedActivity.business_name || "N/A" },
                { label: "Remarks", value: selectedActivity.remarks || "None" },
              ].map((field, idx) => (
                <div key={idx} className="flex justify-between items-start">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400 w-32 shrink-0">{field.label}</span>
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
