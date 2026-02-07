import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  Bar,
  Pie,
  Line,
  Doughnut
} from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";
import {
  Search,
  Download,
  Calendar,
  TrendingUp,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreVertical,
  RefreshCw,
  Eye,
  Printer,
  DownloadCloud,
  TrendingDown,
  User,
  Building,
  Briefcase,
  Home,
  Scale,
  Wrench,
  Plane,
  Landmark,
  Shield,
  Image as ImageIcon,
  X,
  MessageSquare,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  Tag
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import Swal from "sweetalert2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const API_BASE = "/backend/barangay_permit";

// Comprehensive permit purposes based on your requirements
const PERMIT_PURPOSES = [
  // Personal Purposes
  { value: "For personal identification", label: "Personal Identification", icon: User, color: "#4CAF50" },
  { value: "For residency verification", label: "Residency Verification", icon: Home, color: "#4A90E2" },
  { value: "For school requirement", label: "School Requirement", icon: FileText, color: "#FDA811" },
  { value: "For scholarship application", label: "Scholarship Application", color: "#9C27B0", icon: FileText },
  { value: "For government assistance", label: "Government Assistance", color: "#2196F3", icon: Landmark },
  { value: "For medical assistance application", label: "Medical Assistance", color: "#F44336", icon: User },
  { value: "For financial assistance or aid", label: "Financial Assistance", color: "#FF9800", icon: FileText },
  { value: "For barangay ID application", label: "Barangay ID", color: "#795548", icon: User },
  { value: "For court requirement / affidavit / legal matter", label: "Court Requirement", color: "#607D8B", icon: Scale },
  { value: "For police clearance / NBI clearance requirement", label: "Police/NBI Clearance", color: "#3F51B5", icon: Shield },

  // Employment-Related
  { value: "For local employment", label: "Local Employment", color: "#4CAF50", icon: Briefcase },
  { value: "For job application (private company)", label: "Private Job Application", color: "#4A90E2", icon: Briefcase },
  { value: "For government employment", label: "Government Employment", color: "#FDA811", icon: Landmark },
  { value: "For on-the-job training (OJT)", label: "OJT", color: "#9C27B0", icon: Briefcase },
  { value: "For job order / contractual employment", label: "Job Order", color: "#2196F3", icon: Briefcase },
  { value: "For agency employment requirement", label: "Agency Employment", color: "#F44336", icon: Briefcase },
  { value: "For renewal of work contract", label: "Contract Renewal", color: "#FF9800", icon: Briefcase },
  { value: "For employment abroad (POEA / OFW)", label: "Overseas Employment", color: "#795548", icon: Plane },

  // Business-Related
  { value: "For new business permit application", label: "New Business Permit", color: "#4CAF50", icon: Building },
  { value: "For renewal of business permit", label: "Business Renewal", color: "#4A90E2", icon: Building },
  { value: "For DTI / SEC business registration", label: "DTI/SEC Registration", color: "#FDA811", icon: Landmark },
  { value: "For business tax application", label: "Business Tax", color: "#9C27B0", icon: FileText },
  { value: "For stall rental or space lease", label: "Stall Rental", color: "#2196F3", icon: Building },
  { value: "For business name registration", label: "Business Name", color: "#F44336", icon: FileText },
  { value: "For operation of new establishment", label: "New Establishment", color: "#FF9800", icon: Building },
  { value: "For business closure / cancellation", label: "Business Closure", color: "#795548", icon: Building },
  { value: "For relocation / change of business address", label: "Business Relocation", color: "#607D8B", icon: Building },

  // Residency/Property
  { value: "For proof of residency", label: "Proof of Residency", color: "#4CAF50", icon: Home },
  { value: "For transfer of residence", label: "Transfer Residence", color: "#4A90E2", icon: Home },
  { value: "For lot / land ownership verification", label: "Land Ownership", color: "#FDA811", icon: Home },
  { value: "For construction permit requirement", label: "Construction Permit", color: "#9C27B0", icon: Building },
  { value: "For fencing / excavation / building permit application", label: "Fencing/Building Permit", color: "#2196F3", icon: Wrench },
  { value: "For utility connection", label: "Utility Connection", color: "#F44336", icon: Home },
  { value: "For barangay boundary certification", label: "Boundary Certification", color: "#FF9800", icon: Shield },

  // Other Official/Legal
  { value: "For marriage license application", label: "Marriage License", color: "#4CAF50", icon: FileText },
  { value: "For travel / local mobility clearance", label: "Travel Clearance", color: "#4A90E2", icon: Plane },
  { value: "For firearm license application", label: "Firearm License", color: "#FDA811", icon: Shield },
  { value: "For barangay mediation / complaint settlement record", label: "Mediation Record", color: "#9C27B0", icon: Scale },
  { value: "For notarization requirement", label: "Notarization", color: "#2196F3", icon: FileText },
  { value: "For business closure or transfer", label: "Business Transfer", color: "#F44336", icon: Building },
  { value: "For franchise or transport operation permit", label: "Franchise Permit", color: "#FF9800", icon: Briefcase },
  { value: "For cooperative registration", label: "Cooperative Registration", color: "#795548", icon: Landmark },
  { value: "For loan application", label: "Loan Application", color: "#607D8B", icon: FileText },
  { value: "For SSS / Pag-IBIG / PhilHealth registration", label: "Gov't Benefits", color: "#3F51B5", icon: Landmark }
];

// Simplified purpose categories for filtering
const PURPOSE_CATEGORIES = [
  { value: "personal", label: "Personal Purposes", icon: User },
  { value: "employment", label: "Employment-Related", icon: Briefcase },
  { value: "business", label: "Business-Related", icon: Building },
  { value: "residency", label: "Residency/Property", icon: Home },
  { value: "official", label: "Official/Legal", icon: Scale }
];

// Helper functions for file preview
const isImageFile = (fileType, fileName) => {
  if (fileType && fileType.startsWith('image/')) {
    return true;
  }
  if (fileName) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
    return imageExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
  }
  return false;
};

