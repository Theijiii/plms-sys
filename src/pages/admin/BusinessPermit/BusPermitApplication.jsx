import { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { logTx } from '../../../lib/txLogger';
import {
  Search,
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
  Download
} from "lucide-react";

const API_BUSINESS = "/backend/business_permit";

export default function BusPermitApplication() {
  const [selectedPermit, setSelectedPermit] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [permits, setPermits] = useState([]);
  const [actionComment, setActionComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [sortOption, setSortOption] = useState('latest');
  const [searchQuery, setSearchQuery] = useState('');
  const [counts, setCounts] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const [actionHistory, setActionHistory] = useState({});
  const [exporting, setExporting] = useState(false);
  const [exportType, setExportType] = useState('');

  // Dashboard stats computed from permits
  const dashboardStats = useMemo(() => {
    const total = permits.length;
    const approved = permits.filter(p => p.status === 'APPROVED').length;
    const pending = permits.filter(p => p.status === 'PENDING' || !p.status).length;
    const rejected = permits.filter(p => p.status === 'REJECTED').length;
    const compliance = permits.filter(p => p.status === 'COMPLIANCE').length;
    const approvalRate = total > 0 ? ((approved / total) * 100).toFixed(1) : '0.0';

    // Top barangay
    const barangayCounts = {};
    permits.forEach(p => {
      const brgy = p.barangay || 'Unknown';
      barangayCounts[brgy] = (barangayCounts[brgy] || 0) + 1;
    });
    const topBarangay = Object.entries(barangayCounts).sort((a, b) => b[1] - a[1])[0] || ['N/A', 0];

    // Top business nature
    const natureCounts = {};
    permits.forEach(p => {
      const nature = p.business_nature || 'Unknown';
      natureCounts[nature] = (natureCounts[nature] || 0) + 1;
    });
    const topNature = Object.entries(natureCounts).sort((a, b) => b[1] - a[1])[0] || ['N/A', 0];

    return {
      total, approved, pending, rejected, compliance, approvalRate,
      topBarangay: { name: topBarangay[0], count: topBarangay[1] },
      topNature: { name: topNature[0], count: topNature[1] }
    };
  }, [permits]);

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // Sort function for business permits
  const sortPermits = (permitsToSort, sortBy) => {
    const sortedPermits = [...permitsToSort];
    
    switch (sortBy) {
      case 'latest':
        return sortedPermits.sort((a, b) => 
          new Date(b.application_date || 0) - new Date(a.application_date || 0)
        );
      
      case 'oldest':
        return sortedPermits.sort((a, b) => 
          new Date(a.application_date || 0) - new Date(b.application_date || 0)
        );
      
      case 'name_asc':
        return sortedPermits.sort((a, b) => {
          const nameA = `${a.owner_last_name} ${a.owner_first_name}`.toLowerCase();
          const nameB = `${b.owner_last_name} ${b.owner_first_name}`.toLowerCase();
          return nameA.localeCompare(nameB);
        });
      
      case 'name_desc':
        return sortedPermits.sort((a, b) => {
          const nameA = `${a.owner_last_name} ${a.owner_first_name}`.toLowerCase();
          const nameB = `${b.owner_last_name} ${b.owner_first_name}`.toLowerCase();
          return nameB.localeCompare(nameA);
        });
      
      case 'business_name_asc':
        return sortedPermits.sort((a, b) => {
          const nameA = (a.business_name || '').toLowerCase();
          const nameB = (b.business_name || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });
      
      case 'capital_desc':
        return sortedPermits.sort((a, b) => 
          (parseFloat(b.capital_investment) || 0) - (parseFloat(a.capital_investment) || 0)
        );
      
      default:
        return sortedPermits;
    }
  };

  // Search function for business permits
  const searchPermits = (permitsToSearch, query) => {
    if (!query.trim()) return permitsToSearch;
    
    const searchTerm = query.toLowerCase();
    return permitsToSearch.filter(permit => {
      const fullName = `${permit.owner_first_name} ${permit.owner_middle_name} ${permit.owner_last_name}`.toLowerCase();
      const businessName = (permit.business_name || '').toLowerCase();
      const tradeName = (permit.trade_name || '').toLowerCase();
      const applicantId = (permit.applicant_id || '').toLowerCase();
      const email = (permit.email_address || '').toLowerCase();
      const phone = (permit.contact_number || '').toLowerCase();
      const barangay = (permit.barangay || '').toLowerCase();
      
      return (
        fullName.includes(searchTerm) ||
        businessName.includes(searchTerm) ||
        tradeName.includes(searchTerm) ||
        applicantId.includes(searchTerm) ||
        email.includes(searchTerm) ||
        phone.includes(searchTerm) ||
        barangay.includes(searchTerm)
      );
    });
  };

  // Combined filter function
  const getFilteredPermits = () => {
    let filtered = permits;
    
    // Apply tab filter
    if (activeTab !== "all") {
      filtered = filtered.filter(permit => {
        if (activeTab === "approved") return permit.status === "APPROVED";
        if (activeTab === "pending") return permit.status === "PENDING" || !permit.status;
        if (activeTab === "rejected") return permit.status === "REJECTED";
        if (activeTab === "compliance") return permit.status === "COMPLIANCE";
        return true;
      });
    }
    
    // Apply search filter
    filtered = searchPermits(filtered, searchQuery);
    
    // Apply sorting
    filtered = sortPermits(filtered, sortOption);
    
    return filtered;
  };

  // Helper function for sort labels
  const getSortLabel = (option) => {
    switch (option) {
      case 'latest': return 'Latest First';
      case 'oldest': return 'Oldest First';
      case 'name_asc': return 'Owner Name A-Z';
      case 'name_desc': return 'Owner Name Z-A';
      case 'business_name_asc': return 'Business Name A-Z';
      case 'capital_desc': return 'Highest Capital';
      default: return 'Default';
    }
  };

  const getUIStatus = (dbStatus) => {
    if (!dbStatus) return 'Pending';
    const statusMap = {
      'PENDING': 'Pending',
      'APPROVED': 'Approved',
      'REJECTED': 'Rejected',
      'COMPLIANCE': 'Compliance',
      'UNDER_REVIEW': 'Under Review',
      'DOCUMENT_VERIFICATION': 'Document Verification',
      'PAYMENT_VERIFICATION': 'Payment Verification',
      'FOR_MANAGER_APPROVAL': 'For Manager Approval',
      'READY_FOR_RELEASE': 'Ready for Release'
    };
    return statusMap[dbStatus.toUpperCase()] || dbStatus;
  };

  const getDBStatus = (uiStatus) => {
    if (!uiStatus) return 'PENDING';
    // Convert UI status to UPPER_SNAKE_CASE DB value
    return uiStatus.toUpperCase().replace(/\s+/g, '_');
  };

  const getStatusColor = (status) => {
    const uiStatus = getUIStatus(status);
    switch (uiStatus) {
      case "Approved": return "text-[#4CAF50] bg-[#4CAF50]/10";
      case "Rejected": return "text-[#E53935] bg-[#E53935]/10";
      case "Compliance": return "text-[#FDA811] bg-[#FDA811]/10";
      case "Pending": return "text-[#4A90E2] bg-[#4A90E2]/10";
      case "Under Review": return "text-[#3B82F6] bg-[#3B82F6]/10";
      case "Document Verification": return "text-[#8B5CF6] bg-[#8B5CF6]/10";
      case "Payment Verification": return "text-[#F59E0B] bg-[#F59E0B]/10";
      case "For Manager Approval": return "text-[#6366F1] bg-[#6366F1]/10";
      case "Ready for Release": return "text-[#10B981] bg-[#10B981]/10";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  // Helper function to get clean file type name
  const getFileTypeName = (fileType, fileName = '') => {
    const fileTypeLower = (fileType || '').toLowerCase();
    const fileNameLower = (fileName || '').toLowerCase();
    
    // Check file extension first
    if (fileNameLower.endsWith('.pdf')) return 'PDF Document';
    if (fileNameLower.endsWith('.doc') || fileNameLower.endsWith('.docx')) return 'Word Document';
    if (fileNameLower.endsWith('.xls') || fileNameLower.endsWith('.xlsx')) return 'Excel Spreadsheet';
    if (fileNameLower.endsWith('.ppt') || fileNameLower.endsWith('.pptx')) return 'PowerPoint Presentation';
    if (fileNameLower.endsWith('.jpg') || fileNameLower.endsWith('.jpeg')) return 'JPEG Image';
    if (fileNameLower.endsWith('.png')) return 'PNG Image';
    if (fileNameLower.endsWith('.txt')) return 'Text Document';
    
    // Check MIME types
    if (fileTypeLower.includes('pdf')) return 'PDF Document';
    if (fileTypeLower.includes('word') || 
        fileTypeLower.includes('msword') ||
        fileTypeLower.includes('officedocument.wordprocessingml')) return 'Word Document';
    if (fileTypeLower.includes('excel') || 
        fileTypeLower.includes('spreadsheetml')) return 'Excel Spreadsheet';
    if (fileTypeLower.includes('powerpoint') || 
        fileTypeLower.includes('presentationml')) return 'PowerPoint Presentation';
    if (fileTypeLower.includes('image/jpeg')) return 'JPEG Image';
    if (fileTypeLower.includes('image/png')) return 'PNG Image';
    if (fileTypeLower.includes('image/')) return 'Image';
    if (fileTypeLower.includes('text/plain')) return 'Text Document';
    
    return 'Document';
  };

  // Get file icon based on type
  const getFileIcon = (fileType, fileName = '') => {
    const fileTypeLower = (fileType || '').toLowerCase();
    const fileNameLower = (fileName || '').toLowerCase();
    
    if (fileNameLower.endsWith('.pdf') || fileTypeLower.includes('pdf')) {
      return {
        icon: '📄',
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        textColor: 'text-red-600 dark:text-red-400'
      };
    }
    
    if (fileNameLower.endsWith('.doc') || fileNameLower.endsWith('.docx') ||
        fileTypeLower.includes('word') || fileTypeLower.includes('officedocument.wordprocessingml')) {
      return {
        icon: '📝',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        textColor: 'text-blue-600 dark:text-blue-400'
      };
    }
    
    if (fileNameLower.endsWith('.xls') || fileNameLower.endsWith('.xlsx') ||
        fileTypeLower.includes('excel') || fileTypeLower.includes('spreadsheetml')) {
      return {
        icon: '📊',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        textColor: 'text-green-600 dark:text-green-400'
      };
    }
    
    if (fileNameLower.endsWith('.ppt') || fileNameLower.endsWith('.pptx') ||
        fileTypeLower.includes('powerpoint') || fileTypeLower.includes('presentationml')) {
      return {
        icon: '📈',
        bgColor: 'bg-orange-100 dark:bg-orange-900/30',
        textColor: 'text-orange-600 dark:text-orange-400'
      };
    }
    
    if (fileTypeLower.includes('image/')) {
      return {
        icon: '🖼️',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        textColor: 'text-green-600 dark:text-green-400'
      };
    }
    
    return {
      icon: '📁',
      bgColor: 'bg-gray-100 dark:bg-gray-900/30',
      textColor: 'text-gray-600 dark:text-gray-400'
    };
  };

  // Get file extension
  const getFileExtension = (fileName = '') => {
    const parts = fileName.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : 'FILE';
  };

  // Check if file is an image
  const isImageFile = (fileType, fileName = '') => {
    const fileTypeLower = (fileType || '').toLowerCase();
    const fileNameLower = (fileName || '').toLowerCase();
    
    // Check by file extension
    if (fileNameLower.endsWith('.jpg') || 
        fileNameLower.endsWith('.jpeg') || 
        fileNameLower.endsWith('.png') || 
        fileNameLower.endsWith('.gif') || 
        fileNameLower.endsWith('.bmp') || 
        fileNameLower.endsWith('.webp') ||
        fileNameLower.endsWith('.svg')) {
      return true;
    }
    
    // Check by MIME type
    if (fileTypeLower.includes('image/jpeg') || 
        fileTypeLower.includes('image/png') || 
        fileTypeLower.includes('image/gif') || 
        fileTypeLower.includes('image/bmp') || 
        fileTypeLower.includes('image/webp') ||
        fileTypeLower.includes('image/svg')) {
      return true;
    }
    
    return false;
  };

  // Check if file is previewable (images only)
  const isFilePreviewable = (fileType, fileName = '') => {
    return isImageFile(fileType, fileName);
  };

  // Tab navigation styling functions
  const getTabBadgeColor = (tab) =>
    tab === activeTab ? "bg-[#4CAF50] text-white" : "bg-gray-100 text-gray-600";

  const getTabBorderColor = (tab) => {
    return tab === activeTab ? "border-[#4CAF50]" : "border-transparent";
  };

  const getTabTextColor = (tab) => {
    return tab === activeTab ? "text-[#4CAF50] dark:text-[#4CAF50]" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300";
  };

  // Fetch permits from API
  const fetchPermits = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const statusParam = activeTab !== 'all' ? activeTab.toUpperCase() : null;
      const url = new URL(`${API_BUSINESS}/admin_fetch.php`, window.location.origin);
      if (statusParam) url.searchParams.append('status', statusParam);
      if (searchQuery) url.searchParams.append('search', searchQuery);
      if (sortOption) url.searchParams.append('sort_by', sortOption);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setPermits(result.data);
        if (result.counts) {
          setCounts(result.counts);
        }
      } else {
        throw new Error(result.message || 'Failed to fetch permits');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching permits:', err);
    } finally {
      setLoading(false);
    }
  };

const fetchSinglePermit = async (permitId) => {
  try {
    // Use permit_id instead of id in the query
    const response = await fetch(`${API_BUSINESS}/fetch_single.php?permit_id=${permitId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Fetch single result:', result);
    
    if (result.success && result.data) {
      // If documents are not included, fetch them separately
      if (!result.data.documents || result.data.documents.length === 0) {
        const documents = await fetchPermitDocuments(permitId);
        result.data.documents = documents;
      }
      
      return result.data;
    } else {
      throw new Error(result.message || 'Failed to fetch permit details');
    }
  } catch (err) {
    console.error('Error fetching single permit:', err);
    return null;
  }
};

  // Fetch documents separately if needed
  const fetchPermitDocuments = async (permitId) => {
    try {
      const response = await fetch(`${API_BUSINESS}/fetch_documents.php?permit_id=${permitId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        return result.data;
      } else {
        return [];
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
      return [];
    }
  };

  // Update permit status
  const updatePermitStatus = async (permitId, status, comments = '') => {
    try {
      const dbStatus = getDBStatus(status);
      
      const requestBody = {
        permit_id: permitId,
        status: dbStatus,
        comments: comments
      };
      console.log('updatePermitStatus sending:', JSON.stringify(requestBody));
      
      const response = await fetch(`${API_BUSINESS}/update_status.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update permit status');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to update permit status');
      }

      // Record action in history
      const historyEntry = {
        action: status,
        timestamp: new Date().toLocaleString('en-US', {
          year: 'numeric', month: 'short', day: 'numeric',
          hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
        }),
        notes: comments || '',
        by: 'Admin'
      };
      setActionHistory(prev => ({
        ...prev,
        [permitId]: [...(prev[permitId] || []), historyEntry]
      }));

      // Use actual DB response to update local state
      const updatedDbStatus = result.data?.status || dbStatus;
      const updatedUiStatus = getUIStatus(updatedDbStatus);

      if (selectedPermit) {
        setSelectedPermit(prev => ({
          ...prev,
          status: updatedDbStatus,
          uiStatus: updatedUiStatus,
          comments: result.data?.comments || prev.comments
        }));
      }

      // Refresh the permits list
      await fetchPermits();

      // Clear the comment input
      setActionComment('');

      // Show success message
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: `Permit ${status.toLowerCase()} successfully!`,
        confirmButtonColor: '#4CAF50',
        timer: 2000,
        showConfirmButton: true
      });

      // Log transaction
      try { 
        logTx({ 
          service: 'business_permit', 
          permitId: permitId, 
          action: 'update_status', 
          status: status,
          comment: comments 
        }); 
      } catch(e) {
        console.error('Error logging transaction:', e);
      }

    } catch (err) {
      console.error('Error updating permit status:', err);
      setError(err.message || 'Failed to update permit status');
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error updating status: ' + err.message,
        confirmButtonColor: '#E53935'
      });
    }
  };

  // Save comment only
  const saveCommentOnly = async () => {
    if (!selectedPermit || !actionComment.trim()) return;
    
    try {
      const response = await fetch(`${API_BUSINESS}/update_status.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          permit_id: selectedPermit.permit_id,
          comments: actionComment
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to save comment');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to save comment');
      }

      // Update the selected permit in state
      setSelectedPermit(prev => ({
        ...prev,
        comments: result.data?.comments || prev.comments
      }));

      // Also update the main permits list
      setPermits(prevPermits => 
        prevPermits.map(p => 
          p.permit_id === selectedPermit.permit_id 
            ? { ...p, comments: result.data?.comments || p.comments }
            : p
        )
      );

      // Clear the comment input
      setActionComment('');

      // Show success message
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Comment saved successfully!',
        confirmButtonColor: '#4CAF50',
        timer: 2000,
        showConfirmButton: true
      });

      // Log transaction
      try { 
        logTx({ 
          service: 'business_permit', 
          permitId: selectedPermit.permit_id, 
          action: 'add_comment',
          comment: actionComment
        }); 
      } catch(e) {
        console.error('Error logging transaction:', e);
      }

    } catch (err) {
      console.error('Error saving comment:', err);
      setError(err.message || 'Failed to save comment');
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error saving comment: ' + err.message,
        confirmButtonColor: '#E53935'
      });
    }
  };

  useEffect(() => {
    fetchPermits();
  }, [activeTab, sortOption, searchQuery]);

  const openModal = async (permit) => {
    try {
      const detailedPermit = await fetchSinglePermit(permit.permit_id);
      
      if (detailedPermit) {
        const uiStatus = getUIStatus(detailedPermit.status);
        setSelectedPermit({
          ...detailedPermit,
          uiStatus: uiStatus
        });
      } else {
        const uiStatus = getUIStatus(permit.status);
        setSelectedPermit({
          ...permit,
          uiStatus: uiStatus
        });
      }
      
      setActionComment('');
      setShowModal(true);
    } catch (err) {
      console.error('Error opening modal:', err);
      const uiStatus = getUIStatus(permit.status);
      setSelectedPermit({
        ...permit,
        uiStatus: uiStatus
      });
      setActionComment('');
      setShowModal(true);
    }
  };

  const closeModal = () => {
    setSelectedPermit(null);
    setActionComment('');
    setShowModal(false);
  };

  const handleApprove = async () => {
    if (!selectedPermit) return;

    const result = await Swal.fire({
      title: 'Approve Permit?',
      html: `
        <div class="text-left">
          <p class="mb-2">You are about to approve this business permit application:</p>
          <div class="bg-gray-50 p-3 rounded-lg mb-3">
            <p class="text-sm"><strong>Permit ID:</strong> ${selectedPermit.permit_id}</p>
            <p class="text-sm"><strong>Business:</strong> ${selectedPermit.business_name}</p>
            <p class="text-sm"><strong>Owner:</strong> ${selectedPermit.owner_first_name} ${selectedPermit.owner_last_name}</p>
          </div>
          <p class="text-sm text-gray-600">This action will approve the application.</p>
        </div>
      `,
      icon: 'question',
      input: 'textarea',
      inputLabel: 'Add approval notes (optional)',
      inputPlaceholder: 'Enter any additional notes...',
      inputValue: actionComment,
      showCancelButton: true,
      confirmButtonText: 'Yes, Approve',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#4CAF50',
      cancelButtonColor: '#6b7280',
      customClass: {
        popup: 'text-left',
        htmlContainer: 'text-left'
      }
    });

    if (result.isConfirmed) {
      const notes = result.value || actionComment;
      await updatePermitStatus(selectedPermit.permit_id, 'Approved', notes);
      setActionComment('');
    }
  };

  const handleReject = async () => {
    if (!selectedPermit) return;

    const result = await Swal.fire({
      title: 'Reject Application?',
      html: `
        <div class="text-left">
          <p class="mb-2">You are about to reject this business permit application:</p>
          <div class="bg-gray-50 p-3 rounded-lg mb-3">
            <p class="text-sm"><strong>Permit ID:</strong> ${selectedPermit.permit_id}</p>
            <p class="text-sm"><strong>Business:</strong> ${selectedPermit.business_name}</p>
            <p class="text-sm"><strong>Owner:</strong> ${selectedPermit.owner_first_name} ${selectedPermit.owner_last_name}</p>
          </div>
          <p class="text-sm text-red-600">Please provide a reason for rejection.</p>
        </div>
      `,
      icon: 'warning',
      input: 'textarea',
      inputLabel: 'Reason for rejection (required)',
      inputPlaceholder: 'Enter the reason for rejecting this application...',
      inputValue: actionComment,
      inputValidator: (value) => {
        if (!value) {
          return 'You must provide a reason for rejection!';
        }
      },
      showCancelButton: true,
      confirmButtonText: 'Yes, Reject',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#E53935',
      cancelButtonColor: '#6b7280',
      customClass: {
        popup: 'text-left',
        htmlContainer: 'text-left'
      }
    });

    if (result.isConfirmed) {
      await updatePermitStatus(selectedPermit.permit_id, 'Rejected', result.value);
      setActionComment('');
    }
  };

  const handleCompliance = async () => {
    if (!selectedPermit) return;

    const result = await Swal.fire({
      title: 'Mark for Compliance?',
      html: `
        <div class="text-left">
          <p class="mb-2">You are about to mark this application for compliance:</p>
          <div class="bg-gray-50 p-3 rounded-lg mb-3">
            <p class="text-sm"><strong>Permit ID:</strong> ${selectedPermit.permit_id}</p>
            <p class="text-sm"><strong>Business:</strong> ${selectedPermit.business_name}</p>
            <p class="text-sm"><strong>Owner:</strong> ${selectedPermit.owner_first_name} ${selectedPermit.owner_last_name}</p>
          </div>
        </div>
      `,
      icon: 'question',
      input: 'textarea',
      inputLabel: 'Add compliance notes (optional)',
      inputPlaceholder: 'Enter any additional notes...',
      inputValue: actionComment,
      showCancelButton: true,
      confirmButtonText: 'Mark for Compliance',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#FDA811',
      cancelButtonColor: '#6b7280',
      customClass: {
        popup: 'text-left',
        htmlContainer: 'text-left'
      }
    });

    if (result.isConfirmed) {
      await updatePermitStatus(selectedPermit.permit_id, 'Compliance', result.value || '');
      setActionComment('');
    }
  };

  const handlePending = async () => {
    if (!selectedPermit) return;

    const result = await Swal.fire({
      title: 'Set Back to Pending?',
      html: `
        <div class="text-left">
          <p class="mb-2">You are about to set this application back to pending:</p>
          <div class="bg-gray-50 p-3 rounded-lg mb-3">
            <p class="text-sm"><strong>Permit ID:</strong> ${selectedPermit.permit_id}</p>
            <p class="text-sm"><strong>Business:</strong> ${selectedPermit.business_name}</p>
            <p class="text-sm"><strong>Owner:</strong> ${selectedPermit.owner_first_name} ${selectedPermit.owner_last_name}</p>
          </div>
        </div>
      `,
      icon: 'question',
      input: 'textarea',
      inputLabel: 'Add notes (optional)',
      inputPlaceholder: 'Enter any additional notes...',
      inputValue: actionComment,
      showCancelButton: true,
      confirmButtonText: 'Set to Pending',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#4A90E2',
      cancelButtonColor: '#6b7280',
      customClass: {
        popup: 'text-left',
        htmlContainer: 'text-left'
      }
    });

    if (result.isConfirmed) {
      await updatePermitStatus(selectedPermit.permit_id, 'Pending', result.value || '');
      setActionComment('');
    }
  };

  const handleStatusUpdate = async (status, title, message, color) => {
    if (!selectedPermit) return;

    const result = await Swal.fire({
      title: title,
      html: `
        <div class="text-left">
          <p class="mb-3">${message}</p>
          <div class="mt-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Add a comment (optional):</label>
            <textarea 
              id="status-comment" 
              class="w-full border border-gray-300 rounded-lg px-3 py-2" 
              rows="3" 
              placeholder="Enter any additional notes..."
            >${actionComment}</textarea>
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Update Status',
      cancelButtonText: 'Cancel',
      confirmButtonColor: color,
      cancelButtonColor: '#6B7280',
      preConfirm: () => {
        const comment = document.getElementById('status-comment').value;
        return comment;
      }
    });

    if (result.isConfirmed) {
      await updatePermitStatus(selectedPermit.permit_id, status, result.value || '');
    }
  };

const viewFile = async (file) => {
  try {
    if (!file || !file.file_path) {
      Swal.fire({ icon: 'warning', title: 'File Unavailable', text: 'File path not available', confirmButtonColor: '#FDA811' });
      return;
    }
    
    // Extract filename
    const filename = file.file_path.split('/').pop();
    const fullUrl = `${API_BUSINESS}/uploads/${encodeURIComponent(filename)}`;
    const displayName = file.document_name || file.document_type || 'Document';
    const fileIsImage = isImageFile(file.file_type, file.document_name || filename);
    
    if (fileIsImage) {
      Swal.fire({
        title: displayName,
        text: getFileTypeName(file.file_type, filename),
        imageUrl: fullUrl,
        imageAlt: displayName,
        showCloseButton: true,
        showConfirmButton: true,
        showDenyButton: true,
        confirmButtonText: 'Download',
        denyButtonText: 'Close',
        confirmButtonColor: '#4A90E2',
        denyButtonColor: '#6B7280',
        width: '80%',
        customClass: {
          image: 'max-h-[70vh] object-contain rounded-lg'
        }
      }).then((result) => {
        if (result.isConfirmed) {
          window.open(fullUrl, '_blank');
        }
      });
    } else {
      // For PDFs, try iframe; for other files, show download
      const isPdf = (file.file_type || '').toLowerCase().includes('pdf') || filename.toLowerCase().endsWith('.pdf');
      
      Swal.fire({
        title: displayName,
        html: isPdf 
          ? `<iframe src="${fullUrl}" style="width:100%;height:70vh;border:none;border-radius:8px;" title="${displayName}"></iframe>`
          : `<div style="text-align:center;padding:40px 0;">
              <div style="font-size:64px;margin-bottom:16px;">📄</div>
              <p style="color:#6b7280;margin-bottom:8px;">${getFileTypeName(file.file_type, filename)}</p>
              <p style="color:#9ca3af;font-size:14px;">${filename}</p>
            </div>`,
        showCloseButton: true,
        showConfirmButton: true,
        showDenyButton: true,
        confirmButtonText: isPdf ? 'Open in New Tab' : 'Download',
        denyButtonText: 'Close',
        confirmButtonColor: '#4A90E2',
        denyButtonColor: '#6B7280',
        width: isPdf ? '90%' : '500px',
      }).then((result) => {
        if (result.isConfirmed) {
          window.open(fullUrl, '_blank');
        }
      });
    }
    
  } catch (err) {
    console.error('Error accessing file:', err);
    Swal.fire({ icon: 'error', title: 'Error', text: 'Unable to access the file', confirmButtonColor: '#E53935' });
  }
};

  // Format comments with timestamps
  const formatComments = (commentsText) => {
    if (!commentsText || typeof commentsText !== 'string') return [];
    
    try {
      const commentBlocks = commentsText.split(/(?=---\s+.+?\s+---)/g);
      const formattedComments = [];
      
      for (let block of commentBlocks) {
        block = block.trim();
        if (!block) continue;
        
        const match = block.match(/^---\s+(.+?)\s+---\n([\s\S]*)$/);
        
        if (match) {
          const timestamp = match[1].trim();
          const comment = match[2].trim();
          
          if (comment) {
            formattedComments.push({
              timestamp,
              comment
            });
          }
        } else {
          formattedComments.push({
            timestamp: 'Just now',
            comment: block
          });
        }
      }
      
      return formattedComments;
    } catch (e) {
      console.error('Error formatting comments:', e);
      return [{
        timestamp: 'Recent',
        comment: commentsText
      }];
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  // Format time
  const formatTime = (time) => {
    if (!time) return 'N/A';
    try {
      const [hours, minutes] = time.split(':');
      const date = new Date();
      date.setHours(hours, minutes);
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return time;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4CAF50]"></div>
      </div>
    );
  }

  // Export to CSV
  const exportToCSV = () => {
    setExporting(true);
    setExportType("csv");
    
    const headers = [
      "Application ID",
      "Applicant Name",
      "Business Name",
      "Permit Type",
      "Permit Subtype", 
      "TODA",
      "Barangay",
      "Vehicle",
      "Plate Number",
      "Status",
      "Contact",
      "Email",
      "Application Date"
    ];
    
    const csvContent = [
      headers.join(","),
      ...permits.map(p => [
        p.permit_id,
        p.owner_first_name + ' ' + p.owner_last_name,
        p.business_name,
        p.permit_type,
        p.permit_subtype,
        p.toda_name,
        p.barangay_of_operation,
        `${p.make_brand} ${p.model}`,
        p.plate_number,
        p.status,
        p.contact_number,
        p.email,
        formatDate(p.created_at)
      ].map(field => `"${field || ''}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `business-permits-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    setExporting(false);
    setExportType("");
  };

  // Export to PDF
  const exportToPDF = async () => {
    setExporting(true);
    setExportType("pdf");
    
    try {
      // Create a container for PDF content
      const pdfContainer = document.createElement("div");
      pdfContainer.style.position = "absolute";
      pdfContainer.style.left = "-9999px";
      pdfContainer.style.width = "800px";
      pdfContainer.style.backgroundColor = "#ffffff";
      pdfContainer.style.padding = "20px";
      pdfContainer.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
      pdfContainer.style.color = "#1f2937";
      document.body.appendChild(pdfContainer);

      // Header section
      const header = document.createElement("div");
      header.style.marginBottom = "20px";
      header.style.borderBottom = "2px solid #4CAF50";
      header.style.paddingBottom = "15px";
      header.innerHTML = `
        <h1 style="color: #1f2937; font-size: 24px; font-weight: bold; margin: 0;">
          Business Permit Report
        </h1>
        <p style="color: #6b7280; margin:5px 0;">
          Generated on ${new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
        <div style="display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap;">
          <span style="background: #4CAF50; color: white; padding: 3px 10px; border-radius: 15px; font-size: 11px;">
            Total: ${dashboardStats.total}
          </span>
          <span style="background: #4CAF50; color: white; padding: 3px 10px; border-radius: 15px; font-size: 11px;">
            Approved: ${dashboardStats.approved}
          </span>
          <span style="background: #FDA811; color: white; padding: 3px 10px; border-radius: 15px; font-size: 11px;">
            Compliance: ${dashboardStats.compliance}
          </span>
          <span style="background: #E53935; color: white; padding: 3px 10px; border-radius: 15px; font-size: 11px;">
            Rejected: ${dashboardStats.rejected}
          </span>
        </div>
      `;
      pdfContainer.appendChild(header);

      // Summary section
      const summarySection = document.createElement("div");
      summarySection.style.marginBottom = "25px";
      summarySection.style.padding = "15px";
      summarySection.style.backgroundColor = "#f9fafb";
      summarySection.style.borderRadius = "8px";
      summarySection.style.border = "1px solid #e5e7eb";
      summarySection.innerHTML = `
        <h2 style="color: #1f2937; font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">Summary</h2>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 12px;">
          <div>
            <strong>Approval Rate:</strong> ${dashboardStats.approvalRate}%
          </div>
          <div>
            <strong>Top Barangay:</strong> ${dashboardStats.topBarangay.name} (${dashboardStats.topBarangay.count} applications)
          </div>
          <div>
            <strong>Top Business Nature:</strong> ${dashboardStats.topNature.name} (${dashboardStats.topNature.count})
          </div>
          <div>
            <strong>Pending Review:</strong> ${dashboardStats.pending}
          </div>
        </div>
      `;
      pdfContainer.appendChild(summarySection);

      // Applications table section
      const tableSection = document.createElement("div");
      tableSection.innerHTML = `
        <h2 style="color: #1f2937; font-size: 18px; font-weight: bold; margin-bottom: 15px;">Applications List</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
          <thead>
            <tr style="background: #f3f4f6; border-bottom: 2px solid #e5e7eb;">
              <th style="padding: 8px; text-align: left; color: #374151; font-weight: 600; border: 1px solid #e5e7eb;">ID</th>
              <th style="padding: 8px; text-align: left; color: #374151; font-weight: 600; border: 1px solid #e5e7eb;">Applicant</th>
              <th style="padding: 8px; text-align: left; color: #374151; font-weight: 600; border: 1px solid #e5e7eb;">Business</th>
              <th style="padding: 8px; text-align: left; color: #374151; font-weight: 600; border: 1px solid #e5e7eb;">TODA</th>
              <th style="padding: 8px; text-align: left; color: #374151; font-weight: 600; border: 1px solid #e5e7eb;">Barangay</th>
              <th style="padding: 8px; text-align: left; color: #374151; font-weight: 600; border: 1px solid #e5e7eb;">Vehicle</th>
              <th style="padding: 8px; text-align: left; color: #374151; font-weight: 600; border: 1px solid #e5e7eb;">Plate Number</th>
              <th style="padding: 8px; text-align: left; color: #374151; font-weight: 600; border: 1px solid #e5e7eb;">Status</th>
              <th style="padding: 8px; text-align: left; color: #374151; font-weight: 600; border: 1px solid #e5e7eb;">Date</th>
            </tr>
          </thead>
          <tbody>
            ${getFilteredPermits().slice(0, 20).map(permit => {
              const statusColor = permit.status === "Approved" ? "#4CAF50" : 
                                permit.status === "Compliance" ? "#FDA811" : "#E53935";
              return `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 8px; border: 1px solid #e5e7eb;">BP-${String(permit.permit_id).padStart(4, '0')}</td>
                  <td style="padding: 8px; border: 1px solid #e5e7eb;">${permit.owner_first_name} ${permit.owner_last_name}</td>
                  <td style="padding: 8px; border: 1px solid #e5e7eb;">${permit.business_name}</td>
                  <td style="padding: 8px; border: 1px solid #e5e7eb;">${permit.toda_name}</td>
                  <td style="padding: 8px; border: 1px solid #e5e7eb;">${permit.barangay_of_operation}</td>
                  <td style="padding: 8px; border: 1px solid #e5e7eb;">${permit.make_brand} ${permit.model}</td>
                  <td style="padding: 8px; border: 1px solid #e5e7eb;">${permit.plate_number}</td>
                  <td style="padding: 8px; border: 1px solid #e5e7eb; color: ${statusColor}; font-weight: 500;">
                    ${permit.status}
                  </td>
                  <td style="padding: 8px; border: 1px solid #e5e7eb;">${formatDate(permit.created_at)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        ${getFilteredPermits().length > 20 ? 
          `<p style="text-align: center; color: #6b7280; font-size: 10px; margin-top: 10px;">
            ... and ${getFilteredPermits().length - 20} more applications
          </p>` : ''}
      `;
      pdfContainer.appendChild(tableSection);

      // Status distribution section
      const statusSection = document.createElement("div");
      statusSection.style.marginTop = "25px";
      statusSection.style.padding = "15px";
      statusSection.style.backgroundColor = "#f9fafb";
      statusSection.style.borderRadius = "8px";
      statusSection.style.border = "1px solid #e5e7eb";
      statusSection.innerHTML = `
        <h2 style="color: #1f2937; font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">Status Distribution</h2>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; font-size: 12px;">
          <div style="text-align: center;">
            <div style="font-size: 20px; font-weight: bold; color: #4CAF50;">${dashboardStats.approved}</div>
            <div style="color: #6b7280;">Approved</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 20px; font-weight: bold; color: #FDA811;">${dashboardStats.compliance}</div>
            <div style="color: #6b7280;">Compliance</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 20px; font-weight: bold; color: #E53935;">${dashboardStats.rejected}</div>
            <div style="color: #6b7280;">Rejected</div>
          </div>
        </div>
      `;
      pdfContainer.appendChild(statusSection);

      // Footer
      const footer = document.createElement("div");
      footer.style.marginTop = "30px";
      footer.style.paddingTop = "15px";
      footer.style.borderTop = "1px solid #e5e7eb";
      footer.style.color = "#6b7280";
      footer.style.fontSize = "10px";
      footer.innerHTML = `
        <p style="margin: 0;">Generated by Business Permit Management System</p>
        <p style="margin: 5px 0 0 0;">Total Records: ${permits.length} • Filtered: ${getFilteredPermits().length}</p>
      `;
      pdfContainer.appendChild(footer);

      // Wait for DOM to update
      await new Promise(resolve => setTimeout(resolve, 100));

      // Generate PDF
      const canvas = await html2canvas(pdfContainer, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const imgWidth = 190;
      const pageHeight = 280;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`business-permit-report-${new Date().toISOString().split("T")[0]}.pdf`);

      // Clean up
      document.body.removeChild(pdfContainer);
    } catch (error) {
      console.error("Error generating PDF:", error);
      Swal.fire({
        title: "Export Failed",
        text: "Failed to generate PDF. Please try again.",
        icon: "error"
      });
    } finally {
      setExporting(false);
      setExportType("");
    }
  };

  return (
    <div className="bg-white dark:bg-slate-700 p-6 rounded-lg">

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#4CAF50]/10 p-4 rounded-lg border border-[#4CAF50]/20">
          <p className="text-[#4CAF50] text-sm font-medium">Total Applications</p>
          <p className="text-[#4CAF50] text-2xl font-bold">{counts.total}</p>
        </div>
        <div className="bg-[#4A90E2]/10 p-4 rounded-lg border border-[#4A90E2]/20">
          <p className="text-[#4A90E2] text-sm font-medium">Pending Review</p>
          <p className="text-[#4A90E2] text-2xl font-bold">{counts.pending}</p>
        </div>
        <div className="bg-[#FDA811]/10 p-4 rounded-lg border border-[#FDA811]/20">
          <p className="text-[#FDA811] text-sm font-medium">For Compliance</p>
          <p className="text-[#FDA811] text-2xl font-bold">{counts.approved}</p>
        </div>
        <div className="bg-[#E53935]/10 p-4 rounded-lg border border-[#E53935]/20">
          <p className="text-[#E53935] text-sm font-medium">Rejected</p>
          <p className="text-[#E53935] text-2xl font-bold">{counts.rejected}</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm">
        <div className="border-b border-gray-200 dark:border-slate-700 overflow-x-auto">
          <nav className="flex space-x-6 px-6 min-w-max">
            {[
              { key: "all", label: "All Applications" },
              { key: "pending", label: "Pending" },
              { key: "compliance", label: "For Compliance" },
              { key: "approved", label: "Approved" },
              { key: "rejected", label: "Rejected" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center gap-2 transition-all ${getTabBorderColor(tab.key)} ${getTabTextColor(tab.key)}`}
              >
                {tab.label}
                <span className={`px-2 py-1 text-xs rounded-full ${getTabBadgeColor(tab.key)}`}>
                  {tab.key === "all" && counts.total}
                  {tab.key === "pending" && counts.pending}
                  {tab.key === "compliance" && 0} {/* You might want to track compliance separately */}
                  {tab.key === "approved" && counts.approved}
                  {tab.key === "rejected" && counts.rejected}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content Header */}
        <div className="p-6 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-[#4CAF50]/5 to-[#4A90E2]/5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {activeTab === "all" && "All Business Permits"}
                {activeTab === "pending" && "Pending Applications"}
                {activeTab === "compliance" && "For Compliance"}
                {activeTab === "approved" && "Approved Permits"}
                {activeTab === "rejected" && "Rejected Applications"}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                Showing {getFilteredPermits().length} of {permits.length} records
              </p>
            </div>
            
            <div className="flex gap-3">
              {/* Search Input */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && fetchPermits()}
                  placeholder="Search applications..."
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent w-64"
                />
                <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent appearance-none pr-10"
                >
                  <option value="latest">Latest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name_asc">Owner Name (A-Z)</option>
                  <option value="name_desc">Owner Name (Z-A)</option>
                  <option value="business_name_asc">Business Name (A-Z)</option>
                  <option value="capital_desc">Highest Capital</option>
                </select>
                <svg className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              
              {/* Export Buttons */}
              <button
                onClick={exportToCSV}
                disabled={exporting}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exporting && exportType === "csv" ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Export CSV</span>
                  </>
                )}
              </button>
              
              <button
                onClick={exportToPDF}
                disabled={exporting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exporting && exportType === "pdf" ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Export PDF</span>
                  </>
                )}
              </button>
              
              {/* Refresh Button */}
              <button 
                onClick={fetchPermits}
                className="px-4 py-2 bg-[#4CAF50] text-white rounded-lg hover:bg-[#4CAF50]/80 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-center">
              <div className="text-red-600 font-semibold">{error}</div>
            </div>
          )}
          
          {permits.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🏢</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No business permit applications found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                There are currently no business permit applications in the system.
              </p>
              <button 
                onClick={fetchPermits}
                className="px-4 py-2 bg-[#4CAF50] text-white rounded-lg hover:bg-[#FDA811] transition-colors"
              >
                Refresh Data
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full bg-white dark:bg-slate-800 shadow rounded-lg">
                <thead className="bg-gradient-to-r from-[#4CAF50]/10 to-[#4A90E2]/10">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Application ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Business Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Owner
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Business Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Capital
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Applied Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Documents
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {getFilteredPermits().map(p => (
                    <tr key={p.permit_id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-mono text-gray-600 dark:text-gray-300">
                        {p.applicant_id}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {p.business_name || 'N/A'}
                        </div>
                        {p.trade_name && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Trade: {p.trade_name}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {p.owner_last_name}, {p.owner_first_name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {p.owner_type} • {p.citizenship}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {p.business_nature || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(p.capital_investment)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {p.application_date ? new Date(p.application_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1.5 text-xs font-medium rounded-full border ${getStatusColor(
                            p.status
                          )} border-current border-opacity-30`}
                        >
                          {getUIStatus(p.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {p.document_count || 0} files
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => openModal(p)}
                          className="inline-flex items-center px-4 py-2 text-xs font-medium rounded-lg text-white bg-[#4CAF50] hover:bg-[#FDA811] transition-all shadow-sm hover:shadow-md"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Business Permit Modal */}
      {showModal && selectedPermit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 overflow-auto animate-fadeIn">
          <div className="w-full max-w-7xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl transform transition-all">
            {/* Enhanced Business Permit Header */}
            <div className="relative p-6 bg-gradient-to-r from-gray-50 via-white to-gray-50 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 border-b-4 border-green-400">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-green-400 to-green-500 p-3 rounded-2xl shadow-xl">
                    <Building2 className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Business Permit</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Business Permit Application Details</p>
                  </div>
                </div>
                
                <button 
                  onClick={closeModal}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Info Cards Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Permit ID Card */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md border-l-4 border-blue-500">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Permit ID</p>
                  <p className="text-lg font-bold text-gray-800 dark:text-white font-mono">
                    BP-{String(selectedPermit.permit_id).padStart(4, '0')}
                  </p>
                </div>

                {/* Application ID Card */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md border-l-4 border-purple-500">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Applicant ID</p>
                  <p className="text-lg font-bold text-gray-800 dark:text-white">
                    {selectedPermit.applicant_id}
                  </p>
                </div>

                {/* Status Card */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md border-l-4 border-green-500">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Status</p>
                  <span className={`inline-block px-3 py-1 text-sm font-bold rounded-full ${getStatusColor(selectedPermit.status)}`}>
                    {selectedPermit.uiStatus || getUIStatus(selectedPermit.status)}
                  </span>
                </div>

                {/* Date Card */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md border-l-4 border-orange-500">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Date Applied</p>
                  <p className="text-lg font-bold text-gray-800 dark:text-white">
                    {selectedPermit.application_date ? new Date(selectedPermit.application_date).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-8 max-h-[80vh] overflow-y-auto bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-800">
              {/* Personal Information Section */}
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
                      {selectedPermit.owner_last_name}, {selectedPermit.owner_first_name} {selectedPermit.owner_middle_name}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Owner Type</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedPermit.owner_type || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Citizenship</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedPermit.citizenship || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedPermit.date_of_birth ? new Date(selectedPermit.date_of_birth).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Contact Number</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedPermit.contact_number || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email Address</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedPermit.email_address || 'N/A'}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-500">Home Address</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedPermit.home_address || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Valid ID</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedPermit.valid_id_type || 'N/A'}: {selectedPermit.valid_id_number || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Business Information */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border-2 border-green-100 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl shadow-lg">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Business Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-500">Business Name</label>
                    <p className="text-xl font-bold text-[#4CAF50] mt-1">
                      {selectedPermit.business_name || 'N/A'}
                    </p>
                    {selectedPermit.trade_name && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Trading as: {selectedPermit.trade_name}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Nature of Business</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedPermit.business_nature || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Building Type</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedPermit.building_type || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Capital Investment</label>
                    <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                      {formatCurrency(selectedPermit.capital_investment)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Business Area</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedPermit.business_area || '0'} sqm
                    </p>
                  </div>
                </div>
              </div>

              {/* Business Address */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border-2 border-purple-100 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl shadow-lg">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Business Address</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-500">House/Building No.</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedPermit.house_bldg_no || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Street</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedPermit.street || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Barangay</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedPermit.barangay || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">City/Municipality</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedPermit.city_municipality || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Province</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedPermit.province || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Zip Code</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedPermit.zip_code || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Operations Information */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border-2 border-orange-100 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-3 rounded-xl shadow-lg">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Operations Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Operation Hours</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {formatTime(selectedPermit.operation_time_from)} - {formatTime(selectedPermit.operation_time_to)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Operation Type</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedPermit.operation_type || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Total Employees</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedPermit.total_employees || '0'} ({selectedPermit.male_employees || '0'} male, {selectedPermit.female_employees || '0'} female)
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Employees in QC</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedPermit.employees_in_qc || '0'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Delivery Vehicles</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      Vans/Trucks: {selectedPermit.delivery_van_truck || '0'}, Motorcycles: {selectedPermit.delivery_motorcycle || '0'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Total Floor Area</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedPermit.total_floor_area || '0'} sqm
                    </p>
                  </div>
                </div>
              </div>

              {/* Documents Section */}
              {selectedPermit.documents && selectedPermit.documents.length > 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border-2 border-indigo-100 dark:border-slate-700">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-3 rounded-xl shadow-lg">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white">Submitted Documents</h4>
                    <span className="ml-auto bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-bold">
                      {selectedPermit.documents.length} files
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedPermit.documents.map((doc, index) => {
                      const isImage = isImageFile(doc.file_type, doc.document_name);
                      const displayName = doc.document_type ? doc.document_type.replace(/_/g, ' ') : 'Document';
                      
                      return (
                        <div key={index} className="flex items-center justify-between p-3 border border-gray-200 dark:border-slate-600 rounded-lg">
                          <div className="flex items-center gap-2">
                            {isImage ? (
                              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                <ImageIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                              </div>
                            ) : (
                              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                                {displayName}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {doc.document_name}
                              </p>
                            </div>
                          </div>
                          <button 
                            onClick={() => viewFile(doc)}
                            className="px-3 py-1 text-xs bg-[#4CAF50] text-white rounded hover:bg-[#FDA811] transition-colors whitespace-nowrap"
                          >
                            View
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border-2 border-gray-200 dark:border-slate-700">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-gradient-to-br from-gray-400 to-gray-500 p-3 rounded-xl shadow-lg">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white">Submitted Documents</h4>
                  </div>
                  <div className="text-center py-8 bg-gray-50 dark:bg-slate-700 rounded-xl">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      No files uploaded for this application.
                    </p>
                  </div>
                </div>
              )}

              {/* Review Comments Section */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border-2 border-yellow-100 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-3 rounded-xl shadow-lg">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Review Comments</h3>
                    {selectedPermit.comments && (
                      <span className="text-sm font-normal text-gray-500">
                        ({formatComments(selectedPermit.comments).length} comment{formatComments(selectedPermit.comments).length !== 1 ? 's' : ''})
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Display all comments */}
  <div className="space-y-4 mb-6">
    {selectedPermit.comments && selectedPermit.comments.trim() ? (
      <div className="bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600 overflow-hidden">
        <div className="max-h-64 overflow-y-auto p-4">
          {formatComments(selectedPermit.comments).map((comment, index) => (
            <div key={index} className={`mb-4 ${index !== 0 ? 'pt-4 border-t border-gray-200 dark:border-slate-600' : ''}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Admin Comment
                </div>
                <div className="flex items-center text-xs text-gray-400">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {comment.timestamp}
                </div>
              </div>
              <div className="pl-6">
                <p className="text-gray-900 dark:text-white bg-white dark:bg-slate-800 p-3 rounded border border-gray-100 dark:border-slate-500">
                  {comment.comment}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="px-4 py-3 bg-gray-100 dark:bg-slate-800 border-t border-gray-200 dark:border-slate-600">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Total: {formatComments(selectedPermit.comments).length} comment{formatComments(selectedPermit.comments).length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    ) : (
      <div className="text-center py-8 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600">
        <svg className="w-12 h-12 text-gray-300 dark:text-gray-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        <p className="text-gray-500 dark:text-gray-400">
          No comments yet. Add your first comment below.
        </p>
      </div>
    )}
  </div>

                {/* Textarea for adding new comments */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Add New Comment
                  </label>
                  <textarea 
                    value={actionComment} 
                    onChange={(e) => setActionComment(e.target.value)} 
                    className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-3 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                    rows={3} 
                    placeholder="Enter your review notes here..." 
                  />
                  
                  {/* Save Comment Button */}
                  {actionComment.trim() && (
                    <div className="mt-4 flex justify-end">
                      <button 
                        onClick={saveCommentOnly}
                        className="px-6 py-2 bg-[#4A90E2] text-white rounded-lg hover:bg-[#4A90E2]/80 transition-colors font-medium flex items-center shadow-sm hover:shadow"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Save Comment
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Action History Section */}
              {(() => {
                const history = actionHistory[selectedPermit.permit_id] || [];
                return history.length > 0 ? (
                  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border-2 border-blue-100 dark:border-slate-700">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg">
                        <Clock className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Action History</h3>
                        <p className="text-sm text-gray-500">{history.length} action{history.length !== 1 ? 's' : ''} taken this session</p>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="absolute left-[17px] top-0 bottom-0 w-0.5 bg-blue-200 dark:bg-slate-600"></div>
                      <div className="space-y-4 max-h-64 overflow-y-auto">
                        {[...history].reverse().map((entry, idx) => (
                          <div key={idx} className="relative pl-10">
                            <div className={`absolute left-[10px] top-1.5 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 shadow ${
                              entry.action === 'Approved' ? 'bg-green-500' :
                              entry.action === 'Rejected' ? 'bg-red-500' :
                              entry.action === 'Compliance' || entry.action === 'Pending' ? 'bg-yellow-500' :
                              'bg-blue-500'
                            }`}></div>
                            <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-3 border border-gray-200 dark:border-slate-600">
                              <div className="flex items-center justify-between mb-1">
                                <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${
                                  entry.action === 'Approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                  entry.action === 'Rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                  entry.action === 'Compliance' || entry.action === 'Pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                }`}>{entry.action}</span>
                                <span className="text-xs text-gray-400 dark:text-gray-500">{entry.timestamp}</span>
                              </div>
                              {entry.notes && (
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 pl-1">{entry.notes}</p>
                              )}
                              <p className="text-xs text-gray-400 mt-1 pl-1">by {entry.by}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Action Buttons */}
              <div className="flex gap-4 justify-between pt-8 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-700 rounded-2xl p-6 border-t-4 border-gray-300 dark:border-slate-600">
                {/* Actions Dropdown - Show for all statuses except Rejected */}
                {selectedPermit.status !== "REJECTED" && (
                  <div className="relative">
                    <button
                      onClick={() => setShowActionsDropdown(!showActionsDropdown)}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium shadow-md hover:shadow-lg flex items-center gap-2"
                    >
                      Actions
                      <svg className={`w-4 h-4 transition-transform ${showActionsDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {showActionsDropdown && (
                      <div className="absolute left-0 bottom-full mb-2 w-72 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 overflow-hidden z-50 max-h-96 overflow-y-auto">
                        {/* Processing Status Updates */}
                        <div className="px-3 py-2 bg-gray-100 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
                          <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Processing Steps</p>
                        </div>
                        
                        <button
                          onClick={() => {
                            setShowActionsDropdown(false);
                            handleStatusUpdate('Under Review', 'Mark as Under Review', 'Application is now being reviewed by the team.', '#3B82F6');
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-3 border-b border-gray-100 dark:border-slate-600"
                        >
                          <FileText className="w-5 h-5 text-blue-600" />
                          <span className="font-medium text-gray-700 dark:text-gray-200">Under Review</span>
                        </button>

                        <button
                          onClick={() => {
                            setShowActionsDropdown(false);
                            handleStatusUpdate('Document Verification', 'Document Verification', 'Documents are being verified for completeness and authenticity.', '#8B5CF6');
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-purple-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-3 border-b border-gray-100 dark:border-slate-600"
                        >
                          <FileText className="w-5 h-5 text-purple-600" />
                          <span className="font-medium text-gray-700 dark:text-gray-200">Document Verification</span>
                        </button>

                        <button
                          onClick={() => {
                            setShowActionsDropdown(false);
                            handleStatusUpdate('Payment Verification', 'Verify Payment', 'Payment is being verified.', '#F59E0B');
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-amber-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-3 border-b border-gray-100 dark:border-slate-600"
                        >
                          <Receipt className="w-5 h-5 text-amber-600" />
                          <span className="font-medium text-gray-700 dark:text-gray-200">Payment Verification</span>
                        </button>

                        <button
                          onClick={() => {
                            setShowActionsDropdown(false);
                            handleStatusUpdate('For Manager Approval', 'Send for Manager Approval', 'Application is being sent to manager for approval.', '#6366F1');
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-3 border-b border-gray-100 dark:border-slate-600"
                        >
                          <User className="w-5 h-5 text-indigo-600" />
                          <span className="font-medium text-gray-700 dark:text-gray-200">For Manager Approval</span>
                        </button>

                        <button
                          onClick={() => {
                            setShowActionsDropdown(false);
                            handleStatusUpdate('Ready for Release', 'Mark Ready for Release', 'Permit is ready for release to applicant.', '#10B981');
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-3 border-b border-gray-100 dark:border-slate-600"
                        >
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                          <span className="font-medium text-gray-700 dark:text-gray-200">Ready for Release</span>
                        </button>

                        {/* Compliance & Actions */}
                        <div className="px-3 py-2 bg-gray-100 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
                          <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Actions</p>
                        </div>

                        <button
                          onClick={() => {
                            setShowActionsDropdown(false);
                            handleCompliance();
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-yellow-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-3 border-b border-gray-100 dark:border-slate-600"
                        >
                          <AlertCircle className="w-5 h-5 text-yellow-600" />
                          <span className="font-medium text-gray-700 dark:text-gray-200">Mark for Compliance</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            setShowActionsDropdown(false);
                            handleReject();
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-red-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-3 border-b border-gray-100 dark:border-slate-600"
                        >
                          <X className="w-5 h-5 text-red-600" />
                          <span className="font-medium text-gray-700 dark:text-gray-200">Reject Application</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            setShowActionsDropdown(false);
                            handleApprove();
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-green-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-3"
                        >
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="font-medium text-gray-700 dark:text-gray-200">✓ Approve Permit</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Close Button - Always visible */}
                <button 
                  onClick={closeModal}
                  className="px-8 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all font-medium shadow-md hover:shadow-lg flex items-center gap-2 ml-auto"
                >
                  <X className="w-5 h-5" />
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