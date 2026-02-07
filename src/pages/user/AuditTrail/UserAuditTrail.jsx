import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import {
  Calendar, RefreshCw, ChevronLeft, ChevronRight,
  FileText, Shield, Clock, CheckCircle, XCircle,
  AlertTriangle, User, Activity, Eye, X, Loader2, Filter, ChevronDown,
  LogIn, LogOut, UserPlus, ClipboardList, ArrowLeft
} from "lucide-react";

const ACTION_ICONS = {
  "login": LogIn, "logout": LogOut, "registration": UserPlus,
  "account registration": UserPlus, "permit submission": ClipboardList,
  "permit approved": CheckCircle, "permit rejected": XCircle,
  "for compliance": AlertTriangle, "under review": Eye,
  "profile update": User, "password change": Shield, "page visit": Eye,
};

const CATEGORY_STYLES = {
  account: { bg: "bg-cyan-100 dark:bg-cyan-900/30", text: "text-cyan-700 dark:text-cyan-300", label: "Account" },
  permit: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300", label: "Permit" },
  navigation: { bg: "bg-slate-100 dark:bg-slate-700", text: "text-slate-600 dark:text-slate-300", label: "Navigation" },
  system: { bg: "bg-gray-100 dark:bg-gray-900/30", text: "text-gray-700 dark:text-gray-300", label: "System" },
};

export default function UserAuditTrail() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterCategory, setFilterCategory] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  useEffect(() => {
    if (user?.email) fetchAuditTrail();
  }, [user, currentPage, filterCategory, itemsPerPage]);

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
        category: filterCategory,
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
    setFilterCategory("all");
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
    setTimeout(() => fetchAuditTrail(), 0);
  };

  const getActionIcon = (action) => ACTION_ICONS[action?.toLowerCase()] || Activity;
  const getCategoryStyle = (cat) => CATEGORY_STYLES[cat] || CATEGORY_STYLES.system;

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
          <button
            onClick={() => navigate("/user/dashboard")}
            className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-[#4CAF50] dark:hover:text-[#4CAF50] transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Activity className="w-7 h-7 text-[#4CAF50]" />
            My Activity Trail
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Your complete activity history across the system
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
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-5 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <span className="text-3xl font-bold text-blue-600">{stats.total}</span>
            </div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Activities</p>
          </div>
          <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-2xl p-5 border border-cyan-200 dark:border-cyan-800">
            <div className="flex items-center justify-between mb-2">
              <LogIn className="w-5 h-5 text-cyan-600" />
              <span className="text-3xl font-bold text-cyan-600">{stats.by_category?.account || 0}</span>
            </div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Account Activities</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-5 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between mb-2">
              <ClipboardList className="w-5 h-5 text-green-600" />
              <span className="text-3xl font-bold text-green-600">{stats.by_category?.permit || 0}</span>
            </div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Permit Activities</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-5 border border-slate-200 dark:border-slate-600">
            <div className="flex items-center justify-between mb-2">
              <Eye className="w-5 h-5 text-slate-500" />
              <span className="text-3xl font-bold text-slate-600 dark:text-slate-300">{stats.by_category?.navigation || 0}</span>
            </div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Page Visits</p>
          </div>
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
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <select
              value={filterCategory}
              onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4CAF50] dark:text-white"
            >
              <option value="all">All Categories</option>
              <option value="account">Account (Login/Logout)</option>
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
              <button onClick={handleDateFilter} className="flex-1 px-3 py-2.5 bg-[#4CAF50] text-white rounded-xl text-sm hover:bg-[#43A047] transition-colors">Apply</button>
              <button onClick={clearFilters} className="px-3 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">Clear</button>
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
            <button onClick={fetchAuditTrail} className="mt-3 px-4 py-2 bg-[#4CAF50] text-white rounded-xl text-sm">Retry</button>
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-base font-medium text-slate-500 dark:text-slate-400">No activities yet</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Your activities will appear here as you use the system</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {activities.map((activity, idx) => {
              const ActionIcon = getActionIcon(activity.action);
              const catStyle = getCategoryStyle(activity.action_category);

              return (
                <div
                  key={`${activity.id}-${idx}`}
                  className="flex items-start gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer"
                  onClick={() => setSelectedActivity(activity)}
                >
                  <div className={`mt-0.5 w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${catStyle.bg}`}>
                    <ActionIcon className={`w-5 h-5 ${catStyle.text}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-white">
                          {activity.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${catStyle.bg} ${catStyle.text}`}>
                            {catStyle.label}
                          </span>
                          {activity.module && (
                            <span className="text-xs text-slate-500 dark:text-slate-400">{activity.module}</span>
                          )}
                          {activity.reference_id && (
                            <span className="text-xs text-slate-400 font-mono">{activity.reference_id}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                          <ActionIcon className="w-3 h-3" />
                          {activity.action}
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
            <span className="text-sm text-slate-500">Page {pagination.current_page} of {pagination.total_pages}</span>
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
      </div>

      {/* Detail Modal */}
      {selectedActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setSelectedActivity(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
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
                { label: "Action", value: selectedActivity.action },
                { label: "Category", value: selectedActivity.action_category },
                { label: "Description", value: selectedActivity.description },
                { label: "Module", value: selectedActivity.module || "N/A" },
                { label: "Reference", value: selectedActivity.reference_id || "N/A" },
              ].map((field, idx) => (
                <div key={idx} className="flex justify-between items-start">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400 w-28 shrink-0">{field.label}</span>
                  <span className="text-sm text-slate-800 dark:text-white text-right">{field.value}</span>
                </div>
              ))}
              {selectedActivity.metadata && (
                <div>
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400 block mb-1">Details</span>
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