const isPdfFile = (fileType, fileName) => {
  if (fileType && fileType === 'application/pdf') return true;
  if (fileName && fileName.toLowerCase().endsWith('.pdf')) return true;
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
  
  // Fallback based on file extension
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

export default function BarangayPermitAnalytics() {
  const [permits, setPermits] = useState([]);
  const [filteredPermits, setFilteredPermits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [purposeFilter, setPurposeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [exporting, setExporting] = useState(false);
  const [exportType, setExportType] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedPermit, setSelectedPermit] = useState(null);
  const [actionComment, setActionComment] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showSubmittedDocs, setShowSubmittedDocs] = useState(false);
  const imageRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const imagePositionRef = useRef({ x: 0, y: 0 });

  const itemsPerPage = 15;

  // Fetch permits from API
  const fetchPermits = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE}/admin_fetch.php`);
      
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

  // Fetch single permit details
  const fetchSinglePermit = async (permitId) => {
    try {
      const response = await fetch(`${API_BASE}/fetch_single.php?permit_id=${permitId}`);
      
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

  // Update permit status
  const updatePermitStatus = async (permitId, status, comments = '') => {
    try {
      setActionLoading(true);
      const response = await fetch(`${API_BASE}/update_status.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          permit_id: permitId,
          status: status.toLowerCase(),
          comments: comments
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update permit status');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to update permit status');
      }

      // Refresh data
      await fetchPermits();
      setActionComment('');
      
      // Close modal if open
      if (selectedPermit) {
        setShowModal(false);
        setSelectedPermit(null);
      }

    } catch (err) {
      console.error('Error updating permit status:', err);
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Parse attachments from permit data
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
          const filename = value.split('/').pop();
          fileList.push({
            id: key,
            name: filename,
            type: getFileType(filename),
            url: `${API_BASE}/uploads/${filename}`
          });
        } else if (value && typeof value === 'object') {
          const fileName = value.name || value.filename || key;
          if (fileName && fileName.trim() !== '') {
            fileList.push({
              id: key,
              name: fileName,
              type: getFileType(fileName),
              url: `${API_BASE}/uploads/${fileName}`
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

  const getUIStatus = (dbStatus) => {
    if (!dbStatus) return 'For Compliance';
    switch (dbStatus.toLowerCase()) {
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      case 'pending': return 'For Compliance';
      default: return 'For Compliance';
    }
  };

  // Update zoom level display
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

  // View file function
  const viewFile = (file) => {
    console.log('Viewing file:', file);
    
    // Ensure the URL is properly constructed as absolute
    let fileUrl = file.url;
    if (fileUrl && !fileUrl.startsWith('http')) {
      fileUrl = `http://localhost/plms-main${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
    }
    
    const fileWithType = {
      ...file,
      url: fileUrl,
      file_type: file.type || getFileType(file.name)
    };
    
    setSelectedFile(fileWithType);
    setShowFilePreview(true);
  };

  // Close file preview
  const closeFilePreview = () => {
    setSelectedFile(null);
    setShowFilePreview(false);
    setZoomLevel(100);
    isDraggingRef.current = false;
    dragStartRef.current = { x: 0, y: 0 };
    imagePositionRef.current = { x: 0, y: 0 };
  };

  // Enhanced stats with trends
  const stats = useMemo(() => {
    const total = permits.length;
    const approved = permits.filter(p => p.status?.toLowerCase() === "approved").length;
    const rejected = permits.filter(p => p.status?.toLowerCase() === "rejected").length;
    const pending = permits.filter(p => p.status?.toLowerCase() === "pending" || !p.status).length;

    // Calculate purpose statistics from actual data
    const purposeStats = PERMIT_PURPOSES.map(purpose => {
      const count = permits.filter(p => p.purpose?.toLowerCase() === purpose.value.toLowerCase()).length;
      const approvedCount = permits.filter(p => 
        p.purpose?.toLowerCase() === purpose.value.toLowerCase() && 
        p.status?.toLowerCase() === "approved"
      ).length;
      const approvalRate = count > 0 ? ((approvedCount / count) * 100).toFixed(1) : 0;
      
      return {
        ...purpose,
        count,
        approvedCount,
        approvalRate
      };
    }).filter(p => p.count > 0)
      .sort((a, b) => b.count - a.count);

    const topPurpose = purposeStats[0] || { label: "N/A", count: 0 };
    
    // Calculate approval rate
    const approvalRate = total > 0 ? ((approved / total) * 100).toFixed(1) : 0;
    
    // Calculate trend (mock for now)
    const lastWeekCount = Math.floor(total * 0.8);
    const trend = total > 0 ? ((total - lastWeekCount) / lastWeekCount * 100).toFixed(1) : 0;
    
    return {
      total,
      approved,
      rejected,
      pending,
      purposeStats,
      topPurpose,
      approvalRate,
      trend,
      completionRate: total > 0 ? (((approved + rejected) / total) * 100).toFixed(1) : 0
    };
  }, [permits]);

  // Process permit purposes for charts
  const topPurposes = useMemo(() => {
    return stats.purposeStats.slice(0, 6);
  }, [stats.purposeStats]);

  const purposeData = useMemo(() => {
    return {
      labels: topPurposes.map(p => p.label),
      counts: topPurposes.map(p => p.count),
      colors: topPurposes.map(p => p.color)
    };
  }, [topPurposes]);

  // Monthly trends by purpose - Calculate from actual data
  const monthlyData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    // Get data for last 6 months
    const last6Months = months.slice(Math.max(0, currentMonth - 5), currentMonth + 1);
    
    // Get top 3 purposes
    const top3Purposes = topPurposes.slice(0, 3);
    
    // Initialize monthly counts
    const monthlyCounts = {};
    top3Purposes.forEach(purpose => {
      monthlyCounts[purpose.value] = Array(last6Months.length).fill(0);
    });
    
    // Count permits per month
    permits.forEach(permit => {
      if (!permit.application_date) return;
      
      const permitDate = new Date(permit.application_date);
      const monthIndex = permitDate.getMonth();
      const year = permitDate.getFullYear();
      
      if (year === currentYear && monthIndex <= currentMonth && monthIndex >= currentMonth - 5) {
        const monthInRange = monthIndex - (currentMonth - 5);
        if (monthInRange >= 0) {
          const purpose = permit.purpose || "";
          // Find if this purpose is in our top 3
          const foundPurpose = top3Purposes.find(p => p.value === purpose);
          if (foundPurpose && monthlyCounts[foundPurpose.value]) {
            monthlyCounts[foundPurpose.value][monthInRange]++;
          }
        }
      }
    });
    
    const colors = ["#4CAF50", "#FDA811", "#4A90E2"];
    return {
      labels: last6Months,
      datasets: top3Purposes.map((purpose, idx) => ({
        label: purpose.label,
        data: monthlyCounts[purpose.value] || Array(last6Months.length).fill(0),
        borderColor: colors[idx],
        backgroundColor: colors[idx] + "20",
        fill: true,
        tension: 0.4
      }))
    };
  }, [permits, topPurposes]);

  // Get status text color only - no background
  const getStatusText = (status) => {
    const statusLower = (status || "").toLowerCase();
    switch (statusLower) {
      case "approved":
        return {
          text: "Approved",
          color: "text-[#4CAF50]",
          icon: CheckCircle
        };
      case "rejected":
        return {
          text: "Rejected",
          color: "text-[#E53935]",
          icon: XCircle
        };
      case "pending":
        return {
          text: "For Compliance",
          color: "text-[#FDA811]",
          icon: Clock
        };
      case "for compliance":
        return {
          text: "For Compliance",
          color: "text-[#FDA811]",
          icon: AlertCircle
        };
      default:
        return {
          text: "For Compliance",
          color: "text-[#4D4A4A]",
          icon: AlertCircle
        };
    }
  };

  // Get purpose icon
  const getPurposeIcon = useCallback((purpose) => {
    const purposeObj = PERMIT_PURPOSES.find(p => 
      p.value.toLowerCase() === purpose?.toLowerCase()
    );
    return purposeObj?.icon || FileText;
  }, [permits, topPurposes]);

  // Weekly Applications Trend (Last 8 weeks)
  const weeklyApplicationsData = useMemo(() => {
    const weeksData = [];
    const currentDate = new Date();
    
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - (i * 7));
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      const weekLabel = `Week ${8 - i}`;
      const count = permits.filter(p => {
        const appDate = new Date(p.application_date);
        return appDate >= weekStart && appDate <= weekEnd;
      }).length;
      
      weeksData.push({ label: weekLabel, count, weekStart, weekEnd });
    }
    
    return {
      labels: weeksData.map(w => w.label),
      datasets: [{
        label: 'Total Applications',
        data: weeksData.map(w => w.count),
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointBackgroundColor: '#4CAF50',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      }],
      rawData: weeksData
    };
  }, [permits]);

  // Monthly Total Applications Trend (Last 12 months)
  const monthlyTotalApplicationsData = useMemo(() => {
    const monthsData = [];
    const currentDate = new Date();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59, 999);
      
      const monthLabel = `${monthNames[monthDate.getMonth()]} ${monthDate.getFullYear().toString().slice(-2)}`;
      const count = permits.filter(p => {
        const appDate = new Date(p.application_date);
        return appDate >= monthStart && appDate <= monthEnd;
      }).length;
      
      monthsData.push({ label: monthLabel, count, monthStart, monthEnd });
    }
    
    return {
      labels: monthsData.map(m => m.label),
      datasets: [{
        label: 'Total Applications',
        data: monthsData.map(m => m.count),
        borderColor: '#4A90E2',
        backgroundColor: 'rgba(74, 144, 226, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointBackgroundColor: '#4A90E2',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      }],
      rawData: monthsData
    };
  }, [permits]);

  // Status Distribution Chart Data
  const statusChartData = useMemo(() => ({
    labels: ["Approved", "For Compliance", "Rejected"],
    datasets: [{
      data: [
        stats.approved || 0,
        stats.pending || 0,
        stats.rejected || 0
      ],
      backgroundColor: ['#4CAF50', '#FDA811', '#E53935'],
      hoverBackgroundColor: ['#45a049', '#fc9d0b', '#d32f2f'],
      borderColor: '#ffffff',
      borderWidth: 3,
    }]
  }), [stats]);

  // Filter permits based on filters
  useEffect(() => {
    let filtered = [...permits];
    const searchLower = searchTerm.toLowerCase();

    // Date range filter
    if (startDate && endDate) {
      filtered = filtered.filter(p => {
        if (!p.application_date) return false;
        const permitDate = new Date(p.application_date);
        return permitDate >= startDate && permitDate <= endDate;
      });
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.first_name?.toLowerCase().includes(searchLower) ||
        p.last_name?.toLowerCase().includes(searchLower) ||
        p.middle_name?.toLowerCase().includes(searchLower) ||
        p.purpose?.toLowerCase().includes(searchLower) ||
        p.barangay?.toLowerCase().includes(searchLower) ||
        `BP-${String(p.permit_id).padStart(4, '0')}`.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(p => {
        const uiStatus = getUIStatus(p.status);
        return uiStatus.toLowerCase() === statusFilter.toLowerCase();
      });
    }

    // Purpose filter
    if (purposeFilter !== "all") {
      filtered = filtered.filter(p => 
        p.purpose?.toLowerCase() === purposeFilter.toLowerCase()
      );
    }

    // Category filter
    if (categoryFilter !== "all") {
      const categoryMap = {
        personal: ["personal identification", "residency verification", "school requirement", 
                  "scholarship", "government assistance", "medical assistance", "financial assistance",
                  "barangay id", "court", "police clearance", "nbi"],
        employment: ["employment", "job", "ojt", "contract", "agency", "overseas", "ofw", "poea"],
        business: ["business", "dti", "sec", "tax", "stall", "establishment", "closure"],
        residency: ["residency", "residence", "land", "lot", "construction", "fencing", 
                   "excavation", "utility", "boundary"],
        official: ["marriage", "travel", "firearm", "mediation", "notarization", 
                  "franchise", "cooperative", "loan", "sss", "pag-ibig", "philhealth"]
      };

      const categoryKeywords = categoryMap[categoryFilter] || [];
      filtered = filtered.filter(p => {
        const purposeLower = p.purpose?.toLowerCase() || "";
        return categoryKeywords.some(keyword => purposeLower.includes(keyword));
      });
    }

    setFilteredPermits(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [permits, startDate, endDate, searchTerm, statusFilter, purposeFilter, categoryFilter]);

  // Fetch data on component mount
  useEffect(() => {
    fetchPermits();
  }, []);

  // Export to CSV
  const exportToCSV = useCallback(() => {
    setExporting(true);
    setExportType("csv");
    
    const headers = [
      "Permit ID", "Applicant Name", "Purpose", "Category", "Barangay",
      "Status", "Application Date", "Clearance Fee", "Contact Number",
      "Email", "Address", "Valid ID Type", "Valid ID Number"
    ];
    
    const csvContent = [
      headers.join(","),
      ...permits.map(p => {
        const purposeObj = PERMIT_PURPOSES.find(purpose => purpose.value === p.purpose);
        const category = purposeObj ? (
          PURPOSE_CATEGORIES.find(cat => purposeObj.label.includes(cat.label.split('-')[0]))?.label || 'Other'
        ) : 'Other';
        
        return [
          `BP-${String(p.permit_id).padStart(4, '0')}`,
          `${p.first_name} ${p.middle_name || ''} ${p.last_name} ${p.suffix || ''}`.trim(),
          p.purpose || "N/A",
          category,
          p.barangay || "N/A",
          getUIStatus(p.status),
          p.application_date ? new Date(p.application_date).toLocaleDateString() : "N/A",
          p.clearance_fee || '0.00',
          p.mobile_number || "N/A",
          p.email || "N/A",
          p.address || "N/A",
          p.valid_id_type || "N/A",
          p.valid_id_number || "N/A"
        ].map(field => `"${field || ''}"`).join(",");
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `barangay-permits-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    setExporting(false);
    setExportType("");
  }, [permits]);

  // Export to PDF
  const exportToPDF = async () => {
    setExporting(true);
    setExportType("pdf");
    
    try {
      Swal.fire({
        title: 'Generating PDF...',
        text: 'Please wait while we create your report',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      const pdfContainer = document.createElement('div');
      pdfContainer.style.cssText = 'position: absolute; left: -9999px; width: 1200px; background: #FBFBFB; padding: 30px; font-family: Arial, sans-serif;';
      
      pdfContainer.innerHTML = `
        <div style="margin-bottom: 30px;">
          <h1 style="color: #4D4A4A; font-size: 28px; margin: 0 0 10px 0;">Barangay Clearance Analytics</h1>
          <p style="color: #666; margin: 0;">Generated on ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px;">
          ${[
            { title: 'Total Applications', value: stats.total, color: '#4CAF50' },
            { title: 'Approved', value: stats.approved, color: '#4CAF50' },
            { title: 'Pending', value: stats.pending, color: '#FDA811' },
            { title: 'Rejected', value: stats.rejected, color: '#E53935' }
          ].map(stat => `
            <div style="border: 2px solid #E9E7E7; border-radius: 8px; padding: 20px; background: white;">
              <p style="color: #666; font-size: 12px; margin: 0 0 10px 0;">${stat.title}</p>
              <p style="color: ${stat.color}; font-size: 32px; font-weight: bold; margin: 0;">${stat.value}</p>
            </div>
          `).join('')}
        </div>
        
        <div style="margin-bottom: 30px;">
          <h2 style="color: #4D4A4A; font-size: 20px; margin: 0 0 15px 0;">Applications by Status</h2>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
            ${[
              { label: 'Approved', value: stats.approved || 0, color: '#4CAF50' },
              { label: 'For Compliance', value: stats.pending || 0, color: '#FDA811' },
              { label: 'Rejected', value: stats.rejected || 0, color: '#E53935' }
            ].map(stat => `
              <div style="border: 2px solid #E9E7E7; border-radius: 8px; padding: 15px; background: white; border-left: 5px solid ${stat.color};">
                <p style="color: #4D4A4A; font-size: 14px; margin: 0 0 8px 0;">${stat.label}</p>
                <p style="color: #4D4A4A; font-size: 24px; font-weight: bold; margin: 0;">${stat.value}</p>
              </div>
            `).join('')}
          </div>
        </div>
        
        <div style="margin-bottom: 30px;">
          <h2 style="color: #4D4A4A; font-size: 20px; margin: 0 0 15px 0;">Top Permit Purposes</h2>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
            ${topPurposes.slice(0, 6).map((purpose, idx) => {
              const percentage = stats.total > 0 ? ((purpose.count / stats.total) * 100).toFixed(1) : 0;
              return `
                <div style="border: 2px solid #E9E7E7; border-radius: 8px; padding: 12px; background: white; border-left: 5px solid ${purpose.color};">
                  <p style="color: #4D4A4A; font-size: 12px; margin: 0 0 5px 0; font-weight: 500;">${purpose.label}</p>
                  <p style="color: #4D4A4A; font-size: 20px; font-weight: bold; margin: 0;">${purpose.count}</p>
                  <p style="color: #666; font-size: 11px; margin: 3px 0 0 0;">${percentage}% of total</p>
                </div>
              `;
            }).join('')}
          </div>
        </div>
        
        <div style="margin-bottom: 30px;">
          <h2 style="color: #4D4A4A; font-size: 20px; margin: 0 0 15px 0;">Weekly Applications Trend (Last 8 Weeks)</h2>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
            ${weeklyApplicationsData.rawData.map((week, idx) => {
              return `
                <div style="border: 2px solid #E9E7E7; border-radius: 8px; padding: 12px; background: white; text-align: center; border-left: 5px solid #4CAF50;">
                  <p style="color: #666; font-size: 11px; margin: 0 0 5px 0;">${week.label}</p>
                  <p style="color: #4CAF50; font-size: 24px; font-weight: bold; margin: 0;">${week.count}</p>
                  <p style="color: #666; font-size: 10px; margin: 3px 0 0 0;">${new Date(week.weekStart).toLocaleDateString()} - ${new Date(week.weekEnd).toLocaleDateString()}</p>
                </div>
              `;
            }).join('')}
          </div>
        </div>
        
        <div style="margin-bottom: 30px;">
          <h2 style="color: #4D4A4A; font-size: 20px; margin: 0 0 15px 0;">Monthly Applications Trend (Last 12 Months)</h2>
          <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px;">
            ${monthlyTotalApplicationsData.rawData.map((month, idx) => {
              return `
                <div style="border: 2px solid #E9E7E7; border-radius: 8px; padding: 10px; background: white; text-align: center; border-left: 5px solid #4A90E2;">
                  <p style="color: #666; font-size: 10px; margin: 0 0 5px 0;">${month.label}</p>
                  <p style="color: #4A90E2; font-size: 20px; font-weight: bold; margin: 0;">${month.count}</p>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
      
      document.body.appendChild(pdfContainer);
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(pdfContainer, {
        scale: 2,
        backgroundColor: "#FBFBFB",
        logging: false
      });

      document.body.removeChild(pdfContainer);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`barangay-clearance-analytics-${new Date().toISOString().split("T")[0]}.pdf`);

      Swal.fire({
        icon: 'success',
        title: 'PDF Downloaded!',
        text: 'Your report has been downloaded successfully.',
        timer: 2000,
        showConfirmButton: false
      });

    } catch (error) {
      console.error("Error generating PDF:", error);
      Swal.fire({
        title: "Export Failed",
        text: error.message || "Failed to generate PDF. Please try again.",
        icon: "error"
      });
    } finally {
      setExporting(false);
      setExportType("");
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredPermits.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPermits = filteredPermits.slice(startIndex, endIndex);

  const openModal = async (permit) => {
    try {
      const detailedPermit = await fetchSinglePermit(permit.permit_id);
      setSelectedPermit(detailedPermit || permit);
      setActionComment('');
      setShowModal(true);
    } catch (err) {
      console.error('Error opening modal:', err);
      setSelectedPermit(permit);
      setActionComment('');
      setShowModal(true);
    }
  };

  const closeModal = () => {
    setSelectedPermit(null);
    setActionComment('');
    setShowModal(false);
    setShowSubmittedDocs(false);
  };

  const toggleSubmittedDocs = () => {
    setShowSubmittedDocs(prev => !prev);
  };

  const handleApprove = async () => {
    if (!selectedPermit) return;
    await updatePermitStatus(selectedPermit.permit_id, 'approved', actionComment);
  };

  const handleReject = async () => {
    if (!selectedPermit) return;
    await updatePermitStatus(selectedPermit.permit_id, 'rejected', actionComment);
  };

  const handleForCompliance = async () => {
    if (!selectedPermit || !actionComment.trim()) {
      alert('Please add a comment before marking for compliance.');
      return;
    }
    await updatePermitStatus(selectedPermit.permit_id, 'pending', actionComment);
  };

  const formatComments = (commentsText) => {
    if (!commentsText || typeof commentsText !== 'string') return [];
    
    try {
      const cleanedText = commentsText.trim();
      const commentBlocks = cleanedText.split(/---\s+/);
      
      const formattedComments = [];
      
      for (let i = 1; i < commentBlocks.length; i++) {
        const block = commentBlocks[i].trim();
        if (!block) continue;
        
        const timestampEnd = block.indexOf(' ---\n');
        
        if (timestampEnd !== -1) {
          const timestamp = block.substring(0, timestampEnd).trim();
          const comment = block.substring(timestampEnd + 5).trim();
          
          if (comment) {
            formattedComments.push({
              timestamp,
              comment
            });
          }
        } else {
          formattedComments.push({
            timestamp: 'No timestamp',
            comment: block
          });
        }
      }
      
      return formattedComments.reverse();
    } catch (e) {
      console.error('Error formatting comments:', e);
      return [{
        timestamp: 'Error parsing',
        comment: commentsText
      }];
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBFBFB] p-6 flex items-center justify-center font-poppins">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4CAF50] mx-auto"></div>
          <p className="mt-4 text-[#4D4A4A]">Loading permit analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFB] p-4 md:p-6 font-poppins">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#4D4A4A] font-montserrat">
              Barangay Permit Analytics
            </h1>
            <p className="text-[#4D4A4A] text-opacity-70 mt-2">
              Track and analyze permit applications by purpose and status
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 md:mt-0">
            <button
              onClick={fetchPermits}
              className="p-2 rounded-lg bg-white border border-[#E9E7E7] hover:bg-gray-50 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className="w-5 h-5 text-[#4D4A4A]" />
            </button>
            <button
              onClick={exportToCSV}
              disabled={exporting && exportType === "csv"}
              className="px-4 py-2 bg-white border border-[#E9E7E7] text-[#4D4A4A] rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2 disabled:opacity-50 font-montserrat"
            >
              <FileText className="w-5 h-5" />
              <span>{exporting && exportType === "csv" ? "Exporting..." : "Export CSV"}</span>
            </button>
            <button
              onClick={exportToPDF}
              disabled={exporting && exportType === "pdf"}
              className="px-4 py-2 bg-[#4CAF50] text-white rounded-lg hover:bg-opacity-90 transition-colors flex items-center space-x-2 disabled:opacity-50 font-montserrat"
            >
              <Download className="w-5 h-5" />
              <span>{exporting && exportType === "pdf" ? "Generating..." : "Export PDF"}</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            {
              title: "Total Applications",
              value: stats.total,
              icon: FileText,
              color: "#4CAF50",
              trend: `${stats.trend}%`,
              trendUp: stats.trend > 0,
              description: "All permit purposes"
            },
            {
              title: "Approval Rate",
              value: `${stats.approvalRate}%`,
              icon: TrendingUp,
              color: "#4A90E2",
              trend: stats.approvalRate > 0 ? "+5.2%" : "0%",
              trendUp: stats.approvalRate > 0,
              description: "Overall approval"
            },
            {
              title: "Top Purpose",
              value: stats.topPurpose.label,
              icon: stats.topPurpose.icon || FileText,
              color: stats.topPurpose.color || '#4CAF50',
              trend: `${stats.topPurpose.count} applications`,
              trendUp: true,
              description: "Most requested"
            },
            {
              title: "Pending Review",
              value: stats.pending,
              icon: Clock,
              color: "#FDA811",
              trend: `${stats.pending} pending`,
              trendUp: stats.pending > 0,
              description: "For compliance"
            }
          ].map((stat, idx) => (
            <div
              key={idx}
              className="bg-white rounded-lg p-5 shadow-sm border border-[#E9E7E7] transition-all hover:shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#4D4A4A] text-opacity-70">{stat.title}</p>
                  <p className="text-2xl font-bold text-[#4D4A4A] mt-2 font-montserrat">
                    {stat.value}
                  </p>
                  <div className="mt-2">
                    <div className="flex items-center">
                      {stat.trendUp ? (
                        <TrendingUp className="w-4 h-4 text-[#4CAF50] mr-1" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-[#E53935] mr-1" />
                      )}
                      <span className={`text-sm ${stat.trendUp ? 'text-[#4CAF50]' : 'text-[#E53935]'}`}>
                        {stat.trend}
                      </span>
                    </div>
                    <span className="text-xs text-[#4D4A4A] text-opacity-60">{stat.description}</span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg`} style={{ backgroundColor: stat.color }}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-[#E9E7E7]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#4D4A4A] text-opacity-50 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search applicants, purposes, or barangays..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-[#E9E7E7] bg-white text-[#4D4A4A] focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent font-poppins"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <div className="relative">
                <DatePicker
                  selectsRange={true}
                  startDate={startDate}
                  endDate={endDate}
                  onChange={(update) => setDateRange(update)}
                  className="px-4 py-2 rounded-lg border border-[#E9E7E7] bg-white text-[#4D4A4A] focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent font-poppins w-full md:w-auto"
                  placeholderText="Select date range"
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#4D4A4A] text-opacity-50 w-5 h-5 pointer-events-none" />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 rounded-lg border border-[#E9E7E7] bg-white text-[#4D4A4A] focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent font-poppins"
              >
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="for compliance">For Compliance</option>
                <option value="rejected">Rejected</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 rounded-lg border border-[#E9E7E7] bg-white text-[#4D4A4A] focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent font-poppins"
              >
                <option value="all">All Categories</option>
                {PURPOSE_CATEGORIES.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>

              <select
                value={purposeFilter}
                onChange={(e) => setPurposeFilter(e.target.value)}
                className="px-4 py-2 rounded-lg border border-[#E9E7E7] bg-white text-[#4D4A4A] focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent font-poppins"
              >
                <option value="all">All Purposes</option>
                {PERMIT_PURPOSES.map(purpose => (
                  <option key={purpose.value} value={purpose.value.toLowerCase()}>
                    {purpose.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Line Chart - Trends by Purpose */}
        <div className="lg:col-span-2 bg-white rounded-lg p-5 shadow-sm border border-[#E9E7E7]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-[#4D4A4A] font-montserrat">Monthly Trends by Purpose</h3>
              <p className="text-sm text-[#4D4A4A] text-opacity-70">Applications for top permit purposes</p>
            </div>
            <div className="flex items-center space-x-4">
              {monthlyData.datasets.map((dataset, idx) => (
                <span key={idx} className="flex items-center">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: dataset.borderColor }}></div>
                  <span className="text-sm text-[#4D4A4A] ml-2">{dataset.label}</span>
                </span>
              ))}
            </div>
          </div>
          <div className="h-[300px]">
            <Line
              data={monthlyData}
              options={{
                maintainAspectRatio: false,
                responsive: true,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    mode: 'index',
                    intersect: false,
                  }
                },
                scales: {
                  x: {
                    grid: {
                      color: 'rgba(233, 231, 231, 0.5)'
                    },
                    ticks: {
                      color: '#4D4A4A',
                      font: {
                        family: 'Poppins'
                      }
                    }
                  },
                  y: {
                    grid: {
                      color: 'rgba(233, 231, 231, 0.5)'
                    },
                    ticks: {
                      color: '#4D4A4A',
                      font: {
                        family: 'Poppins'
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Donut Chart - Status Distribution */}
        <div className="bg-white rounded-lg p-5 shadow-sm border border-[#E9E7E7]">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-[#4D4A4A] font-montserrat">Status Distribution</h3>
            <p className="text-sm text-[#4D4A4A] text-opacity-70">Current application status</p>
          </div>
          <div className="h-[250px] flex items-center justify-center">
            <Doughnut
              data={{
                labels: ["Approved", "For Compliance", "Rejected"],
                datasets: [{
                  data: [stats.approved, stats.pending, stats.rejected],
                  backgroundColor: [
                    'rgba(76, 175, 80, 0.8)',
                    'rgba(253, 168, 17, 0.8)',
                    'rgba(229, 57, 53, 0.8)'
                  ],
                  borderColor: '#FBFBFB',
                  borderWidth: 2,
                }]
              }}
              options={{
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      color: '#4D4A4A',
                      padding: 20,
                      usePointStyle: true,
                      font: {
                        family: 'Poppins'
                      }
                    }
                  }
                }
              }}
            />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {[
              { label: "Approved", value: stats.approved },
              { label: "For Compliance", value: stats.pending },
              { label: "Rejected", value: stats.rejected }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-[#FBFBFB] rounded-lg border border-[#E9E7E7]">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full ${
                    item.label === "Approved" ? "bg-[#4CAF50]" :
                    item.label === "For Compliance" ? "bg-[#FDA811]" :
                    "bg-[#E53935]"
                  } mr-3`}></div>
                  <span className="text-sm text-[#4D4A4A] font-poppins">{item.label}</span>
                </div>
                <span className="font-semibold text-[#4D4A4A] font-montserrat">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bar Chart - Permit Purposes */}
      <div className="mb-6 bg-white rounded-lg p-5 shadow-sm border border-[#E9E7E7]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[#4D4A4A] font-montserrat">Applications by Purpose</h3>
            <p className="text-sm text-[#4D4A4A] text-opacity-70">Distribution across different permit purposes</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-[#4D4A4A] text-opacity-70">
              Showing top {topPurposes.length} purposes
            </span>
          </div>
        </div>
        <div className="h-[300px]">
          <Bar
            data={{
              labels: purposeData.labels,
              datasets: [
                {
                  label: "Applications",
                  data: purposeData.counts,
                  backgroundColor: purposeData.colors,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: "#E9E7E7",
                },
              ],
            }}
            options={{
              maintainAspectRatio: false,
              responsive: true,
              plugins: {
                legend: { 
                  display: false
                },
              },
              scales: {
                x: { 
                  ticks: { 
                    color: '#4D4A4A',
                    font: {
                      family: 'Poppins'
                    }
                  }, 
                  grid: { 
                    color: 'rgba(233, 231, 231, 0.5)' 
                  } 
                },
                y: { 
                  ticks: { 
                    color: '#4D4A4A',
                    font: {
                      family: 'Poppins'
                    }
                  }, 
                  grid: { 
                    color: 'rgba(233, 231, 231, 0.5)' 
                  }, 
                  beginAtZero: true 
                },
              },
            }}
          />
        </div>
        
        {/* Purpose Summary Cards */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {topPurposes.map((purpose, idx) => {
            const PurposeIcon = purpose.icon;
            return (
              <div 
                key={idx}
                className="p-3 rounded-lg border border-[#E9E7E7] hover:shadow transition-all"
                style={{ borderLeftColor: purpose.color, borderLeftWidth: '4px' }}
              >
                <div className="flex items-center mb-2">
                  <PurposeIcon className="w-5 h-5 mr-2" style={{ color: purpose.color }} />
                  <span className="text-sm font-medium text-[#4D4A4A] font-poppins truncate">
                    {purpose.label}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-[#4D4A4A] font-montserrat">
                    {purpose.count}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-[#FBFBFB] text-[#4D4A4A]">
                    {purpose.approvalRate}% approved
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status Distribution Chart */}
      {permits.length > 0 && (
        <div className="mb-6 bg-white rounded-lg p-5 shadow-sm border border-[#E9E7E7]">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-[#4D4A4A] font-montserrat">Status Distribution</h3>
            <p className="text-sm text-[#4D4A4A] text-opacity-70">Applications by approval status</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 h-[250px] flex items-center justify-center">
              <Doughnut
                data={statusChartData}
                options={{
                  maintainAspectRatio: false,
                  cutout: '65%',
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        color: '#4D4A4A',
                        padding: 15,
                        usePointStyle: true,
                        font: { family: 'Poppins' }
                      }
                    }
                  }
                }}
              />
            </div>
            <div className="lg:col-span-2 flex flex-col justify-center space-y-3">
              {[
                { label: "Approved", value: stats.approved || 0, color: '#4CAF50' },
                { label: "For Compliance", value: stats.pending || 0, color: '#FDA811' },
                { label: "Rejected", value: stats.rejected || 0, color: '#E53935' }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-[#FBFBFB] rounded-lg border border-[#E9E7E7]">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: item.color }}></div>
                    <span className="text-sm text-[#4D4A4A] font-poppins">{item.label}</span>
                  </div>
                  <span className="font-semibold text-[#4D4A4A] font-montserrat">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Weekly Applications Trend */}
      {permits.length > 0 && (
        <div className="mb-6 bg-white rounded-lg p-5 shadow-sm border border-[#E9E7E7]">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-[#4D4A4A] font-montserrat">Weekly Applications Trend</h3>
            <p className="text-sm text-[#4D4A4A] text-opacity-70">Total applications submitted in the last 8 weeks</p>
          </div>
          <div className="h-[300px]">
            <Line
              data={weeklyApplicationsData}
              options={{
                maintainAspectRatio: false,
                responsive: true,
                plugins: {
                  legend: {
                    display: true,
                    position: 'top',
                    labels: {
                      color: '#4D4A4A',
                      font: { family: 'Poppins' }
                    }
                  },
                  tooltip: {
                    callbacks: {
                      title: (context) => {
                        const weekData = weeklyApplicationsData.rawData[context[0].dataIndex];
                        const start = new Date(weekData.weekStart).toLocaleDateString();
                        const end = new Date(weekData.weekEnd).toLocaleDateString();
                        return `${weekData.label}: ${start} - ${end}`;
                      }
                    }
                  }
                },
                scales: {
                  x: {
                    ticks: {
                      color: '#4D4A4A',
                      font: { family: 'Poppins' }
                    },
                    grid: { color: 'rgba(233, 231, 231, 0.5)' }
                  },
                  y: {
                    ticks: {
                      color: '#4D4A4A',
                      font: { family: 'Poppins' },
                      stepSize: 1
                    },
                    grid: { color: 'rgba(233, 231, 231, 0.5)' },
                    beginAtZero: true
                  }
                }
              }}
            />
          </div>
          <div className="mt-4 grid grid-cols-4 md:grid-cols-8 gap-2">
            {weeklyApplicationsData.rawData.map((week, idx) => (
              <div key={idx} className="text-center p-2 bg-[#FBFBFB] rounded border border-[#E9E7E7]">
                <p className="text-xs text-[#4D4A4A] text-opacity-70 font-poppins">{week.label}</p>
                <p className="text-lg font-bold text-[#4CAF50] font-montserrat">{week.count}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly Total Applications Trend */}
      {permits.length > 0 && (
        <div className="mb-6 bg-white rounded-lg p-5 shadow-sm border border-[#E9E7E7]">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-[#4D4A4A] font-montserrat">Monthly Applications Trend</h3>
            <p className="text-sm text-[#4D4A4A] text-opacity-70">Total applications submitted over the last 12 months</p>
          </div>
          <div className="h-[300px]">
            <Line
              data={monthlyTotalApplicationsData}
              options={{
                maintainAspectRatio: false,
                responsive: true,
                plugins: {
                  legend: {
                    display: true,
                    position: 'top',
                    labels: {
                      color: '#4D4A4A',
                      font: { family: 'Poppins' }
                    }
                  }
                },
                scales: {
                  x: {
                    ticks: {
                      color: '#4D4A4A',
                      font: { family: 'Poppins' }
                    },
                    grid: { color: 'rgba(233, 231, 231, 0.5)' }
                  },
                  y: {
                    ticks: {
                      color: '#4D4A4A',
                      font: { family: 'Poppins' },
                      stepSize: 1
                    },
                    grid: { color: 'rgba(233, 231, 231, 0.5)' },
                    beginAtZero: true
                  }
                }
              }}
            />
          </div>
          <div className="mt-4 grid grid-cols-6 md:grid-cols-12 gap-2">
            {monthlyTotalApplicationsData.rawData.map((month, idx) => (
              <div key={idx} className="text-center p-2 bg-[#FBFBFB] rounded border border-[#E9E7E7]">
                <p className="text-xs text-[#4D4A4A] text-opacity-70 font-poppins">{month.label}</p>
                <p className="text-lg font-bold text-[#4A90E2] font-montserrat">{month.count}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-sm border border-[#E9E7E7] overflow-hidden">
        <div className="p-5 border-b border-[#E9E7E7]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-[#4D4A4A] font-montserrat">Permit Applications</h3>
              <p className="text-sm text-[#4D4A4A] text-opacity-70">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredPermits.length)} of {filteredPermits.length} applications
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => window.print()}
                className="px-3 py-2 text-sm border border-[#E9E7E7] rounded-lg hover:bg-[#FBFBFB] transition-colors flex items-center font-poppins"
                title="Print Report"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#FBFBFB]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#4D4A4A] uppercase tracking-wider font-montserrat">
                  Permit ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#4D4A4A] uppercase tracking-wider font-montserrat">
                  Applicant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#4D4A4A] uppercase tracking-wider font-montserrat">
                  Purpose
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#4D4A4A] uppercase tracking-wider font-montserrat">
                  Barangay
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#4D4A4A] uppercase tracking-wider font-montserrat">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#4D4A4A] uppercase tracking-wider font-montserrat">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#4D4A4A] uppercase tracking-wider font-montserrat">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9E7E7]">
              {currentPermits.map((permit, index) => {
                const statusInfo = getStatusText(getUIStatus(permit.status));
                const StatusIcon = statusInfo.icon;
                const PurposeIcon = getPurposeIcon(permit.purpose);
                const purposeInfo = PERMIT_PURPOSES.find(p => p.value.toLowerCase() === permit.purpose?.toLowerCase());
                
                return (
                  <tr key={index} className="hover:bg-[#FBFBFB] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono text-sm text-[#4D4A4A] font-medium">
                        BP-{String(permit.permit_id).padStart(4, '0')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-[#4D4A4A] font-montserrat">
                          {permit.first_name} {permit.last_name}
                        </p>
                        <p className="text-sm text-[#4D4A4A] text-opacity-70 font-poppins">
                          {permit.email || permit.mobile_number || "No contact"}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <PurposeIcon className="w-5 h-5 mr-3" style={{ color: purposeInfo?.color || '#4D4A4A' }} />
                        <span className="text-[#4D4A4A] font-poppins truncate max-w-[200px]">
                          {permit.purpose || "N/A"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#4D4A4A] font-poppins">
                      {permit.barangay || "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-[#4D4A4A] text-opacity-70 font-poppins">
                        {permit.application_date ? new Date(permit.application_date).toLocaleDateString() : "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <StatusIcon className={`w-4 h-4 mr-2 ${statusInfo.color}`} />
                        <span className={`text-sm font-medium ${statusInfo.color} font-poppins`}>
                          {statusInfo.text}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <button 
                          onClick={() => openModal(permit)}
                          title="View Details"
                          className="p-2 bg-[#4A90E2] text-white rounded-lg hover:bg-[#FDA811]/80 transition-colors"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredPermits.length === 0 && !loading && (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-[#E9E7E7] mx-auto mb-4" />
            <p className="text-[#4D4A4A] text-opacity-70">No permits match your filters</p>
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setPurposeFilter("all");
                setCategoryFilter("all");
                setDateRange([null, null]);
              }}
              className="mt-4 text-[#4CAF50] hover:underline font-poppins"
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* Pagination */}
        {filteredPermits.length > itemsPerPage && (
          <div className="p-5 border-t border-[#E9E7E7]">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#4D4A4A] text-opacity-70 font-poppins">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm border border-[#E9E7E7] rounded-lg hover:bg-[#FBFBFB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-poppins"
                >
                  Previous
                </button>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm border border-[#E9E7E7] rounded-lg hover:bg-[#FBFBFB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-poppins"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="mt-6 p-4 bg-[#E53935] bg-opacity-20 border border-[#E53935] border-opacity-30 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-[#E53935] mr-3" />
            <p className="text-[#4D4A4A] font-poppins">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="ml-auto text-sm text-[#4CAF50] hover:underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Permit Details Modal - Modern Design */}
      {showModal && selectedPermit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 overflow-auto animate-fadeIn">
          <div className="w-full max-w-7xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl transform transition-all">
            {/* Redesigned Barangay Permit Header */}
            <div className="relative p-6 bg-gradient-to-r from-gray-50 via-white to-gray-50 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 border-b-4 border-green-400">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-green-400 to-green-500 p-3 rounded-2xl shadow-xl">
                    <Shield className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Barangay Permit</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Barangay Clearance Application Details</p>
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

                {/* Date Card */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md border-l-4 border-purple-500">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Date Applied</p>
                  <p className="text-lg font-bold text-gray-800 dark:text-white">
                    {selectedPermit.application_date ? new Date(selectedPermit.application_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                  </p>
                </div>

                {/* Status Card */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md border-l-4 border-green-500">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Status</p>
                  <span className={`inline-block px-3 py-1 text-sm font-bold rounded-full ${
                    getUIStatus(selectedPermit.status) === 'Approved' ? 'text-[#4CAF50] bg-[#4CAF50]/10' :
                    getUIStatus(selectedPermit.status) === 'Rejected' ? 'text-[#E53935] bg-[#E53935]/10' :
                    'text-[#FDA811] bg-[#FDA811]/10'
                  }`}>
                    {getUIStatus(selectedPermit.status)}
                  </span>
                </div>

                {/* Purpose Card */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md border-l-4 border-orange-500">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Purpose</p>
                  <p className="text-sm font-bold text-gray-800 dark:text-white truncate" title={selectedPermit.purpose || 'N/A'}>
                    {selectedPermit.purpose || 'N/A'}
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
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Personal Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                </div>
              </div>

              {/* Address Information */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border-2 border-green-100 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl shadow-lg">
                    <MapPin className="w-6 h-6 text-white" />
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
                </div>
              </div>

              {/* Permit Details */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border-2 border-orange-100 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-3 rounded-xl shadow-lg">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
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
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl shadow-lg">
                    <Tag className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Payment Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              {parseAttachments(selectedPermit.attachments).length > 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border-2 border-indigo-100 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-3 rounded-xl shadow-lg">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <h4 className="text-xl font-bold text-gray-900 dark:text-white">Submitted Documents</h4>
                      <span className="ml-2 bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-bold">
                        {parseAttachments(selectedPermit.attachments).length} files
                      </span>
                    </div>
                    <button
                      onClick={toggleSubmittedDocs}
                      className="flex items-center gap-2 text-sm text-[#4CAF50] hover:text-[#FDA811] transition-colors"
                    >
                      <span>{showSubmittedDocs ? 'Hide' : 'View'} Documents</span>
                      <ChevronRight className={`w-4 h-4 transition-transform ${showSubmittedDocs ? 'rotate-90' : ''}`} />
                    </button>
                  </div>

                {showSubmittedDocs && (
                  <div className="mt-4">
                    {parseAttachments(selectedPermit.attachments).length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {parseAttachments(selectedPermit.attachments).map((file) => (
                          <div 
                            key={file.id} 
                            className="flex items-center justify-between p-4 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-3 rounded-lg ${
                                isImageFile(file.type, file.name)
                                  ? 'bg-green-100 dark:bg-green-900/30' 
                                  : 'bg-blue-100 dark:bg-blue-900/30'
                              }`}>
                                {isImageFile(file.type, file.name) ? (
                                  <ImageIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                                ) : (
                                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {file.id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {file.name}
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                  {getFileTypeName(file.type, file.name)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => viewFile(file)}
                                className="p-2 bg-[#4CAF50] text-white rounded-lg hover:bg-[#FDA811] transition-colors"
                                title="View document"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <a 
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-[#4A90E2] text-white rounded-lg hover:bg-[#4A90E2]/80 transition-colors"
                                title="Download document"
                                download
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600">
                        <FileText className="w-12 h-12 text-gray-300 dark:text-gray-500 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">
                          No documents submitted for this application.
                        </p>
                      </div>
                    )}
                  </div>
                )}
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
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Review Comments
                  {selectedPermit.comments && (
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      ({formatComments(selectedPermit.comments).length} comment{formatComments(selectedPermit.comments).length !== 1 ? 's' : ''})
                    </span>
                  )}
                </h3>
                
                {/* Display all comments in one box */}
                <div className="space-y-4 mb-6">
                  {selectedPermit.comments && selectedPermit.comments.trim() ? (
                    <div className="bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600 overflow-hidden">
                      <div className="max-h-64 overflow-y-auto p-4">
                        {formatComments(selectedPermit.comments).map((comment, index) => (
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
                          Total: {formatComments(selectedPermit.comments).length} comment{formatComments(selectedPermit.comments).length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600">
                      <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-500 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400">
                        No comments yet. Add your first comment below.
                      </p>
                    </div>
                  )}
                </div>

              </div>

              {/* Close Button */}
              <div className="flex justify-end pt-8 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-700 rounded-2xl p-6 border-t-4 border-gray-300 dark:border-slate-600">
                <button 
                  onClick={closeModal}
                  className="px-8 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all font-medium shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <X className="w-5 h-5" />
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Preview Modal - SAME STYLE AS BUSINESS PERMIT */}
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

            {/* File Content - Image / PDF / Other */}
            {isImageFile(selectedFile.file_type, selectedFile.name) ? (
              <div 
                className="flex-1 flex items-center justify-center p-4 pt-20 pb-16 overflow-hidden cursor-move"
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
              >
                <div className="relative w-full h-full flex items-center justify-center">
                  <img 
                    ref={imageRef}
                    id="preview-image"
                    src={selectedFile.url} 
                    alt={selectedFile.name}
                    crossOrigin="anonymous"
                    className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl transition-transform duration-200 ease-out"
                    style={{ transform: `scale(${zoomLevel / 100})`, position: 'relative', left: '0px', top: '0px', cursor: zoomLevel > 100 ? 'move' : 'default' }}
                    onLoad={() => console.log('Image loaded successfully:', selectedFile.url)}
                    onError={(e) => {
                      console.error('Failed to load image:', selectedFile.url);
                      e.target.onerror = null;
                      e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23222222"/><text x="200" y="140" text-anchor="middle" font-family="Arial" font-size="16" fill="%23ffffff">Image failed to load</text><text x="200" y="170" text-anchor="middle" font-family="Arial" font-size="11" fill="%23999999">Check browser console for URL</text></svg>';
                      e.target.className = 'max-w-md mx-auto bg-gray-800 rounded-lg p-8';
                    }}
                  />
                </div>
              </div>
            ) : isPdfFile(selectedFile.file_type, selectedFile.name) ? (
              <div className="flex-1 flex items-center justify-center p-4 pt-20 pb-16">
                <iframe
                  src={selectedFile.url}
                  title={selectedFile.name}
                  className="w-full h-full rounded-lg border-0"
                  style={{ minHeight: '70vh' }}
                />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center max-w-md bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                  <div className="text-gray-300 mb-6">
                    <FileText className="w-24 h-24 mx-auto" />
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