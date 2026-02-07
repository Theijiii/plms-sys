import { useState, useEffect, useMemo } from "react";
import Swal from "sweetalert2";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Search,
  RefreshCw,
  FileText,
  User,
  Bus,
  MapPin,
  Eye,
  Car,
  Ticket,
} from "lucide-react";

const API_BASE = "/backend/franchise_permit";

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-800", icon: Clock },
  approved: { label: "Approved", color: "bg-green-100 text-green-800", icon: CheckCircle },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800", icon: XCircle },
  under_review: { label: "Under Review", color: "bg-blue-100 text-blue-800", icon: Eye },
  document_verification: { label: "Document Verification", color: "bg-purple-100 text-purple-800", icon: FileText },
  field_inspection_scheduled: { label: "Field Inspection", color: "bg-cyan-100 text-cyan-800", icon: MapPin },
  payment_verification: { label: "Payment Verification", color: "bg-yellow-100 text-yellow-800", icon: AlertCircle },
  for_manager_approval: { label: "For Manager Approval", color: "bg-indigo-100 text-indigo-800", icon: Ticket },
  ready_for_release: { label: "Ready for Release", color: "bg-emerald-100 text-emerald-800", icon: CheckCircle },
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
    });
  } catch { return "N/A"; }
};

const mapStatusToFrontend = (status) => {
  if (!status) return "Pending";
  const map = {
    pending: "Pending", approved: "Approved", rejected: "Rejected",
    under_review: "Under Review", document_verification: "Document Verification",
    field_inspection_scheduled: "Field Inspection", payment_verification: "Payment Verification",
    for_manager_approval: "For Manager Approval", ready_for_release: "Ready for Release",
  };
  return map[status.toLowerCase()] || status;
};

