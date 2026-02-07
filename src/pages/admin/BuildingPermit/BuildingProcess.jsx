import { useState, useEffect, useMemo, useRef, useCallback } from "react";
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
  Building2,
  XCircle,
  Info,
  Bot,
  ShieldAlert,
  ScanSearch
} from "lucide-react";

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

function getBuildingAIStatus(app) {
  if (!app) return "not_checked";
  const hasOwner = app.first_name && app.last_name;
  const hasSite = app.street && app.barangay;
  const hasPermitGroup = app.permit_group;
  if (hasOwner && hasSite && hasPermitGroup) return "verified";
  if (!hasOwner) return "flagged";
  return "pending";
}

export default function BuildingProcess() {
  const API_BASE = "/backend/api"; // PHP backend folder

  const [applications, setApplications] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  });
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    status: "",
    permitId: "",
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('latest');
  const [activeTab, setActiveTab] = useState("all");
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const imageRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const imagePositionRef = useRef({ x: 0, y: 0 });

  // Load all building permits from PHP
  useEffect(() => {
    fetch(`${API_BASE}/newbuildingapp.php?db=eplms_business_permit_system`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setApplications(data);
          computeStats(data);
        }
      })
      .catch((err) => console.error("Error loading applications:", err))
      .finally(() => setLoading(false));
  }, []);

  const computeStats = (apps) => {
    const total = apps.length;
    const approved = apps.filter((a) => a.status === "Approved").length;
    const pending = apps.filter((a) => a.status === "Pending").length;
    const rejected = apps.filter((a) => a.status === "Rejected").length;
    setStats({ total, approved, pending, rejected });
  };

  // View full application details
  const viewApplication = (id) => {
    const app = applications.find((a) => a.application_id === id);
    if (app) {
      setSelectedApp(app);
      setNote(app.remarks || "");
    }
  };

  // Update status with SweetAlert2 confirmation
  const updateStatus = async (status) => {
    if (!selectedApp) return;

    const statusConfig = {
      Approved: { title: 'Approve Permit?', color: '#4CAF50', icon: 'question' },
      Rejected: { title: 'Reject Application?', color: '#E53935', icon: 'warning' },
      Pending: { title: 'Set to Pending?', color: '#FDA811', icon: 'info' }
    };

    const config = statusConfig[status] || statusConfig.Pending;

    const result = await Swal.fire({
      title: config.title,
      html: `
        <div class="text-left">
          <p class="mb-2">You are about to ${status.toLowerCase()} this building permit application:</p>
          <div class="bg-gray-50 p-3 rounded-lg mb-3">
            <p class="text-sm"><strong>Application ID:</strong> ${selectedApp.application_id}</p>
            <p class="text-sm"><strong>Owner:</strong> ${selectedApp.first_name} ${selectedApp.last_name}</p>
            <p class="text-sm"><strong>Type:</strong> ${selectedApp.permit_group || 'N/A'}</p>
          </div>
          ${status === 'Rejected' ? '<p class="text-sm text-red-600">Please provide a reason for rejection.</p>' : '<p class="text-sm text-gray-600">Add notes (optional).</p>'}
        </div>
      `,
      icon: config.icon,
      input: 'textarea',
      inputLabel: status === 'Rejected' ? 'Reason for rejection (required)' : 'Notes (optional)',
      inputPlaceholder: 'Enter notes...',
      inputValue: note,
      inputValidator: status === 'Rejected' ? (value) => {
        if (!value) return 'You must provide a reason for rejection!';
      } : null,
      showCancelButton: true,
      confirmButtonText: `Yes, ${status}`,
      cancelButtonText: 'Cancel',
      confirmButtonColor: config.color,
      cancelButtonColor: '#6b7280',
      customClass: {
        popup: 'text-left',
        htmlContainer: 'text-left'
      }
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(
          `${API_BASE}/update_building_app.php?db=eplms_business_permit_system`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              application_id: selectedApp.application_id,
              status,
              comment: result.value || note,
            }),
          }
        );

        const data = await res.json();

        if (data.success) {
          const updated = applications.map((a) =>
            a.application_id === selectedApp.application_id
              ? { ...a, status, remarks: result.value || note }
              : a
          );
          setApplications(updated);
          computeStats(updated);
          setSelectedApp({ ...selectedApp, status, remarks: result.value || note });
          setNote('');

          await Swal.fire({
            title: 'Success!',
            text: `Application ${status.toLowerCase()} successfully!`,
            icon: 'success',
            confirmButtonColor: config.color
          });

          setSelectedApp(null);
        } else {
          await Swal.fire({
            title: 'Error',
            text: 'Failed to update status.',
            icon: 'error',
            confirmButtonColor: '#E53935'
          });
        }
      } catch (err) {
        console.error(err);
        await Swal.fire({
          title: 'Error',
          text: 'Error updating status.',
          icon: 'error',
          confirmButtonColor: '#E53935'
        });
      }
    }
  };

  const statusConfig = {
    Approved: {
      icon: <CheckCircle size={24} className="text-green-600" />,
      text: "approved",
    },
    Rejected: {
      icon: <XCircle size={24} className="text-red-600" />,
      text: "rejected",
    },
    Pending: {
      icon: <Info size={24} className="text-yellow-500" />,
      text: "set to pending",
    },
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-lg min-h-screen font-[Montserrat,Arial,sans-serif]">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Building Permit Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Overview of submitted building permit applications
        </p>
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
          <p className="text-[#E53935] text-xs mt-1">Not approved</p>
        </div>
        <div className="bg-[#FDA811]/10 p-4 rounded-lg border border-[#FDA811]/20">
          <p className="text-[#FDA811] text-sm font-medium">Pending</p>
          <p className="text-[#FDA811] text-2xl font-bold">{stats.pending}</p>
          <p className="text-[#FDA811] text-xs mt-1">Awaiting review</p>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <p>Loading applications...</p>
      ) : applications.length === 0 ? (
        <p>No applications found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full bg-white dark:bg-slate-800 shadow rounded-lg">
            <thead className="bg-gradient-to-r from-[#4CAF50]/10 to-[#4A90E2]/10">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Application No.
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {applications.map((a) => (
                <tr
                  key={a.application_id}
                  className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition"
                >
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {a.application_id}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {a.first_name} {a.middle_initial || ""} {a.last_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {a.permit_group}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        a.status === "Approved"
                          ? "bg-green-100 text-green-800"
                          : a.status === "Rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {a.proposed_date_of_construction
                      ? new Date(a.proposed_date_of_construction).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => viewApplication(a.application_id)}
                      className="inline-flex items-center px-4 py-2 text-xs font-medium rounded-lg text-white bg-[#4CAF50] hover:bg-[#FDA811] transition-all shadow-sm hover:shadow-md"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Application Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 overflow-auto animate-fadeIn">
          <div className="w-full max-w-7xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl transform transition-all">
            {/* Enhanced Header */}
            <div className="relative p-6 bg-gradient-to-r from-gray-50 via-white to-gray-50 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 border-b-4 border-orange-400">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-orange-400 to-orange-500 p-3 rounded-2xl shadow-xl">
                    <Building2 className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Building Permit Application</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Application Details</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => setSelectedApp(null)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Info Cards Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md border-l-4 border-blue-500">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Application ID</p>
                  <p className="text-lg font-bold text-gray-800 dark:text-white font-mono">
                    BP-{String(selectedApp.application_id).padStart(4, '0')}
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md border-l-4 border-purple-500">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Date Submitted</p>
                  <p className="text-lg font-bold text-gray-800 dark:text-white">
                    {selectedApp.proposed_date_of_construction
                      ? new Date(selectedApp.proposed_date_of_construction).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md border-l-4 border-green-500">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Status</p>
                  <span className={`inline-block px-3 py-1 text-sm font-bold rounded-full ${
                    selectedApp.status === "Approved"
                      ? "bg-green-100 text-green-800"
                      : selectedApp.status === "Rejected"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {selectedApp.status}
                  </span>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md border-l-4 border-emerald-500">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">AI Document Check</p>
                  <AIVerificationBadge status={getBuildingAIStatus(selectedApp)} />
                </div>
              </div>
            </div>

            <div className="p-8 space-y-8 max-h-[80vh] overflow-y-auto bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-800">

            {/* AI Verification Details */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border-2 border-emerald-100 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-3 rounded-xl shadow-lg">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">AI Document Verification</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-xl border-2 ${selectedApp.first_name && selectedApp.last_name ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {selectedApp.first_name && selectedApp.last_name ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span className="text-sm font-semibold">Owner Identity</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    {selectedApp.first_name && selectedApp.last_name
                      ? `${selectedApp.first_name} ${selectedApp.last_name} - identity validated`
                      : "Owner identity data incomplete"}
                  </p>
                </div>
                <div className={`p-4 rounded-xl border-2 ${selectedApp.street && selectedApp.barangay ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {selectedApp.street && selectedApp.barangay ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-600" />
                    )}
                    <span className="text-sm font-semibold">Project Site</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    {selectedApp.street && selectedApp.barangay
                      ? "Project site address verified against zoning records"
                      : "Project site verification incomplete"}
                  </p>
                </div>
                <div className={`p-4 rounded-xl border-2 ${selectedApp.permit_group ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {selectedApp.permit_group ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-600" />
                    )}
                    <span className="text-sm font-semibold">Permit Classification</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    {selectedApp.permit_group
                      ? `Permit type "${selectedApp.permit_group}" matches building code requirements`
                      : "Permit classification not specified"}
                  </p>
                </div>
              </div>
            </div>

            {/* Owner Information */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border-2 border-blue-100 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg">
                  <User className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Owner Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-slate-700 dark:to-slate-600 p-4 rounded-xl">
                  <label className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Full Name</label>
                  <p className="text-lg font-bold text-gray-900 dark:text-white mt-2">
                    {selectedApp.first_name} {selectedApp.middle_initial || ""} {selectedApp.last_name}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Ownership Type</label>
                  <p className="text-gray-900 dark:text-white mt-1">
                    {selectedApp.form_of_ownership || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Project Site */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border-2 border-green-100 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl shadow-lg">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Project Site</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-500">Street</label>
                  <p className="text-gray-900 dark:text-white mt-1">
                    {selectedApp.street || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Barangay</label>
                  <p className="text-gray-900 dark:text-white mt-1">
                    {selectedApp.barangay || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">City/Municipality</label>
                  <p className="text-gray-900 dark:text-white mt-1">
                    {selectedApp.city_municipality || 'N/A'}
                  </p>
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
                  onClick={() => updateStatus("Pending")}
                  className="px-6 py-3 bg-[#FDA811] text-white rounded-lg hover:bg-[#FDA811]/80 transition-colors font-medium"
                >
                  Set Pending
                </button>
                <button
                  onClick={() => updateStatus("Rejected")}
                  className="px-6 py-3 bg-[#E53935] text-white rounded-lg hover:bg-[#E53935]/80 transition-colors font-medium"
                >
                  Reject
                </button>
                <button
                  onClick={() => updateStatus("Approved")}
                  className="px-6 py-3 bg-[#4CAF50] text-white rounded-lg hover:bg-[#4CAF50]/80 transition-all font-medium shadow-sm"
                >
                  Approve
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
