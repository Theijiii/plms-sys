import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import Swal from "sweetalert2";
import { logTx } from '../../../lib/txLogger';
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
  AlertCircle
} from "lucide-react";

const API_BRGY = "/backend/barangay_permit";

// Helper functions for file preview modal
const isImageFile = (fileType, fileName) => {
  if (fileType) {
    return fileType.startsWith('image/');
  }
  if (fileName) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
    return imageExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
  }
  return false;
};

const getFileTypeName = (fileType, fileName) => {
  if (fileType) {
    if (fileType === 'application/pdf') return 'PDF Document';
    if (fileType.startsWith('image/')) {
      const format = fileType.split('/')[1].toUpperCase();
      return `${format} Image`;
    }
    if (fileType.startsWith('application/')) {
      if (fileType.includes('word')) return 'Word Document';
      if (fileType.includes('excel')) return 'Excel Spreadsheet';
      if (fileType.includes('zip')) return 'ZIP Archive';
      if (fileType.includes('rar')) return 'RAR Archive';
    }
    if (fileType.startsWith('text/')) {
      if (fileType.includes('csv')) return 'CSV File';
      return 'Text File';
    }
  }
  
  if (fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    switch (ext) {
      case 'pdf': return 'PDF Document';
      case 'jpg':
      case 'jpeg': return 'JPEG Image';
      case 'png': return 'PNG Image';
      case 'gif': return 'GIF Image';
      case 'bmp': return 'BMP Image';
      case 'webp': return 'WebP Image';
      case 'doc':
      case 'docx': return 'Word Document';
      case 'txt': return 'Text File';
      case 'csv': return 'CSV File';
      case 'xls':
      case 'xlsx': return 'Excel Spreadsheet';
      case 'zip': return 'ZIP Archive';
      case 'rar': return 'RAR Archive';
      default: return 'File';
    }
  }
  
  return 'File';
};

