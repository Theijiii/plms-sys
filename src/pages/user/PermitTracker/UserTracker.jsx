import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Eye, Download, Calendar, FileText, X, CheckCircle, Clock, Upload, 
  Check, Loader2, Building, Home, Briefcase, Building2, RefreshCw
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import Swal from "sweetalert2";

export default function PermitTracker() {
  const [tracking, setTracking] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedPermit, setSelectedPermit] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [uploadFiles, setUploadFiles] = useState({});
  const [showDownloadSuccess, setShowDownloadSuccess] = useState(false);
  const [showUploadSuccess, setShowUploadSuccess] = useState(false);
  const [downloadedPermitId, setDownloadedPermitId] = useState("");
  const [uploadedPermitId, setUploadedPermitId] = useState("");
  const [isConfirmBackOpen, setIsConfirmBackOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchApplications();
  }, [user]);

  const fetchApplications = async () => {
    if (!user || !user.email) {
      setError("User not authenticated");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const userEmail = user.email;
      const userId = localStorage.getItem('user_id') || 0;

      const response = await fetch(
        `/backend/api/tracker.php?email=${encodeURIComponent(userEmail)}&user_id=${userId}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setTracking(data.applications || []);
      } else {
        setError(data.message || "Failed to fetch applications");
      }
    } catch (err) {
      console.error("Error fetching applications:", err);
      setError("Failed to load applications. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Statistics
  const statistics = {
    total: tracking.length,
    approved: tracking.filter(t => t.status === 'Approved').length,
    pending: tracking.filter(t => t.status === 'Pending').length,
    forCompliance: tracking.filter(t => t.status === 'For Compliance').length,
    rejected: tracking.filter(t => t.status === 'Rejected').length,
  };

  // Permit type icons
  const getPermitIcon = (permitType) => {
    const type = permitType?.toLowerCase() || '';
    if (type.includes('business')) return <Building className="w-5 h-5" />;
    if (type.includes('barangay')) return <Home className="w-5 h-5" />;
    if (type.includes('franchise')) return <Briefcase className="w-5 h-5" />;
    if (type.includes('building')) return <Building2 className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  // Filtered tracking with type and status filters
  const filteredTracking = tracking.filter((t) => {
    const searchMatch = `${t.permitType} ${t.status} ${t.application_type} ${t.applicantName} ${t.businessName} ${t.id}`
      .toLowerCase()
      .includes(search.toLowerCase());
    
    const typeMatch = filterType === 'all' || t.permitType?.toLowerCase().includes(filterType.toLowerCase());
    const statusMatch = filterStatus === 'all' || t.status === filterStatus;
    
    return searchMatch && typeMatch && statusMatch;
  });

  const viewDetails = (permit) => {
    setSelectedPermit(permit);
    setShowModal(true);
  };

  const downloadPermit = async (permit) => {
    if (permit.status !== "Approved") {
      Swal.fire({
        icon: 'warning',
        title: 'Cannot Download',
        text: 'Permit can only be downloaded when approved and claimed.',
        confirmButtonColor: '#4A90E2'
      });
      return;
    }

    try {
      // Generate realistic HTML permit document
      const permitHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Official Permit - ${permit.id}</title>
  <style>
    @page { margin: 0; }
    body {
      font-family: 'Times New Roman', serif;
      margin: 0;
      padding: 40px;
      background: white;
    }
    .permit-container {
      max-width: 800px;
      margin: 0 auto;
      border: 3px double #000;
      padding: 30px;
      position: relative;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #000;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .seal {
      width: 100px;
      height: 100px;
      border: 3px solid #000;
      border-radius: 50%;
      margin: 0 auto 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 12px;
    }
    .title {
      font-size: 28px;
      font-weight: bold;
      margin: 10px 0;
      text-transform: uppercase;
    }
    .subtitle {
      font-size: 16px;
      color: #333;
    }
    .permit-number {
      text-align: center;
      font-size: 20px;
      font-weight: bold;
      margin: 20px 0;
      color: #c00;
    }
    .section {
      margin: 20px 0;
    }
    .section-title {
      font-weight: bold;
      font-size: 14px;
      border-bottom: 1px solid #000;
      padding-bottom: 5px;
      margin-bottom: 10px;
      text-transform: uppercase;
    }
    .info-row {
      display: flex;
      margin: 8px 0;
      font-size: 13px;
    }
    .info-label {
      font-weight: bold;
      width: 200px;
      flex-shrink: 0;
    }
    .info-value {
      flex: 1;
    }
    .footer {
      margin-top: 40px;
      border-top: 2px solid #000;
      padding-top: 20px;
      display: flex;
      justify-content: space-between;
    }
    .signature-box {
      text-align: center;
      width: 200px;
    }
    .signature-line {
      border-top: 1px solid #000;
      margin-top: 60px;
      padding-top: 5px;
      font-size: 11px;
    }
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 80px;
      color: rgba(0, 128, 0, 0.1);
      font-weight: bold;
      z-index: -1;
      pointer-events: none;
    }
    .notice {
      margin-top: 20px;
      padding: 15px;
      background: #f9f9f9;
      border-left: 4px solid #000;
      font-size: 11px;
    }
  </style>
</head>
<body>
  <div class="permit-container">
    <div class="watermark">OFFICIAL</div>
    
    <div class="header">
      <div class="seal">CALOOCAN CITY<br/>SEAL</div>
      <div class="title">Republic of the Philippines</div>
      <div class="subtitle">City of Caloocan</div>
      <div class="subtitle" style="margin-top: 10px; font-size: 18px; font-weight: bold;">OFFICE OF THE MAYOR</div>
    </div>

    <div class="permit-number">PERMIT NO. ${permit.id}</div>

    <div style="text-align: center; font-size: 18px; font-weight: bold; margin: 20px 0;">
      ${permit.permitType?.toUpperCase() || 'PERMIT'}
    </div>

    <div class="section">
      <div class="section-title">Permit Details</div>
      <div class="info-row">
        <div class="info-label">Application Type:</div>
        <div class="info-value">${permit.application_type || 'N/A'}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Date Issued:</div>
        <div class="info-value">${formatDate(permit.approvedDate)}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Valid Until:</div>
        <div class="info-value">${formatDate(permit.expirationDate)}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Status:</div>
        <div class="info-value" style="color: green; font-weight: bold;">${permit.status}</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Permitee Information</div>
      <div class="info-row">
        <div class="info-label">Name:</div>
        <div class="info-value">${permit.applicantName || 'N/A'}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Business/Establishment:</div>
        <div class="info-value">${permit.businessName || 'N/A'}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Address:</div>
        <div class="info-value">${permit.address || 'N/A'}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Contact Number:</div>
        <div class="info-value">${permit.contactNumber || 'N/A'}</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Financial Details</div>
      <div class="info-row">
        <div class="info-label">Fees Paid:</div>
        <div class="info-value">${permit.fees || 'PHP 0.00'}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Receipt Number:</div>
        <div class="info-value">${permit.receiptNumber || 'N/A'}</div>
      </div>
    </div>

    <div class="footer">
      <div class="signature-box">
        <div class="signature-line">Approved By</div>
      </div>
      <div class="signature-box">
        <div class="signature-line">City Mayor</div>
      </div>
    </div>

    <div class="notice">
      <strong>IMPORTANT NOTICE:</strong><br/>
      This permit is not transferable and must be displayed in a conspicuous place. 
      Any violation of the terms and conditions may result in revocation of this permit.
      For verification, please visit our office or check online at e-plms.caloocan.gov.ph
      <br/><br/>
      <strong>Document Generated:</strong> ${new Date().toLocaleString()}<br/>
      <strong>Document ID:</strong> ${permit.id}-${Date.now()}
    </div>
  </div>
</body>
</html>
      `;

      // Create blob and download
      const blob = new Blob([permitHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Official-Permit-${permit.id}-${permit.permitType?.replace(/\s+/g, '-')}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Show success notification
      Swal.fire({
        icon: 'success',
        title: 'Download Complete!',
        html: `
          <p>Your official permit <strong>${permit.id}</strong> has been downloaded.</p>
          <p class="text-sm text-gray-600 mt-2">Open the HTML file in your browser to view and print your permit.</p>
        `,
        confirmButtonColor: '#4CAF50'
      });
    } catch (error) {
      console.error('Download error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Download Failed',
        text: error.message || 'Unable to download permit. Please try again.',
        confirmButtonColor: '#E53935'
      });
    }
  };

  const handleFileUpload = async (permit, event) => {
    const files = event.target.files;
    if (files.length === 0) return;

    const result = await Swal.fire({
      title: 'Upload Compliance Documents',
      html: `
        <div class="text-left">
          <p class="mb-2">You are uploading <strong>${files.length}</strong> file(s) for:</p>
          <p class="text-sm bg-gray-100 p-2 rounded mb-2"><strong>Permit ID:</strong> ${permit.id}</p>
          <p class="text-sm bg-gray-100 p-2 rounded mb-3"><strong>Type:</strong> ${permit.permitType}</p>
          <div class="text-xs text-gray-600">
            <p><strong>Files to upload:</strong></p>
            <ul class="list-disc pl-4 mt-1">
              ${Array.from(files).map(f => `<li>${f.name} (${(f.size / 1024).toFixed(1)} KB)</li>`).join('')}
            </ul>
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Upload Files',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#4CAF50',
      cancelButtonColor: '#9CA3AF'
    });

    if (!result.isConfirmed) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('permit_id', permit.id);
      formData.append('permit_type', permit.permitType);
      formData.append('user_id', localStorage.getItem('user_id') || '');
      
      Array.from(files).forEach((file, index) => {
        formData.append(`compliance_file_${index}`, file);
      });

      const response = await fetch('/backend/api/upload_compliance.php', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Upload Successful!',
          html: `
            <p>Your compliance documents have been uploaded successfully.</p>
            <p class="text-sm text-gray-600 mt-2">Permit ID: <strong>${permit.id}</strong></p>
            <p class="text-sm text-gray-600">The admin team will review your documents shortly.</p>
          `,
          confirmButtonColor: '#4CAF50'
        });
        
        // Refresh applications
        fetchApplications();
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Upload Failed',
        text: error.message || 'Failed to upload compliance documents. Please try again.',
        confirmButtonColor: '#E53935'
      });
    } finally {
      setUploading(false);
      if (event.target) event.target.value = '';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Approved":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "Rejected":
        return <X className="w-4 h-4 text-red-500" />;
      case "For Compliance":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="mx-1 mt-1 p-6 dark:bg-slate-900 bg-white dark:text-slate-300 rounded-lg min-h-screen flex flex-col">
      <h1 className="text-xl md:text-3xl font-bold mb-2 text-center">
        E-Permit Tracker
      </h1>
      <p className="mb-6 text-center text-sm">
        Track the status of all your permit applications in one place. <br />
        Search by permit type, status, or permit ID.
      </p>

      {/* Applicant Info */}
      <div className="w-full max-w-2xl mx-auto mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div className="text-center">
          <h3 className="font-semibold text-blue-800 dark:text-blue-300 text-sm">Applicant Information</h3>
          <p className="text-sm"><strong>Name:</strong> {user?.fullName || user?.username || 'N/A'}</p>
          <p className="text-sm"><strong>Email:</strong> {user?.email || 'N/A'}</p>
        </div>
      </div>

      {/* Search Input */}
      <div className="w-full max-w-md mx-auto mb-8">
        <input
          type="text"
          placeholder="Search by permit type, status, or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-sm"
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center flex-grow py-12">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading your applications...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center flex-grow py-12">
          <X className="w-12 h-12 text-red-500 mb-4" />
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchApplications}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      ) : tracking.length === 0 ? (
        <p className="text-gray-500 italic text-center flex-grow text-sm">
          No permit applications submitted
        </p>
      ) : (
        <div className="overflow-x-auto flex-grow">
          <table className="w-full bg-white dark:bg-slate-800 shadow rounded-lg">
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Permit ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Permit Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Application Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Submitted Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Expiration Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTracking.length > 0 ? (
                filteredTracking.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-mono">{t.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{t.permitType}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        t.application_type === 'New' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                        t.application_type === 'Renewal' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                        'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                      }`}>
                        {t.application_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(t.status)}
                        <span className={`font-medium ${
                          t.status === 'Approved' ? 'text-green-600 dark:text-green-400' :
                          t.status === 'Rejected' ? 'text-red-600 dark:text-red-400' :
                          'text-yellow-600 dark:text-yellow-400'
                        }`}>
                          {t.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(t.submittedDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(t.expirationDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => viewDetails(t)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => downloadPermit(t)}
                          className={`p-2 rounded-lg transition-colors ${
                            t.status === 'Approved' 
                              ? 'text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20' 
                              : 'text-gray-400 cursor-not-allowed'
                          }`}
                          title={t.status === 'Approved' ? 'Download Permit' : 'Available when approved'}
                          disabled={t.status !== 'Approved'}
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {t.status === "For Compliance" && (
                          <label className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors cursor-pointer" title="Upload Compliance Documents">
                            <Upload className="w-4 h-4" />
                            <input
                              type="file"
                              multiple
                              onChange={(e) => handleFileUpload(t, e)}
                              className="hidden"
                              disabled={uploading}
                            />
                          </label>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center text-gray-500 py-4 text-sm">
                    No matching permits found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Details Modal */}
      {showModal && selectedPermit && (
<  div className="fixed inset-0 bg-black bg-opacity-10 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">Permit Details</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2 text-sm">Basic Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Permit ID:</strong> {selectedPermit.id}</p>
                    <p><strong>Permit Type:</strong> {selectedPermit.permitType}</p>
                    <p><strong>Application Type:</strong> {selectedPermit.application_type}</p>
                    <p><strong>Status:</strong> 
                      <span className={`ml-2 ${
                        selectedPermit.status === 'Approved' ? 'text-green-600 dark:text-green-400' :
                        selectedPermit.status === 'Rejected' ? 'text-red-600 dark:text-red-400' :
                        'text-yellow-600 dark:text-yellow-400'
                      }`}>
                        {selectedPermit.status}
                      </span>
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2 text-sm">Applicant Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Applicant Name:</strong> {selectedPermit.applicantName}</p>
                    <p><strong>Business Name:</strong> {selectedPermit.businessName}</p>
                    <p><strong>Address:</strong> {selectedPermit.address}</p>
                    <p><strong>Contact:</strong> {selectedPermit.contactNumber}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <Calendar className="w-5 h-5 mx-auto mb-2 text-blue-500" />
                  <p className="text-xs text-gray-600 dark:text-gray-400">Submitted</p>
                  <p className="font-semibold text-sm">{formatDate(selectedPermit.submittedDate)}</p>
                </div>
                
                {selectedPermit.approvedDate && (
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <CheckCircle className="w-5 h-5 mx-auto mb-2 text-green-500" />
                    <p className="text-xs text-gray-600 dark:text-gray-400">Approved</p>
                    <p className="font-semibold text-sm">{formatDate(selectedPermit.approvedDate)}</p>
                  </div>
                )}

                {selectedPermit.rejectedDate && (
                  <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <X className="w-5 h-5 mx-auto mb-2 text-red-500" />
                    <p className="text-xs text-gray-600 dark:text-gray-400">Rejected</p>
                    <p className="font-semibold text-sm">{formatDate(selectedPermit.rejectedDate)}</p>
                  </div>
                )}

                {selectedPermit.expirationDate && (
                  <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <Calendar className="w-5 h-5 mx-auto mb-2 text-orange-500" />
                    <p className="text-xs text-gray-600 dark:text-gray-400">Expires</p>
                    <p className="font-semibold text-sm">{formatDate(selectedPermit.expirationDate)}</p>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2 text-sm">Requirements</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {selectedPermit.requirements.map((req, index) => (
                    <li key={index}>{req}</li>
                  ))}
                </ul>
              </div>

              {selectedPermit.complianceNotes && (
                <div className="mb-6 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <h3 className="font-semibold text-yellow-700 dark:text-yellow-300 mb-1 text-sm">Compliance Requirements</h3>
                  <p className="text-sm">{selectedPermit.complianceNotes}</p>
                  <div className="mt-3">
                    <label className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs leading-4 font-medium rounded text-white bg-yellow-600 hover:bg-yellow-700 cursor-pointer">
                      <Upload className="w-3 h-3 mr-1" />
                      Upload Compliance Documents
                      <input
                        type="file"
                        multiple
                        onChange={(e) => handleFileUpload(selectedPermit, e)}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>
                  </div>
                </div>
              )}

              {selectedPermit.rejectionReason && (
                <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <h3 className="font-semibold text-red-700 dark:text-red-300 mb-1 text-sm">Rejection Reason</h3>
                  <p className="text-sm">{selectedPermit.rejectionReason}</p>
                </div>
              )}

              <div className="flex justify-between items-center">
                <p className="text-sm"><strong>Fees:</strong> {selectedPermit.fees}</p>
                <button
                  onClick={() => downloadPermit(selectedPermit)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${
                    selectedPermit.status === 'Approved'
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  }`}
                  disabled={selectedPermit.status !== 'Approved'}
                >
                  <Download className="w-4 h-4" />
                  Download Permit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Download Success Modal */}
      {showDownloadSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Download Complete!
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Permit <strong>{downloadedPermitId}</strong> has been successfully downloaded to your device.
              </p>
              <button
                onClick={() => setShowDownloadSuccess(false)}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Success Modal */}
      {showUploadSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                <Check className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Files Submitted!
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Your compliance documents for permit <strong>{uploadedPermitId}</strong> have been successfully submitted for review.
              </p>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                You will be notified once your documents have been reviewed.
              </div>
              <button
                onClick={() => setShowUploadSuccess(false)}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 text-center">
        <button
          onClick={() => setIsConfirmBackOpen(true)}
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-orange-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>
      </div>

      {/* Confirm Back Modal */}
      {isConfirmBackOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-lg w-full p-8 text-center">
            <h3 className="text-2xl font-semibold mb-6">Are you sure you want to go back?</h3>
            <div className="flex justify-center gap-6">
              <button
                onClick={() => setIsConfirmBackOpen(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => navigate('/user/dashboard')}
                className="bg-green-600 hover:bg-orange-500 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Yes, Go Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}