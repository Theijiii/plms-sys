// apiConfig.js (shared across components)
const API_BASE = "/backend/business_permit";

// Generic POST request
export async function postData(endpoint, action, payload, db = 'eplms_business_permit_system') {
  const url = `${API_BASE}/${endpoint}/${action}?db=${db}`; // Clean URL
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

// Generic GET request
export async function getData(endpoint, action, params = {}, db = 'eplms_business_permit_system') {
  const query = new URLSearchParams({...params, db}).toString();
  const url = `${API_BASE}/${endpoint}/${action}?${query}`;
  const res = await fetch(url);
  return res.json();
}
// BusinessProcess.jsx
import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Info } from "lucide-react";
// import { getData, postData } from './apiConfig';

export default function BusinessProcess() {
  const [applications, setApplications] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, rejected: 0 });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, status: "", permitId: "" });

  // Load all applications on mount
  useEffect(() => {
    getData('applications', 'list')
      .then(data => {
        if (Array.isArray(data)) {
          setApplications(data);
          computeStats(data);
        }
      })
      .catch(err => console.error("Error loading applications:", err))
      .finally(() => setLoading(false));
  }, []);

  // Compute dashboard stats
  const computeStats = (apps) => {
    const total = apps.length;
    const approved = apps.filter(a => a.status === "Approved").length;
    const pending = apps.filter(a => a.status === "Pending").length;
    const rejected = apps.filter(a => a.status === "Rejected").length;
    setStats({ total, approved, pending, rejected });
  };

  // View application details
  const viewApplication = async (id) => {
    try {
      const data = await getData('applications', 'view', { id });
      if (data.success) {
        setSelectedApp(data.application);
        setNote(data.application.admin_note || "");
      } else {
        alert("Failed to load application details.");
      }
    } catch (err) {
      console.error(err);
      alert("Error loading details.");
    }
  };

  // Update application status
  const updateStatus = async (status) => {
    if (!selectedApp) return;

    try {
      const data = await postData(
        'applications',
        'updateStatus',
        { id: selectedApp.permit_id, status, note }
      );

      if (data.success) {
        // Update local state
        const updated = applications.map(a =>
          a.permit_id === selectedApp.permit_id
            ? { ...a, status, admin_note: note }
            : a
        );
        setApplications(updated);
        computeStats(updated);
        setSelectedApp({ ...selectedApp, status, admin_note: note });

        // Show confirmation modal
        setConfirmModal({ isOpen: true, status, permitId: selectedApp.permit_id });
      } else {
        alert("Failed to update status.");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating status.");
    }
  };

  // Icon mapping for confirmation modal
  const statusConfig = {
    Approved: { icon: <CheckCircle size={24} className="text-green-600" />, text: "approved" },
    Rejected: { icon: <XCircle size={24} className="text-red-600" />, text: "rejected" },
    Pending: { icon: <Info size={24} className="text-yellow-500" />, text: "set to pending" },
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-lg min-h-screen font-[Montserrat,Arial,sans-serif]">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Business Permits Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Overview of issued business permits
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-100 p-4 rounded-lg">
          <p className="text-blue-800 text-sm font-medium">Total Permits</p>
          <p className="text-blue-900 text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-green-100 p-4 rounded-lg">
          <p className="text-green-800 text-sm font-medium">Approved</p>
          <p className="text-green-900 text-2xl font-bold">{stats.approved}</p>
        </div>
        <div className="bg-red-100 p-4 rounded-lg">
          <p className="text-red-800 text-sm font-medium">Rejected</p>
          <p className="text-red-900 text-2xl font-bold">{stats.rejected}</p>
        </div>
        <div className="bg-yellow-100 p-4 rounded-lg">
          <p className="text-yellow-800 text-sm font-medium">Pending</p>
          <p className="text-yellow-900 text-2xl font-bold">{stats.pending}</p>
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
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Permit ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Business Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {applications.map(a => (
                <tr key={a.permit_id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition">
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{a.permit_id}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{a.business_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{a.owner_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{a.permit_type}</td>
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
                    {a.date_submitted ? new Date(a.date_submitted).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-center">
                    <button
                      onClick={() => viewApplication(a.permit_id)}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs leading-4 font-medium rounded text-white"
                      style={{ backgroundColor: "#4A90E2" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FDA811")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#4A90E2")}
                    >
                      VIEW
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Full Details Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setSelectedApp(null)}
              className="absolute top-3 right-3 text-gray-600 hover:text-red-600 text-xl"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold text-gray-800 mb-4">Application Details</h2>

            {/* Owner Information */}
            <section className="mb-4">
              <h3 className="font-semibold text-gray-700 mb-2">Owner Information</h3>
              <div className="pl-2 text-sm text-gray-700 space-y-1">
                <p><strong>Name:</strong> {selectedApp.first_name} {selectedApp.middle_name || ""} {selectedApp.last_name}</p>
                <p><strong>Type:</strong> {selectedApp.owner_type}</p>
                <p><strong>Email:</strong> {selectedApp.email_address}</p>
                <p><strong>Contact:</strong> {selectedApp.contact_number}</p>
                <p><strong>Citizenship:</strong> {selectedApp.citizenship}</p>
              </div>
            </section>

            {/* Business Information */}
            <section className="mb-4">
              <h3 className="font-semibold text-gray-700 mb-2">Business Information</h3>
              <div className="pl-2 text-sm text-gray-700 space-y-1">
                <p><strong>Business Name:</strong> {selectedApp.business_name}</p>
                <p><strong>Nature:</strong> {selectedApp.business_nature}</p>
                <p><strong>Structure:</strong> {selectedApp.business_structure}</p>
                <p><strong>Activity:</strong> {selectedApp.business_activity}</p>
              </div>
            </section>

            {/* Permit Information */}
            <section className="mb-4">
              <h3 className="font-semibold text-gray-700 mb-2">Permit Information</h3>
              <div className="pl-2 text-sm text-gray-700 space-y-1">
                <p><strong>Permit Type:</strong> {selectedApp.permit_type}</p>
                <p><strong>Status:</strong> {selectedApp.status || "Pending"}</p>
                <p><strong>Date Submitted:</strong> {selectedApp.date_submitted}</p>
              </div>
            </section>

            {/* Admin Action */}
            <section className="mt-6 border-t pt-4">
              <h3 className="font-semibold text-gray-700 mb-2">Admin Action</h3>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-green-300 focus:outline-none"
                placeholder="Add remarks or note..."
              />
              <div className="flex gap-3 mt-3">
                <button
                  onClick={() => updateStatus("Approved")}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
                >
                  Approve
                </button>
                <button
                  onClick={() => updateStatus("Rejected")}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition"
                >
                  Reject
                </button>
                <button
                  onClick={() => updateStatus("Pending")}
                  className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition"
                >
                  Set Pending
                </button>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* Action Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-900 rounded-lg w-full max-w-sm p-6 shadow-lg text-center">
            <div className="flex flex-col items-center gap-3">
              {statusConfig[confirmModal.status]?.icon}
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                You {statusConfig[confirmModal.status]?.text}{" "}
                <span className="font-mono">Business Permit #{confirmModal.permitId}</span>
              </h3>
              <button
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
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
