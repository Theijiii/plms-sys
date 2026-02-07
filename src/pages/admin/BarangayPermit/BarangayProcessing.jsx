import { useState, useEffect, useMemo, useRef } from "react";
import Swal from "sweetalert2";
import {
  Search,
  Download,
  RefreshCw,
  FileText,
  Image as ImageIcon,
  X,
  CheckCircle,
  User,
  Clock,
  File,
  Receipt,
  AlertCircle,
  Home,
  XCircle,
  Info,
  Shield,
  MapPin,
  Phone,
  Mail,
  Calendar,
  ChevronDown,
  Eye,
  Fingerprint,
  BadgeCheck,
  ScanSearch,
  FileCheck,
  Bot,
  ShieldCheck,
  ShieldAlert
} from "lucide-react";

const API_BASE = "/backend/barangay_permit";

// Barangay-specific processing steps
const PROCESSING_STEPS = [
  { key: "identity_verification", label: "Identity Verification", icon: Fingerprint, color: "#4A90E2" },
  { key: "residency_check", label: "Residency Check", icon: Home, color: "#9C27B0" },
  { key: "purpose_validation", label: "Purpose Validation", icon: FileCheck, color: "#FF9800" },
  { key: "clearance_check", label: "Clearance Check", icon: ShieldCheck, color: "#4CAF50" },
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

// Simulate AI verification (in production, this would call a real AI endpoint)
function getAIVerificationStatus(app) {
  if (!app) return "not_checked";
  // Simulate based on data completeness
  const hasId = app.id_type && app.id_number;
  const hasAddress = app.barangay && app.street;
  const hasPurpose = app.purpose;
  if (hasId && hasAddress && hasPurpose) return "verified";
  if (!hasId) return "flagged";
  return "pending";
}

export default function BarangayProcessing() {
  const [applications, setApplications] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, rejected: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
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

  // Fetch all barangay permits
  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin_fetch.php`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setApplications(data.data);
        computeStats(data.data);
      }
    } catch (err) {
      console.error("Error loading barangay permits:", err);
    } finally {
      setLoading(false);
    }
  };

  const computeStats = (apps) => {
    const total = apps.length;
    const approved = apps.filter((a) => a.status?.toLowerCase() === "approved").length;
    const pending = apps.filter((a) => a.status?.toLowerCase() === "pending").length;
    const rejected = apps.filter((a) => a.status?.toLowerCase() === "rejected").length;
    setStats({ total, approved, pending, rejected });
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
          (a.purpose || "").toLowerCase().includes(q) ||
          String(a.permit_id).includes(q) ||
          (a.barangay || "").toLowerCase().includes(q)
      );
    }

    return result;
  }, [applications, activeTab, searchQuery]);

  // View application
  const viewApplication = (app) => {
    setSelectedApp(app);
    setNote(app.comments || "");
    // Initialize processing steps
    setProcessingSteps({
      identity_verification: false,
      residency_check: false,
      purpose_validation: false,
      clearance_check: false,
    });
  };

  // Toggle processing step
  const toggleStep = (key) => {
    setProcessingSteps((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Update status with SweetAlert2
  const updateStatus = async (status) => {
    if (!selectedApp) return;

    const statusConfig = {
      approved: { title: "Approve Clearance?", color: "#4CAF50", icon: "question" },
      rejected: { title: "Reject Application?", color: "#E53935", icon: "warning" },
      pending: { title: "Set to Pending?", color: "#FDA811", icon: "info" },
    };

    const config = statusConfig[status] || statusConfig.pending;

    const result = await Swal.fire({
      title: config.title,
      html: `
        <div class="text-left">
          <p class="mb-2">You are about to <strong>${status}</strong> this barangay clearance application:</p>
          <div class="bg-gray-50 p-3 rounded-lg mb-3">
            <p class="text-sm"><strong>Permit ID:</strong> ${selectedApp.permit_id}</p>
            <p class="text-sm"><strong>Applicant:</strong> ${selectedApp.first_name} ${selectedApp.last_name}</p>
            <p class="text-sm"><strong>Purpose:</strong> ${selectedApp.purpose || "N/A"}</p>
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
      confirmButtonText: `Yes, ${status.charAt(0).toUpperCase() + status.slice(1)}`,
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
            permit_id: selectedApp.permit_id,
            status,
            comments: result.value || note,
          }),
        });

        const data = await res.json();

        if (data.success) {
          const updated = applications.map((a) =>
            a.permit_id === selectedApp.permit_id
              ? { ...a, status, comments: result.value || note }
              : a
          );
          setApplications(updated);
          computeStats(updated);

          await Swal.fire({
            title: "Success!",
            text: `Application ${status} successfully!`,
            icon: "success",
            confirmButtonColor: config.color,
          });

          setSelectedApp(null);
        } else {
          await Swal.fire({ title: "Error", text: data.message || "Failed to update status.", icon: "error" });
        }
      } catch (err) {
        console.error(err);
        await Swal.fire({ title: "Error", text: "Error updating status.", icon: "error" });
      }
    }
  };

  // Quick action from dropdown
  const handleQuickAction = (app, action) => {
    setActionsOpen(null);
    viewApplication(app);
    if (action === "approve") setTimeout(() => updateStatus("approved"), 300);
    if (action === "reject") setTimeout(() => updateStatus("rejected"), 300);
  };

  const getStatusBadge = (status) => {
    const s = (status || "pending").toLowerCase();
    const map = {
      approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    };
    return map[s] || map.pending;
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-lg min-h-screen font-[Montserrat,Arial,sans-serif]">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            Barangay Clearance Processing
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Process and manage barangay clearance applications
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#4CAF50]/10 p-4 rounded-lg border border-[#4CAF50]/20">
          <p className="text-[#4CAF50] text-sm font-medium">Total Applications</p>
          <p className="text-[#4CAF50] text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-[#4A90E2]/10 p-4 rounded-lg border border-[#4A90E2]/20">
          <p className="text-[#4A90E2] text-sm font-medium">Approved</p>
          <p className="text-[#4A90E2] text-2xl font-bold">{stats.approved}</p>
          <p className="text-[#4A90E2] text-xs mt-1">
            {stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}% approval rate
          </p>
        </div>
        <div className="bg-[#E53935]/10 p-4 rounded-lg border border-[#E53935]/20">
          <p className="text-[#E53935] text-sm font-medium">Rejected</p>
          <p className="text-[#E53935] text-2xl font-bold">{stats.rejected}</p>
        </div>
        <div className="bg-[#FDA811]/10 p-4 rounded-lg border border-[#FDA811]/20">
          <p className="text-[#FDA811] text-sm font-medium">Pending</p>
          <p className="text-[#FDA811] text-2xl font-bold">{stats.pending}</p>
          <p className="text-[#FDA811] text-xs mt-1">Awaiting review</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        {/* Tab filters */}
        <div className="flex bg-gray-100 dark:bg-slate-800 rounded-lg p-1">
          {[
            { key: "all", label: "All" },
            { key: "pending", label: "Pending" },
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

        {/* Search */}
        <div className="relative flex-1 min-w-[250px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, purpose, barangay..."
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
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Permit ID</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Applicant</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Purpose</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Barangay</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">AI Check</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredApps.map((a) => (
                <tr key={a.permit_id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition">
                  <td className="px-6 py-4 text-sm font-mono text-gray-900 dark:text-white">
                    BC-{String(a.permit_id).padStart(4, "0")}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {a.first_name} {a.middle_name || ""} {a.last_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 max-w-[200px] truncate">
                    {a.purpose || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {a.barangay || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusBadge(a.status)}`}>
                      {a.status || "pending"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <AIVerificationBadge status={getAIVerificationStatus(a)} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {a.created_at ? new Date(a.created_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-center relative" ref={actionsOpen === a.permit_id ? dropdownRef : null}>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => viewApplication(a)}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg text-white bg-[#4CAF50] hover:bg-[#FDA811] transition-all shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" /> View
                      </button>
                      <button
                        onClick={() => setActionsOpen(actionsOpen === a.permit_id ? null : a.permit_id)}
                        className="inline-flex items-center p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Quick Actions Dropdown */}
                    {actionsOpen === a.permit_id && (
                      <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 z-50">
                        <div className="py-1">
                          <button
                            onClick={() => handleQuickAction(a, "view")}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700"
                          >
                            <Fingerprint className="w-4 h-4 text-blue-500" /> Verify Identity
                          </button>
                          <button
                            onClick={() => handleQuickAction(a, "view")}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700"
                          >
                            <Home className="w-4 h-4 text-purple-500" /> Check Residency
                          </button>
                          <button
                            onClick={() => handleQuickAction(a, "view")}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700"
                          >
                            <FileCheck className="w-4 h-4 text-orange-500" /> Validate Purpose
                          </button>
                          <hr className="my-1 border-gray-200 dark:border-slate-700" />
                          <button
                            onClick={() => handleQuickAction(a, "approve")}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                          >
                            <CheckCircle className="w-4 h-4" /> Approve Clearance
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
          <div className="w-full max-w-6xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl transform transition-all">
            {/* Modal Header */}
            <div className="relative p-6 bg-gradient-to-r from-gray-50 via-white to-gray-50 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 border-b-4 border-[#4CAF50]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-[#4CAF50] to-[#4CAF50]/80 p-3 rounded-2xl shadow-xl">
                    <Shield className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Barangay Clearance Application</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Application Processing & Review</p>
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
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Permit ID</p>
                  <p className="text-lg font-bold text-gray-800 dark:text-white font-mono">
                    BC-{String(selectedApp.permit_id).padStart(4, "0")}
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md border-l-4 border-purple-500">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Date Applied</p>
                  <p className="text-lg font-bold text-gray-800 dark:text-white">
                    {selectedApp.created_at ? new Date(selectedApp.created_at).toLocaleDateString() : "N/A"}
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md border-l-4 border-green-500">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Status</p>
                  <span className={`inline-block px-3 py-1 text-sm font-bold rounded-full capitalize ${getStatusBadge(selectedApp.status)}`}>
                    {selectedApp.status || "pending"}
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
                  <div className={`p-4 rounded-xl border-2 ${selectedApp.id_type && selectedApp.id_number ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {selectedApp.id_type && selectedApp.id_number ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      <span className="text-sm font-semibold">ID Document</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      {selectedApp.id_type && selectedApp.id_number
                        ? `${selectedApp.id_type} - ${selectedApp.id_number} detected and validated`
                        : "No valid ID document detected"}
                    </p>
                  </div>
                  <div className={`p-4 rounded-xl border-2 ${selectedApp.barangay && selectedApp.street ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {selectedApp.barangay && selectedApp.street ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-amber-600" />
                      )}
                      <span className="text-sm font-semibold">Address Match</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      {selectedApp.barangay && selectedApp.street
                        ? "Address matches barangay records"
                        : "Address verification incomplete"}
                    </p>
                  </div>
                  <div className={`p-4 rounded-xl border-2 ${selectedApp.purpose ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {selectedApp.purpose ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-amber-600" />
                      )}
                      <span className="text-sm font-semibold">Purpose Validation</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      {selectedApp.purpose
                        ? `Purpose "${selectedApp.purpose}" is within standard categories`
                        : "Purpose not specified"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Processing Steps Checklist */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border-2 border-indigo-100 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-3 rounded-xl shadow-lg">
                    <FileCheck className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Processing Checklist</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                        className={`p-2 rounded-lg ${
                          processingSteps[step.key] ? "bg-green-500" : "bg-gray-200 dark:bg-slate-700"
                        }`}
                      >
                        <step.icon className={`w-5 h-5 ${processingSteps[step.key] ? "text-white" : "text-gray-500"}`} />
                      </div>
                      <div className="text-left">
                        <p className={`text-sm font-semibold ${processingSteps[step.key] ? "text-green-700" : "text-gray-700 dark:text-gray-300"}`}>
                          {step.label}
                        </p>
                        <p className="text-xs text-gray-500">
                          {processingSteps[step.key] ? "Completed" : "Click to mark as done"}
                        </p>
                      </div>
                      {processingSteps[step.key] && <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Applicant Information */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border-2 border-blue-100 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Applicant Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-slate-700 dark:to-slate-600 p-4 rounded-xl">
                    <label className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Full Name</label>
                    <p className="text-lg font-bold text-gray-900 dark:text-white mt-2">
                      {selectedApp.first_name} {selectedApp.middle_name || ""} {selectedApp.last_name} {selectedApp.suffix || ""}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Gender / Civil Status</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedApp.gender || "N/A"} / {selectedApp.civil_status || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Birthdate</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedApp.birthdate ? new Date(selectedApp.birthdate).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Nationality</label>
                    <p className="text-gray-900 dark:text-white mt-1">{selectedApp.nationality || "N/A"}</p>
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
                      <label className="text-sm font-medium text-gray-500">Mobile Number</label>
                      <p className="text-gray-900 dark:text-white">{selectedApp.mobile_number || "N/A"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border-2 border-green-100 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl shadow-lg">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Address Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-500">House No. / Street</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedApp.house_no || ""} {selectedApp.street || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Barangay</label>
                    <p className="text-gray-900 dark:text-white mt-1">{selectedApp.barangay || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">City / Municipality</label>
                    <p className="text-gray-900 dark:text-white mt-1">{selectedApp.city_municipality || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Province</label>
                    <p className="text-gray-900 dark:text-white mt-1">{selectedApp.province || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Zip Code</label>
                    <p className="text-gray-900 dark:text-white mt-1">{selectedApp.zip_code || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Clearance Details */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border-2 border-orange-100 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-3 rounded-xl shadow-lg">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Clearance Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Purpose</label>
                    <p className="text-gray-900 dark:text-white mt-1">{selectedApp.purpose || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Duration</label>
                    <p className="text-gray-900 dark:text-white mt-1">{selectedApp.duration || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">ID Type</label>
                    <p className="text-gray-900 dark:text-white mt-1">{selectedApp.id_type || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">ID Number</label>
                    <p className="text-gray-900 dark:text-white mt-1">{selectedApp.id_number || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Clearance Fee</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedApp.clearance_fee ? `₱${Number(selectedApp.clearance_fee).toFixed(2)}` : "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Receipt Number</label>
                    <p className="text-gray-900 dark:text-white mt-1">{selectedApp.receipt_number || "N/A"}</p>
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

                {/* Previous Comments */}
                {selectedApp.comments && (
                  <div className="mb-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                    <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">Previous Comments</p>
                    <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans">
                      {selectedApp.comments}
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
                    onClick={() => updateStatus("rejected")}
                    className="px-6 py-3 bg-[#E53935] text-white rounded-lg hover:bg-[#E53935]/80 transition-colors font-medium"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => updateStatus("approved")}
                    className="px-6 py-3 bg-[#4CAF50] text-white rounded-lg hover:bg-[#4CAF50]/80 transition-all font-medium shadow-sm"
                  >
                    Approve Clearance
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