export default function BrgyPermitApplication() {
  const [selectedPermit, setSelectedPermit] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [permits, setPermits] = useState([]);
  const [actionComment, setActionComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [sortOption, setSortOption] = useState('latest');
  const [searchQuery, setSearchQuery] = useState('');
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const [actionHistory, setActionHistory] = useState({});
  const [zoomLevel, setZoomLevel] = useState(100);
  const imageRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const imagePositionRef = useRef({ x: 0, y: 0 });

  // Helper function to update zoom level display
  const updateZoomLevel = useCallback(() => {
    if (imageRef.current) {
      const currentTransform = imageRef.current.style.transform || 'scale(1)';
      const currentScale = parseFloat(currentTransform.match(/scale\(([^)]+)\)/)?.[1] || 1);
      setZoomLevel(Math.round(currentScale * 100));
    }
  }, []);

  // Handle ESC key press to close file preview
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape' && showFilePreview) {
        closeFilePreview();
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => {
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [showFilePreview]);

  // Reset image position when file changes
  useEffect(() => {
    if (selectedFile && imageRef.current) {
      imageRef.current.style.transform = 'scale(1)';
      imageRef.current.style.left = '0px';
      imageRef.current.style.top = '0px';
      imageRef.current.style.cursor = 'default';
      setZoomLevel(100);
      imagePositionRef.current = { x: 0, y: 0 };
    }
  }, [selectedFile]);

  // Handle wheel event for zooming
  const handleWheel = useCallback((e) => {
    if (!imageRef.current || !isImageFile(selectedFile?.file_type, selectedFile?.name)) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    if (e.deltaY !== 0) {
      const currentTransform = imageRef.current.style.transform || 'scale(1)';
      const currentScale = parseFloat(currentTransform.match(/scale\(([^)]+)\)/)?.[1] || 1);
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newScale = Math.max(0.5, Math.min(currentScale + delta, 5));
      imageRef.current.style.transform = `scale(${newScale})`;
      imageRef.current.style.cursor = newScale > 1 ? 'grab' : 'default';
      updateZoomLevel();
    }
  }, [selectedFile, updateZoomLevel]);

  // Handle mouse down for dragging
  const handleMouseDown = useCallback((e) => {
    if (!imageRef.current || !isImageFile(selectedFile?.file_type, selectedFile?.name)) return;
    
    const currentTransform = imageRef.current.style.transform || 'scale(1)';
    const currentScale = parseFloat(currentTransform.match(/scale\(([^)]+)\)/)?.[1] || 1);
    
    if (currentScale > 1) {
      e.preventDefault();
      isDraggingRef.current = true;
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      imageRef.current.style.cursor = 'grabbing';
      
      // Add event listeners for dragging
      const handleMouseMove = (moveEvent) => {
        if (!isDraggingRef.current || !imageRef.current) return;
        
        const deltaX = moveEvent.clientX - dragStartRef.current.x;
        const deltaY = moveEvent.clientY - dragStartRef.current.y;
        
        const newX = imagePositionRef.current.x + deltaX;
        const newY = imagePositionRef.current.y + deltaY;
        
        imageRef.current.style.left = `${newX}px`;
        imageRef.current.style.top = `${newY}px`;
      };
      
      const handleMouseUp = () => {
        if (!imageRef.current) return;
        
        isDraggingRef.current = false;
        imageRef.current.style.cursor = 'grab';
        
        // Update the stored position
        if (imageRef.current.style.left && imageRef.current.style.top) {
          imagePositionRef.current.x = parseFloat(imageRef.current.style.left);
          imagePositionRef.current.y = parseFloat(imageRef.current.style.top);
        }
        
        // Remove event listeners
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  }, [selectedFile]);

  // Handle zoom controls
  const handleZoomIn = useCallback(() => {
    if (!imageRef.current) return;
    
    const currentTransform = imageRef.current.style.transform || 'scale(1)';
    const currentScale = parseFloat(currentTransform.match(/scale\(([^)]+)\)/)?.[1] || 1);
    const newScale = Math.min(currentScale + 0.25, 5);
    imageRef.current.style.transform = `scale(${newScale})`;
    imageRef.current.style.cursor = newScale > 1 ? 'grab' : 'default';
    updateZoomLevel();
  }, [updateZoomLevel]);

  const handleZoomOut = useCallback(() => {
    if (!imageRef.current) return;
    
    const currentTransform = imageRef.current.style.transform || 'scale(1)';
    const currentScale = parseFloat(currentTransform.match(/scale\(([^)]+)\)/)?.[1] || 1);
    const newScale = Math.max(currentScale - 0.25, 0.5);
    imageRef.current.style.transform = `scale(${newScale})`;
    imageRef.current.style.cursor = newScale > 1 ? 'grab' : 'default';
    updateZoomLevel();
  }, [updateZoomLevel]);

  const handleResetZoom = useCallback(() => {
    if (!imageRef.current) return;
    
    imageRef.current.style.transform = 'scale(1)';
    imageRef.current.style.left = '0px';
    imageRef.current.style.top = '0px';
    imageRef.current.style.cursor = 'default';
    setZoomLevel(100);
    imagePositionRef.current = { x: 0, y: 0 };
  }, []);

  const sortPermits = (permitsToSort, sortBy) => {
    const sortedPermits = [...permitsToSort];
    
    switch (sortBy) {
      case 'latest':
        return sortedPermits.sort((a, b) => 
          new Date(b.application_date || b.created_at || 0) - 
          new Date(a.application_date || a.created_at || 0)
        );
      
      case 'oldest':
        return sortedPermits.sort((a, b) => 
          new Date(a.application_date || a.created_at || 0) - 
          new Date(b.application_date || b.created_at || 0)
        );
      
      case 'name_asc':
        return sortedPermits.sort((a, b) => {
          const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
          const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
          return nameA.localeCompare(nameB);
        });
      
      case 'name_desc':
        return sortedPermits.sort((a, b) => {
          const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
          const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
          return nameB.localeCompare(nameA);
        });
      
      case 'status_priority':
        // Custom order: Compliance -> Approved -> Rejected
        const statusOrder = { 'pending': 1, 'approved': 2, 'rejected': 3 };
        return sortedPermits.sort((a, b) => 
          (statusOrder[a.status] || 4) - (statusOrder[b.status] || 4)
        );
      
      default:
        return sortedPermits;
    }
  };

  // Search function
  const searchPermits = (permitsToSearch, query) => {
    if (!query.trim()) return permitsToSearch;
    
    const searchTerm = query.toLowerCase();
    return permitsToSearch.filter(permit => {
      const fullName = `${permit.first_name} ${permit.middle_name} ${permit.last_name} ${permit.suffix}`.toLowerCase();
      const permitId = `BP-${String(permit.permit_id).padStart(4, '0')}`.toLowerCase();
      const barangay = (permit.barangay || '').toLowerCase();
      const purpose = (permit.purpose || '').toLowerCase();
      const email = (permit.email || '').toLowerCase();
      const mobile = (permit.mobile_number || '').toLowerCase();
      
      return (
        fullName.includes(searchTerm) ||
        permitId.includes(searchTerm) ||
        barangay.includes(searchTerm) ||
        purpose.includes(searchTerm) ||
        email.includes(searchTerm) ||
        mobile.includes(searchTerm)
      );
    });
  };

  // Combined filter function
  const getFilteredPermits = () => {
    let filtered = permits;
    
    // Apply tab filter
    if (activeTab !== "all") {
      filtered = filtered.filter(permit => {
        if (activeTab === "approved") return permit.status === "approved";
        if (activeTab === "pending") return permit.status === "pending" || !permit.status;
        if (activeTab === "rejected") return permit.status === "rejected";
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
      case 'name_asc': return 'Name A-Z';
      case 'name_desc': return 'Name Z-A';
      case 'status_priority': return 'Status Priority';
      default: return 'Default';
    }
  };

  const getUIStatus = (dbStatus) => {
    if (!dbStatus) return 'Compliance';
    const statusMap = {
      'pending': 'Compliance',
      'approved': 'Approved',
      'rejected': 'Rejected',
      'under_review': 'Under Review',
      'document_verification': 'Document Verification',
      'payment_verification': 'Payment Verification',
      'for_manager_approval': 'For Manager Approval',
      'ready_for_release': 'Ready for Release'
    };
    return statusMap[dbStatus.toLowerCase()] || dbStatus;
  };

  const getDBStatus = (uiStatus) => {
    if (!uiStatus) return 'pending';
    // 'Compliance' maps to 'pending' for backward compat
    if (uiStatus === 'Compliance') return 'pending';
    // Convert UI status to snake_case DB value
    return uiStatus.toLowerCase().replace(/\s+/g, '_');
  };

const parseAttachments = (attachmentsData) => {
  if (!attachmentsData) return [];
  
  try {
    let attachments;
    
    if (typeof attachmentsData === 'object' && attachmentsData !== null) {
      attachments = attachmentsData;
    } else if (typeof attachmentsData === 'string' && attachmentsData.trim() !== '') {
      attachments = JSON.parse(attachmentsData);
    } else {
      console.warn('Invalid attachments format:', attachmentsData);
      return [];
    }
    
    const fileList = [];
    
    Object.entries(attachments).forEach(([key, value]) => {
      if (value && typeof value === 'string' && value.trim() !== '') {
        // Extract just the filename, not the full path
        const filename = value.split('/').pop();
        fileList.push({
          id: key,
          name: filename,
          type: getFileType(filename),
          // FIXED: Use consistent URL format
          url: `${API_BRGY}/uploads/${filename}`
        });
      } else if (value && typeof value === 'object') {
        const fileName = value.name || value.filename || key;
        if (fileName && fileName.trim() !== '') {
          fileList.push({
            id: key,
            name: fileName,
            type: getFileType(fileName),
            // FIXED: Use consistent URL format
            url: `${API_BRGY}/uploads/${fileName}`
          });
        }
      }
    });
    
    return fileList;
  } catch (e) {
    console.error('Error parsing attachments:', e, 'Data:', attachmentsData);
    return [];
  }
};
  const getFileType = (filename) => {
    if (!filename || typeof filename !== 'string') return 'application/octet-stream';
    
    const ext = filename.split('.').pop().toLowerCase();
    switch (ext) {
      case 'pdf': return 'application/pdf';
      case 'jpg':
      case 'jpeg': return 'image/jpeg';
      case 'png': return 'image/png';
      case 'gif': return 'image/gif';
      case 'bmp': return 'image/bmp';
      case 'webp': return 'image/webp';
      case 'doc': return 'application/msword';
      case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'txt': return 'text/plain';
      case 'csv': return 'text/csv';
      case 'xls':
      case 'xlsx': return 'application/vnd.ms-excel';
      case 'zip': return 'application/zip';
      case 'rar': return 'application/x-rar-compressed';
      default: return 'application/octet-stream';
    }
  };

  const getStatusColor = (status) => {
    const uiStatus = getUIStatus(status);
    switch (uiStatus) {
      case "Approved": return "text-[#4CAF50] bg-[#4CAF50]/10";
      case "Rejected": return "text-[#E53935] bg-[#E53935]/10";
      case "Compliance": return "text-[#FDA811] bg-[#FDA811]/10";
      case "Under Review": return "text-[#3B82F6] bg-[#3B82F6]/10";
      case "Document Verification": return "text-[#8B5CF6] bg-[#8B5CF6]/10";
      case "Payment Verification": return "text-[#F59E0B] bg-[#F59E0B]/10";
      case "For Manager Approval": return "text-[#6366F1] bg-[#6366F1]/10";
      case "Ready for Release": return "text-[#10B981] bg-[#10B981]/10";
      default: return "text-gray-600 bg-gray-100";
    }
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
      
      const response = await fetch(`${API_BRGY}/admin_fetch.php`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setPermits(result.data);
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

  // Fetch single permit with detailed information including comments
  const fetchSinglePermit = async (permitId) => {
    try {
      const response = await fetch(`${API_BRGY}/fetch_single.php?permit_id=${permitId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to fetch permit details');
      }
    } catch (err) {
      console.error('Error fetching single permit:', err);
      return null;
    }
  };

  // Update permit status in database
  const updatePermitStatus = async (permitId, status, comments = '') => {
    try {
      const dbStatus = getDBStatus(status);
      
      // If there's a comment, add timestamp
      let commentWithTimestamp = '';
      if (comments.trim()) {
        const timestamp = new Date().toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        });
        commentWithTimestamp = `--- ${timestamp} ---\n${comments}\n`;
      }
      
      const response = await fetch(`${API_BRGY}/update_status.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          permit_id: permitId,
          status: dbStatus,
          comments: commentWithTimestamp
        })
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
      const updatedComments = result.data?.comments || 
        (comments.trim() && selectedPermit
          ? (selectedPermit.comments ? selectedPermit.comments + commentWithTimestamp : commentWithTimestamp)
          : selectedPermit?.comments);

      if (selectedPermit) {
        setSelectedPermit(prev => ({
          ...prev,
          comments: updatedComments || prev.comments,
          status: updatedDbStatus,
          uiStatus: updatedUiStatus
        }));
      }

      // Refresh the permits list
      await fetchPermits();

      // Clear the comment input
      setActionComment('');

      // Show success message
      alert(`Permit ${status.toLowerCase()} successfully!`);

      // Log transaction
      try { 
        logTx({ 
          service: 'barangay', 
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
      alert('Error updating status: ' + err.message);
    }
  };

  // Save comment only (without changing status)
  const saveCommentOnly = async () => {
    if (!selectedPermit || !actionComment.trim()) return;
    
    try {
      // Create timestamp in a standard format
      const now = new Date();
      const timestamp = now.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      
      const newCommentBlock = `--- ${timestamp} ---\n${actionComment}\n`;
      
      const response = await fetch(`${API_BRGY}/update_status.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          permit_id: selectedPermit.permit_id,
          comments: newCommentBlock
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

      // Use actual DB response to update local state
      const updatedComments = result.data?.comments || 
        (selectedPermit.comments 
          ? newCommentBlock + selectedPermit.comments
          : newCommentBlock);

      setSelectedPermit({
        ...selectedPermit,
        comments: updatedComments
      });

      // Also update the main permits list
      setPermits(prevPermits => 
        prevPermits.map(p => 
          p.permit_id === selectedPermit.permit_id 
            ? { ...p, comments: updatedComments }
            : p
        )
      );

      // Clear the comment input
      setActionComment('');

      // Show success modal instead of alert
      setSuccessMessage('Comment saved successfully!');
      setShowSuccessModal(true);

      // Log transaction
      try { 
        logTx({ 
          service: 'barangay', 
          permitId: selectedPermit.permit_id, 
          action: 'add_comment',
          comment: actionComment,
          timestamp: timestamp
        }); 
      } catch(e) {
        console.error('Error logging transaction:', e);
      }

    } catch (err) {
      console.error('Error saving comment:', err);
      setError(err.message || 'Failed to save comment');
      alert('Error saving comment: ' + err.message);
    }
  };

  useEffect(() => {
    fetchPermits();
  }, []);

  const openModal = async (permit) => {
    try {
      // First fetch detailed permit information including comments
      const detailedPermit = await fetchSinglePermit(permit.permit_id);
      
      if (detailedPermit) {
        const uiStatus = getUIStatus(detailedPermit.status);
        setSelectedPermit({
          ...detailedPermit,
          uiStatus: uiStatus
        });
      } else {
        // Fallback to the basic permit data if detailed fetch fails
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
      // Fallback to basic data
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
    setSelectedFile(null);
    setShowFilePreview(false);
    setShowModal(false);
  };

  const handleApprove = async () => {
    if (!selectedPermit) return;

    const result = await Swal.fire({
      title: 'Approve Permit?',
      html: `
        <div class="text-left">
          <p class="mb-2">You are about to approve this barangay permit application:</p>
          <div class="bg-gray-50 p-3 rounded-lg mb-3">
            <p class="text-sm"><strong>Permit ID:</strong> ${selectedPermit.permit_id}</p>
            <p class="text-sm"><strong>Applicant:</strong> ${selectedPermit.first_name} ${selectedPermit.last_name}</p>
            <p class="text-sm"><strong>Purpose:</strong> ${selectedPermit.purpose || 'N/A'}</p>
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
          <p class="mb-2">You are about to reject this barangay permit application:</p>
          <div class="bg-gray-50 p-3 rounded-lg mb-3">
            <p class="text-sm"><strong>Permit ID:</strong> ${selectedPermit.permit_id}</p>
            <p class="text-sm"><strong>Applicant:</strong> ${selectedPermit.first_name} ${selectedPermit.last_name}</p>
            <p class="text-sm"><strong>Purpose:</strong> ${selectedPermit.purpose || 'N/A'}</p>
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

  const handleForCompliance = async () => {
    if (!selectedPermit) return;

    const result = await Swal.fire({
      title: 'Mark for Compliance?',
      html: `
        <div class="text-left">
          <p class="mb-2">Mark this application for compliance review:</p>
          <div class="bg-gray-50 p-3 rounded-lg mb-3">
            <p class="text-sm"><strong>Permit ID:</strong> ${selectedPermit.permit_id}</p>
            <p class="text-sm"><strong>Applicant:</strong> ${selectedPermit.first_name} ${selectedPermit.last_name}</p>
          </div>
          <p class="text-sm text-gray-600">Please specify what compliance items are needed.</p>
        </div>
      `,
      icon: 'info',
      input: 'textarea',
      inputLabel: 'Compliance notes (optional)',
      inputPlaceholder: 'List required compliance items...',
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
      const notes = result.value || actionComment;
      await updatePermitStatus(selectedPermit.permit_id, 'Compliance', notes);
      setActionComment('');
    }
  };

  // Generic status update handler for processing steps
  const handleStatusUpdate = async (status, title, message, color = '#4CAF50') => {
    if (!selectedPermit) return;

    const result = await Swal.fire({
      title: title,
      html: `
        <div class="text-left">
          <p class="mb-2">${message}</p>
          <div class="bg-gray-50 p-3 rounded-lg mb-3">
            <p class="text-sm"><strong>Permit ID:</strong> BP-${String(selectedPermit.permit_id).padStart(4, '0')}</p>
            <p class="text-sm"><strong>Applicant:</strong> ${selectedPermit.first_name} ${selectedPermit.last_name}</p>
            <p class="text-sm"><strong>Purpose:</strong> ${selectedPermit.purpose || 'N/A'}</p>
          </div>
          <p class="text-sm text-gray-600">Add notes about this status update (optional).</p>
        </div>
      `,
      icon: 'question',
      input: 'textarea',
      inputLabel: 'Status update notes',
      inputPlaceholder: 'Enter any relevant notes...',
      inputValue: actionComment,
      showCancelButton: true,
      confirmButtonText: 'Update Status',
      cancelButtonText: 'Cancel',
      confirmButtonColor: color,
      cancelButtonColor: '#6b7280',
      customClass: {
        popup: 'text-left',
      },
      preConfirm: (notes) => {
        return notes;
      }
    });

    if (result.isConfirmed) {
      await updatePermitStatus(selectedPermit.permit_id, status, result.value || '');
    }
  };

const viewFile = (file) => {
  console.log('Viewing file:', file); // Debug log
  
  // Ensure the URL is properly constructed
  let fileUrl = file.url;
  
  // If URL doesn't start with http, prepend the base URL
  if (file.url && !file.url.startsWith('http')) {
    fileUrl = `${API_BRGY}/${file.url}`;
  }
  
  const fileWithType = {
    ...file,
    file_type: file.type || getFileType(file.name),
    url: fileUrl
  };
  
  setSelectedFile(fileWithType);
  setShowFilePreview(true);
};

  const closeFilePreview = () => {
    setSelectedFile(null);
    setShowFilePreview(false);
    setZoomLevel(100);
    isDraggingRef.current = false;
    dragStartRef.current = { x: 0, y: 0 };
    imagePositionRef.current = { x: 0, y: 0 };
  };

  // Function to format and display comments with timestamps
  const formatComments = (commentsText) => {
    if (!commentsText || typeof commentsText !== 'string') return [];
    
    try {
      // Clean the text
      const cleanedText = commentsText.trim();
      if (!cleanedText) return [];
      
      // Split by the timestamp pattern "--- [timestamp] ---"
      const commentBlocks = cleanedText.split(/(?=---\s+.+?\s+---)/g);
      
      const formattedComments = [];
      
      for (let block of commentBlocks) {
        block = block.trim();
        if (!block) continue;
        
        // Extract timestamp and comment using regex
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
          // If no timestamp format, treat entire block as comment
          formattedComments.push({
            timestamp: 'Just now',
            comment: block
          });
        }
      }
      
      // Return in the order they appear (newest first since we prepend new comments)
      return formattedComments;
    } catch (e) {
      console.error('Error formatting comments:', e);
      return [{
        timestamp: 'Recent',
        comment: commentsText
      }];
    }
  };

  // Calculate counts
  const total = permits.length;
  const approved = permits.filter(p => p.status === "approved").length;
  const rejected = permits.filter(p => p.status === "rejected").length;
  const pending = permits.filter(p => p.status === "pending" || !p.status).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4CAF50]"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-700 p-6 rounded-lg">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Barangay Permits Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage and track all barangay permit applications
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#4CAF50]/10 p-4 rounded-lg border border-[#4CAF50]/20">
          <p className="text-[#4CAF50] text-sm font-medium">Total Permits</p>
          <p className="text-[#4CAF50] text-2xl font-bold">{total}</p>
        </div>
        <div className="bg-[#4A90E2]/10 p-4 rounded-lg border border-[#4A90E2]/20">
          <p className="text-[#4A90E2] text-sm font-medium">Approved</p>
          <p className="text-[#4A90E2] text-2xl font-bold">{approved}</p>
        </div>
        <div className="bg-[#FDA811]/10 p-4 rounded-lg border border-[#FDA811]/20">
          <p className="text-[#FDA811] text-sm font-medium">Compliance</p>
          <p className="text-[#FDA811] text-2xl font-bold">{pending}</p>
        </div>
        <div className="bg-[#E53935]/10 p-4 rounded-lg border border-[#E53935]/20">
          <p className="text-[#E53935] text-sm font-medium">Rejected</p>
          <p className="text-[#E53935] text-2xl font-bold">{rejected}</p>
        </div>
      </div>

      {/* 🧭 Tab Navigation */}
      <div className="mb-6 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm">
        <div className="border-b border-gray-200 dark:border-slate-700 overflow-x-auto">
          <nav className="flex space-x-6 px-6 min-w-max">
            {[
              { key: "all", label: "All Permits" },
              { key: "approved", label: "Approved" },
              { key: "pending", label: "Compliance" },
              { key: "rejected", label: "Rejected" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center gap-2 transition-all ${getTabBorderColor(tab.key)} ${getTabTextColor(tab.key)}`}
              >
                {tab.label}
                <span className={`px-2 py-1 text-xs rounded-full ${getTabBadgeColor(tab.key)}`}>
                  {tab.key === "all" && total}
                  {tab.key === "approved" && approved}
                  {tab.key === "pending" && pending}
                  {tab.key === "rejected" && rejected}
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
                {activeTab === "all" && "All Barangay Permits"}
                {activeTab === "approved" && "Approved Permits"}
                {activeTab === "pending" && "Compliance"}
                {activeTab === "rejected" && "Rejected Permits"}
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
                  placeholder="Search permits..."
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent w-64"
                />
                <svg 
                  className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                )}
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
                  <option value="name_asc">Name (A-Z)</option>
                  <option value="name_desc">Name (Z-A)</option>
                  <option value="status_priority">Status Priority</option>
                </select>
                <svg 
                  className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              
              {/* Refresh Button */}
              <button 
                onClick={fetchPermits}
                className="px-4 py-2 bg-[#4CAF50] text-white rounded-lg hover:bg-[#4CAF50]/80 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
          
          {/* Search Summary */}
          {searchQuery && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Search results for: <span className="font-semibold">"{searchQuery}"</span>
              </div>
              <button
                onClick={() => setSearchQuery('')}
                className="text-sm text-[#4CAF50] hover:text-[#FDA811] flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear search
              </button>
            </div>
          )}
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
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No barangay permits found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                There are currently no barangay permits in the system.
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
                      Permit No.
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Applicant
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Barangay
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Purpose
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Applied Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Status
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
                        BP-{String(p.permit_id).padStart(4, '0')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">
                        {p.first_name} {p.middle_name} {p.last_name} {p.suffix}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {p.barangay || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {p.purpose || 'N/A'}
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
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => openModal(p)}
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
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedPermit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 overflow-auto animate-fadeIn">
          <div className="w-full max-w-7xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl transform transition-all">
            {/* Modal Header */}
            <div className="relative p-6 bg-gradient-to-r from-gray-50 via-white to-gray-50 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 border-b-4 border-[#4CAF50]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-[#4CAF50] to-[#45a049] p-3 rounded-2xl shadow-xl">
                    <FileText className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Barangay Permit</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Barangay Permit Application Details</p>
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
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md border-l-4 border-blue-500">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Permit ID</p>
                  <p className="text-lg font-bold text-gray-800 dark:text-white font-mono">
                    BP-{String(selectedPermit.permit_id).padStart(4, '0')}
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md border-l-4 border-purple-500">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Applicant ID</p>
                  <p className="text-lg font-bold text-gray-800 dark:text-white">
                    {selectedPermit.applicant_id || 'N/A'}
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md border-l-4 border-green-500">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Status</p>
                  <span className={`inline-block px-3 py-1 text-sm font-bold rounded-full ${getStatusColor(selectedPermit.status)}`}>
                    {selectedPermit.uiStatus || getUIStatus(selectedPermit.status)}
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md border-l-4 border-orange-500">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Application Date</p>
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
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg"><User className="w-6 h-6 text-white" /></div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Personal Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Applicant ID</label>
                    <p className="text-lg font-mono font-bold text-[#4CAF50] mt-1">
                      {selectedPermit.applicant_id || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Full Name</label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                      {selectedPermit.first_name} {selectedPermit.middle_name} {selectedPermit.last_name} {selectedPermit.suffix}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Mobile Number</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedPermit.mobile_number || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email Address</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedPermit.email || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Birth Date</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedPermit.birthdate ? new Date(selectedPermit.birthdate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Gender</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedPermit.gender || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Civil Status</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedPermit.civil_status || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Nationality</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedPermit.nationality || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border-2 border-green-100 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Address Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-500">House No.</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedPermit.house_no || 'N/A'}
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

              {/* Permit Details */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border-2 border-orange-100 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-3 rounded-xl shadow-lg"><FileText className="w-6 h-6 text-white" /></div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Permit Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Purpose</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedPermit.purpose || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Duration</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedPermit.duration || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">ID Type</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedPermit.id_type || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">ID Number</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedPermit.id_number || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Application Date</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedPermit.application_date ? new Date(selectedPermit.application_date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border-2 border-purple-100 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl shadow-lg"><Receipt className="w-6 h-6 text-white" /></div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Payment Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Clearance Fee</label>
                    <p className="text-xl font-bold text-[#4CAF50] mt-1">
                      ₱{selectedPermit.clearance_fee || '0.00'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Receipt Number</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedPermit.receipt_number || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Submitted Attachments */}
              {parseAttachments(selectedPermit.attachments).length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border-2 border-cyan-100 dark:border-slate-700">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 p-3 rounded-xl shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white">Submitted Files</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {parseAttachments(selectedPermit.attachments).map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-slate-600 rounded-lg">
                        <div className="flex items-center gap-2">
                          {file.type.includes('image') ? (
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          ) : (
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                          )}
                          <span className="text-sm text-gray-700 dark:text-gray-300">{file.name}</span>
                        </div>
                        <button 
                          onClick={() => viewFile(file)}
                          className="px-3 py-1 text-xs bg-[#4CAF50] text-white rounded hover:bg-[#FDA811] transition-colors"
                        >
                          View
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Review Comments Section */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border-2 border-yellow-100 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-3 rounded-xl shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
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
                
                {/* Display all comments in one box */}
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
                              entry.action === 'Compliance' ? 'bg-yellow-500' :
                              'bg-blue-500'
                            }`}></div>
                            <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-3 border border-gray-200 dark:border-slate-600">
                              <div className="flex items-center justify-between mb-1">
                                <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${
                                  entry.action === 'Approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                  entry.action === 'Rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                  entry.action === 'Compliance' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
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
                {/* Actions Dropdown - Show for all statuses except rejected */}
                {selectedPermit.status !== "rejected" && (
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
                          <Search className="w-5 h-5 text-blue-600" />
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

                        {/* Main Actions */}
                        <div className="px-3 py-2 bg-gray-100 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
                          <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Actions</p>
                        </div>

                        <button
                          onClick={() => {
                            setShowActionsDropdown(false);
                            handleForCompliance();
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

      {/* File Preview Modal - UPDATED VERSION */}
      {showFilePreview && selectedFile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-0">
          <div className="relative w-full h-full flex flex-col">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-20 p-4 flex justify-between items-center bg-gradient-to-b from-black/70 to-transparent">
              <div className="flex items-center gap-3 text-white">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-medium truncate max-w-xs">
                    {selectedFile.name}
                  </span>
                  <span className="text-xs text-gray-300">
                    {getFileTypeName(selectedFile.file_type, selectedFile.name)}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Zoom Controls */}
                {isImageFile(selectedFile.file_type, selectedFile.name) && (
                  <div className="flex items-center gap-1 mr-4 bg-black/40 rounded-lg p-1">
                    <button 
                      onClick={handleZoomOut}
                      className="p-2 text-white hover:bg-white/10 rounded transition-colors"
                      title="Zoom Out"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                      </svg>
                    </button>
                    
                    <button 
                      onClick={handleResetZoom}
                      className="px-3 py-2 text-xs text-white hover:bg-white/10 rounded transition-colors"
                      title="Reset Zoom"
                    >
                      {zoomLevel}%
                    </button>
                    
                    <button 
                      onClick={handleZoomIn}
                      className="p-2 text-white hover:bg-white/10 rounded transition-colors"
                      title="Zoom In"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </button>
                  </div>
                )}
                
                <a 
                  href={selectedFile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center gap-1.5 transition-colors"
                  download
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </a>
                <button 
                  onClick={closeFilePreview}
                  className="ml-2 p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                  title="Close preview"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Image Content with Zoom */}
            {isImageFile(selectedFile.file_type, selectedFile.name) ? (
              <div 
                className="flex-1 flex items-center justify-center p-4 overflow-hidden cursor-move"
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
              >
                <div className="relative w-full h-full flex items-center justify-center">
<img 
  ref={imageRef}
  id="preview-image"
  src={selectedFile.url} 
  alt={selectedFile.name}
  className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl transition-transform duration-200 ease-out"
  style={{ transform: 'scale(1)', position: 'relative', left: '0px', top: '0px', cursor: 'default' }}
  onError={(e) => {
    console.error('Failed to load image:', selectedFile.url);
    e.target.onerror = null;
    e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23222222"/><text x="200" y="150" text-anchor="middle" font-family="Arial" font-size="16" fill="%23ffffff">Image not found</text><text x="200" y="170" text-anchor="middle" font-family="Arial" font-size="12" fill="%23999999">URL: ' + selectedFile.url + '</text></svg>';
    e.target.className = 'max-w-md mx-auto bg-gray-800 rounded-lg p-8';
  }}
/>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center max-w-md bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                  <div className="text-gray-300 mb-6">
                    {selectedFile.file_type?.includes('pdf') || selectedFile.name?.endsWith('.pdf') ? (
                      <FileText className="w-24 h-24 mx-auto" />
                    ) : selectedFile.file_type?.includes('image/') ? (
                      <ImageIcon className="w-24 h-24 mx-auto" />
                    ) : (
                      <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                  </div>
                  <h3 className="text-xl font-medium text-white mb-3">
                    {getFileTypeName(selectedFile.file_type, selectedFile.name)}
                  </h3>
                  <p className="text-gray-300 mb-6">
                    This file cannot be previewed in browser.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <a 
                      href={selectedFile.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      download
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download
                    </a>
                    <button 
                      onClick={closeFilePreview}
                      className="inline-flex items-center justify-center px-5 py-2.5 border border-white/30 text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Info with Zoom Level */}
            <div className="absolute bottom-0 left-0 right-0 z-20 p-4 flex justify-between items-center text-white/60 text-sm">
              <div className="flex items-center gap-2">
                {isImageFile(selectedFile.file_type, selectedFile.name) && (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                    <span>{zoomLevel}%</span>
                    <span className="text-xs ml-4">Drag to pan when zoomed</span>
                  </>
                )}
              </div>
              <div>
                <span className="hidden sm:inline">Press </span>
                <kbd className="px-2 py-1 bg-black/40 rounded text-xs mx-1">ESC</kbd>
                <span className="hidden sm:inline"> to close</span>
              </div>
            </div>

            {/* Close on background click */}
            <div 
              className="absolute inset-0 -z-10 cursor-pointer"
              onClick={closeFilePreview}
            />
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 transform transition-all">
            <div className="text-center">
              {/* Success Checkmark Animation */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                <svg className="h-10 w-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Success!
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {successMessage}
              </p>
              
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    setSuccessMessage('');
                  }}
                  className="px-6 py-2 bg-[#4CAF50] text-white rounded-lg hover:bg-[#4CAF50]/80 transition-colors font-medium flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}