import { useState, useEffect, useMemo, useRef } from "react";
import Swal from "sweetalert2";
import {
  Search,
  RefreshCw,
  FileText,
  X,
  CheckCircle,
  User,
  Clock,
  AlertCircle,
  XCircle,
  Eye,
  ChevronDown,
  Car,
  Route,
  ShieldCheck,
  Clipboard,
  Bot,
  ShieldAlert,
  ScanSearch,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Hash,
  FileCheck,
  Truck,
  BadgeCheck,
  Wrench,
  ClipboardCheck
} from "lucide-react";

const API_BASE = "/backend/franchise_permit";

// Franchise-specific processing steps
const PROCESSING_STEPS = [
  { key: "vehicle_inspection", label: "Vehicle Inspection", icon: Car, color: "#4A90E2" },
  { key: "route_verification", label: "Route/Zone Verification", icon: Route, color: "#9C27B0" },
  { key: "lto_compliance", label: "LTO Compliance Check", icon: Clipboard, color: "#FF9800" },
  { key: "insurance_check", label: "Insurance & Fees Verification", icon: ShieldCheck, color: "#E91E63" },
  { key: "toda_verification", label: "TODA/Operator Verification", icon: Truck, color: "#00BCD4" },
  { key: "final_review", label: "Final Review & Clearance", icon: ClipboardCheck, color: "#4CAF50" },
];

