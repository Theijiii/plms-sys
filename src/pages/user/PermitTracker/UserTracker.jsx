import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Eye, Download, Calendar, FileText, X, CheckCircle, Clock, Upload, 
  Check, Loader2, Building, Home, Briefcase, Building2, RefreshCw, Filter,
  ChevronUp, ChevronDown, FileDown, TrendingUp, AlertCircle, ArrowUpDown,
  FileType, Printer
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import Swal from "sweetalert2";
import { generatePermitPDF } from "../../../utils/permitPdfGenerator";
import fileBrgyImg from "../../../assets/filebrgy.png";
import fileBuildingImg from "../../../assets/filebuilding.png";
import fileBusinessImg from "../../../assets/filebusiness.png";
import fileTodaImg from "../../../assets/filetoda.png";

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
  const [downloading, setDownloading] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortField, setSortField] = useState("submittedDate");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(true);
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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('[PermitTracker] API response:', { total: data.total, appCount: data.applications?.length, email: data.user_email, userId: data.user_id });

      if (data.success) {
        const normalizeStatus = (s) => {
          if (!s) return 'Pending';
          const lower = s.trim().toLowerCase();
          if (lower === 'approved') return 'Approved';
          if (lower === 'rejected') return 'Rejected';
          if (lower === 'for compliance') return 'For Compliance';
          return 'Pending';
        };
        const apps = (data.applications || []).map(app => ({
          ...app,
          status: normalizeStatus(app.status)
        }));
        setTracking(apps);
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

  // Get unique permit types for filter dropdown
  const permitTypes = [...new Set(tracking.map(t => t.permitType).filter(Boolean))];

  // Filtered tracking with type, status, and date range filters
  const filteredTracking = tracking.filter((t) => {
    const searchMatch = `${t.permitType} ${t.status} ${t.application_type} ${t.applicantName} ${t.businessName} ${t.id}`
      .toLowerCase()
      .includes(search.toLowerCase());
    
    const typeMatch = filterType === 'all' || t.permitType?.toLowerCase().includes(filterType.toLowerCase());
    const statusMatch = filterStatus === 'all' || t.status === filterStatus;
    
    // Date range filtering
    let dateMatch = true;
    if (dateFrom || dateTo) {
      const submitDate = new Date(t.submittedDate);
      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        dateMatch = dateMatch && submitDate >= fromDate;
      }
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999); // Include entire day
        dateMatch = dateMatch && submitDate <= toDate;
      }
    }
    
    return searchMatch && typeMatch && statusMatch && dateMatch;
  });

  // Sorted tracking
  const sortedTracking = [...filteredTracking].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    
    // Handle date fields
    if (sortField.includes('Date')) {
      aVal = new Date(aVal || 0).getTime();
      bVal = new Date(bVal || 0).getTime();
    }
    
    // Handle string fields
    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal?.toLowerCase() || '';
    }
    
    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedTracking.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTracking = sortedTracking.slice(startIndex, endIndex);

  // Handle sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    if (filteredTracking.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Data',
        text: 'No applications to export.',
        confirmButtonColor: '#4A90E2'
      });
      return;
    }

    const headers = ['Permit ID', 'Permit Type', 'Application Type', 'Status', 'Applicant Name', 'Business Name', 'Submitted Date', 'Expiration Date', 'Address', 'Contact'];
    const csvData = filteredTracking.map(t => [
      t.id,
      t.permitType,
      t.application_type,
      t.status,
      t.applicantName || 'N/A',
      t.businessName || 'N/A',
      formatDate(t.submittedDate),
      formatDate(t.expirationDate),
      t.address || 'N/A',
      t.contactNumber || 'N/A'
    ]);

    const csv = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Permit-Applications-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    Swal.fire({
      icon: 'success',
      title: 'Export Successful!',
      text: `Exported ${filteredTracking.length} application(s) to CSV.`,
      confirmButtonColor: '#4CAF50'
    });
  };

  // Clear filters
  const clearFilters = () => {
    setSearch('');
    setFilterType('all');
    setFilterStatus('all');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  const viewDetails = (permit) => {
    setSelectedPermit(permit);
    setShowModal(true);
  };

  const downloadPermit = async (permit) => {
    if (permit.status !== "Approved") {
      Swal.fire({
        icon: 'warning',
        title: 'Cannot Download',
        text: 'Permit can only be downloaded when approved.',
        confirmButtonColor: '#4A90E2'
      });
      return;
    }

    try {
      setDownloading(true);
      const filename = await generatePermitPDF(permit);

      Swal.fire({
        icon: 'success',
        title: 'PDF Downloaded!',
        html: `
          <p>Your unofficial digital copy of <strong>${permit.permitType}</strong> (${permit.id}) has been downloaded as PDF.</p>
          <p class="text-sm text-gray-600 mt-2">File: <strong>${filename}</strong></p>
          <p class="text-xs text-gray-400 mt-1">This is a digital copy. For the official permit, please visit the respective office.</p>
        `,
        confirmButtonColor: '#4CAF50'
      });
    } catch (error) {
      console.error('Download error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Download Failed',
        text: error.message || 'Unable to generate PDF. Please try again.',
        confirmButtonColor: '#E53935'
      });
    } finally {
      setDownloading(false);
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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

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

  const isDownloadablePermit = (permitType) => {
    const type = (permitType || '').toLowerCase();
    return type.includes('business') || type.includes('barangay') || type.includes('building') || type.includes('toda') || type.includes('franchise');
  };

  const getPermitPreviewImage = (permitType) => {
    const type = (permitType || '').toLowerCase();
    if (type.includes('business')) return fileBusinessImg;
    if (type.includes('barangay')) return fileBrgyImg;
    if (type.includes('building')) return fileBuildingImg;
    if (type.includes('toda') || type.includes('franchise')) return fileTodaImg;
    return null;
  };

  return (
    <div className="mx-1 mt-1 p-6 bg-[#FBFBFB] dark:bg-slate-900 text-[#4D4A4A] dark:text-slate-300 rounded-lg min-h-screen flex flex-col">
      <h1 className="text-xl md:text-3xl font-bold mb-2 text-center text-[#4D4A4A] dark:text-white">
        E-Permit Tracker
      </h1>
      <p className="mb-6 text-center text-sm text-[#4D4A4A]/70 dark:text-gray-400">
        Track the status of all your permit applications in one place. <br />
        Search, filter, and manage your applications efficiently.
      </p>

      {/* Statistics Dashboard */}
      {!loading && !error && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <div className="bg-[#EBF3FC] border border-[#C9DDFB] rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <FileText className="w-7 h-7 text-[#4A90E2]" />
              <span className="text-2xl font-bold text-[#4A90E2]">{statistics.total}</span>
            </div>
            <p className="text-xs font-medium text-[#4D4A4A]">Total Applications</p>
          </div>
          
          <div className="bg-[#E8F5E9] border border-[#C8E6C9] rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-7 h-7 text-[#4CAF50]" />
              <span className="text-2xl font-bold text-[#4CAF50]">{statistics.approved}</span>
            </div>
            <p className="text-xs font-medium text-[#4D4A4A]">Approved</p>
          </div>
          
          <div className="bg-[#FFF8E1] border border-[#FFECB3] rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-7 h-7 text-[#FDA811]" />
              <span className="text-2xl font-bold text-[#FDA811]">{statistics.pending}</span>
            </div>
            <p className="text-xs font-medium text-[#4D4A4A]">Pending</p>
          </div>
          
          <div className="bg-[#FFF3E0] border border-[#FFE0B2] rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="w-7 h-7 text-[#F57C00]" />
              <span className="text-2xl font-bold text-[#F57C00]">{statistics.forCompliance}</span>
            </div>
            <p className="text-xs font-medium text-[#4D4A4A]">For Compliance</p>
          </div>
          
          <div className="bg-[#FFEBEE] border border-[#FFCDD2] rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <X className="w-7 h-7 text-[#E53935]" />
              <span className="text-2xl font-bold text-[#E53935]">{statistics.rejected}</span>
            </div>
            <p className="text-xs font-medium text-[#4D4A4A]">Rejected</p>
          </div>
        </div>
      )}

      {/* Applicant Info */}
      <div className="w-full max-w-2xl mx-auto mb-6 p-4 bg-[#EBF3FC] dark:bg-blue-900/20 rounded-lg border border-[#C9DDFB] dark:border-blue-800">
        <div className="text-center">
          <h3 className="font-semibold text-[#4A90E2] dark:text-blue-300 text-sm">Applicant Information</h3>
          <p className="text-sm"><strong>Name:</strong> {user?.fullName || user?.username || 'N/A'}</p>
          <p className="text-sm"><strong>Email:</strong> {user?.email || 'N/A'}</p>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="mb-6 space-y-4">
        {/* Search and Action Buttons */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="w-full md:w-96">
            <input
              type="text"
              placeholder="Search by permit type, status, name, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white text-sm"
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-[#4A90E2] hover:bg-[#3A7BD5] text-white rounded-lg transition-colors text-sm"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? 'Hide' : 'Show'} Filters
            </button>
            
            <button
              onClick={fetchApplications}
              className="flex items-center gap-2 px-4 py-2 bg-[#4CAF50] hover:bg-[#43A047] text-white rounded-lg transition-colors text-sm"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-[#4A90E2]/80 hover:bg-[#4A90E2] text-white rounded-lg transition-colors text-sm"
              disabled={tracking.length === 0}
            >
              <FileDown className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-[#E9E7E7] dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Permit Type Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Permit Type</label>
                <select
                  value={filterType}
                  onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white text-sm"
                >
                  <option value="all">All Types</option>
                  {permitTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="For Compliance">For Compliance</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              {/* Date From */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Date From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white text-sm"
                />
              </div>

              {/* Date To */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Date To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white text-sm"
                />
              </div>
            </div>
            
            <div className="mt-3 flex justify-between items-center">
              <p className="text-xs text-[#4D4A4A]/70 dark:text-gray-400">
                Showing {sortedTracking.length} of {tracking.length} applications
              </p>
              <button
                onClick={clearFilters}
                className="text-xs text-[#4A90E2] hover:text-[#3A7BD5] dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center flex-grow py-12">
          <Loader2 className="w-12 h-12 text-[#4A90E2] animate-spin mb-4" />
          <p className="text-[#4D4A4A]/70 dark:text-gray-400">Loading your applications...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center flex-grow py-12">
          <X className="w-12 h-12 text-[#E53935] mb-4" />
          <p className="text-[#E53935] dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchApplications}
            className="px-4 py-2 bg-[#4A90E2] hover:bg-[#3A7BD5] text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      ) : tracking.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg font-medium mb-2">
            No permit applications found
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-sm">
            Submit your first application to get started
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto flex-grow">
            <table className="w-full bg-white dark:bg-slate-800 rounded-lg border border-[#E9E7E7] dark:border-gray-700">
              <thead className="bg-[#FBFBFB] dark:bg-slate-700">
                <tr>
                  <th 
                    onClick={() => handleSort('id')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600"
                  >
                    <div className="flex items-center gap-1">
                      Permit ID
                      {sortField === 'id' && (
                        sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      )}
                      {sortField !== 'id' && <ArrowUpDown className="w-3 h-3 opacity-30" />}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('permitType')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600"
                  >
                    <div className="flex items-center gap-1">
                      Permit Type
                      {sortField === 'permitType' && (
                        sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      )}
                      {sortField !== 'permitType' && <ArrowUpDown className="w-3 h-3 opacity-30" />}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Application Type</th>
                  <th 
                    onClick={() => handleSort('status')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600"
                  >
                    <div className="flex items-center gap-1">
                      Status
                      {sortField === 'status' && (
                        sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      )}
                      {sortField !== 'status' && <ArrowUpDown className="w-3 h-3 opacity-30" />}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('submittedDate')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600"
                  >
                    <div className="flex items-center gap-1">
                      Submitted Date
                      {sortField === 'submittedDate' && (
                        sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      )}
                      {sortField !== 'submittedDate' && <ArrowUpDown className="w-3 h-3 opacity-30" />}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Expiration Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedTracking.length > 0 ? (
                  paginatedTracking.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-mono">{t.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{t.permitType}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        t.application_type === 'New' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                        t.application_type === 'Renewal' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                        t.application_type?.startsWith('Amendment') ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300' :
                        t.application_type === 'Professional Registration' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300' :
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
                    <td className="px-6 py-4 text-sm">
                      {t.expirationDate ? (() => {
                        const now = new Date();
                        const exp = new Date(t.expirationDate);
                        const daysLeft = Math.round((exp - now) / 86400000);
                        const isExpired = daysLeft < 0;
                        const isExpiringSoon = !isExpired && daysLeft <= 30;
                        return (
                          <div>
                            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                              <Calendar className="w-3 h-3" />
                              {formatDate(t.expirationDate)}
                            </div>
                            {isExpired && (
                              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                <X className="w-3 h-3" /> Expired ({Math.abs(daysLeft)}d ago)
                              </span>
                            )}
                            {isExpiringSoon && (
                              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                <AlertCircle className="w-3 h-3" /> {daysLeft}d left
                              </span>
                            )}
                            {!isExpired && !isExpiringSoon && (
                              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                <CheckCircle className="w-3 h-3" /> Active
                              </span>
                            )}
                          </div>
                        );
                      })() : (
                        <span className="text-gray-400 dark:text-gray-500 text-xs">Not set</span>
                      )}
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
                        {isDownloadablePermit(t.permitType) && (
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
                        )}
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
                    <td colSpan="7" className="text-center text-gray-500 dark:text-gray-400 py-8">
                      <Filter className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="font-medium">No matching permits found</p>
                      <p className="text-xs mt-1">Try adjusting your filters or search criteria</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col md:flex-row items-center justify-between bg-white dark:bg-slate-800 px-4 py-3 rounded-lg border border-[#E9E7E7] dark:border-gray-700">
              <div className="flex items-center gap-2 mb-3 md:mb-0">
                <label className="text-sm text-gray-700 dark:text-gray-300">Items per page:</label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-slate-700 dark:text-white text-sm"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {startIndex + 1}-{Math.min(endIndex, sortedTracking.length)} of {sortedTracking.length}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  First
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Previous
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 border rounded text-sm ${
                          currentPage === pageNum
                            ? 'bg-[#4A90E2] text-white border-[#4A90E2]'
                            : 'border-[#E9E7E7] dark:border-gray-600 hover:bg-[#EBF3FC] dark:hover:bg-slate-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Next
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Last
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Enhanced Details Modal */}
      {showModal && selectedPermit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className={`relative px-6 py-5 flex-shrink-0 ${
              selectedPermit.status === 'Approved' ? 'bg-gradient-to-r from-[#4CAF50] to-[#43A047]' :
              selectedPermit.status === 'Rejected' ? 'bg-gradient-to-r from-[#E53935] to-[#C62828]' :
              selectedPermit.status === 'For Compliance' ? 'bg-gradient-to-r from-[#F57C00] to-[#E65100]' :
              'bg-gradient-to-r from-[#4A90E2] to-[#3A7BD5]'
            } text-white`}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center">
                    {getPermitIcon(selectedPermit.permitType)}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold leading-tight">{selectedPermit.permitType || 'Permit'}</h2>
                    <p className="text-sm text-white/80 font-mono">{selectedPermit.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-semibold flex items-center gap-1.5">
                    {getStatusIcon(selectedPermit.status)}
                    {selectedPermit.status}
                  </span>
                  <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto flex-1 p-6 space-y-5">

              {/* Date Timeline */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                  <Calendar className="w-5 h-5 mx-auto mb-1.5 text-blue-500" />
                  <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-0.5">Submitted</p>
                  <p className="font-semibold text-xs">{formatDate(selectedPermit.submittedDate)}</p>
                </div>
                {selectedPermit.approvedDate && (
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800">
                    <CheckCircle className="w-5 h-5 mx-auto mb-1.5 text-green-500" />
                    <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-0.5">Approved</p>
                    <p className="font-semibold text-xs">{formatDate(selectedPermit.approvedDate)}</p>
                  </div>
                )}
                {selectedPermit.expirationDate && (
                  <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-800">
                    <Calendar className="w-5 h-5 mx-auto mb-1.5 text-orange-500" />
                    <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-0.5">Expires</p>
                    <p className="font-semibold text-xs">{formatDate(selectedPermit.expirationDate)}</p>
                  </div>
                )}
                {selectedPermit.fees && (
                  <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800">
                    <FileText className="w-5 h-5 mx-auto mb-1.5 text-purple-500" />
                    <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-0.5">Total Fees</p>
                    <p className="font-semibold text-xs">{selectedPermit.fees}</p>
                  </div>
                )}
              </div>

              {/* Application Info + Applicant Details Combined */}
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4 text-blue-500" />
                  Application Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5">
                  <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-600">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Permit Type</span>
                    <span className="text-xs font-semibold">{selectedPermit.permitType || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-600">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Application Type</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      selectedPermit.application_type === 'New' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                      selectedPermit.application_type === 'Renewal' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                      'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                    }`}>{selectedPermit.application_type || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-600">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Receipt No.</span>
                    <span className="text-xs font-semibold font-mono">{selectedPermit.receiptNumber || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-600">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Email</span>
                    <span className="text-xs font-semibold">{selectedPermit.email || user?.email || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Applicant & Business */}
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2 text-sm">
                  <Building className="w-4 h-4 text-blue-500" />
                  Applicant & Business
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5">
                  <div className="py-1 border-b border-gray-100 dark:border-gray-600">
                    <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">Applicant Name</p>
                    <p className="text-sm font-medium mt-0.5">{selectedPermit.applicantName || 'N/A'}</p>
                  </div>
                  <div className="py-1 border-b border-gray-100 dark:border-gray-600">
                    <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">Business/Establishment</p>
                    <p className="text-sm font-medium mt-0.5">{selectedPermit.businessName || 'N/A'}</p>
                  </div>
                  <div className="py-1 border-b border-gray-100 dark:border-gray-600 md:col-span-2">
                    <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">Complete Address</p>
                    <p className="text-sm font-medium mt-0.5">{selectedPermit.address || 'N/A'}</p>
                  </div>
                  <div className="py-1 border-b border-gray-100 dark:border-gray-600">
                    <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">Contact Number</p>
                    <p className="text-sm font-medium mt-0.5">{selectedPermit.contactNumber || 'N/A'}</p>
                  </div>
                  {selectedPermit.tin && (
                    <div className="py-1 border-b border-gray-100 dark:border-gray-600">
                      <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">TIN</p>
                      <p className="text-sm font-medium font-mono mt-0.5">{selectedPermit.tin}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Requirements */}
              {selectedPermit.requirements && selectedPermit.requirements.length > 0 && (
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                  <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Submitted Requirements
                  </h3>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                    {selectedPermit.requirements.map((req, index) => (
                      <li key={index} className="flex items-center gap-2 text-xs bg-green-50 dark:bg-green-900/10 px-3 py-2 rounded-lg">
                        <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Compliance Notice */}
              {selectedPermit.complianceNotes && (
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-5 border-l-4 border-amber-500">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-bold text-amber-800 dark:text-amber-300 text-sm mb-1">Compliance Required</h3>
                      <p className="text-xs text-amber-700 dark:text-amber-400 mb-3">{selectedPermit.complianceNotes}</p>
                      <label className="inline-flex items-center px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg cursor-pointer transition-colors text-xs font-semibold">
                        <Upload className="w-3.5 h-3.5 mr-1.5" />
                        Upload Documents
                        <input type="file" multiple onChange={(e) => handleFileUpload(selectedPermit, e)} className="hidden" disabled={uploading} />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Rejection Notice */}
              {selectedPermit.rejectionReason && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-5 border-l-4 border-red-500">
                  <div className="flex items-start gap-3">
                    <X className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-bold text-red-800 dark:text-red-300 text-sm mb-1">Application Rejected</h3>
                      <p className="text-xs text-red-700 dark:text-red-400">{selectedPermit.rejectionReason}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Download Permit Section - Only for Approved + Downloadable Permit Types */}
              {selectedPermit.status === 'Approved' && isDownloadablePermit(selectedPermit.permitType) && (
                <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20 rounded-2xl border-2 border-green-200 dark:border-green-700 overflow-hidden">
                  <div className="bg-green-600 dark:bg-green-700 px-5 py-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-white" />
                    <h3 className="font-bold text-white text-sm">Your Permit Has Been Approved!</h3>
                  </div>
                  <div className="p-5">
                    <div className="flex flex-col sm:flex-row gap-5 items-center">
                      {/* Permit Preview Image */}
                      {getPermitPreviewImage(selectedPermit.permitType) && (
                        <div className="flex-shrink-0 w-40 sm:w-44">
                          <div className="relative rounded-xl overflow-hidden shadow-lg border-2 border-white dark:border-gray-600 group">
                            <img
                              src={getPermitPreviewImage(selectedPermit.permitType)}
                              alt={`${selectedPermit.permitType} Preview`}
                              className="w-full h-auto object-cover"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all" />
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                              <p className="text-white text-[10px] font-semibold text-center">Sample Preview</p>
                            </div>
                          </div>
                        </div>
                      )}
                      {/* Download Info & Button */}
                      <div className="flex-1 text-center sm:text-left">
                        <p className="text-sm text-green-800 dark:text-green-300 mb-1 font-medium">
                          Download your digital copy of <strong>{selectedPermit.permitType}</strong>
                        </p>
                        <p className="text-xs text-green-700/70 dark:text-green-400/70 mb-4">
                          System-generated PDF with "DIGITAL COPY" watermark. For the official/physical permit, please visit the respective office.
                        </p>
                        <button
                          onClick={() => downloadPermit(selectedPermit)}
                          disabled={downloading}
                          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg text-sm"
                        >
                          {downloading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                          {downloading ? 'Generating PDF...' : 'Download PDF Permit'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Information */}
              {Object.keys(selectedPermit).filter(key => 
                !['id', 'permitType', 'application_type', 'status', 'applicantName', 'businessName', 
                  'address', 'contactNumber', 'submittedDate', 'approvedDate', 'rejectedDate', 
                  'expirationDate', 'fees', 'requirements', 'complianceNotes', 'rejectionReason',
                  'email', 'receiptNumber', 'tin'].includes(key) && 
                selectedPermit[key] && 
                selectedPermit[key] !== 'N/A' &&
                typeof selectedPermit[key] !== 'object'
              ).length > 0 && (
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                  <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-3 text-sm">Additional Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                    {Object.entries(selectedPermit).map(([key, value]) => {
                      if (['id', 'permitType', 'application_type', 'status', 'applicantName', 'businessName', 
                          'address', 'contactNumber', 'submittedDate', 'approvedDate', 'rejectedDate', 
                          'expirationDate', 'fees', 'requirements', 'complianceNotes', 'rejectionReason',
                          'email', 'receiptNumber', 'tin'].includes(key) || 
                          !value || value === 'N/A' || typeof value === 'object') {
                        return null;
                      }
                      return (
                        <div key={key} className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-600">
                          <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <span className="text-xs font-semibold">{value}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex-shrink-0 px-6 py-4 bg-gray-50 dark:bg-slate-700/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3">
              {selectedPermit.status === 'Approved' && isDownloadablePermit(selectedPermit.permitType) ? (
                <button
                  onClick={() => downloadPermit(selectedPermit)}
                  disabled={downloading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#4CAF50] hover:bg-[#43A047] disabled:bg-green-400 text-white rounded-xl font-semibold transition-colors text-sm"
                >
                  {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {downloading ? 'Generating...' : 'Download Permit'}
                </button>
              ) : (
                <div />
              )}
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-slate-600 dark:hover:bg-slate-500 text-gray-700 dark:text-gray-200 rounded-xl font-semibold transition-colors text-sm"
              >
                Close
              </button>
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
          className="inline-flex items-center gap-2 bg-[#4CAF50] hover:bg-[#43A047] text-white font-semibold py-2 px-4 rounded-lg transition-colors"
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
                className="bg-[#4CAF50] hover:bg-[#43A047] text-white font-semibold py-3 px-6 rounded-lg transition-colors"
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