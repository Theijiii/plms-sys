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
  Building,
  Briefcase,
  Users,
  DollarSign,
  MapPin,
  Factory,
  Store,
  Coffee,
  ShoppingBag,
  Utensils,
  Home,
  Truck,
  BarChart,
  Layers,
  File,
  FileText as FileTextIcon,
  FileSpreadsheet,
  Image as ImageIcon,
  X,
  AlertTriangle,
  User,
  FileCode,
  Folder,
  FileArchive,
  FileVideo,
  FileAudio,
  ChevronRight,
  MessageSquare
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

const API_BASE = "/backend/business_permit";

// Business types and categories
const BUSINESS_CATEGORIES = [
  { value: "retail", label: "Retail Store", icon: Store, color: "#4CAF50" },
  { value: "restaurant", label: "Restaurant/Café", icon: Utensils, color: "#FDA811" },
  { value: "manufacturing", label: "Manufacturing", icon: Factory, color: "#4A90E2" },
  { value: "services", label: "Services", icon: Briefcase, color: "#9C27B0" },
  { value: "wholesale", label: "Wholesale", icon: ShoppingBag, color: "#2196F3" },
  { value: "construction", label: "Construction", icon: Home, color: "#795548" },
  { value: "transport", label: "Transport", icon: Truck, color: "#607D8B" },
  { value: "professional", label: "Professional Services", icon: Briefcase, color: "#3F51B5" },
  { value: "others", label: "Others", icon: Building, color: "#F44336" }
];

const BUSINESS_SIZE = [
  { value: "micro", label: "Micro (<₱3M)", color: "#4CAF50" },
  { value: "small", label: "Small (₱3M-15M)", color: "#FDA811" },
  { value: "medium", label: "Medium (₱15M-100M)", color: "#4A90E2" },
  { value: "large", label: "Large (>₱100M)", color: "#9C27B0" }
];

// Format currency function
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0);
};

// Helper function to match business category
const matchesCategory = (businessType, category) => {
  if (!businessType) return false;
  
  switch (category) {
    case "retail": return businessType.includes("retail") || businessType.includes("store");
    case "restaurant": return businessType.includes("restaurant") || businessType.includes("cafe") || businessType.includes("food");
    case "manufacturing": return businessType.includes("manufactur");
    case "services": return businessType.includes("service");
    case "wholesale": return businessType.includes("wholesale");
    case "construction": return businessType.includes("construct");
    case "transport": return businessType.includes("transport");
    case "professional": return businessType.includes("professional") || businessType.includes("consult");
    case "others": return true;
    default: return false;
  }
};