export default function FranchiseProcessing() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);
  const [note, setNote] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOption, setSortOption] = useState("latest");
  const [activeTab, setActiveTab] = useState("all");

  const stats = useMemo(() => {
    const total = applications.length;
    const approved = applications.filter(a => (a.status || "").toLowerCase() === "approved").length;
    const pending = applications.filter(a => !a.status || (a.status || "").toLowerCase() === "pending").length;
    const rejected = applications.filter(a => (a.status || "").toLowerCase() === "rejected").length;
    const inProcess = total - approved - pending - rejected;
    return { total, approved, pending, rejected, inProcess };
  }, [applications]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE}/admin_fetch.php`);
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        const transformed = data.data.map((f) => ({
          ...f,
          full_name: `${f.first_name || ""} ${f.middle_initial ? f.middle_initial + "." : ""} ${f.last_name || ""}`.trim() || "N/A",
          display_status: mapStatusToFrontend(f.status),
        }));
        setApplications(transformed);
      } else {
        throw new Error(data.message || "Failed to fetch applications");
      }
    } catch (err) {
      console.error("Error loading franchise applications:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApplications(); }, []);

  const filteredApps = useMemo(() => {
    let filtered = [...applications];
    if (statusFilter !== "all") {
      filtered = filtered.filter(a => (a.status || "pending").toLowerCase() === statusFilter);
    }
    if (activeTab !== "all") {
      filtered = filtered.filter(a => (a.permit_subtype || "").toLowerCase() === activeTab.toLowerCase());
    }
    if (searchQuery.trim()) {
      const term = searchQuery.toLowerCase();
      filtered = filtered.filter(a =>
        (a.full_name || "").toLowerCase().includes(term) ||
        (a.plate_number || "").toLowerCase().includes(term) ||
        (a.toda_name || "").toLowerCase().includes(term) ||
        (a.application_id || "").toString().includes(term) ||
        (a.route_zone || "").toLowerCase().includes(term)
      );
    }
    if (sortOption === "latest") {
      filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    } else if (sortOption === "oldest") {
      filtered.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
    } else if (sortOption === "name_asc") {
      filtered.sort((a, b) => (a.full_name || "").localeCompare(b.full_name || ""));
    }
    return filtered;
  }, [applications, statusFilter, searchQuery, sortOption, activeTab]);

  const updateStatus = async (appId, status, comments = "") => {
    try {
      const response = await fetch(`${API_BASE}/update_status.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          application_id: appId,
          status: status.toLowerCase().replace(/\s+/g, "_"),
          remarks: comments,
          updated_by: "Admin",
        }),
      });
      const data = await response.json();
      if (data.success) {
        Swal.fire({ icon: "success", title: "Updated!", text: `Application ${status.toLowerCase()} successfully.`, confirmButtonColor: "#4CAF50", timer: 2000 });
        await fetchApplications();
        if (selectedApp && (selectedApp.application_id === appId)) {
          setSelectedApp(prev => ({ ...prev, status: status.toLowerCase().replace(/\s+/g, "_"), display_status: mapStatusToFrontend(status.toLowerCase().replace(/\s+/g, "_")), remarks: data.data?.remarks || prev.remarks }));
        }
      } else {
        Swal.fire({ icon: "error", title: "Error", text: data.message || "Failed to update status", confirmButtonColor: "#E53935" });
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: "Error updating status: " + err.message, confirmButtonColor: "#E53935" });
    }
  };

  const handleStatusAction = async (status) => {
    if (!selectedApp) return;
    const appId = selectedApp.application_id || selectedApp.id;
    const result = await Swal.fire({
      title: `${status} this application?`,
      html: `<div class="text-left text-sm">
        <p><strong>ID:</strong> ${appId}</p>
        <p><strong>Applicant:</strong> ${selectedApp.full_name}</p>
        <p><strong>Vehicle:</strong> ${selectedApp.plate_number || "N/A"}</p>
      </div>`,
      icon: status === "Rejected" ? "warning" : "question",
      input: "textarea",
      inputLabel: status === "Rejected" ? "Reason for rejection (required)" : "Add notes (optional)",
      inputPlaceholder: "Enter notes...",
      inputValue: note,
      inputValidator: status === "Rejected" ? (v) => (!v ? "Rejection reason is required" : null) : undefined,
      showCancelButton: true,
      confirmButtonText: `Yes, ${status}`,
      confirmButtonColor: status === "Approved" ? "#4CAF50" : status === "Rejected" ? "#E53935" : "#4A90E2",
      cancelButtonColor: "#6b7280",
    });
    if (result.isConfirmed) {
      await updateStatus(appId, status, result.value || "");
      setNote("");
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || "pending").toLowerCase().replace(/\s+/g, "_");
    const config = STATUS_CONFIG[s] || STATUS_CONFIG.pending;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${config.color}`}>
        <config.icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const tabItems = [
    { key: "all", label: "All" },
    { key: "franchise", label: "Franchise" },
    { key: "mtop", label: "MTOP" },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-lg min-h-screen font-[Montserrat,Arial,sans-serif]">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Bus className="w-7 h-7 text-[#4A90E2]" />
          Franchise Permit Processing
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Review and process franchise/MTOP permit applications</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: "Total", value: stats.total, bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-700 dark:text-blue-300" },
          { label: "Pending", value: stats.pending, bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-700 dark:text-amber-300" },
          { label: "Approved", value: stats.approved, bg: "bg-green-50 dark:bg-green-900/20", text: "text-green-700 dark:text-green-300" },
          { label: "Rejected", value: stats.rejected, bg: "bg-red-50 dark:bg-red-900/20", text: "text-red-700 dark:text-red-300" },
          { label: "In Process", value: stats.inProcess, bg: "bg-indigo-50 dark:bg-indigo-900/20", text: "text-indigo-700 dark:text-indigo-300" },
        ].map((card) => (
          <div key={card.label} className={`${card.bg} rounded-xl p-4`}>
            <p className={`text-xs font-medium ${card.text} opacity-80`}>{card.label}</p>
            <p className={`text-2xl font-bold ${card.text}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-200 dark:border-slate-700">
        {tabItems.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
              activeTab === tab.key
                ? "border-[#4CAF50] text-[#4CAF50]"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, plate, TODA, route..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-[#4A90E2] focus:outline-none"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-[#4A90E2] focus:outline-none">
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="under_review">Under Review</option>
          <option value="document_verification">Document Verification</option>
          <option value="payment_verification">Payment Verification</option>
        </select>
        <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-[#4A90E2] focus:outline-none">
          <option value="latest">Latest First</option>
          <option value="oldest">Oldest First</option>
          <option value="name_asc">Name A-Z</option>
        </select>
        <button onClick={fetchApplications} className="flex items-center gap-2 px-4 py-2.5 bg-[#4A90E2] text-white rounded-xl text-sm font-medium hover:bg-[#3a7bc8] transition">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-[#4A90E2] border-t-transparent rounded-full" />
          <span className="ml-3 text-gray-500">Loading applications...</span>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-red-600 font-medium">{error}</p>
          <button onClick={fetchApplications} className="mt-3 text-sm text-[#4A90E2] hover:underline">Try again</button>
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No applications found</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-700">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-800">
              <tr>
                {["ID", "Applicant", "Vehicle / Plate", "TODA / Route", "Type", "Status", "Date", "Action"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {filteredApps.map((app) => (
                <tr key={app.application_id || app.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition">
                  <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">#{app.application_id || app.id}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{app.full_name}</p>
                    <p className="text-xs text-gray-500">{app.contact_number || ""}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-900 dark:text-white">{app.make_brand || ""} {app.model || ""}</p>
                    <p className="text-xs text-gray-500 font-mono">{app.plate_number || "N/A"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-900 dark:text-white">{app.toda_name || "N/A"}</p>
                    <p className="text-xs text-gray-500">{app.route_zone || ""}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300">
                      {app.permit_type || "NEW"} / {app.permit_subtype || "FRANCHISE"}
                    </span>
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(app.status)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(app.created_at)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => { setSelectedApp(app); setNote(""); }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#4A90E2] text-white text-xs font-medium rounded-lg hover:bg-[#3a7bc8] transition"
                    >
                      <Eye className="w-3 h-3" /> Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail / Review Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Bus className="w-5 h-5 text-[#4A90E2]" />
                Application #{selectedApp.application_id || selectedApp.id}
              </h2>
              <button onClick={() => setSelectedApp(null)} className="text-gray-400 hover:text-red-500 text-xl font-bold">&times;</button>
            </div>
            <div className="p-6 space-y-5">
              {/* Status */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">Current Status:</span>
                {getStatusBadge(selectedApp.status)}
              </div>

              {/* Applicant Info */}
              <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" /> Applicant Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">Name:</span> <span className="font-medium text-gray-900 dark:text-white">{selectedApp.full_name}</span></div>
                  <div><span className="text-gray-500">Email:</span> <span className="font-medium text-gray-900 dark:text-white">{selectedApp.email || "N/A"}</span></div>
                  <div><span className="text-gray-500">Contact:</span> <span className="font-medium text-gray-900 dark:text-white">{selectedApp.contact_number || "N/A"}</span></div>
                  <div><span className="text-gray-500">Address:</span> <span className="font-medium text-gray-900 dark:text-white">{selectedApp.home_address || "N/A"}</span></div>
                  <div><span className="text-gray-500">Operator Type:</span> <span className="font-medium text-gray-900 dark:text-white">{selectedApp.operator_type || "N/A"}</span></div>
                  <div><span className="text-gray-500">Citizenship:</span> <span className="font-medium text-gray-900 dark:text-white">{selectedApp.citizenship || "N/A"}</span></div>
                </div>
              </div>

              {/* Vehicle Info */}
              <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Car className="w-4 h-4" /> Vehicle Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">Make/Brand:</span> <span className="font-medium text-gray-900 dark:text-white">{selectedApp.make_brand || "N/A"}</span></div>
                  <div><span className="text-gray-500">Model:</span> <span className="font-medium text-gray-900 dark:text-white">{selectedApp.model || "N/A"}</span></div>
                  <div><span className="text-gray-500">Plate Number:</span> <span className="font-medium text-gray-900 dark:text-white font-mono">{selectedApp.plate_number || "N/A"}</span></div>
                  <div><span className="text-gray-500">Color:</span> <span className="font-medium text-gray-900 dark:text-white">{selectedApp.color || "N/A"}</span></div>
                  <div><span className="text-gray-500">Year Acquired:</span> <span className="font-medium text-gray-900 dark:text-white">{selectedApp.year_acquired || "N/A"}</span></div>
                  <div><span className="text-gray-500">Vehicle Type:</span> <span className="font-medium text-gray-900 dark:text-white">{selectedApp.vehicle_type || "Tricycle"}</span></div>
                  <div><span className="text-gray-500">Engine No:</span> <span className="font-medium text-gray-900 dark:text-white">{selectedApp.engine_number || "N/A"}</span></div>
                  <div><span className="text-gray-500">Chassis No:</span> <span className="font-medium text-gray-900 dark:text-white">{selectedApp.chassis_number || "N/A"}</span></div>
                </div>
              </div>

              {/* Route Info */}
              <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Route & Franchise Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">TODA Name:</span> <span className="font-medium text-gray-900 dark:text-white">{selectedApp.toda_name || "N/A"}</span></div>
                  <div><span className="text-gray-500">Route/Zone:</span> <span className="font-medium text-gray-900 dark:text-white">{selectedApp.route_zone || "N/A"}</span></div>
                  <div><span className="text-gray-500">Barangay:</span> <span className="font-medium text-gray-900 dark:text-white">{selectedApp.barangay_of_operation || "N/A"}</span></div>
                  <div><span className="text-gray-500">District:</span> <span className="font-medium text-gray-900 dark:text-white">{selectedApp.district || "N/A"}</span></div>
                  <div><span className="text-gray-500">Permit Type:</span> <span className="font-medium text-gray-900 dark:text-white">{selectedApp.permit_type || "NEW"}</span></div>
                  <div><span className="text-gray-500">Subtype:</span> <span className="font-medium text-gray-900 dark:text-white">{selectedApp.permit_subtype || "FRANCHISE"}</span></div>
                </div>
              </div>

              {/* LTO Info */}
              <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> LTO & Registration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">LTO OR No:</span> <span className="font-medium text-gray-900 dark:text-white">{selectedApp.lto_or_number || "N/A"}</span></div>
                  <div><span className="text-gray-500">LTO CR No:</span> <span className="font-medium text-gray-900 dark:text-white">{selectedApp.lto_cr_number || "N/A"}</span></div>
                  <div><span className="text-gray-500">MV File No:</span> <span className="font-medium text-gray-900 dark:text-white">{selectedApp.mv_file_number || "N/A"}</span></div>
                  <div><span className="text-gray-500">LTO Expiry:</span> <span className="font-medium text-gray-900 dark:text-white">{formatDate(selectedApp.lto_expiration_date)}</span></div>
                </div>
              </div>

              {/* Existing Remarks */}
              {selectedApp.remarks && (
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-700">
                  <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-2">Previous Remarks</h3>
                  <pre className="text-xs text-amber-700 dark:text-amber-400 whitespace-pre-wrap font-sans">{selectedApp.remarks}</pre>
                </div>
              )}

              {/* Admin Notes */}
              <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Admin Notes / Remarks</h3>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-200 dark:border-slate-700 rounded-xl p-3 text-sm bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-[#4A90E2] focus:outline-none"
                  placeholder="Add processing remarks..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-2">
                <button onClick={() => handleStatusAction("Approved")} className="flex items-center gap-2 px-5 py-2.5 bg-[#4CAF50] text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition">
                  <CheckCircle className="w-4 h-4" /> Approve
                </button>
                <button onClick={() => handleStatusAction("Rejected")} className="flex items-center gap-2 px-5 py-2.5 bg-[#E53935] text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition">
                  <XCircle className="w-4 h-4" /> Reject
                </button>
                <button onClick={() => handleStatusAction("Under Review")} className="flex items-center gap-2 px-5 py-2.5 bg-[#3B82F6] text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
                  <Eye className="w-4 h-4" /> Under Review
                </button>
                <button onClick={() => handleStatusAction("Pending")} className="flex items-center gap-2 px-5 py-2.5 bg-[#FDA811] text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition">
                  <Clock className="w-4 h-4" /> Set Pending
                </button>
                <button onClick={() => setSelectedApp(null)} className="ml-auto px-5 py-2.5 border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-100 dark:hover:bg-slate-800 transition">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
