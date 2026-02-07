import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import Swal from "sweetalert2";
import {
  Search,
  Download,
  RefreshCw,
  Car,
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
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

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

// Status mapping functions
const mapStatusToFrontend = (status) => {
  if (!status) return 'Pending';
  const statusMap = {
    'pending': 'Pending',
    'approved': 'Approved',
    'rejected': 'Rejected',
    'under_review': 'Under Review',
    'document_verification': 'Document Verification',
    'field_inspection_scheduled': 'Field Inspection Scheduled',
    'payment_verification': 'Payment Verification',
    'for_manager_approval': 'For Manager Approval',
    'printing_processing': 'Printing Processing',
    'ready_for_release': 'Ready for Release'
  };
  return statusMap[status.toLowerCase()] || status;
};

const mapStatusToBackend = (status) => {
  if (!status) return 'pending';
  // Convert UI status to snake_case DB value
  return status.toLowerCase().replace(/\s+/g, '_');
};

export default function FranchisePermitApplication() {
  const [franchises, setFranchises] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFranchise, setSelectedFranchise] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [permitSubtypeFilter, setPermitSubtypeFilter] = useState("all");
  const [permitTypeFilter, setPermitTypeFilter] = useState("all");
  const [exporting, setExporting] = useState(false);
  const [exportType, setExportType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionComment, setActionComment] = useState('');
  const [sortOption, setSortOption] = useState('latest');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const [actionHistory, setActionHistory] = useState({});
  const imageRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const imagePositionRef = useRef({ x: 0, y: 0 });
  
  const ITEMS_PER_PAGE = 10;
  const API_BASE = "/backend/franchise_permit";

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return 'N/A';
    }
  };

  // Fetch franchises from API
  const fetchFranchises = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: currentPage,
        limit: ITEMS_PER_PAGE
      });
      
      if (statusFilter !== "all") {
        params.append('status', statusFilter);
      }
      
      if (permitSubtypeFilter !== "all") {
        params.append('permit_subtype', permitSubtypeFilter.toUpperCase());
      }
      
      if (permitTypeFilter !== "all") {
        params.append('permit_type', permitTypeFilter.toUpperCase());
      }
      
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }
      
      const url = `${API_BASE}/admin_fetch.php?${params}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        const transformedData = data.data.map((franchise) => {
          const fullName = `${franchise.first_name || ''} ${franchise.middle_initial ? franchise.middle_initial + '.' : ''} ${franchise.last_name || ''}`.trim();
          
          return {
            id: franchise.application_id,
            application_id: franchise.application_id,
            type: franchise.permit_type === "RENEWAL" ? "Renewal" : "New",
            permit_type: franchise.permit_type || 'NEW',
            permit_subtype: franchise.permit_subtype || 'FRANCHISE',
            application_date: franchise.created_at,
            created_at: franchise.created_at,
            full_name: fullName || 'N/A',
            contact_number: franchise.contact_number || 'N/A',
            email: franchise.email || 'N/A',
            home_address: franchise.home_address || 'N/A',
            make_brand: franchise.make_brand || 'N/A',
            model: franchise.model || 'N/A',
            route_zone: franchise.route_zone || 'N/A',
            toda_name: franchise.toda_name || 'N/A',
            barangay_of_operation: franchise.barangay_of_operation || 'N/A',
            status: mapStatusToFrontend(franchise.status),
            plate_number: franchise.plate_number || 'N/A',
            year_acquired: franchise.year_acquired || 'N/A',
            color: franchise.color || 'N/A',
            vehicle_type: franchise.vehicle_type || 'Tricycle',
            lto_or_number: franchise.lto_or_number || 'N/A',
            lto_cr_number: franchise.lto_cr_number || 'N/A',
            engine_number: franchise.engine_number || 'N/A',
            chassis_number: franchise.chassis_number || 'N/A',
            district: franchise.district || 'N/A',
            remarks: franchise.remarks || '',
            operator_type: franchise.operator_type || 'N/A',
            citizenship: franchise.citizenship || 'N/A',
            birth_date: franchise.birth_date || 'N/A',
            id_type: franchise.id_type || 'N/A',
            id_number: franchise.id_number || 'N/A',
            lto_expiration_date: franchise.lto_expiration_date || 'N/A',
            mv_file_number: franchise.mv_file_number || 'N/A',
            franchise_fee_or: franchise.franchise_fee_or || 'N/A',
            sticker_id_fee_or: franchise.sticker_id_fee_or || 'N/A',
            inspection_fee_or: franchise.inspection_fee_or || 'N/A',
            date_submitted: franchise.date_submitted || franchise.created_at,
            attachments: franchise.attachments || {}
          };
        });
        
        setFranchises(transformedData);
        setError(null);
        
      } else {
        throw new Error(data.message || "Failed to fetch data from server");
      }
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(`Failed to load data: ${err.message}`);
      setFranchises([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFranchises();
  }, [currentPage, statusFilter, permitSubtypeFilter, permitTypeFilter]);

  // File zoom and drag handlers
  const updateZoomLevel = useCallback(() => {
    if (imageRef.current) {
      const currentTransform = imageRef.current.style.transform || 'scale(1)';
      const currentScale = parseFloat(currentTransform.match(/scale\(([^)]+)\)/)?.[1] || 1);
      setZoomLevel(Math.round(currentScale * 100));
    }
  }, []);

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

  const handleMouseDown = useCallback((e) => {
    if (!imageRef.current || !isImageFile(selectedFile?.file_type, selectedFile?.name)) return;
    
    const currentTransform = imageRef.current.style.transform || 'scale(1)';
    const currentScale = parseFloat(currentTransform.match(/scale\(([^)]+)\)/)?.[1] || 1);
    
    if (currentScale > 1) {
      e.preventDefault();
      isDraggingRef.current = true;
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      imageRef.current.style.cursor = 'grabbing';
      
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
        
        if (imageRef.current.style.left && imageRef.current.style.top) {
          imagePositionRef.current.x = parseFloat(imageRef.current.style.left);
          imagePositionRef.current.y = parseFloat(imageRef.current.style.top);
        }
        
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  }, [selectedFile]);

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

  // Save comment only
  const saveCommentOnly = async () => {
    if (!selectedFranchise || !actionComment.trim()) return;
    
    try {
      const response = await fetch(`${API_BASE}/update_status.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          application_id: selectedFranchise.application_id || selectedFranchise.id,
          remarks: actionComment,
          updated_by: 'Admin'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
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
        
        const newCommentBlock = `--- ${timestamp} (Admin) ---\n${actionComment}\n\n`;
        
        const updatedRemarks = result.data?.remarks || 
          (selectedFranchise.remarks ? 
            newCommentBlock + selectedFranchise.remarks : 
            newCommentBlock);

        setSelectedFranchise({
          ...selectedFranchise,
          remarks: updatedRemarks
        });

        Swal.fire({
          icon: 'success',
          title: 'Comment Saved!',
          text: 'Your comment has been saved successfully.',
          confirmButtonColor: '#4CAF50',
          timer: 2000,
          showConfirmButton: true
        });
        setActionComment('');
      } else {
        throw new Error(result.message || 'Failed to save comment');
      }
    } catch (err) {
      console.error('Error saving comment:', err);
      Swal.fire('Error', 'Failed to save comment: ' + err.message, 'error');
    }
  };

  // Filter logic
  const getFilteredFranchises = () => {
    let filtered = [...franchises];

    if (searchQuery) {
      const term = searchQuery.toLowerCase();
      filtered = filtered.filter(f => 
        f.full_name?.toLowerCase().includes(term) ||
        f.plate_number?.toLowerCase().includes(term) ||
        f.toda_name?.toLowerCase().includes(term) ||
        f.barangay_of_operation?.toLowerCase().includes(term) ||
        f.application_id?.toString().includes(term) ||
        f.email?.toLowerCase().includes(term)
      );
    }

    if (activeTab !== "all") {
      filtered = filtered.filter(f => 
        f.permit_subtype?.toLowerCase() === activeTab.toLowerCase()
      );
    }

    return filtered;
  };

  // Sort function
  const sortFranchises = (franchisesToSort, sortBy) => {
    const sortedFranchises = [...franchisesToSort];
    
    switch (sortBy) {
      case 'latest':
        return sortedFranchises.sort((a, b) => 
          new Date(b.created_at || 0) - new Date(a.created_at || 0)
        );
      
      case 'oldest':
        return sortedFranchises.sort((a, b) => 
          new Date(a.created_at || 0) - new Date(b.created_at || 0)
        );
      
      case 'name_asc':
        return sortedFranchises.sort((a, b) => {
          const nameA = a.full_name.toLowerCase();
          const nameB = b.full_name.toLowerCase();
          return nameA.localeCompare(nameB);
        });
      
      case 'name_desc':
        return sortedFranchises.sort((a, b) => {
          const nameA = a.full_name.toLowerCase();
          const nameB = b.full_name.toLowerCase();
          return nameB.localeCompare(nameA);
        });
      
      case 'status_priority':
        const statusOrder = { 'Pending': 1, 'Approved': 2, 'Rejected': 3 };
        return sortedFranchises.sort((a, b) => 
          (statusOrder[a.status] || 4) - (statusOrder[b.status] || 4)
        );
      
      default:
        return sortedFranchises;
    }
  };

  // Get filtered and sorted permits
  const getFilteredAndSortedFranchises = () => {
    let filtered = getFilteredFranchises();
    filtered = sortFranchises(filtered, sortOption);
    return filtered;
  };

  // Calculate dashboard stats
  const dashboardStats = useMemo(() => {
    const total = franchises.length;
    const approved = franchises.filter(f => f.status === "Approved").length;
    const rejected = franchises.filter(f => f.status === "Rejected").length;
    const pending = franchises.filter(f => f.status === "Pending").length;
    const mtop = franchises.filter(f => f.permit_subtype === "MTOP").length;
    const franchise = franchises.filter(f => f.permit_subtype === "FRANCHISE").length;
    
    const approvalRate = total > 0 ? ((approved / total) * 100).toFixed(1) : 0;
    
    const todaCounts = {};
    franchises.forEach(f => {
      const toda = f.toda_name || 'Unknown';
      if (toda !== 'N/A' && toda) {
        todaCounts[toda] = (todaCounts[toda] || 0) + 1;
      }
    });
    const topTODA = Object.entries(todaCounts)
      .sort(([,a], [,b]) => b - a)[0] || ['No TODA data', 0];

    return {
      total,
      approved,
      rejected,
      pending,
      mtop,
      franchise,
      approvalRate,
      topTODA: { name: topTODA[0], count: topTODA[1] }
    };
  }, [franchises]);

  // Status colors
  const getStatusColor = (status) => {
    switch (status) {
      case "Approved":
        return "text-[#4CAF50] bg-[#4CAF50]/10";
      case "Rejected":
        return "text-[#E53935] bg-[#E53935]/10";
      case "Pending":
        return "text-[#FDA811] bg-[#FDA811]/10";
      case "Under Review":
        return "text-[#3B82F6] bg-[#3B82F6]/10";
      case "Document Verification":
        return "text-[#8B5CF6] bg-[#8B5CF6]/10";
      case "Field Inspection Scheduled":
        return "text-[#0EA5E9] bg-[#0EA5E9]/10";
      case "Payment Verification":
        return "text-[#F59E0B] bg-[#F59E0B]/10";
      case "For Manager Approval":
        return "text-[#6366F1] bg-[#6366F1]/10";
      case "Printing Processing":
        return "text-[#14B8A6] bg-[#14B8A6]/10";
      case "Ready for Release":
        return "text-[#10B981] bg-[#10B981]/10";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  // Tab navigation styling
  const getTabBadgeColor = (tab) =>
    tab === activeTab ? "bg-[#4CAF50] text-white" : "bg-gray-100 text-gray-600";

  const getTabBorderColor = (tab) => {
    return tab === activeTab ? "border-[#4CAF50]" : "border-transparent";
  };

  const getTabTextColor = (tab) => {
    return tab === activeTab ? "text-[#4CAF50]" : "text-gray-500 hover:text-gray-700";
  };

  // View franchise details
  const openModal = async (franchise) => {
    try {
      const applicationId = franchise.application_id || franchise.id;
      const response = await fetch(`${API_BASE}/fetch_single.php?application_id=${applicationId}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const franchiseData = data.data;
          
          // Parse attachments from individual fields
          const attachments = parseAttachments(franchiseData);
          
          setSelectedFranchise({
            ...franchiseData,
            email_address: franchiseData.email,
            address: franchiseData.home_address || 'N/A',
            year_model: franchiseData.year_acquired,
            vehicle_color: franchiseData.color,
            or_number: franchiseData.lto_or_number,
            cr_number: franchiseData.lto_cr_number,
            driver_license: franchiseData.id_number || 'N/A',
            franchise_number: franchiseData.application_id,
            date_applied: franchiseData.formatted_date_submitted || formatDate(franchiseData.date_submitted),
            attachments: attachments, // Pass the parsed attachments
            status: mapStatusToFrontend(franchiseData.status)
          });
        } else {
          throw new Error(data.message || 'Failed to fetch details');
        }
      } else {
        throw new Error(`HTTP error: ${response.status}`);
      }
      setShowModal(true);
    } catch (err) {
      console.error('Error viewing franchise:', err);
      Swal.fire('Error', 'Failed to load application details: ' + err.message, 'error');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedFranchise(null);
    setActionComment('');
    setSelectedFile(null);
    setShowFilePreview(false);
  };

  // Handle status update
  const updatePermitStatus = async (status, comments = '') => {
    if (!selectedFranchise) return;
    
    try {
      const backendStatus = mapStatusToBackend(status);
      
      const response = await fetch(`${API_BASE}/update_status.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          application_id: selectedFranchise.application_id || selectedFranchise.id,
          status: backendStatus,
          remarks: comments,
          updated_by: 'Admin'
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Record action in history
        const permitId = selectedFranchise.application_id || selectedFranchise.id;
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

        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: `Permit ${status.toLowerCase()} successfully!`,
          confirmButtonColor: '#4CAF50',
          timer: 2000,
          showConfirmButton: true
        });
        
        await fetchFranchises();
        
        // Use actual DB response to update local state
        const updatedStatus = data.data?.status 
          ? mapStatusToFrontend(data.data.status) 
          : status;
        
        setSelectedFranchise(prev => ({
          ...prev,
          status: updatedStatus,
          remarks: data.data?.remarks || prev.remarks
        }));
      } else {
        Swal.fire('Error', data.message || 'Failed to update status', 'error');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      Swal.fire('Error', 'Failed to update status. Please try again.', 'error');
    }
  };

  // Format comments for display
  const formatComments = (commentsText) => {
    if (!commentsText || typeof commentsText !== 'string') return [];
    
    try {
      const cleanedText = commentsText.trim();
      if (!cleanedText) return [];
      
      const commentBlocks = cleanedText.split(/(?=---\s+.+?\s+---)/g);
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

  // Parse attachments from franchise data
  const parseAttachments = (franchiseData) => {
    if (!franchiseData) return [];
    
    try {
      const fileList = [];
      const applicationId = franchiseData.application_id;
      
      // List of all possible file fields from your PHP code
      const fileFields = [
        'proof_of_residency',
        'barangay_clearance',
        'lto_or_cr',
        'insurance_certificate',
        'drivers_license',
        'emission_test',
        'id_picture',
        'official_receipt',
        'nbi_clearance',
        'police_clearance',
        'medical_certificate',
        'toda_endorsement',
        'toda_president_cert',
        'franchise_fee_receipt',
        'sticker_id_fee_receipt',
        'inspection_fee_receipt',
        'applicant_signature'
      ];
      
      fileFields.forEach(field => {
        const fileName = franchiseData[field];
        if (fileName && fileName.trim() !== '') {
          // Files are stored in: uploads/{application_id}/{filename}
          const fileUrl = `${API_BASE}/uploads/${applicationId}/${fileName}`;
          
          fileList.push({
            id: field,
            name: fileName,
            type: getFileType(fileName),
            url: fileUrl,
            field_name: field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
          });
        }
      });
      
      return fileList;
    } catch (e) {
      console.error('Error parsing attachments:', e);
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
      case 'doc':
      case 'docx': return 'application/msword';
      case 'txt': return 'text/plain';
      case 'csv': return 'text/csv';
      case 'xls':
      case 'xlsx': return 'application/vnd.ms-excel';
      case 'zip': return 'application/zip';
      case 'rar': return 'application/x-rar-compressed';
      default: return 'application/octet-stream';
    }
  };

  // File handling functions
  const viewFile = (file) => {
    let fileUrl = file.url;
    
    // If URL doesn't start with http, prepend the base URL
    if (file.url && !file.url.startsWith('http')) {
      fileUrl = `${API_BASE}/${file.url}`;
    }
    
    const fileWithType = {
      ...file,
      file_type: file.type || getFileType(file.name),
      url: fileUrl
    };
    
    console.log('Viewing file:', fileWithType); // Debug log
    
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

  // Export to CSV
  const exportToCSV = () => {
    setExporting(true);
    setExportType("csv");
    
    const headers = [
      "Application ID",
      "Applicant Name",
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
      ...franchises.map(f => [
        f.id,
        f.full_name,
        f.permit_type,
        f.permit_subtype,
        f.toda_name,
        f.barangay_of_operation,
        `${f.make_brand} ${f.model}`,
        f.plate_number,
        f.status,
        f.contact_number,
        f.email,
        formatDate(f.created_at)
      ].map(field => `"${field || ''}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `franchise-permits-${new Date().toISOString().split('T')[0]}.csv`;
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
      // Create a container for the PDF content
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
          Franchise Permit Report
        </h1>
        <p style="color: #6b7280; margin: 5px 0;">
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
            Pending: ${dashboardStats.pending}
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
            <strong>Top TODA:</strong> ${dashboardStats.topTODA.name} (${dashboardStats.topTODA.count} applications)
          </div>
          <div>
            <strong>MTOP Applications:</strong> ${dashboardStats.mtop}
          </div>
          <div>
            <strong>Franchise Applications:</strong> ${dashboardStats.franchise}
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
              <th style="padding: 8px; text-align: left; color: #374151; font-weight: 600; border: 1px solid #e5e7eb;">Vehicle</th>
              <th style="padding: 8px; text-align: left; color: #374151; font-weight: 600; border: 1px solid #e5e7eb;">TODA</th>
              <th style="padding: 8px; text-align: left; color: #374151; font-weight: 600; border: 1px solid #e5e7eb;">Status</th>
              <th style="padding: 8px; text-align: left; color: #374151; font-weight: 600; border: 1px solid #e5e7eb;">Date</th>
            </tr>
          </thead>
          <tbody>
            ${getFilteredAndSortedFranchises().slice(0, 20).map(franchise => {
              const statusColor = franchise.status === "Approved" ? "#4CAF50" : 
                                franchise.status === "Pending" ? "#FDA811" : "#E53935";
              return `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 8px; border: 1px solid #e5e7eb;">FP-${String(franchise.application_id).padStart(4, '0')}</td>
                  <td style="padding: 8px; border: 1px solid #e5e7eb;">${franchise.full_name}</td>
                  <td style="padding: 8px; border: 1px solid #e5e7eb;">${franchise.plate_number}</td>
                  <td style="padding: 8px; border: 1px solid #e5e7eb;">${franchise.toda_name}</td>
                  <td style="padding: 8px; border: 1px solid #e5e7eb; color: ${statusColor}; font-weight: 500;">
                    ${franchise.status}
                  </td>
                  <td style="padding: 8px; border: 1px solid #e5e7eb;">${formatDate(franchise.created_at)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        ${getFilteredAndSortedFranchises().length > 20 ? 
          `<p style="text-align: center; color: #6b7280; font-size: 10px; margin-top: 10px;">
            ... and ${getFilteredAndSortedFranchises().length - 20} more applications
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
            <div style="font-size: 20px; font-weight: bold; color: #FDA811;">${dashboardStats.pending}</div>
            <div style="color: #6b7280;">Pending</div>
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
        <p style="margin: 0;">Generated by Franchise Permit Management System</p>
        <p style="margin: 5px 0 0 0;">Total Records: ${franchises.length} • Filtered: ${getFilteredAndSortedFranchises().length}</p>
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

      pdf.save(`franchise-report-${new Date().toISOString().split("T")[0]}.pdf`);

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

  // Action handlers with SweetAlert
  const handleApprove = async () => {
    if (!selectedFranchise) return;

    const result = await Swal.fire({
      title: 'Approve Permit?',
      html: `
        <div class="text-left">
          <p class="mb-2">You are about to approve this permit application:</p>
          <div class="bg-gray-50 p-3 rounded-lg mb-3">
            <p class="text-sm"><strong>Application ID:</strong> ${selectedFranchise.application_id}</p>
            <p class="text-sm"><strong>Applicant:</strong> ${selectedFranchise.full_name}</p>
            <p class="text-sm"><strong>Type:</strong> ${selectedFranchise.permit_type} - ${selectedFranchise.permit_subtype}</p>
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
      await updatePermitStatus('Approved', notes);
      setActionComment('');
    }
  };

  const handleReject = async () => {
    if (!selectedFranchise) return;

    const result = await Swal.fire({
      title: 'Reject Application?',
      html: `
        <div class="text-left">
          <p class="mb-2">You are about to reject this permit application:</p>
          <div class="bg-gray-50 p-3 rounded-lg mb-3">
            <p class="text-sm"><strong>Application ID:</strong> ${selectedFranchise.application_id}</p>
            <p class="text-sm"><strong>Applicant:</strong> ${selectedFranchise.full_name}</p>
            <p class="text-sm"><strong>Type:</strong> ${selectedFranchise.permit_type} - ${selectedFranchise.permit_subtype}</p>
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
      await updatePermitStatus('Rejected', result.value);
      setActionComment('');
    }
  };

  // New status update handlers for tracking processing steps
  const handleStatusUpdate = async (status, title, message, color = '#4CAF50') => {
    if (!selectedFranchise) return;

    const result = await Swal.fire({
      title: title,
      html: `
        <div class="text-left">
          <p class="mb-2">${message}</p>
          <div class="bg-gray-50 p-3 rounded-lg mb-3">
            <p class="text-sm"><strong>Application ID:</strong> ${selectedFranchise.application_id}</p>
            <p class="text-sm"><strong>Applicant:</strong> ${selectedFranchise.full_name}</p>
            <p class="text-sm"><strong>Type:</strong> ${selectedFranchise.permit_type} - ${selectedFranchise.permit_subtype}</p>
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
      await updatePermitStatus(status, result.value || '');
    }
  };

  const handleForCompliance = async () => {
    if (!selectedFranchise) return;

    const result = await Swal.fire({
      title: 'Mark as Pending?',
      html: `
        <div class="text-left">
          <p class="mb-2">Mark this application as pending:</p>
          <div class="bg-gray-50 p-3 rounded-lg mb-3">
            <p class="text-sm"><strong>Application ID:</strong> ${selectedFranchise.application_id}</p>
            <p class="text-sm"><strong>Applicant:</strong> ${selectedFranchise.full_name}</p>
            <p class="text-sm"><strong>Type:</strong> ${selectedFranchise.permit_type} - ${selectedFranchise.permit_subtype}</p>
          </div>
          <p class="text-sm text-gray-600">Please add any notes if needed.</p>
        </div>
      `,
      icon: 'info',
      input: 'textarea',
      inputLabel: 'Notes (optional)',
      inputPlaceholder: 'Add notes...',
      inputValue: actionComment,
      showCancelButton: true,
      confirmButtonText: 'Mark as Pending',
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
      await updatePermitStatus('Pending', notes);
      setActionComment('');
    }
  };

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
          Franchise Permit Analytics
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage and track all franchise permit applications
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-center">
          <div className="text-red-600 font-semibold">{error}</div>
          <button
            onClick={fetchFranchises}
            className="mt-2 px-4 py-2 bg-[#4CAF50] text-white rounded-lg hover:bg-[#4CAF50]/80 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#4CAF50]/10 p-4 rounded-lg border border-[#4CAF50]/20">
          <p className="text-[#4CAF50] text-sm font-medium">Total Applications</p>
          <p className="text-[#4CAF50] text-2xl font-bold">{dashboardStats.total}</p>
          <p className="text-[#4CAF50] text-xs mt-1">
            MTOP: {dashboardStats.mtop} • Franchise: {dashboardStats.franchise}
          </p>
        </div>
        <div className="bg-[#4A90E2]/10 p-4 rounded-lg border border-[#4A90E2]/20">
          <p className="text-[#4A90E2] text-sm font-medium">Approved</p>
          <p className="text-[#4A90E2] text-2xl font-bold">{dashboardStats.approved}</p>
          <p className="text-[#4A90E2] text-xs mt-1">
            {dashboardStats.approvalRate}% approval rate
          </p>
        </div>
        <div className="bg-[#FDA811]/10 p-4 rounded-lg border border-[#FDA811]/20">
          <p className="text-[#FDA811] text-sm font-medium">Pending</p>
          <p className="text-[#FDA811] text-2xl font-bold">{dashboardStats.pending}</p>
          <p className="text-[#FDA811] text-xs mt-1">
            Requires review
          </p>
        </div>
        <div className="bg-[#E53935]/10 p-4 rounded-lg border border-[#E53935]/20">
          <p className="text-[#E53935] text-sm font-medium">Rejected</p>
          <p className="text-[#E53935] text-2xl font-bold">{dashboardStats.rejected}</p>
          <p className="text-[#E53935] text-xs mt-1">
            Not approved
          </p>
        </div>
      </div>

      {/* Main Content with Tabs */}
      <div className="mb-6 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm">
        <div className="border-b border-gray-200 dark:border-slate-700 overflow-x-auto">
          <nav className="flex space-x-6 px-6 min-w-max">
            {[
              { key: "all", label: "All Applications" },
              { key: "mtop", label: "MTOP" },
              { key: "franchise", label: "Franchise" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setPermitSubtypeFilter(tab.key === "all" ? "all" : tab.key);
                  setCurrentPage(1);
                }}
                className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center gap-2 transition-all ${getTabBorderColor(tab.key)} ${getTabTextColor(tab.key)}`}
              >
                {tab.label}
                <span className={`px-2 py-1 text-xs rounded-full ${getTabBadgeColor(tab.key)}`}>
                  {tab.key === "all" && franchises.length}
                  {tab.key === "mtop" && franchises.filter(f => f.permit_subtype === "MTOP").length}
                  {tab.key === "franchise" && franchises.filter(f => f.permit_subtype === "FRANCHISE").length}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Permit Type Filter (NEW/RENEWAL) */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Permit Type:</label>
            <div className="flex gap-2">
              {[
                { value: "all", label: "All", count: franchises.length },
                { value: "new", label: "New Applications", count: franchises.filter(f => f.permit_type === "NEW").length },
                { value: "renewal", label: "Renewals", count: franchises.filter(f => f.permit_type === "RENEWAL").length },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setPermitTypeFilter(option.value);
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    permitTypeFilter === option.value
                      ? "bg-[#4CAF50] text-white shadow-md"
                      : "bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700"
                  }`}
                >
                  {option.label}
                  <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                    permitTypeFilter === option.value
                      ? "bg-white/20 text-white"
                      : "bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-400"
                  }`}>
                    {option.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content Header */}
        <div className="p-6 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-[#4CAF50]/5 to-[#4A90E2]/5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {activeTab === "all" && "All Franchise Applications"}
                {activeTab === "mtop" && "MTOP Applications"}
                {activeTab === "franchise" && "Franchise Applications"}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                Showing {getFilteredAndSortedFranchises().length} of {franchises.length} records
              </p>
            </div>
            
            <div className="flex gap-3">
              {/* Search Input */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search applications..."
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent w-64"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
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
                onClick={fetchFranchises}
                className="px-4 py-2 bg-[#4CAF50] text-white rounded-lg hover:bg-[#4CAF50]/80 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>

              {/* Export Dropdown */}
              <div className="relative group">
                <button
                  disabled={exporting || franchises.length === 0}
                  className="px-4 py-2 bg-[#4A90E2] text-white rounded-lg hover:bg-[#4A90E2]/80 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{exporting ? "Exporting..." : "Export"}</span>
                </button>
                
                {/* Export Options Dropdown */}
                <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <button
                    onClick={exportToCSV}
                    disabled={exporting || franchises.length === 0}
                    className="w-full px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2 border-b border-gray-100 dark:border-slate-700"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Export as CSV</span>
                  </button>
                  <button
                    onClick={exportToPDF}
                    disabled={exporting || franchises.length === 0}
                    className="w-full px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    <File className="w-4 h-4" />
                    <span>Export as PDF</span>
                  </button>
                </div>
              </div>
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
                <X className="w-4 h-4" />
                Clear search
              </button>
            </div>
          )}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {franchises.length === 0 ? (
            <div className="text-center py-12">
              <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No franchise applications found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {error ? error : "There are currently no franchise applications in the system."}
              </p>
              <button 
                onClick={fetchFranchises}
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
                      Application No.
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Applicant
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Vehicle Details
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      TODA
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
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {getFilteredAndSortedFranchises().map(f => (
                    <tr key={f.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-mono text-gray-600 dark:text-gray-300">
                        FP-{String(f.application_id).padStart(4, '0')}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex flex-col gap-1">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full inline-block w-fit ${
                            f.permit_type === "NEW" 
                              ? "bg-blue-100 text-blue-700 border border-blue-200" 
                              : "bg-purple-100 text-purple-700 border border-purple-200"
                          }`}>
                            {f.permit_type === "NEW" ? "New" : "Renewal"}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full inline-block w-fit ${
                            f.permit_subtype === "MTOP" 
                              ? "bg-green-100 text-green-700 border border-green-200" 
                              : "bg-orange-100 text-orange-700 border border-orange-200"
                          }`}>
                            {f.permit_subtype}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">
                        {f.full_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        <div>{f.vehicle_type} • {f.plate_number}</div>
                        <div className="text-xs text-gray-500">{f.make_brand} {f.model}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {f.toda_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {formatDate(f.created_at)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1.5 text-xs font-medium rounded-full border ${getStatusColor(
                            f.status
                          )} border-current border-opacity-30`}
                        >
                          {f.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => openModal(f)}
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

      {/* Enhanced Transport-Themed Modal */}
      {showModal && selectedFranchise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 overflow-auto animate-fadeIn">
          <div className="w-full max-w-7xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl transform transition-all">
            {/* Redesigned Transport Permit Header */}
            <div className="relative p-6 bg-gradient-to-r from-gray-50 via-white to-gray-50 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 border-b-4 border-orange-400">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-orange-400 to-orange-500 p-3 rounded-2xl shadow-xl">
                    <Car className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Transport Permit</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Franchise Application Details</p>
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
                {/* Application ID Card */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md border-l-4 border-blue-500">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Application ID</p>
                  <p className="text-lg font-bold text-gray-800 dark:text-white font-mono">
                    FP-{String(selectedFranchise.application_id).padStart(4, '0')}
                  </p>
                </div>

                {/* Date Card */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md border-l-4 border-purple-500">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Date Applied</p>
                  <p className="text-lg font-bold text-gray-800 dark:text-white">
                    {formatDate(selectedFranchise.created_at)}
                  </p>
                </div>

                {/* Status Card */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md border-l-4 border-green-500">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Status</p>
                  <span className={`inline-block px-3 py-1 text-sm font-bold rounded-full ${getStatusColor(selectedFranchise.status)}`}>
                    {selectedFranchise.status}
                  </span>
                </div>

                {/* Permit Type Card */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md border-l-4 border-orange-500">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Permit Info</p>
                  <div className="flex gap-2 flex-wrap">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                      selectedFranchise.permit_type === "NEW" 
                        ? "bg-blue-100 text-blue-700" 
                        : "bg-purple-100 text-purple-700"
                    }`}>
                      {selectedFranchise.permit_type === "NEW" ? "New" : "Renewal"}
                    </span>
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                      selectedFranchise.permit_subtype === "MTOP" 
                        ? "bg-green-100 text-green-700" 
                        : "bg-orange-100 text-orange-700"
                    }`}>
                      {selectedFranchise.permit_subtype}
                    </span>
                  </div>
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
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Personal Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-slate-700 dark:to-slate-600 p-4 rounded-xl">
                    <label className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Full Name</label>
                    <p className="text-lg font-bold text-gray-900 dark:text-white mt-2">
                      {selectedFranchise.full_name}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Contact Number</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedFranchise.contact_number}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email Address</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedFranchise.email}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Home Address</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedFranchise.home_address}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Citizenship</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedFranchise.citizenship}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Birth Date</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {formatDate(selectedFranchise.birth_date)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Vehicle Information */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border-2 border-green-100 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl shadow-lg">
                    <Car className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Vehicle Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Vehicle Type</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedFranchise.vehicle_type}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Make/Brand</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedFranchise.make_brand}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Model</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedFranchise.model}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Plate Number</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedFranchise.plate_number}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Year Acquired</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedFranchise.year_acquired}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Color</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedFranchise.color}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Engine Number</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedFranchise.engine_number}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Chassis Number</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedFranchise.chassis_number}
                    </p>
                  </div>
                </div>
              </div>

              {/* Franchise Details */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border-2 border-orange-100 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-3 rounded-xl shadow-lg">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Franchise & Route Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Permit Type</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedFranchise.permit_type}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Permit Subtype</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedFranchise.permit_subtype}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">TODA Name</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedFranchise.toda_name}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Barangay of Operation</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedFranchise.barangay_of_operation}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Route/Zone</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedFranchise.route_zone}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">District</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedFranchise.district}
                    </p>
                  </div>
                </div>
              </div>

              {/* LTO Documents */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border-2 border-purple-100 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl shadow-lg">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">LTO Registration Documents</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-500">LTO OR Number</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedFranchise.lto_or_number}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">LTO CR Number</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedFranchise.lto_cr_number}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">LTO Expiration Date</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {formatDate(selectedFranchise.lto_expiration_date)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">MV File Number</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedFranchise.mv_file_number}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-slate-800 dark:to-slate-700 rounded-2xl shadow-lg p-6 border-2 border-green-200 dark:border-slate-600">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-xl shadow-lg">
                    <Receipt className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Payment Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md border-l-4 border-green-500 relative">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Franchise Fee</label>
                    <p className="text-3xl font-black text-green-600 mt-2">
                      ₱250.00
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">PAID</span>
                      {selectedFranchise.franchise_fee_or && (
                        <span className="text-xs text-gray-500">OR: {selectedFranchise.franchise_fee_or}</span>
                      )}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md border-l-4 border-blue-500 relative">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Sticker ID Fee</label>
                    <p className="text-3xl font-black text-blue-600 mt-2">
                      ₱150.00
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">PAID</span>
                      {selectedFranchise.sticker_id_fee_or && (
                        <span className="text-xs text-gray-500">OR: {selectedFranchise.sticker_id_fee_or}</span>
                      )}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md border-l-4 border-orange-500 relative">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Inspection Fee</label>
                    <p className="text-3xl font-black text-orange-600 mt-2">
                      ₱100.00
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">PAID</span>
                      {selectedFranchise.inspection_fee_or && (
                        <span className="text-xs text-gray-500">OR: {selectedFranchise.inspection_fee_or}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-white dark:bg-slate-800 rounded-xl border-2 border-dashed border-green-300">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-700 dark:text-gray-300">Total Amount Paid:</span>
                    <span className="text-4xl font-black text-green-600">
                      ₱500.00
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 text-center">
                    Franchise Fee + Sticker Fee + Inspection Fee
                  </div>
                </div>
              </div>

              {/* Submitted Attachments - UPDATED TO SHOW ALL FILES */}
              {selectedFranchise.attachments && selectedFranchise.attachments.length > 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border-2 border-indigo-100 dark:border-slate-700">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-3 rounded-xl shadow-lg">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white">Submitted Documents</h4>
                    <span className="ml-auto bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-bold">
                      {selectedFranchise.attachments.length} files
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedFranchise.attachments.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-slate-600 rounded-lg">
                        <div className="flex items-center gap-2">
                          {file.type.includes('image') ? (
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
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {file.field_name}
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => viewFile(file)}
                          className="px-3 py-1 text-xs bg-[#4CAF50] text-white rounded hover:bg-[#FDA811] transition-colors whitespace-nowrap"
                        >
                          View
                        </button>
                      </div>
                    ))}
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
                    {selectedFranchise.remarks && (
                      <span className="text-sm font-normal text-gray-500">
                        ({formatComments(selectedFranchise.remarks).length} comment{formatComments(selectedFranchise.remarks).length !== 1 ? 's' : ''})
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Display all comments in one box */}
                <div className="space-y-4 mb-6">
                  {selectedFranchise.remarks && selectedFranchise.remarks.trim() ? (
                    <div className="bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600 overflow-hidden">
                      <div className="max-h-64 overflow-y-auto p-4">
                        {formatComments(selectedFranchise.remarks).map((comment, index) => (
                          <div key={index} className={`mb-4 ${index !== 0 ? 'pt-4 border-t border-gray-200 dark:border-slate-600' : ''}`}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                <User className="w-4 h-4 mr-2" />
                                Admin Comment
                              </div>
                              <div className="flex items-center text-xs text-gray-400">
                                <Clock className="w-3 h-3 mr-1" />
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
                          Total: {formatComments(selectedFranchise.remarks).length} comment{formatComments(selectedFranchise.remarks).length !== 1 ? 's' : ''}
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
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Save Comment
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Action History Section */}
              {(() => {
                const permitId = selectedFranchise.application_id || selectedFranchise.id;
                const history = actionHistory[permitId] || [];
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
                              entry.action === 'Pending' ? 'bg-yellow-500' :
                              'bg-blue-500'
                            }`}></div>
                            <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-3 border border-gray-200 dark:border-slate-600">
                              <div className="flex items-center justify-between mb-1">
                                <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${
                                  entry.action === 'Approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                  entry.action === 'Rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                  entry.action === 'Pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
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
                {selectedFranchise.status !== "Rejected" && (
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
                            handleStatusUpdate('Field Inspection Scheduled', 'Schedule Field Inspection', 'Field inspection has been scheduled for this vehicle.', '#0EA5E9');
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-cyan-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-3 border-b border-gray-100 dark:border-slate-600"
                        >
                          <Car className="w-5 h-5 text-cyan-600" />
                          <span className="font-medium text-gray-700 dark:text-gray-200">Field Inspection Scheduled</span>
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
                            handleStatusUpdate('Printing Processing', 'Mark as Printing', 'Permit is being printed and processed.', '#14B8A6');
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-teal-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-3 border-b border-gray-100 dark:border-slate-600"
                        >
                          <FileText className="w-5 h-5 text-teal-600" />
                          <span className="font-medium text-gray-700 dark:text-gray-200">Printing/Processing</span>
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

                        {/* Pending & Actions */}
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
                          <span className="font-medium text-gray-700 dark:text-gray-200">Mark as Pending</span>
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

      {/* File Preview Modal */}
      {showFilePreview && selectedFile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-0">
          <div className="relative w-full h-full flex flex-col">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-20 p-4 flex justify-between items-center bg-gradient-to-b from-black/70 to-transparent">
              <div className="flex items-center gap-3 text-white">
                <div className="flex items-center gap-2">
                  {isImageFile(selectedFile.file_type, selectedFile.name) ? (
                    <ImageIcon className="w-5 h-5" />
                  ) : (
                    <FileText className="w-5 h-5" />
                  )}
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
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </a>
                <button 
                  onClick={closeFilePreview}
                  className="ml-2 p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                  title="Close preview"
                >
                  <X className="w-6 h-6" />
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
                      <FileText className="w-24 h-24 mx-auto" />
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
                      <Download className="w-5 h-5 mr-2" />
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

    </div>
  );
}