export default function BusPermitAnalytics() {
  const [permits, setPermits] = useState([]);
  const [filteredPermits, setFilteredPermits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sizeFilter, setSizeFilter] = useState("all");
  const [permitTypeFilter, setPermitTypeFilter] = useState("all");
  const [exporting, setExporting] = useState(false);
  const [exportType, setExportType] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedPermit, setSelectedPermit] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [actionComment, setActionComment] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showSubmittedDocs, setShowSubmittedDocs] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const imageRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const imagePositionRef = useRef({ x: 0, y: 0 });
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState("all");
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

  // Fetch single permit with documents
  const fetchSinglePermit = async (permitId) => {
    try {
      const response = await fetch(`${API_BASE}/fetch_single.php?permit_id=${permitId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
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
      const response = await fetch(`${API_BASE}/fetch_documents.php?permit_id=${permitId}`);
      
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

  // Enhanced stats with business-specific metrics
  const stats = useMemo(() => {
    const total = permits.length;
    const approved = permits.filter(p => p.status?.toUpperCase() === "APPROVED").length;
    const rejected = permits.filter(p => p.status?.toUpperCase() === "REJECTED").length;
    const pending = permits.filter(p => p.status?.toUpperCase() === "PENDING" || !p.status).length;
    const compliance = permits.filter(p => p.status?.toUpperCase() === "COMPLIANCE").length;

    // Calculate business category statistics
    const categoryStats = BUSINESS_CATEGORIES.map(category => {
      const count = permits.filter(p => {
        const businessType = p.business_nature?.toLowerCase();
        if (!businessType) return false;
        
        return matchesCategory(businessType, category.value);
      }).length;
      
      const approvedCount = permits.filter(p => {
        const businessType = p.business_nature?.toLowerCase();
        if (!businessType) return false;
        
        return matchesCategory(businessType, category.value) && p.status?.toUpperCase() === "APPROVED";
      }).length;
      
      const approvalRate = count > 0 ? ((approvedCount / count) * 100).toFixed(1) : 0;
      
      // Calculate total capital for this category
      const totalCapital = permits.filter(p => {
        const businessType = p.business_nature?.toLowerCase();
        if (!businessType) return false;
        
        return matchesCategory(businessType, category.value);
      }).reduce((sum, p) => sum + (parseFloat(p.capital_investment) || 0), 0);
      
      return {
        ...category,
        count,
        approvedCount,
        approvalRate,
        totalCapital: formatCurrency(totalCapital),
        rawCapital: totalCapital
      };
    }).filter(p => p.count > 0)
      .sort((a, b) => b.count - a.count);

    // Calculate size distribution
    const sizeStats = BUSINESS_SIZE.map(size => {
      const count = permits.filter(p => {
        const capital = parseFloat(p.capital_investment) || 0;
        if (size.value === "micro" && capital < 3000000) return true;
        if (size.value === "small" && capital >= 3000000 && capital < 15000000) return true;
        if (size.value === "medium" && capital >= 15000000 && capital < 100000000) return true;
        if (size.value === "large" && capital >= 100000000) return true;
        return false;
      }).length;
      
      return {
        ...size,
        count,
        percentage: total > 0 ? ((count / total) * 100).toFixed(1) : 0
      };
    }).filter(s => s.count > 0);

    const topCategory = categoryStats[0] || { label: "N/A", count: 0 };
    
    // Calculate totals
    const totalCapital = permits.reduce((sum, p) => sum + (parseFloat(p.capital_investment) || 0), 0);
    const totalEmployees = permits.reduce((sum, p) => sum + (parseInt(p.total_employees) || 0), 0);
    const avgProcessingTime = 7;
    
    // Calculate trend
    const lastMonthCount = Math.floor(total * 0.85);
    const trend = total > 0 ? ((total - lastMonthCount) / lastMonthCount * 100).toFixed(1) : 0;
    
    return {
      total,
      approved,
      rejected,
      pending,
      compliance,
      categoryStats,
      sizeStats,
      topCategory,
      totalCapital: formatCurrency(totalCapital),
      totalEmployees,
      avgProcessingTime,
      trend,
      approvalRate: total > 0 ? ((approved / total) * 100).toFixed(1) : 0,
      completionRate: total > 0 ? (((approved + rejected + compliance) / total) * 100).toFixed(1) : 0
    };
  }, [permits]);

  // Process business categories for charts
  const topCategories = useMemo(() => {
    return stats.categoryStats.slice(0, 5);
  }, [stats.categoryStats]);

  const categoryData = useMemo(() => {
    return {
      labels: topCategories.map(p => p.label),
      counts: topCategories.map(p => p.count),
      colors: topCategories.map(p => p.color),
      capital: topCategories.map(p => p.rawCapital || 0)
    };
  }, [topCategories]);

  // Monthly trends by category
  const monthlyData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    // Get data for last 6 months
    const last6Months = months.slice(Math.max(0, currentMonth - 5), currentMonth + 1);
    
    // Get top 3 categories
    const top3Categories = topCategories.slice(0, 3);
    
    // Initialize monthly counts
    const monthlyCounts = {};
    top3Categories.forEach(category => {
      monthlyCounts[category.value] = Array(last6Months.length).fill(0);
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
          const businessType = permit.business_nature?.toLowerCase() || "";
          
          // Find if this business type matches our top categories
          top3Categories.forEach(category => {
            if (matchesCategory(businessType, category.value)) {
              monthlyCounts[category.value][monthInRange]++;
            }
          });
        }
      }
    });
    
    const colors = ["#4CAF50", "#FDA811", "#4A90E2"];
    return {
      labels: last6Months,
      datasets: top3Categories.map((category, idx) => ({
        label: category.label,
        data: monthlyCounts[category.value] || Array(last6Months.length).fill(0),
        borderColor: colors[idx],
        backgroundColor: colors[idx] + "20",
        fill: true,
        tension: 0.4
      }))
    };
  }, [permits, topCategories]);

  // Get status text and color
  const getStatusText = (status) => {
    const statusUpper = (status || "").toUpperCase();
    switch (statusUpper) {
      case "APPROVED":
        return {
          text: "Approved",
          color: "text-[#4CAF50]",
          bgColor: "bg-[#4CAF50]/10",
          icon: CheckCircle
        };
      case "REJECTED":
        return {
          text: "Rejected",
          color: "text-[#E53935]",
          bgColor: "bg-[#E53935]/10",
          icon: XCircle
        };
      case "PENDING":
        return {
          text: "Pending",
          color: "text-[#4A90E2]",
          bgColor: "bg-[#4A90E2]/10",
          icon: Clock
        };
      case "COMPLIANCE":
        return {
          text: "For Compliance",
          color: "text-[#FDA811]",
          bgColor: "bg-[#FDA811]/10",
          icon: AlertCircle
        };
      default:
        return {
          text: "Pending",
          color: "text-[#4D4A4A]",
          bgColor: "bg-gray-100",
          icon: AlertCircle
        };
    }
  };

  // Get category icon
  const getCategoryIcon = useCallback((businessType) => {
    if (!businessType) return Building;
    
    const businessTypeLower = businessType.toLowerCase();
    if (businessTypeLower.includes("retail") || businessTypeLower.includes("store")) return Store;
    if (businessTypeLower.includes("restaurant") || businessTypeLower.includes("cafe") || businessTypeLower.includes("food")) return Utensils;
    if (businessTypeLower.includes("manufactur")) return Factory;
    if (businessTypeLower.includes("service")) return Briefcase;
    if (businessTypeLower.includes("wholesale")) return ShoppingBag;
    if (businessTypeLower.includes("construct")) return Home;
    if (businessTypeLower.includes("transport")) return Truck;
    if (businessTypeLower.includes("professional") || businessTypeLower.includes("consult")) return Briefcase;
    return Building;
  }, []);

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
        p.owner_first_name?.toLowerCase().includes(searchLower) ||
        p.owner_last_name?.toLowerCase().includes(searchLower) ||
        p.business_name?.toLowerCase().includes(searchLower) ||
        p.trade_name?.toLowerCase().includes(searchLower) ||
        p.barangay?.toLowerCase().includes(searchLower) ||
        p.applicant_id?.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(p => {
        const status = (p.status || "").toUpperCase();
        return status === statusFilter.toUpperCase();
      });
    }

    // Permit type filter
    if (permitTypeFilter !== "all") {
      filtered = filtered.filter(p => {
        const permitType = (p.permit_type || "").toUpperCase();
        return permitType === permitTypeFilter.toUpperCase();
      });
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(p => 
        matchesCategory(p.business_nature?.toLowerCase(), categoryFilter)
      );
    }

    // Size filter
    if (sizeFilter !== "all") {
      filtered = filtered.filter(p => {
        const capital = parseFloat(p.capital_investment) || 0;
        switch (sizeFilter) {
          case "micro": return capital < 3000000;
          case "small": return capital >= 3000000 && capital < 15000000;
          case "medium": return capital >= 15000000 && capital < 100000000;
          case "large": return capital >= 100000000;
          default: return true;
        }
      });
    }

    setFilteredPermits(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [permits, startDate, endDate, searchTerm, statusFilter, categoryFilter, sizeFilter, permitTypeFilter]);

  // Fetch data on component mount
  useEffect(() => {
    fetchPermits();
  }, []);

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
    labels: ["Approved", "For Compliance", "Rejected", "Pending"],
    datasets: [{
      data: [
        stats.approved || 0,
        stats.compliance || 0,
        stats.rejected || 0,
        stats.pending || 0
      ],
      backgroundColor: ['#4CAF50', '#FDA811', '#E53935', '#4A90E2'],
      hoverBackgroundColor: ['#45a049', '#fc9d0b', '#d32f2f', '#3d7bc7'],
      borderColor: '#ffffff',
      borderWidth: 3,
    }]
  }), [stats]);

  // Barangay Distribution Data
  const barangayChartData = useMemo(() => {
    const barangayCounts = {};
    permits.forEach(p => {
      const barangay = p.barangay || 'Unknown';
      if (barangay && barangay !== 'N/A') {
        barangayCounts[barangay] = (barangayCounts[barangay] || 0) + 1;
      }
    });
    
    const sortedBarangays = Object.entries(barangayCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6);
    
    return {
      labels: sortedBarangays.length > 0 ? sortedBarangays.map(([name]) => name) : ['No Data'],
      datasets: [{
        label: 'Applications',
        data: sortedBarangays.length > 0 ? sortedBarangays.map(([, count]) => count) : [0],
        backgroundColor: '#FDA811',
        hoverBackgroundColor: '#fc9d0b',
        borderRadius: 8,
        borderWidth: 0,
      }]
    };
  }, [permits]);

  // Export to CSV
  const exportToCSV = useCallback(() => {
    setExporting(true);
    setExportType("csv");
    
    const headers = [
      "Application ID", "Business Name", "Trade Name", "Owner Name", 
      "Business Type", "Capital Investment", "Building Type",
      "Status", "Application Date", "Barangay", "City/Municipality",
      "Province", "Total Employees", "Male Employees", "Female Employees",
      "Contact Number", "Email", "Home Address"
    ];
    
    const csvContent = [
      headers.join(","),
      ...permits.map(p => [
        p.applicant_id,
        p.business_name,
        p.trade_name,
        `${p.owner_last_name}, ${p.owner_first_name} ${p.owner_middle_name || ''}`.trim(),
        p.business_nature,
        p.capital_investment,
        p.building_type,
        getStatusText(p.status).text,
        p.application_date ? new Date(p.application_date).toLocaleDateString() : '',
        p.barangay,
        p.city_municipality,
        p.province,
        p.total_employees,
        p.male_employees,
        p.female_employees,
        p.contact_number,
        p.email_address,
        p.home_address
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
  }, [permits]);

  // Export to PDF with automatic download
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
          <h1 style="color: #4D4A4A; font-size: 28px; margin: 0 0 10px 0;">Business Permit Analytics</h1>
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
              { label: 'For Compliance', value: stats.compliance || 0, color: '#FDA811' },
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
          <h2 style="color: #4D4A4A; font-size: 20px; margin: 0 0 15px 0;">Top Business Categories</h2>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
            ${topCategories.slice(0, 6).map((category, idx) => {
              const percentage = stats.total > 0 ? ((category.count / stats.total) * 100).toFixed(1) : 0;
              return `
                <div style="border: 2px solid #E9E7E7; border-radius: 8px; padding: 12px; background: white; border-left: 5px solid ${category.color};">
                  <p style="color: #4D4A4A; font-size: 12px; margin: 0 0 5px 0; font-weight: 500;">${category.label}</p>
                  <p style="color: #4D4A4A; font-size: 20px; font-weight: bold; margin: 0;">${category.count}</p>
                  <p style="color: #666; font-size: 11px; margin: 3px 0 0 0;">${percentage}% of total</p>
                </div>
              `;
            }).join('')}
          </div>
        </div>
        
        <div style="margin-bottom: 30px;">
          <h2 style="color: #4D4A4A; font-size: 20px; margin: 0 0 15px 0;">Top Barangays</h2>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
            ${barangayChartData.labels.slice(0, 6).map((barangay, idx) => {
              const count = barangayChartData.datasets[0].data[idx];
              const percentage = permits.length > 0 ? ((count / permits.length) * 100).toFixed(1) : 0;
              return `
                <div style="border: 2px solid #E9E7E7; border-radius: 8px; padding: 12px; background: white; border-left: 5px solid #FDA811;">
                  <p style="color: #4D4A4A; font-size: 12px; margin: 0 0 5px 0; font-weight: 500;">${barangay}</p>
                  <p style="color: #4D4A4A; font-size: 20px; font-weight: bold; margin: 0;">${count}</p>
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

      pdf.save(`business-permits-analytics-${new Date().toISOString().split("T")[0]}.pdf`);

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

  // Helper functions for modal
  const getUIStatus = (dbStatus) => {
    if (!dbStatus) return 'Pending';
    switch (dbStatus.toUpperCase()) {
      case 'APPROVED': return 'Approved';
      case 'REJECTED': return 'Rejected';
      case 'COMPLIANCE': return 'Compliance';
      case 'PENDING': return 'Pending';
      default: return 'Pending';
    }
  };

  const getDBStatus = (uiStatus) => {
    switch (uiStatus) {
      case 'Approved': return 'APPROVED';
      case 'Rejected': return 'REJECTED';
      case 'Compliance': return 'COMPLIANCE';
      case 'Pending': return 'PENDING';
      default: return 'PENDING';
    }
  };

  const getStatusColor = (status) => {
    const uiStatus = getUIStatus(status);
    switch (uiStatus) {
      case "Approved": return "text-[#4CAF50] bg-[#4CAF50]/10";
      case "Rejected": return "text-[#E53935] bg-[#E53935]/10";
      case "Compliance": return "text-[#FDA811] bg-[#FDA811]/10";
      case "Pending": return "text-[#4A90E2] bg-[#4A90E2]/10";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  // Check if file is an image
  const isImageFile = (fileType, fileName = '') => {
    const fileTypeLower = (fileType || '').toLowerCase();
    const fileNameLower = (fileName || '').toLowerCase();
    
    if (fileNameLower.endsWith('.jpg') || 
        fileNameLower.endsWith('.jpeg') || 
        fileNameLower.endsWith('.png') || 
        fileNameLower.endsWith('.gif') || 
        fileNameLower.endsWith('.bmp') || 
        fileNameLower.endsWith('.webp') ||
        fileNameLower.endsWith('.svg')) {
      return true;
    }
    
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

  // Get file icon - Updated to use Lucide icons
  const getFileIcon = (fileType, fileName = '') => {
    const fileTypeLower = (fileType || '').toLowerCase();
    const fileNameLower = (fileName || '').toLowerCase();
    
    if (fileNameLower.endsWith('.pdf') || fileTypeLower.includes('pdf')) {
      return {
        icon: FileTextIcon,
        bgColor: 'bg-red-100',
        textColor: 'text-red-600',
        iconColor: '#dc2626'
      };
    }
    
    if (fileNameLower.endsWith('.doc') || fileNameLower.endsWith('.docx') ||
        fileTypeLower.includes('word') || fileTypeLower.includes('officedocument.wordprocessingml')) {
      return {
        icon: FileText,
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-600',
        iconColor: '#2563eb'
      };
    }
    
    if (fileNameLower.endsWith('.xls') || fileNameLower.endsWith('.xlsx') ||
        fileTypeLower.includes('excel') || fileTypeLower.includes('spreadsheetml')) {
      return {
        icon: FileSpreadsheet,
        bgColor: 'bg-green-100',
        textColor: 'text-green-600',
        iconColor: '#059669'
      };
    }
    
    if (fileTypeLower.includes('image/')) {
      return {
        icon: ImageIcon,
        bgColor: 'bg-purple-100',
        textColor: 'text-purple-600',
        iconColor: '#7c3aed'
      };
    }
    
    if (fileNameLower.endsWith('.zip') || fileNameLower.endsWith('.rar') || 
        fileNameLower.endsWith('.7z') || fileTypeLower.includes('zip') ||
        fileTypeLower.includes('compressed')) {
      return {
        icon: FileArchive,
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-600',
        iconColor: '#ea580c'
      };
    }
    
    if (fileNameLower.endsWith('.mp4') || fileNameLower.endsWith('.avi') || 
        fileNameLower.endsWith('.mov') || fileTypeLower.includes('video')) {
      return {
        icon: FileVideo,
        bgColor: 'bg-pink-100',
        textColor: 'text-pink-600',
        iconColor: '#db2777'
      };
    }
    
    if (fileNameLower.endsWith('.mp3') || fileNameLower.endsWith('.wav') || 
        fileNameLower.endsWith('.flac') || fileTypeLower.includes('audio')) {
      return {
        icon: FileAudio,
        bgColor: 'bg-indigo-100',
        textColor: 'text-indigo-600',
        iconColor: '#4f46e5'
      };
    }
    
    if (fileNameLower.endsWith('.js') || fileNameLower.endsWith('.ts') || 
        fileNameLower.endsWith('.html') || fileNameLower.endsWith('.css') ||
        fileNameLower.endsWith('.json') || fileNameLower.endsWith('.xml')) {
      return {
        icon: FileCode,
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-600',
        iconColor: '#4b5563'
      };
    }
    
    return {
      icon: File,
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-600',
      iconColor: '#4b5563'
    };
  };

  // Get file type name
  const getFileTypeName = (fileType, fileName = '') => {
    const fileTypeLower = (fileType || '').toLowerCase();
    const fileNameLower = (fileName || '').toLowerCase();
    
    if (fileNameLower.endsWith('.pdf')) return 'PDF Document';
    if (fileNameLower.endsWith('.doc') || fileNameLower.endsWith('.docx')) return 'Word Document';
    if (fileNameLower.endsWith('.xls') || fileNameLower.endsWith('.xlsx')) return 'Excel Spreadsheet';
    if (fileNameLower.endsWith('.jpg') || fileNameLower.endsWith('.jpeg')) return 'JPEG Image';
    if (fileNameLower.endsWith('.png')) return 'PNG Image';
    if (fileNameLower.endsWith('.gif')) return 'GIF Image';
    if (fileNameLower.endsWith('.zip') || fileNameLower.endsWith('.rar')) return 'Compressed Archive';
    if (fileNameLower.endsWith('.mp4') || fileNameLower.endsWith('.mov')) return 'Video File';
    if (fileNameLower.endsWith('.mp3') || fileNameLower.endsWith('.wav')) return 'Audio File';
    if (fileTypeLower.includes('pdf')) return 'PDF Document';
    if (fileTypeLower.includes('image/')) return 'Image';
    if (fileTypeLower.includes('video/')) return 'Video';
    if (fileTypeLower.includes('audio/')) return 'Audio';
    if (fileTypeLower.includes('zip')) return 'Compressed File';
    
    return 'Document';
  };

  // Get file extension
  const getFileExtension = (fileName = '') => {
    const parts = fileName.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : 'FILE';
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

  // Format comments
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
    setSelectedFile(null);
    setShowFilePreview(false);
    setShowSubmittedDocs(false);
    setShowModal(false);
  };

  const toggleSubmittedDocs = () => {
    setShowSubmittedDocs(!showSubmittedDocs);
  };

  // Update permit status
  const updatePermitStatus = async (status) => {
    if (!selectedPermit) return;
    
    try {
      const dbStatus = getDBStatus(status);
      
      const response = await fetch(`${API_BASE}/update_status.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          permit_id: selectedPermit.permit_id,
          status: dbStatus,
          comments: actionComment
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update permit status');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to update permit status');
      }

      // Update the selected permit in state
      setSelectedPermit(prev => ({
        ...prev,
        status: dbStatus,
        uiStatus: status,
        comments: result.data?.comments || prev.comments
      }));

      // Refresh the permits list
      await fetchPermits();

      // Clear the comment input
      setActionComment('');

      // Show success message
      setSuccessMessage(`Permit ${status.toLowerCase()} successfully!`);
      setShowSuccessModal(true);

    } catch (err) {
      console.error('Error updating permit status:', err);
      setError(err.message || 'Failed to update permit status');
    }
  };

  const viewFile = async (file) => {
    try {
      if (!file || !file.file_path) {
        alert('File path not available');
        return;
      }
      
      // Extract filename for display
      const filename = file.file_path.split('/').pop();
      
      // Construct URL - use file_path directly with API_BASE
      // Browser resolves ../ in URLs (e.g. ../uploads/file.jpg resolves correctly)
      const fullUrl = `${API_BASE}/${file.file_path}`;
      
      console.log('Viewing file:', { file_path: file.file_path, url: fullUrl, file_type: file.file_type });
      
      setSelectedFile({
        ...file,
        url: fullUrl,
        name: filename,
        file_type: file.file_type || getFileType(filename)
      });
      setShowFilePreview(true);
      
    } catch (err) {
      console.error('Error accessing file:', err);
      alert('Unable to access the file');
    }
  };

  // File preview functions
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

  const closeFilePreview = () => {
    setSelectedFile(null);
    setShowFilePreview(false);
    setZoomLevel(100);
    isDraggingRef.current = false;
    dragStartRef.current = { x: 0, y: 0 };
    imagePositionRef.current = { x: 0, y: 0 };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBFBFB] p-6 flex items-center justify-center font-poppins">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4CAF50] mx-auto"></div>
          <p className="mt-4 text-[#4D4A4A]">Loading business analytics...</p>
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
              Business Permit Analytics
            </h1>
            <p className="text-[#4D4A4A] text-opacity-70 mt-2">
              Track and analyze business permit applications by category, size, and status
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
              <FileSpreadsheet className="w-5 h-5" />
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
              description: "All business types"
            },
            {
              title: "Total Capital",
              value: stats.totalCapital,
              icon: DollarSign,
              color: "#FDA811",
              trend: "+12.5%",
              trendUp: true,
              description: "Total investment"
            },
            {
              title: "Top Category",
              value: stats.topCategory.label,
              icon: stats.topCategory.icon || Building,
              color: stats.topCategory.color || '#4CAF50',
              trend: `${stats.topCategory.count} applications`,
              trendUp: true,
              description: "Most registered"
            },
            {
              title: "Pending Review",
              value: stats.pending + stats.compliance,
              icon: Clock,
              color: "#4A90E2",
              trend: `${stats.pending} pending, ${stats.compliance} compliance`,
              trendUp: stats.pending > 0,
              description: "Awaiting action"
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

        {/* Secondary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-[#E9E7E7]">
            <p className="text-sm text-[#4D4A4A] text-opacity-70">Approval Rate</p>
            <p className="text-xl font-bold text-[#4CAF50]">{stats.approvalRate}%</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-[#E9E7E7]">
            <p className="text-sm text-[#4D4A4A] text-opacity-70">Total Employees</p>
            <p className="text-xl font-bold text-[#4A90E2]">{stats.totalEmployees}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-[#E9E7E7]">
            <p className="text-sm text-[#4D4A4A] text-opacity-70">Avg Processing</p>
            <p className="text-xl font-bold text-[#FDA811]">{stats.avgProcessingTime} days</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-[#E9E7E7]">
            <p className="text-sm text-[#4D4A4A] text-opacity-70">Completion Rate</p>
            <p className="text-xl font-bold text-[#9C27B0]">{stats.completionRate}%</p>
          </div>
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
                  placeholder="Search businesses, owners, or barangays..."
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
                <option value="pending">Pending</option>
                <option value="compliance">For Compliance</option>
                <option value="rejected">Rejected</option>
              </select>

              <select
                value={permitTypeFilter}
                onChange={(e) => setPermitTypeFilter(e.target.value)}
                className="px-4 py-2 rounded-lg border border-[#E9E7E7] bg-white text-[#4D4A4A] focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent font-poppins"
              >
                <option value="all">All Permit Types</option>
                <option value="NEW">New</option>
                <option value="RENEWAL">Renewal</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 rounded-lg border border-[#E9E7E7] bg-white text-[#4D4A4A] focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent font-poppins"
              >
                <option value="all">All Categories</option>
                {BUSINESS_CATEGORIES.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>

              <select
                value={sizeFilter}
                onChange={(e) => setSizeFilter(e.target.value)}
                className="px-4 py-2 rounded-lg border border-[#E9E7E7] bg-white text-[#4D4A4A] focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent font-poppins"
              >
                <option value="all">All Sizes</option>
                {BUSINESS_SIZE.map(size => (
                  <option key={size.value} value={size.value}>
                    {size.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Line Chart - Trends by Category */}
        <div className="lg:col-span-2 bg-white rounded-lg p-5 shadow-sm border border-[#E9E7E7]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-[#4D4A4A] font-montserrat">Monthly Trends by Business Category</h3>
              <p className="text-sm text-[#4D4A4A] text-opacity-70">Applications for top business categories</p>
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

        {/* Donut Chart - Business Size Distribution */}
        <div className="bg-white rounded-lg p-5 shadow-sm border border-[#E9E7E7]">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-[#4D4A4A] font-montserrat">Business Size Distribution</h3>
            <p className="text-sm text-[#4D4A4A] text-opacity-70">By capital investment</p>
          </div>
          <div className="h-[250px] flex items-center justify-center">
            <Doughnut
              data={{
                labels: stats.sizeStats.map(s => s.label),
                datasets: [{
                  data: stats.sizeStats.map(s => s.count),
                  backgroundColor: stats.sizeStats.map(s => s.color),
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
            {stats.sizeStats.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-[#FBFBFB] rounded-lg border border-[#E9E7E7]">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm text-[#4D4A4A] font-poppins">{item.label}</span>
                </div>
                <span className="font-semibold text-[#4D4A4A] font-montserrat">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bar Chart - Business Categories */}
      <div className="mb-6 bg-white rounded-lg p-5 shadow-sm border border-[#E9E7E7]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[#4D4A4A] font-montserrat">Applications by Business Category</h3>
            <p className="text-sm text-[#4D4A4A] text-opacity-70">Distribution across different business types</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-[#4D4A4A] text-opacity-70">
              Showing top {topCategories.length} categories
            </span>
          </div>
        </div>
        <div className="h-[300px]">
          <Bar
            data={{
              labels: categoryData.labels,
              datasets: [
                {
                  label: "Applications",
                  data: categoryData.counts,
                  backgroundColor: categoryData.colors,
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
        
        {/* Category Summary Cards */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {topCategories.map((category, idx) => {
            const CategoryIcon = category.icon;
            return (
              <div 
                key={idx}
                className="p-3 rounded-lg border border-[#E9E7E7] hover:shadow transition-all"
                style={{ borderLeftColor: category.color, borderLeftWidth: '4px' }}
              >
                <div className="flex items-center mb-2">
                  <CategoryIcon className="w-5 h-5 mr-2" style={{ color: category.color }} />
                  <span className="text-sm font-medium text-[#4D4A4A] font-poppins truncate">
                    {category.label}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-[#4D4A4A] font-montserrat">
                    {category.count}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-[#FBFBFB] text-[#4D4A4A]">
                    {category.approvalRate}% approved
                  </span>
                </div>
                <div className="mt-2 text-xs text-[#4D4A4A] text-opacity-70">
                  Capital: {category.totalCapital}
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
                { label: "For Compliance", value: stats.compliance || 0, color: '#FDA811' },
                { label: "Rejected", value: stats.rejected || 0, color: '#E53935' },
                { label: "Pending", value: stats.pending || 0, color: '#4A90E2' }
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

      {/* Top Barangays Chart */}
      {permits.length > 0 && barangayChartData.labels[0] !== 'No Data' && (
        <div className="mb-6 bg-white rounded-lg p-5 shadow-sm border border-[#E9E7E7]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-[#4D4A4A] font-montserrat">Top Barangays</h3>
              <p className="text-sm text-[#4D4A4A] text-opacity-70">Application distribution by barangay location</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-[#4D4A4A] text-opacity-70">
                Top {Math.min(6, barangayChartData.labels.length)} barangays
              </span>
            </div>
          </div>
          <div className="h-[300px]">
            <Bar
              data={barangayChartData}
              options={{
                maintainAspectRatio: false,
                responsive: true,
                plugins: {
                  legend: { display: false },
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
                      font: { family: 'Poppins' }
                    }, 
                    grid: { color: 'rgba(233, 231, 231, 0.5)' }, 
                    beginAtZero: true 
                  },
                },
              }}
            />
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
              <h3 className="text-lg font-semibold text-[#4D4A4A] font-montserrat">Business Permit Applications</h3>
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
                  App ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#4D4A4A] uppercase tracking-wider font-montserrat">
                  Business
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#4D4A4A] uppercase tracking-wider font-montserrat">
                  Owner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#4D4A4A] uppercase tracking-wider font-montserrat">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#4D4A4A] uppercase tracking-wider font-montserrat">
                  Capital
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
                const statusInfo = getStatusText(permit.status);
                const StatusIcon = statusInfo.icon;
                const CategoryIcon = getCategoryIcon(permit.business_nature);
                const categoryInfo = BUSINESS_CATEGORIES.find(c => 
                  matchesCategory(permit.business_nature?.toLowerCase(), c.value)
                ) || BUSINESS_CATEGORIES[BUSINESS_CATEGORIES.length - 1];
                
                return (
                  <tr key={index} className="hover:bg-[#FBFBFB] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono text-sm text-[#4D4A4A] font-medium">
                        {permit.applicant_id || `BP-${String(permit.permit_id).padStart(4, '0')}`}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-[#4D4A4A] font-montserrat">
                          {permit.business_name || "N/A"}
                        </p>
                        {permit.trade_name && (
                          <p className="text-sm text-[#4D4A4A] text-opacity-70 font-poppins">
                            Trade: {permit.trade_name}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-[#4D4A4A] font-poppins">
                          {permit.owner_last_name}, {permit.owner_first_name}
                        </p>
                        <p className="text-sm text-[#4D4A4A] text-opacity-70">
                          {permit.owner_type || "N/A"}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <CategoryIcon className="w-5 h-5 mr-3" style={{ color: categoryInfo.color }} />
                        <span className="text-[#4D4A4A] font-poppins truncate max-w-[150px]">
                          {permit.business_nature || "N/A"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-lg font-semibold text-[#4D4A4A] font-montserrat">
                        {formatCurrency(permit.capital_investment)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-[#4D4A4A] text-opacity-70 font-poppins">
                        {permit.application_date ? new Date(permit.application_date).toLocaleDateString() : "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center px-3 py-1.5 rounded-full ${statusInfo.bgColor} ${statusInfo.color}`}>
                        <StatusIcon className={`w-4 h-4 mr-2 ${statusInfo.color}`} />
                        <span className={`text-sm font-medium ${statusInfo.color} font-poppins`}>
                          {statusInfo.text}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => openModal(permit)}
                          title="View Details"
                          className="p-2 bg-[#4A90E2] text-white rounded-lg hover:bg-[#4A90E2]/80 transition-colors"
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
            <Building className="w-12 h-12 text-[#E9E7E7] mx-auto mb-4" />
            <p className="text-[#4D4A4A] text-opacity-70">No business permits match your filters</p>
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setCategoryFilter("all");
                setSizeFilter("all");
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

      {/* Business Permit Details Modal - Modern Design */}
      {showModal && selectedPermit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 overflow-auto animate-fadeIn">
          <div className="w-full max-w-7xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl transform transition-all">
            {/* Redesigned Business Permit Header */}
            <div className="relative p-6 bg-gradient-to-r from-gray-50 via-white to-gray-50 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 border-b-4 border-green-400">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-green-400 to-green-500 p-3 rounded-2xl shadow-xl">
                    <Building className="w-10 h-10 text-white" />
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
                {/* Application ID Card */}
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
                    {selectedPermit.created_at ? new Date(selectedPermit.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                  </p>
                </div>

                {/* Status Card */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md border-l-4 border-green-500">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Status</p>
                  <span className={`inline-block px-3 py-1 text-sm font-bold rounded-full ${getStatusColor(selectedPermit.status)}`}>
                    {selectedPermit.uiStatus || getUIStatus(selectedPermit.status)}
                  </span>
                </div>

                {/* Business Info Card */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md border-l-4 border-orange-500">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Capital Investment</p>
                  <p className="text-lg font-bold text-gray-800 dark:text-white">
                    {formatCurrency(selectedPermit.capital_investment)}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-8 max-h-[80vh] overflow-y-auto bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-800">
              {/* Applicant Information Section */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border-2 border-blue-100 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Applicant Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Full Name</label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
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
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Business Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-500">Business Name</label>
                    <p className="text-xl font-bold text-[#4CAF50] mt-1">
                      {selectedPermit.business_name || 'N/A'}
                    </p>
                    {selectedPermit.trade_name && (
                      <p className="text-sm text-gray-500 mt-1">
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
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border-2 border-orange-100 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-3 rounded-xl shadow-lg">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Business Address</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border-2 border-purple-100 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl shadow-lg">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Operations Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

              {/* Submitted Documents */}
              {selectedPermit.documents && selectedPermit.documents.length > 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border-2 border-indigo-100 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-3 rounded-xl shadow-lg">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <h4 className="text-xl font-bold text-gray-900 dark:text-white">Submitted Documents</h4>
                      <span className="ml-2 bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-bold">
                        {selectedPermit.documents.length} files
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
                      {selectedPermit.documents && selectedPermit.documents.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedPermit.documents.map((doc, index) => {
                            const fileIcon = getFileIcon(doc.file_type, doc.document_name);
                            const FileIconComponent = fileIcon.icon;
                            const isImage = isImageFile(doc.file_type, doc.document_name);
                            const displayName = doc.document_type ? doc.document_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Document';
                            
                            return (
                              <div 
                                key={index} 
                                className="flex items-center justify-between p-4 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`p-3 rounded-lg ${
                                    isImage
                                      ? 'bg-green-100 dark:bg-green-900/30' 
                                      : 'bg-blue-100 dark:bg-blue-900/30'
                                  }`}>
                                    {isImage ? (
                                      <ImageIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                                    ) : (
                                      <FileIconComponent className="w-5 h-5 text-blue-600 dark:text-blue-400" style={{ color: fileIcon.iconColor }} />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                      {displayName}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                      {doc.document_name || 'No filename'}
                                    </p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                      {getFileTypeName(doc.file_type, doc.document_name)}
                                      {doc.file_size ? ` • ${(doc.file_size / 1024).toFixed(2)} KB` : ''}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {isImage && (
                                    <button 
                                      onClick={() => viewFile(doc)}
                                      className="p-2 bg-[#4CAF50] text-white rounded-lg hover:bg-[#FDA811] transition-colors"
                                      title="View document"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                  )}
                                  <a 
                                    href={doc.file_path ? `${API_BASE}/uploads/${doc.file_path.split('/').pop()}` : '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 bg-[#4A90E2] text-white rounded-lg hover:bg-[#4A90E2]/80 transition-colors"
                                    title="Download document"
                                    download
                                    onClick={(e) => {
                                      if (!doc.file_path) {
                                        e.preventDefault();
                                        alert('Download link not available');
                                      }
                                    }}
                                  >
                                    <Download className="w-4 h-4" />
                                  </a>
                                </div>
                              </div>
                            );
                          })}
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
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-6 transform transition-all">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              
              <h3 className="text-lg font-semibold text-[#4D4A4A] mb-2">
                Success!
              </h3>
              <p className="text-[#4D4A4A] text-opacity-70 mb-6">
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
                  <CheckCircle className="w-4 h-4 mr-2" />
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