// AI Verification Badge Component
function AIVerificationBadge({ status }) {
  const config = {
    verified: {
      icon: <Bot className="w-4 h-4" />,
      label: "AI Verified",
      bg: "bg-emerald-50 dark:bg-emerald-900/30",
      border: "border-emerald-200 dark:border-emerald-700",
      text: "text-emerald-700 dark:text-emerald-300",
      dot: "bg-emerald-500"
    },
    flagged: {
      icon: <ShieldAlert className="w-4 h-4" />,
      label: "AI Flagged",
      bg: "bg-red-50 dark:bg-red-900/30",
      border: "border-red-200 dark:border-red-700",
      text: "text-red-700 dark:text-red-300",
      dot: "bg-red-500"
    },
    pending: {
      icon: <ScanSearch className="w-4 h-4" />,
      label: "AI Review Pending",
      bg: "bg-amber-50 dark:bg-amber-900/30",
      border: "border-amber-200 dark:border-amber-700",
      text: "text-amber-700 dark:text-amber-300",
      dot: "bg-amber-500"
    },
    not_checked: {
      icon: <Bot className="w-4 h-4" />,
      label: "Not AI Checked",
      bg: "bg-gray-50 dark:bg-gray-800",
      border: "border-gray-200 dark:border-gray-700",
      text: "text-gray-500 dark:text-gray-400",
      dot: "bg-gray-400"
    }
  };

  const c = config[status] || config.not_checked;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${c.bg} ${c.border} ${c.text}`}>
      <span className={`w-2 h-2 rounded-full ${c.dot} animate-pulse`} />
      {c.icon}
      <span className="text-xs font-semibold">{c.label}</span>
    </div>
  );
}

// Simulate AI verification based on data completeness
function getAIVerificationStatus(app) {
  if (!app) return "not_checked";
  const hasVehicle = app.plate_number && app.engine_number && app.chassis_number;
  const hasLTO = app.lto_or_number && app.lto_cr_number;
  const hasRoute = app.route_zone && app.toda_name;
  if (hasVehicle && hasLTO && hasRoute) return "verified";
  if (!hasVehicle) return "flagged";
  return "pending";
}

export default function FranchiseProcessing() {
  const [applications, setApplications] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, rejected: 0, under_review: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [processingSteps, setProcessingSteps] = useState({});
  const [actionsOpen, setActionsOpen] = useState(null);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setActionsOpen(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin_fetch.php?limit=200`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setApplications(data.data);
        if (data.stats?.overall) {
          setStats({
            total: data.stats.overall.total || 0,
            approved: data.stats.overall.approved || 0,
            pending: data.stats.overall.pending || 0,
            rejected: data.stats.overall.rejected || 0,
            under_review: data.stats.overall.under_review || 0,
          });
        } else {
          computeStats(data.data);
        }
      }
    } catch (err) {
      console.error("Error loading franchise permits:", err);
    } finally {
      setLoading(false);
    }
  };

  const computeStats = (apps) => {
    const total = apps.length;
    const approved = apps.filter((a) => a.status?.toLowerCase() === "approved").length;
    const pending = apps.filter((a) => a.status?.toLowerCase() === "pending").length;
    const rejected = apps.filter((a) => a.status?.toLowerCase() === "rejected").length;
    const under_review = apps.filter((a) => a.status?.toLowerCase() === "under_review").length;
    setStats({ total, approved, pending, rejected, under_review });
  };

  // Filtered applications
  const filteredApps = useMemo(() => {
    let result = [...applications];

    if (activeTab !== "all") {
      result = result.filter((a) => a.status?.toLowerCase() === activeTab);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          (a.first_name || "").toLowerCase().includes(q) ||
          (a.last_name || "").toLowerCase().includes(q) ||
          (a.plate_number || "").toLowerCase().includes(q) ||
          (a.application_id || "").toLowerCase().includes(q) ||
          (a.toda_name || "").toLowerCase().includes(q) ||
          (a.route_zone || "").toLowerCase().includes(q)
      );
    }

    return result;
  }, [applications, activeTab, searchQuery]);

  const viewApplication = (app) => {
    setSelectedApp(app);
    setNote(app.remarks || "");
    setProcessingSteps({
      vehicle_inspection: false,
      route_verification: false,
      lto_compliance: false,
      insurance_check: false,
      toda_verification: false,
      final_review: false,
    });
  };

  const toggleStep = (key) => {
    setProcessingSteps((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Update status
  const updateStatus = async (status) => {
    if (!selectedApp) return;

    const statusConfig = {
      approved: { title: "Approve Franchise?", color: "#4CAF50", icon: "question" },
      rejected: { title: "Reject Application?", color: "#E53935", icon: "warning" },
      pending: { title: "Set to Pending?", color: "#FDA811", icon: "info" },
      under_review: { title: "Set Under Review?", color: "#4A90E2", icon: "info" },
    };

    const config = statusConfig[status] || statusConfig.pending;

    const result = await Swal.fire({
      title: config.title,
      html: `
        <div class="text-left">
          <p class="mb-2">You are about to <strong>${status.replace("_", " ")}</strong> this franchise permit application:</p>
          <div class="bg-gray-50 p-3 rounded-lg mb-3">
            <p class="text-sm"><strong>Application ID:</strong> ${selectedApp.application_id}</p>
            <p class="text-sm"><strong>Operator:</strong> ${selectedApp.first_name} ${selectedApp.last_name}</p>
            <p class="text-sm"><strong>Plate No.:</strong> ${selectedApp.plate_number || "N/A"}</p>
            <p class="text-sm"><strong>Route:</strong> ${selectedApp.route_zone || "N/A"}</p>
          </div>
          ${status === "rejected" ? '<p class="text-sm text-red-600">Please provide a reason for rejection.</p>' : '<p class="text-sm text-gray-600">Add notes (optional).</p>'}
        </div>
      `,
      icon: config.icon,
      input: "textarea",
      inputLabel: status === "rejected" ? "Reason for rejection (required)" : "Notes (optional)",
      inputPlaceholder: "Enter notes...",
      inputValue: note,
      inputValidator:
        status === "rejected"
          ? (value) => {
              if (!value) return "You must provide a reason for rejection!";
            }
          : null,
      showCancelButton: true,
      confirmButtonText: `Yes, ${status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}`,
      cancelButtonText: "Cancel",
      confirmButtonColor: config.color,
      cancelButtonColor: "#6b7280",
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`${API_BASE}/update_status.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            application_id: selectedApp.application_id,
            status,
            remarks: result.value || note,
          }),
        });

        const data = await res.json();

        if (data.success) {
          const updated = applications.map((a) =>
            a.application_id === selectedApp.application_id
              ? { ...a, status, remarks: result.value || note }
              : a
          );
          setApplications(updated);
          computeStats(updated);

          await Swal.fire({
            title: "Success!",
            text: `Application ${status.replace("_", " ")} successfully!`,
            icon: "success",
            confirmButtonColor: config.color,
          });

          setSelectedApp(null);
        } else {
          await Swal.fire({ title: "Error", text: data.message || "Failed to update.", icon: "error" });
        }
      } catch (err) {
        console.error(err);
        await Swal.fire({ title: "Error", text: "Error updating status.", icon: "error" });
      }
    }
  };

  const handleQuickAction = (app, action) => {
    setActionsOpen(null);
    if (action === "view") {
      viewApplication(app);
    } else {
      viewApplication(app);
      if (action === "approve") setTimeout(() => updateStatus("approved"), 300);
      if (action === "reject") setTimeout(() => updateStatus("rejected"), 300);
      if (action === "review") setTimeout(() => updateStatus("under_review"), 300);
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || "pending").toLowerCase();
    const map = {
      approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
      under_review: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    };
    return map[s] || map.pending;
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-lg min-h-screen font-[Montserrat,Arial,sans-serif]">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            Franchise Permit Processing
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Process and manage franchise/MTOP permit applications
          </p>
        </div>
        <button
          onClick={fetchApplications}
          className="flex items-center gap-2 px-4 py-2 bg-[#4CAF50] text-white rounded-lg hover:bg-[#4CAF50]/80 transition"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-[#4CAF50]/10 p-4 rounded-lg border border-[#4CAF50]/20">
          <p className="text-[#4CAF50] text-sm font-medium">Total</p>
          <p className="text-[#4CAF50] text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-[#4A90E2]/10 p-4 rounded-lg border border-[#4A90E2]/20">
          <p className="text-[#4A90E2] text-sm font-medium">Approved</p>
          <p className="text-[#4A90E2] text-2xl font-bold">{stats.approved}</p>
          <p className="text-[#4A90E2] text-xs mt-1">
            {stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}%
          </p>
        </div>
        <div className="bg-[#E53935]/10 p-4 rounded-lg border border-[#E53935]/20">
          <p className="text-[#E53935] text-sm font-medium">Rejected</p>
          <p className="text-[#E53935] text-2xl font-bold">{stats.rejected}</p>
        </div>
        <div className="bg-[#FDA811]/10 p-4 rounded-lg border border-[#FDA811]/20">
          <p className="text-[#FDA811] text-sm font-medium">Pending</p>
          <p className="text-[#FDA811] text-2xl font-bold">{stats.pending}</p>
        </div>
        <div className="bg-[#9C27B0]/10 p-4 rounded-lg border border-[#9C27B0]/20">
          <p className="text-[#9C27B0] text-sm font-medium">Under Review</p>
          <p className="text-[#9C27B0] text-2xl font-bold">{stats.under_review}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex bg-gray-100 dark:bg-slate-800 rounded-lg p-1">
          {[
            { key: "all", label: "All" },
            { key: "pending", label: "Pending" },
            { key: "under_review", label: "Under Review" },
            { key: "approved", label: "Approved" },
            { key: "rejected", label: "Rejected" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition ${
                activeTab === tab.key
                  ? "bg-[#4CAF50] text-white shadow"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 min-w-[250px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, plate number, TODA, route..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#4CAF50]"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-8 h-8 text-[#4CAF50] animate-spin" />
          <span className="ml-3 text-gray-600">Loading applications...</span>
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No applications found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-700">
          <table className="w-full bg-white dark:bg-slate-800">
            <thead className="bg-gradient-to-r from-[#4CAF50]/10 to-[#4A90E2]/10">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">App ID</th>
                <th className="px-5 py-4 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Operator</th>
                <th className="px-5 py-4 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Plate No.</th>
                <th className="px-5 py-4 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Type</th>
                <th className="px-5 py-4 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Route/TODA</th>
                <th className="px-5 py-4 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Status</th>
                <th className="px-5 py-4 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">AI Check</th>
                <th className="px-5 py-4 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredApps.map((a) => (
                <tr key={a.application_id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition">
                  <td className="px-5 py-4 text-sm font-mono text-gray-900 dark:text-white">
                    {a.display_id || a.application_id}
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-900 dark:text-white">
                    {a.full_name || `${a.first_name} ${a.last_name}`}
                  </td>
                  <td className="px-5 py-4 text-sm font-mono text-gray-600 dark:text-gray-300">
                    {a.plate_number || "N/A"}
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                    <span className="px-2 py-0.5 text-xs font-medium rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                      {a.permit_subtype || a.permit_type || "N/A"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {a.route_zone || "—"} {a.toda_name ? `(${a.toda_name})` : ""}
                  </td>
                  <td className="px-5 py-4 text-sm">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusBadge(a.status)}`}>
                      {(a.status || "pending").replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm">
                    <AIVerificationBadge status={getAIVerificationStatus(a)} />
                  </td>
                  <td className="px-5 py-4 text-sm text-center relative" ref={actionsOpen === a.application_id ? dropdownRef : null}>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => viewApplication(a)}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg text-white bg-[#4CAF50] hover:bg-[#FDA811] transition-all shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" /> View
                      </button>
                      <button
                        onClick={() => setActionsOpen(actionsOpen === a.application_id ? null : a.application_id)}
                        className="inline-flex items-center p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Quick Actions Dropdown - Franchise specific */}
                    {actionsOpen === a.application_id && (
                      <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 z-50">
                        <div className="py-1">
                          <button
                            onClick={() => handleQuickAction(a, "view")}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700"
                          >
                            <Car className="w-4 h-4 text-blue-500" /> Inspect Vehicle
                          </button>
                          <button
                            onClick={() => handleQuickAction(a, "view")}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700"
                          >
                            <Route className="w-4 h-4 text-purple-500" /> Verify Route
                          </button>
                          <button
                            onClick={() => handleQuickAction(a, "view")}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700"
                          >
                            <Clipboard className="w-4 h-4 text-orange-500" /> Check LTO Docs
                          </button>
                          <button
                            onClick={() => handleQuickAction(a, "review")}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          >
                            <ScanSearch className="w-4 h-4" /> Set Under Review
                          </button>
                          <hr className="my-1 border-gray-200 dark:border-slate-700" />
                          <button
                            onClick={() => handleQuickAction(a, "approve")}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                          >
                            <CheckCircle className="w-4 h-4" /> Approve Franchise
                          </button>
                          <button
                            onClick={() => handleQuickAction(a, "reject")}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <XCircle className="w-4 h-4" /> Reject Application
                          </button>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ───────── DETAIL MODAL ───────── */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 overflow-auto animate-fadeIn">
          <div className="w-full max-w-7xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl transform transition-all">
            {/* Modal Header */}
            <div className="relative p-6 bg-gradient-to-r from-gray-50 via-white to-gray-50 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 border-b-4 border-[#FDA811]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-[#FDA811] to-[#FDA811]/80 p-3 rounded-2xl shadow-xl">
                    <Car className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Franchise Permit Application</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedApp.permit_type} - {selectedApp.permit_subtype || "N/A"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md border-l-4 border-blue-500">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Application ID</p>
                  <p className="text-lg font-bold text-gray-800 dark:text-white font-mono">
                    {selectedApp.display_id || selectedApp.application_id}
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md border-l-4 border-purple-500">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Date Submitted</p>
                  <p className="text-lg font-bold text-gray-800 dark:text-white">
                    {selectedApp.date_submitted_formatted || "N/A"}
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md border-l-4 border-green-500">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Status</p>
                  <span className={`inline-block px-3 py-1 text-sm font-bold rounded-full capitalize ${getStatusBadge(selectedApp.status)}`}>
                    {(selectedApp.status || "pending").replace("_", " ")}
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md border-l-4 border-emerald-500">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">AI Document Check</p>
                  <AIVerificationBadge status={getAIVerificationStatus(selectedApp)} />
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-800">

              {/* AI Verification Details */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border-2 border-emerald-100 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-3 rounded-xl shadow-lg">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">AI Document Verification</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={`p-4 rounded-xl border-2 ${selectedApp.plate_number && selectedApp.engine_number && selectedApp.chassis_number ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {selectedApp.plate_number && selectedApp.engine_number ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      <span className="text-sm font-semibold">Vehicle Registration</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      {selectedApp.plate_number
                        ? `Plate: ${selectedApp.plate_number} | Engine: ${selectedApp.engine_number || "Missing"}`
                        : "Vehicle registration data incomplete"}
                    </p>
                  </div>
                  <div className={`p-4 rounded-xl border-2 ${selectedApp.lto_or_number && selectedApp.lto_cr_number ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {selectedApp.lto_or_number && selectedApp.lto_cr_number ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-amber-600" />
                      )}
                      <span className="text-sm font-semibold">LTO Documents</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      {selectedApp.lto_or_number
                        ? `OR: ${selectedApp.lto_or_number} | CR: ${selectedApp.lto_cr_number || "Missing"}`
                        : "LTO documents not verified"}
                    </p>
                  </div>
                  <div className={`p-4 rounded-xl border-2 ${selectedApp.route_zone && selectedApp.toda_name ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {selectedApp.route_zone && selectedApp.toda_name ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-amber-600" />
                      )}
                      <span className="text-sm font-semibold">Route/TODA Validation</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      {selectedApp.route_zone
                        ? `Route: ${selectedApp.route_zone} | TODA: ${selectedApp.toda_name || "N/A"}`
                        : "Route/TODA information incomplete"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Processing Steps */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border-2 border-indigo-100 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-3 rounded-xl shadow-lg">
                    <ClipboardCheck className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Processing Checklist</h3>
                  <span className="ml-auto text-sm text-gray-500">
                    {Object.values(processingSteps).filter(Boolean).length}/{PROCESSING_STEPS.length} completed
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {PROCESSING_STEPS.map((step) => (
                    <button
                      key={step.key}
                      onClick={() => toggleStep(step.key)}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                        processingSteps[step.key]
                          ? "border-green-300 bg-green-50 dark:bg-green-900/20"
                          : "border-gray-200 dark:border-slate-700 hover:border-gray-300"
                      }`}
                    >
                      <div
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: processingSteps[step.key] ? "#4CAF50" : step.color + "20" }}
                      >
                        <step.icon
                          className="w-5 h-5"
                          style={{ color: processingSteps[step.key] ? "#fff" : step.color }}
                        />
                      </div>
                      <div className="text-left flex-1">
                        <p className={`text-sm font-semibold ${processingSteps[step.key] ? "text-green-700" : "text-gray-700 dark:text-gray-300"}`}>
                          {step.label}
                        </p>
                        <p className="text-xs text-gray-500">
                          {processingSteps[step.key] ? "Completed" : "Click to mark as done"}
                        </p>
                      </div>
                      {processingSteps[step.key] && <CheckCircle className="w-5 h-5 text-green-500" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Operator Information */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border-2 border-blue-100 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Operator Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-slate-700 dark:to-slate-600 p-4 rounded-xl">
                    <label className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Full Name</label>
                    <p className="text-lg font-bold text-gray-900 dark:text-white mt-2">
                      {selectedApp.first_name} {selectedApp.middle_initial || ""} {selectedApp.last_name}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Operator Type</label>
                    <p className="text-gray-900 dark:text-white mt-1">{selectedApp.operator_type || "N/A"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-gray-900 dark:text-white">{selectedApp.email || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <div>
                      <label className="text-sm font-medium text-gray-500">Contact</label>
                      <p className="text-gray-900 dark:text-white">{selectedApp.contact_number || "N/A"}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Address</label>
                    <p className="text-gray-900 dark:text-white mt-1">{selectedApp.home_address || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Citizenship</label>
                    <p className="text-gray-900 dark:text-white mt-1">{selectedApp.citizenship || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Birth Date</label>
                    <p className="text-gray-900 dark:text-white mt-1">{selectedApp.birth_date_formatted || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">ID Type / Number</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedApp.id_type || "N/A"} — {selectedApp.id_number || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Vehicle Information */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border-2 border-purple-100 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl shadow-lg">
                    <Car className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Vehicle Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-slate-700 dark:to-slate-600 p-4 rounded-xl">
                    <label className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide">Plate Number</label>
                    <p className="text-lg font-bold text-gray-900 dark:text-white mt-2 font-mono">
                      {selectedApp.plate_number || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Make/Brand</label>
                    <p className="text-gray-900 dark:text-white mt-1">{selectedApp.make_brand || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Model</label>
                    <p className="text-gray-900 dark:text-white mt-1">{selectedApp.model || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Engine Number</label>
                    <p className="text-gray-900 dark:text-white mt-1 font-mono">{selectedApp.engine_number || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Chassis Number</label>
                    <p className="text-gray-900 dark:text-white mt-1 font-mono">{selectedApp.chassis_number || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Vehicle Type / Color</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedApp.vehicle_type || "N/A"} — {selectedApp.color || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Year Acquired</label>
                    <p className="text-gray-900 dark:text-white mt-1">{selectedApp.year_acquired || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">MV File Number</label>
                    <p className="text-gray-900 dark:text-white mt-1">{selectedApp.mv_file_number || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* LTO & Route Information */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border-2 border-green-100 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl shadow-lg">
                    <Route className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">LTO & Route Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-500">LTO OR Number</label>
                    <p className="text-gray-900 dark:text-white mt-1">{selectedApp.lto_or_number || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">LTO CR Number</label>
                    <p className="text-gray-900 dark:text-white mt-1">{selectedApp.lto_cr_number || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">LTO Expiration Date</label>
                    <p className="text-gray-900 dark:text-white mt-1">{selectedApp.lto_expiration_date_formatted || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">District</label>
                    <p className="text-gray-900 dark:text-white mt-1">{selectedApp.district || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Route/Zone</label>
                    <p className="text-gray-900 dark:text-white mt-1">{selectedApp.route_zone || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">TODA Name</label>
                    <p className="text-gray-900 dark:text-white mt-1">{selectedApp.toda_name || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Barangay of Operation</label>
                    <p className="text-gray-900 dark:text-white mt-1">{selectedApp.barangay_of_operation || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Fees Information */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border-2 border-cyan-100 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 p-3 rounded-xl shadow-lg">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Fees & Payments</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Franchise Fee OR</label>
                    <p className="text-gray-900 dark:text-white mt-1">{selectedApp.franchise_fee_or || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Sticker/ID Fee OR</label>
                    <p className="text-gray-900 dark:text-white mt-1">{selectedApp.sticker_id_fee_or || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Inspection Fee OR</label>
                    <p className="text-gray-900 dark:text-white mt-1">{selectedApp.inspection_fee_or || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Admin Action */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border-2 border-yellow-100 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-3 rounded-xl shadow-lg">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Admin Action</h3>
                </div>

                {/* Previous Remarks */}
                {selectedApp.remarks && (
                  <div className="mb-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                    <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">Previous Remarks</p>
                    <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans">
                      {selectedApp.remarks}
                    </pre>
                  </div>
                )}

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Add Review Notes
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-3 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                    rows={3}
                    placeholder="Add remarks or notes..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 justify-end pt-6 border-t border-gray-200 dark:border-slate-700 mt-6">
                  <button
                    onClick={() => updateStatus("pending")}
                    className="px-6 py-3 bg-[#FDA811] text-white rounded-lg hover:bg-[#FDA811]/80 transition-colors font-medium"
                  >
                    Set Pending
                  </button>
                  <button
                    onClick={() => updateStatus("under_review")}
                    className="px-6 py-3 bg-[#4A90E2] text-white rounded-lg hover:bg-[#4A90E2]/80 transition-colors font-medium"
                  >
                    Under Review
                  </button>
                  <button
                    onClick={() => updateStatus("rejected")}
                    className="px-6 py-3 bg-[#E53935] text-white rounded-lg hover:bg-[#E53935]/80 transition-colors font-medium"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => updateStatus("approved")}
                    className="px-6 py-3 bg-[#4CAF50] text-white rounded-lg hover:bg-[#4CAF50]/80 transition-all font-medium shadow-sm"
                  >
                    Approve Franchise
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
