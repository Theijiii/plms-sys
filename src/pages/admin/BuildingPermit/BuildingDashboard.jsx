import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import Swal from "sweetalert2";
import { Bar, Doughnut, Line } from "react-chartjs-2";
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
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
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
  RefreshCw,
  Eye,
  Printer,
  DownloadCloud,
  TrendingDown,
  User,
  Phone,
  Mail,
  CalendarDays,
  ShieldCheck,
  Users,
  MoreVertical,
  Home,
  MapPin,
  Tag,
  Building,
  Hash,
  FileType,
  Image as ImageIcon,
  File,
  ChevronRight,
  X,
  MessageSquare
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

ChartJS.register(
  CategoryScale, LinearScale, BarElement, ArcElement,
  PointElement, LineElement, Title, Tooltip, Legend, Filler
);

const isImageFile = (fileType, fileName) => {
  if (fileType) return fileType.startsWith('image/');
  if (fileName) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
    return imageExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
  }
  return false;
};

const getFileTypeName = (fileType, fileName) => {
  if (fileType) {
    if (fileType === 'application/pdf') return 'PDF Document';
    if (fileType.startsWith('image/')) return `${fileType.split('/')[1].toUpperCase()} Image`;
    if (fileType.startsWith('application/')) {
      if (fileType.includes('word')) return 'Word Document';
      if (fileType.includes('excel')) return 'Excel Spreadsheet';
    }
  }
  if (fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    const map = { pdf: 'PDF Document', jpg: 'JPEG Image', jpeg: 'JPEG Image', png: 'PNG Image', gif: 'GIF Image', doc: 'Word Document', docx: 'Word Document', txt: 'Text File', csv: 'CSV File' };
    return map[ext] || 'File';
  }
  return 'File';
};

export default function BuildingDashboard() {
  const [permits, setPermits] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPermit, setSelectedPermit] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [statusFilter, setStatusFilter] = useState("all");
  const [permitGroupFilter, setPermitGroupFilter] = useState("all");
  const [exporting, setExporting] = useState(false);
  const [exportType, setExportType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSubmittedDocs, setShowSubmittedDocs] = useState(false);
  const [actionComment, setActionComment] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const ITEMS_PER_PAGE = 8;
  const API_BASE = "/backend/building_permit";

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) { return 'N/A'; }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₱0.00';
    return '₱' + parseFloat(amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const fetchPermits = async () => {
    try {
      setLoading(true);
      setError(null);
      const url = `${API_BASE}/building_permit.php`;
      const response = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } });
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const data = await response.json();
      if (data.success) {
        const transformedData = data.data.map((p) => {
          const fullName = `${p.first_name || ''} ${p.middle_initial ? p.middle_initial + '.' : ''} ${p.last_name || ''}`.trim();
          const permitGroup = p.permit_group || 'Unknown';
          const groupShort = permitGroup.includes('GROUP') ? permitGroup.split(':')[0].trim() : permitGroup;
          return {
            id: `BP-${String(p.application_id).padStart(4, '0')}`,
            application_id: p.application_id,
            applicant_id: p.applicant_id,
            full_name: fullName || 'N/A',
            contact_number: p.contact_no || 'N/A',
            email: p.email || 'N/A',
            home_address: p.home_address || 'N/A',
            citizenship: p.citizenship || 'N/A',
            form_of_ownership: p.form_of_ownership || 'N/A',
            permit_group: permitGroup,
            permit_group_short: groupShort,
            use_of_permit: p.use_of_permit || 'N/A',
            proposed_date: p.proposed_date_of_construction,
            expected_completion: p.expected_date_of_completion,
            total_estimated_cost: p.total_estimated_cost || 0,
            remarks: p.remarks || '',
            street: p.street || '',
            barangay: p.barangay || 'N/A',
            city_municipality: p.city_municipality || 'N/A',
            province: p.province || 'N/A',
            lot_no: p.lot_no || 'N/A',
            blk_no: p.blk_no || 'N/A',
            tct_no: p.tct_no || 'N/A',
            tax_dec_no: p.tax_dec_no || 'N/A',
            number_of_units: p.number_of_units || 0,
            number_of_storeys: p.number_of_storeys || 0,
            total_floor_area: p.total_floor_area || 0,
            lot_area: p.lot_area || 0,
            building_cost: p.building_cost || 0,
            electrical_cost: p.electrical_cost || 0,
            mechanical_cost: p.mechanical_cost || 0,
            electronics_cost: p.electronics_cost || 0,
            plumbing_cost: p.plumbing_cost || 0,
            other_cost: p.other_cost || 0,
            equipment_cost: p.equipment_cost || 0,
            status: 'Pending',
            created_at: p.proposed_date_of_construction || new Date().toISOString(),
          };
        });
        setPermits(transformedData);
        setError(null);
      } else {
        throw new Error(data.message || "Failed to fetch data");
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(`Failed to load data: ${err.message}`);
      setPermits([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPermits(); }, []);

  const filteredPermits = useMemo(() => {
    let filtered = [...permits];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(f =>
        f.full_name?.toLowerCase().includes(term) ||
        f.barangay?.toLowerCase().includes(term) ||
        f.permit_group?.toLowerCase().includes(term) ||
        f.use_of_permit?.toLowerCase().includes(term) ||
        f.application_id?.toString().includes(term) ||
        f.email?.toLowerCase().includes(term)
      );
    }
    if (activeTab !== "all") {
      filtered = filtered.filter(f => f.permit_group?.toLowerCase().includes(activeTab.toLowerCase()));
    }
    if (startDate && endDate) {
      filtered = filtered.filter(f => {
        if (!f.proposed_date) return false;
        const d = new Date(f.proposed_date);
        return d >= startDate && d <= endDate;
      });
    }
    return filtered;
  }, [permits, activeTab, searchTerm, startDate, endDate]);

  const totalPages = Math.ceil(filteredPermits.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedPermits = filteredPermits.slice(startIndex, endIndex);

  const dashboardStats = useMemo(() => {
    const total = permits.length;
    const totalCost = permits.reduce((sum, p) => sum + parseFloat(p.total_estimated_cost || 0), 0);
    const avgCost = total > 0 ? totalCost / total : 0;
    const totalStoreys = permits.reduce((sum, p) => sum + parseInt(p.number_of_storeys || 0), 0);
    const avgStoreys = total > 0 ? (totalStoreys / total).toFixed(1) : 0;
    const barangayCounts = {};
    permits.forEach(f => {
      const b = f.barangay || 'Unknown';
      if (b !== 'N/A') barangayCounts[b] = (barangayCounts[b] || 0) + 1;
    });
    const topBarangay = Object.entries(barangayCounts).sort(([,a], [,b]) => b - a)[0] || ['No data', 0];
    const lastWeekCount = Math.floor(total * 0.8);
    const trend = total > 0 ? ((total - lastWeekCount) / Math.max(lastWeekCount, 1) * 100).toFixed(1) : 0;
    return { total, totalCost, avgCost, avgStoreys, trend, topBarangay: { name: topBarangay[0], count: topBarangay[1] } };
  }, [permits]);

  const barChartData = useMemo(() => {
    const barangays = [...new Set(permits.map(f => f.barangay).filter(t => t && t !== 'N/A'))];
    const topBarangays = barangays.slice(0, 6);
    return {
      labels: topBarangays.length > 0 ? topBarangays : ['No Data'],
      datasets: [{
        label: "Applications",
        data: topBarangays.length > 0 ? topBarangays.map(b => permits.filter(f => f.barangay === b).length) : [0],
        backgroundColor: "#4CAF50",
        hoverBackgroundColor: "#45a049",
        borderRadius: 8,
        borderWidth: 0,
      }]
    };
  }, [permits]);

  const pieChartData = useMemo(() => {
    const groupCounts = {};
    permits.forEach(p => {
      const g = p.permit_group_short || 'Unknown';
      groupCounts[g] = (groupCounts[g] || 0) + 1;
    });
    const sorted = Object.entries(groupCounts).sort(([,a],[,b]) => b - a).slice(0, 5);
    const colors = ['#4CAF50', '#4A90E2', '#FDA811', '#E53935', '#9C27B0'];
    return {
      labels: sorted.map(([k]) => k),
      datasets: [{
        data: sorted.map(([,v]) => v),
        backgroundColor: colors.slice(0, sorted.length),
        hoverBackgroundColor: colors.slice(0, sorted.length).map(c => c + 'cc'),
        borderColor: '#ffffff',
        borderWidth: 3,
      }]
    };
  }, [permits]);

  const monthlyData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonth = new Date().getMonth();
    const last6Months = months.slice(Math.max(0, currentMonth - 5), currentMonth + 1);
    const currentYear = new Date().getFullYear();
    const monthlyCounts = Array(last6Months.length).fill(0);
    permits.forEach(p => {
      if (!p.proposed_date) return;
      const d = new Date(p.proposed_date);
      const mi = d.getMonth();
      const y = d.getFullYear();
      if (y === currentYear && mi <= currentMonth && mi >= currentMonth - 5) {
        const idx = mi - (currentMonth - 5);
        if (idx >= 0) monthlyCounts[idx]++;
      }
    });
    return {
      labels: last6Months,
      datasets: [{
        label: "Building Permits",
        data: monthlyCounts,
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.15)',
        fill: true, tension: 0.4, borderWidth: 3,
        pointBackgroundColor: '#4CAF50', pointBorderColor: '#ffffff', pointBorderWidth: 3, pointRadius: 6, pointHoverRadius: 8,
      }]
    };
  }, [permits]);

  const costDistributionData = useMemo(() => {
    const ranges = { '< ₱1M': 0, '₱1M-₱10M': 0, '₱10M-₱100M': 0, '₱100M-₱1B': 0, '> ₱1B': 0 };
    permits.forEach(p => {
      const cost = parseFloat(p.total_estimated_cost || 0);
      if (cost < 1000000) ranges['< ₱1M']++;
      else if (cost < 10000000) ranges['₱1M-₱10M']++;
      else if (cost < 100000000) ranges['₱10M-₱100M']++;
      else if (cost < 1000000000) ranges['₱100M-₱1B']++;
      else ranges['> ₱1B']++;
    });
    return ranges;
  }, [permits]);

  const ownershipStats = useMemo(() => {
    const counts = {};
    permits.forEach(f => {
      const t = f.form_of_ownership || 'Unknown';
      counts[t] = (counts[t] || 0) + 1;
    });
    return counts;
  }, [permits]);

  const weeklyApplicationsData = useMemo(() => {
    const weeksData = [];
    const currentDate = new Date();
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(currentDate); weekStart.setDate(currentDate.getDate() - (i * 7)); weekStart.setHours(0,0,0,0);
      const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6); weekEnd.setHours(23,59,59,999);
      const count = permits.filter(f => { const d = new Date(f.created_at); return d >= weekStart && d <= weekEnd; }).length;
      weeksData.push({ label: `Week ${8 - i}`, count, weekStart, weekEnd });
    }
    return {
      labels: weeksData.map(w => w.label),
      datasets: [{ label: 'Total Applications', data: weeksData.map(w => w.count), borderColor: '#4CAF50', backgroundColor: 'rgba(76,175,80,0.1)', fill: true, tension: 0.4, borderWidth: 3, pointBackgroundColor: '#4CAF50', pointBorderColor: '#ffffff', pointBorderWidth: 2, pointRadius: 5, pointHoverRadius: 7 }],
      rawData: weeksData
    };
  }, [permits]);

  const monthlyTotalApplicationsData = useMemo(() => {
    const monthsData = [];
    const currentDate = new Date();
    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    for (let i = 11; i >= 0; i--) {
      const md = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const ms = new Date(md.getFullYear(), md.getMonth(), 1);
      const me = new Date(md.getFullYear(), md.getMonth() + 1, 0, 23,59,59,999);
      const label = `${monthNames[md.getMonth()]} ${md.getFullYear().toString().slice(-2)}`;
      const count = permits.filter(f => { const d = new Date(f.created_at); return d >= ms && d <= me; }).length;
      monthsData.push({ label, count, monthStart: ms, monthEnd: me });
    }
    return {
      labels: monthsData.map(m => m.label),
      datasets: [{ label: 'Total Applications', data: monthsData.map(m => m.count), borderColor: '#4A90E2', backgroundColor: 'rgba(74,144,226,0.1)', fill: true, tension: 0.4, borderWidth: 3, pointBackgroundColor: '#4A90E2', pointBorderColor: '#ffffff', pointBorderWidth: 2, pointRadius: 5, pointHoverRadius: 7 }],
      rawData: monthsData
    };
  }, [permits]);

  const getStatusColor = (status) => {
    switch (status) {
      case "Approved": return { text: "text-[#4CAF50]", icon: CheckCircle, badge: "text-[#4CAF50] bg-[#4CAF50]/10" };
      case "Rejected": return { text: "text-[#E53935]", icon: XCircle, badge: "text-[#E53935] bg-[#E53935]/10" };
      case "Pending": return { text: "text-[#FDA811]", icon: AlertCircle, badge: "text-[#FDA811] bg-[#FDA811]/10" };
      default: return { text: "text-[#4D4A4A]", icon: AlertCircle, badge: "text-gray-600 bg-gray-100" };
    }
  };

  const tabCategories = [
    { key: "all", label: "All Applications" },
    { key: "group b", label: "Group B" },
    { key: "group d", label: "Group D" },
    { key: "group f", label: "Group F" },
  ];

  const countByType = useMemo(() => {
    const counts = { all: permits.length };
    tabCategories.forEach(t => {
      if (t.key !== 'all') counts[t.key] = permits.filter(f => f.permit_group?.toLowerCase().includes(t.key)).length;
    });
    return counts;
  }, [permits]);

  const handleView = async (id) => {
    try {
      const permit = permits.find(f => f.id === id);
      if (permit) {
        setSelectedPermit(permit);
        setIsModalOpen(true);
      }
    } catch (err) {
      console.error('Error viewing permit:', err);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPermit(null);
    setActionComment('');
    setShowSubmittedDocs(false);
  };

  const exportToCSV = () => {
    setExporting(true); setExportType("csv");
    const headers = ["Application ID","Applicant Name","Permit Group","Use of Permit","Barangay","City","Total Estimated Cost","Storeys","Floor Area","Lot Area","Ownership","Contact","Email","Proposed Date","Expected Completion"];
    const csvContent = [headers.join(","), ...permits.map(f => [f.id, f.full_name, f.permit_group, f.use_of_permit, f.barangay, f.city_municipality, f.total_estimated_cost, f.number_of_storeys, f.total_floor_area, f.lot_area, f.form_of_ownership, f.contact_number, f.email, formatDate(f.proposed_date), formatDate(f.expected_completion)].map(field => `"${field || ''}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `building-permits-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); window.URL.revokeObjectURL(url);
    setExporting(false); setExportType("");
  };

  const exportToPDF = async () => {
    setExporting(true); setExportType("pdf");
    try {
      Swal.fire({ title: 'Generating PDF...', text: 'Please wait while we create your report', allowOutsideClick: false, allowEscapeKey: false, showConfirmButton: false, didOpen: () => { Swal.showLoading(); } });
      await new Promise(resolve => setTimeout(resolve, 500));
      const pdfContainer = document.createElement('div');
      pdfContainer.style.cssText = 'position: absolute; left: -9999px; width: 1200px; background: #FBFBFB; padding: 30px; font-family: Arial, sans-serif;';
      pdfContainer.innerHTML = `
        <div style="margin-bottom: 30px;">
          <h1 style="color: #4D4A4A; font-size: 28px; margin: 0 0 10px 0;">Building Permit Analytics</h1>
          <p style="color: #666; margin: 0;">Generated on ${new Date().toLocaleDateString()}</p>
        </div>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px;">
          ${[
            { title: 'Total Applications', value: dashboardStats.total, color: '#4CAF50' },
            { title: 'Total Est. Cost', value: formatCurrency(dashboardStats.totalCost), color: '#4A90E2' },
            { title: 'Avg Cost', value: formatCurrency(dashboardStats.avgCost), color: '#FDA811' },
            { title: 'Avg Storeys', value: dashboardStats.avgStoreys, color: '#9C27B0' }
          ].map(stat => `<div style="border: 2px solid #E9E7E7; border-radius: 8px; padding: 20px; background: white;"><p style="color: #666; font-size: 12px; margin: 0 0 10px 0;">${stat.title}</p><p style="color: ${stat.color}; font-size: 24px; font-weight: bold; margin: 0;">${stat.value}</p></div>`).join('')}
        </div>
        <div style="margin-bottom: 30px;">
          <h2 style="color: #4D4A4A; font-size: 20px; margin: 0 0 15px 0;">Permit Group Distribution</h2>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
            ${pieChartData.labels.map((label, idx) => `<div style="border: 2px solid #E9E7E7; border-radius: 8px; padding: 15px; background: white; border-left: 5px solid ${pieChartData.datasets[0].backgroundColor[idx]};"><p style="color: #4D4A4A; font-size: 14px; margin: 0 0 8px 0;">${label}</p><p style="color: #4D4A4A; font-size: 24px; font-weight: bold; margin: 0;">${pieChartData.datasets[0].data[idx]}</p></div>`).join('')}
          </div>
        </div>
        <div style="margin-bottom: 30px;">
          <h2 style="color: #4D4A4A; font-size: 20px; margin: 0 0 15px 0;">Cost Distribution</h2>
          <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px;">
            ${Object.entries(costDistributionData).map(([range, count], idx) => {
              const colors = ['#4CAF50','#4A90E2','#FDA811','#9C27B0','#E53935'];
              return `<div style="border: 2px solid #E9E7E7; border-radius: 8px; padding: 12px; background: white; border-left: 5px solid ${colors[idx]};"><p style="color: #666; font-size: 11px; margin: 0 0 5px 0;">${range}</p><p style="color: #4D4A4A; font-size: 22px; font-weight: bold; margin: 0;">${count}</p></div>`;
            }).join('')}
          </div>
        </div>
      `;
      document.body.appendChild(pdfContainer);
      await new Promise(resolve => setTimeout(resolve, 100));
      const canvas = await html2canvas(pdfContainer, { scale: 2, backgroundColor: "#FBFBFB", logging: false });
      document.body.removeChild(pdfContainer);
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight; let position = 10;
      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
      while (heightLeft > 0) { position = heightLeft - imgHeight + 10; pdf.addPage(); pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight); heightLeft -= pdfHeight; }
      pdf.save(`building-analytics-${new Date().toISOString().split("T")[0]}.pdf`);
      Swal.fire({ icon: 'success', title: 'PDF Downloaded!', text: 'Your report has been downloaded successfully.', timer: 2000, showConfirmButton: false });
    } catch (error) {
      console.error("Error generating PDF:", error);
      Swal.fire({ title: "Export Failed", text: error.message || "Failed to generate PDF.", icon: "error" });
    } finally { setExporting(false); setExportType(""); }
  };

  const handleSearch = (e) => { setSearchTerm(e.target.value); setCurrentPage(1); };
  const clearFilters = () => { setSearchTerm(""); setStatusFilter("all"); setPermitGroupFilter("all"); setDateRange([null, null]); setCurrentPage(1); };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBFBFB] p-6 flex items-center justify-center font-poppins">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4CAF50] mx-auto"></div>
          <p className="mt-4 text-[#4D4A4A]">Loading building permit analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFB] p-4 md:p-6 font-poppins" id="building-dashboard-content">
      {error && (
        <div className="mb-6 p-4 bg-[#E53935] bg-opacity-20 border border-[#E53935] border-opacity-30 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-[#E53935] mr-3" />
            <div className="flex-1"><p className="text-[#4D4A4A] font-poppins">{error}</p></div>
            <button onClick={fetchPermits} className="text-sm text-[#4CAF50] hover:underline">Retry Connection</button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#4D4A4A] font-montserrat">Building Permit Analytics</h1>
            <p className="text-[#4D4A4A] text-opacity-70 mt-2">Track and analyze building permit applications</p>
            {permits.length > 0 && <p className="text-sm text-[#4CAF50] mt-1">{permits.length} applications loaded</p>}
          </div>
          <div className="flex items-center space-x-3 mt-4 md:mt-0">
            <button onClick={fetchPermits} className="p-2 rounded-lg bg-white border border-[#E9E7E7] hover:bg-gray-50 transition-colors" title="Refresh Data"><RefreshCw className="w-5 h-5 text-[#4D4A4A]" /></button>
            <button onClick={exportToCSV} disabled={exporting || permits.length === 0} className="px-4 py-2 bg-[#4CAF50] text-white rounded-lg hover:bg-opacity-90 transition-colors flex items-center space-x-2 disabled:opacity-50 font-montserrat">
              <DownloadCloud className="w-5 h-5" /><span>{exporting && exportType === "csv" ? "Exporting CSV..." : "Export CSV"}</span>
            </button>
            <button onClick={exportToPDF} disabled={exporting || permits.length === 0} className="px-4 py-2 bg-[#E53935] text-white rounded-lg hover:bg-opacity-90 transition-colors flex items-center space-x-2 disabled:opacity-50 font-montserrat">
              <File className="w-5 h-5" /><span>{exporting && exportType === "pdf" ? "Generating PDF..." : "Export PDF"}</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { title: "Total Applications", value: dashboardStats.total, icon: FileText, color: "#4CAF50", trend: `${dashboardStats.trend}%`, trendUp: dashboardStats.trend > 0, description: `${permits.length} total permits` },
            { title: "Total Est. Cost", value: formatCurrency(dashboardStats.totalCost), icon: TrendingUp, color: "#4A90E2", trend: "+12.5%", trendUp: true, description: "Combined project cost" },
            { title: "Top Barangay", value: dashboardStats.topBarangay.name, icon: Building, color: "#FDA811", trend: `${dashboardStats.topBarangay.count} applications`, trendUp: dashboardStats.topBarangay.count > 0, description: "Most applications" },
            { title: "Avg Storeys", value: dashboardStats.avgStoreys, icon: Home, color: "#9C27B0", trend: `${permits.length} buildings`, trendUp: true, description: "Average building height" }
          ].map((stat, idx) => (
            <div key={idx} className="bg-white rounded-lg p-5 shadow-sm border border-[#E9E7E7] transition-all hover:shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#4D4A4A] text-opacity-70">{stat.title}</p>
                  <p className="text-2xl font-bold text-[#4D4A4A] mt-2 font-montserrat">{stat.value}</p>
                  <div className="mt-2">
                    <div className="flex items-center">
                      {stat.trendUp ? <TrendingUp className="w-4 h-4 text-[#4CAF50] mr-1" /> : <TrendingDown className="w-4 h-4 text-[#E53935] mr-1" />}
                      <span className={`text-sm ${stat.trendUp ? 'text-[#4CAF50]' : 'text-[#E53935]'}`}>{stat.trend}</span>
                    </div>
                    <span className="text-xs text-[#4D4A4A] text-opacity-60">{stat.description}</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: stat.color }}><stat.icon className="w-6 h-6 text-white" /></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-[#E9E7E7]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#4D4A4A] text-opacity-50 w-5 h-5" />
                <input type="text" placeholder="Search by name, barangay, permit group, email..." className="w-full pl-10 pr-4 py-2 rounded-lg border border-[#E9E7E7] bg-white text-[#4D4A4A] focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent font-poppins" value={searchTerm} onChange={handleSearch} />
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="relative">
                <DatePicker selectsRange={true} startDate={startDate} endDate={endDate} onChange={(update) => { setDateRange(update); setCurrentPage(1); }} className="px-4 py-2 rounded-lg border border-[#E9E7E7] bg-white text-[#4D4A4A] focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent font-poppins w-full md:w-auto" placeholderText="Select date range" />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#4D4A4A] text-opacity-50 w-5 h-5 pointer-events-none" />
              </div>
              {(searchTerm || startDate || endDate) && (
                <button onClick={clearFilters} className="px-4 py-2 text-sm text-[#4D4A4A] hover:text-[#4CAF50] hover:bg-[#FBFBFB] rounded-lg transition-colors font-poppins">Clear Filters</button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      {permits.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-white rounded-lg p-5 shadow-sm border border-[#E9E7E7]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-[#4D4A4A] font-montserrat">Monthly Permit Trends</h3>
                <p className="text-sm text-[#4D4A4A] text-opacity-70">Building permit applications over time</p>
              </div>
            </div>
            <div className="h-[300px]">
              <Line data={monthlyData} options={{ maintainAspectRatio: false, responsive: true, plugins: { legend: { display: false } }, scales: { x: { grid: { color: 'rgba(233,231,231,0.5)' }, ticks: { color: '#4D4A4A', font: { family: 'Poppins' } } }, y: { grid: { color: 'rgba(233,231,231,0.5)' }, ticks: { color: '#4D4A4A', font: { family: 'Poppins' } } } } }} />
            </div>
          </div>
          <div className="bg-white rounded-lg p-5 shadow-sm border border-[#E9E7E7]">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-[#4D4A4A] font-montserrat">Permit Group Distribution</h3>
              <p className="text-sm text-[#4D4A4A] text-opacity-70">By permit classification</p>
            </div>
            <div className="h-[250px] flex items-center justify-center">
              <Doughnut data={pieChartData} options={{ maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'bottom', labels: { color: '#4D4A4A', padding: 20, usePointStyle: true, font: { family: 'Poppins' } } } } }} />
            </div>
          </div>
        </div>
      )}

      {/* Cost & Ownership Insights */}
      {permits.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg p-5 shadow-sm border border-[#E9E7E7]">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-[#4D4A4A] font-montserrat">Cost Distribution</h3>
              <p className="text-sm text-[#4D4A4A] text-opacity-70">Estimated project cost breakdown</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {Object.entries(costDistributionData).map(([range, count], idx) => {
                const colors = ['#4CAF50','#4A90E2','#FDA811','#9C27B0','#E53935'];
                const percentage = permits.length > 0 ? ((count / permits.length) * 100).toFixed(1) : 0;
                return (
                  <div key={range} className="p-4 rounded-lg border-2 border-[#E9E7E7] hover:shadow-md transition-all" style={{ borderLeftColor: colors[idx], borderLeftWidth: '4px' }}>
                    <p className="text-xs text-[#4D4A4A] text-opacity-70 mb-1 font-poppins">{range}</p>
                    <p className="text-2xl font-bold text-[#4D4A4A] font-montserrat mb-1">{count}</p>
                    <div className="flex items-center">
                      <div className="flex-1 bg-[#E9E7E7] rounded-full h-1.5 mr-2"><div className="h-1.5 rounded-full" style={{ width: `${percentage}%`, backgroundColor: colors[idx] }}></div></div>
                      <span className="text-xs text-[#4D4A4A] text-opacity-70">{percentage}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bg-white rounded-lg p-5 shadow-sm border border-[#E9E7E7]">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-[#4D4A4A] font-montserrat">Ownership Type Distribution</h3>
              <p className="text-sm text-[#4D4A4A] text-opacity-70">Breakdown by form of ownership</p>
            </div>
            <div className="space-y-3">
              {Object.entries(ownershipStats).map(([type, count], idx) => {
                const percentage = ((count / permits.length) * 100).toFixed(1);
                const colors = ['#4CAF50','#4A90E2','#FDA811','#9C27B0','#E53935'];
                const color = colors[idx % colors.length];
                return (
                  <div key={type} className="relative">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-[#4D4A4A] font-poppins">{type}</span>
                      <span className="text-sm font-bold text-[#4D4A4A] font-montserrat">{count}</span>
                    </div>
                    <div className="w-full bg-[#E9E7E7] rounded-full h-2.5"><div className="h-2.5 rounded-full transition-all" style={{ width: `${percentage}%`, backgroundColor: color }}></div></div>
                    <span className="text-xs text-[#4D4A4A] text-opacity-70 mt-1">{percentage}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Barangay Chart */}
      {permits.length > 0 && barChartData.labels[0] !== 'No Data' && (
        <div className="mb-6 bg-white rounded-lg p-5 shadow-sm border border-[#E9E7E7]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-[#4D4A4A] font-montserrat">Top Barangays</h3>
              <p className="text-sm text-[#4D4A4A] text-opacity-70">Application distribution by barangay</p>
            </div>
          </div>
          <div className="h-[300px]">
            <Bar data={barChartData} options={{ maintainAspectRatio: false, responsive: true, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#4D4A4A', font: { family: 'Poppins' } }, grid: { color: 'rgba(233,231,231,0.5)' } }, y: { ticks: { color: '#4D4A4A', font: { family: 'Poppins' } }, grid: { color: 'rgba(233,231,231,0.5)' }, beginAtZero: true } } }} />
          </div>
        </div>
      )}

      {/* Weekly & Monthly Trends */}
      {permits.length > 0 && (
        <div className="mb-6 bg-white rounded-lg p-5 shadow-sm border border-[#E9E7E7]">
          <div className="mb-6"><h3 className="text-lg font-semibold text-[#4D4A4A] font-montserrat">Weekly Applications Trend</h3><p className="text-sm text-[#4D4A4A] text-opacity-70">Last 8 weeks</p></div>
          <div className="h-[300px]">
            <Line data={weeklyApplicationsData} options={{ maintainAspectRatio: false, responsive: true, plugins: { legend: { display: true, position: 'top', labels: { color: '#4D4A4A', font: { family: 'Poppins' } } }, tooltip: { callbacks: { title: (ctx) => { const w = weeklyApplicationsData.rawData[ctx[0].dataIndex]; return `${w.label}: ${new Date(w.weekStart).toLocaleDateString()} - ${new Date(w.weekEnd).toLocaleDateString()}`; } } } }, scales: { x: { ticks: { color: '#4D4A4A', font: { family: 'Poppins' } }, grid: { color: 'rgba(233,231,231,0.5)' } }, y: { ticks: { color: '#4D4A4A', font: { family: 'Poppins' }, stepSize: 1 }, grid: { color: 'rgba(233,231,231,0.5)' }, beginAtZero: true } } }} />
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

      {permits.length > 0 && (
        <div className="mb-6 bg-white rounded-lg p-5 shadow-sm border border-[#E9E7E7]">
          <div className="mb-6"><h3 className="text-lg font-semibold text-[#4D4A4A] font-montserrat">Monthly Applications Trend</h3><p className="text-sm text-[#4D4A4A] text-opacity-70">Last 12 months</p></div>
          <div className="h-[300px]">
            <Line data={monthlyTotalApplicationsData} options={{ maintainAspectRatio: false, responsive: true, plugins: { legend: { display: true, position: 'top', labels: { color: '#4D4A4A', font: { family: 'Poppins' } } } }, scales: { x: { ticks: { color: '#4D4A4A', font: { family: 'Poppins' } }, grid: { color: 'rgba(233,231,231,0.5)' } }, y: { ticks: { color: '#4D4A4A', font: { family: 'Poppins' }, stepSize: 1 }, grid: { color: 'rgba(233,231,231,0.5)' }, beginAtZero: true } } }} />
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

      {/* Applications Table */}
      {permits.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-[#E9E7E7] overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-[#4D4A4A] font-montserrat">Applications List</h3>
                <p className="text-sm text-[#4D4A4A] text-opacity-70">Showing {startIndex + 1}-{Math.min(endIndex, filteredPermits.length)} of {filteredPermits.length} applications</p>
              </div>
              <button onClick={() => window.print()} className="px-3 py-2 text-sm border border-[#E9E7E7] rounded-lg hover:bg-[#FBFBFB] transition-colors flex items-center font-poppins" title="Print Report"><Printer className="w-4 h-4 mr-2" />Print</button>
            </div>
            <nav className="flex space-x-6">
              {tabCategories.map((tab) => (
                <button key={tab.key} onClick={() => { setActiveTab(tab.key); setCurrentPage(1); }} className={`py-2 px-3 border-b-2 font-medium text-sm flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === tab.key ? "border-[#4CAF50] text-[#4CAF50]" : "border-transparent text-[#4D4A4A] hover:text-[#4CAF50]"}`}>
                  {tab.label}
                  <span className={`px-2 py-1 text-xs rounded-full ${activeTab === tab.key ? "bg-[#4CAF50] text-white" : "bg-[#FBFBFB] text-[#4D4A4A] border border-[#E9E7E7]"}`}>{countByType[tab.key] || 0}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#FBFBFB]">
                <tr>
                  {["Application ID","Applicant","Permit Group","Use of Permit","Barangay","Est. Cost","Storeys","Date","Actions"].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-[#4D4A4A] uppercase tracking-wider font-montserrat">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9E7E7]">
                {paginatedPermits.length > 0 ? paginatedPermits.map((permit, index) => (
                  <tr key={index} className="hover:bg-[#FBFBFB] transition-colors">
                    <td className="px-6 py-4"><div className="font-mono text-sm text-[#4D4A4A] font-medium">{permit.id}</div></td>
                    <td className="px-6 py-4"><div><p className="font-medium text-[#4D4A4A] font-montserrat">{permit.full_name}</p><p className="text-sm text-[#4D4A4A] text-opacity-70 font-poppins">{permit.contact_number}</p></div></td>
                    <td className="px-6 py-4"><span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">{permit.permit_group_short}</span></td>
                    <td className="px-6 py-4 text-[#4D4A4A] font-poppins">{permit.use_of_permit}</td>
                    <td className="px-6 py-4 text-[#4D4A4A] font-poppins">{permit.barangay}</td>
                    <td className="px-6 py-4 text-[#4D4A4A] font-poppins font-medium">{formatCurrency(permit.total_estimated_cost)}</td>
                    <td className="px-6 py-4 text-[#4D4A4A] font-poppins">{permit.number_of_storeys}</td>
                    <td className="px-6 py-4"><div className="text-sm text-[#4D4A4A] text-opacity-70 font-poppins">{formatDate(permit.proposed_date)}</div></td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleView(permit.id)} title="View Details" className="p-2 bg-[#4A90E2] text-white rounded-lg hover:bg-[#FDA811]/80 transition-colors"><Eye className="w-5 h-5" /></button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="9" className="px-6 py-12 text-center">
                    <Building className="w-12 h-12 text-[#E9E7E7] mx-auto mb-4" />
                    <p className="text-[#4D4A4A] text-opacity-70">{permits.length === 0 ? "No applications found." : "No applications match your filters"}</p>
                    {permits.length > 0 && <button onClick={clearFilters} className="mt-4 px-4 py-2 border border-[#E9E7E7] text-[#4D4A4A] rounded-lg hover:bg-[#FBFBFB] transition-colors font-poppins">Clear Filters</button>}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>

          {filteredPermits.length > ITEMS_PER_PAGE && (
            <div className="p-5 border-t border-[#E9E7E7]">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[#4D4A4A] text-opacity-70 font-poppins">Page {currentPage} of {totalPages}</p>
                <div className="flex items-center space-x-2">
                  <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-3 py-2 text-sm border border-[#E9E7E7] rounded-lg hover:bg-[#FBFBFB] transition-colors disabled:opacity-50 font-poppins">Previous</button>
                  <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="px-3 py-2 text-sm border border-[#E9E7E7] rounded-lg hover:bg-[#FBFBFB] transition-colors disabled:opacity-50 font-poppins">Next</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Building Permit Details Modal */}
      {isModalOpen && selectedPermit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 overflow-auto animate-fadeIn">
          <div className="w-full max-w-7xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl transform transition-all">
            <div className="relative p-6 bg-gradient-to-r from-gray-50 via-white to-gray-50 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 border-b-4 border-[#4CAF50]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-[#4CAF50] to-[#45a049] p-3 rounded-2xl shadow-xl"><Building className="w-10 h-10 text-white" /></div>
                  <div><h2 className="text-2xl font-bold text-gray-800 dark:text-white">Building Permit</h2><p className="text-sm text-gray-500 dark:text-gray-400">Application Details</p></div>
                </div>
                <button onClick={closeModal} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"><X className="w-6 h-6" /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md border-l-4 border-blue-500">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Application ID</p>
                  <p className="text-lg font-bold text-gray-800 dark:text-white font-mono">{selectedPermit.id}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md border-l-4 border-purple-500">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Proposed Date</p>
                  <p className="text-lg font-bold text-gray-800 dark:text-white">{formatDate(selectedPermit.proposed_date)}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md border-l-4 border-green-500">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Est. Cost</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(selectedPermit.total_estimated_cost)}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md border-l-4 border-orange-500">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Permit Group</p>
                  <span className="px-3 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-700">{selectedPermit.permit_group_short}</span>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-8 max-h-[80vh] overflow-y-auto bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-800">
              {/* Personal Information */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border-2 border-blue-100 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg"><User className="w-6 h-6 text-white" /></div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Applicant Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { label: "Full Name", value: selectedPermit.full_name },
                    { label: "Contact Number", value: selectedPermit.contact_number },
                    { label: "Email Address", value: selectedPermit.email },
                    { label: "Home Address", value: selectedPermit.home_address },
                    { label: "Citizenship", value: selectedPermit.citizenship },
                    { label: "Form of Ownership", value: selectedPermit.form_of_ownership },
                  ].map((item, idx) => (
                    <div key={idx}><label className="text-sm font-medium text-gray-500">{item.label}</label><p className="text-gray-900 dark:text-white mt-1">{item.value}</p></div>
                  ))}
                </div>
              </div>

              {/* Project Site */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border-2 border-green-100 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl shadow-lg"><MapPin className="w-6 h-6 text-white" /></div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Project Site</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { label: "Street", value: selectedPermit.street },
                    { label: "Barangay", value: selectedPermit.barangay },
                    { label: "City/Municipality", value: selectedPermit.city_municipality },
                    { label: "Province", value: selectedPermit.province },
                    { label: "Lot No.", value: selectedPermit.lot_no },
                    { label: "Block No.", value: selectedPermit.blk_no },
                    { label: "TCT No.", value: selectedPermit.tct_no },
                    { label: "Tax Dec. No.", value: selectedPermit.tax_dec_no },
                  ].map((item, idx) => (
                    <div key={idx}><label className="text-sm font-medium text-gray-500">{item.label}</label><p className="text-gray-900 dark:text-white mt-1">{item.value}</p></div>
                  ))}
                </div>
              </div>

              {/* Building Details */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border-2 border-orange-100 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-3 rounded-xl shadow-lg"><Building className="w-6 h-6 text-white" /></div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Building Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { label: "Permit Group", value: selectedPermit.permit_group },
                    { label: "Use of Permit", value: selectedPermit.use_of_permit },
                    { label: "Number of Storeys", value: selectedPermit.number_of_storeys },
                    { label: "Number of Units", value: selectedPermit.number_of_units },
                    { label: "Total Floor Area", value: `${selectedPermit.total_floor_area} sqm` },
                    { label: "Lot Area", value: `${selectedPermit.lot_area} sqm` },
                    { label: "Proposed Start", value: formatDate(selectedPermit.proposed_date) },
                    { label: "Expected Completion", value: formatDate(selectedPermit.expected_completion) },
                  ].map((item, idx) => (
                    <div key={idx}><label className="text-sm font-medium text-gray-500">{item.label}</label><p className="text-gray-900 dark:text-white mt-1">{item.value}</p></div>
                  ))}
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-slate-800 dark:to-slate-700 rounded-2xl shadow-lg p-6 border-2 border-green-200 dark:border-slate-600">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-xl shadow-lg"><FileText className="w-6 h-6 text-white" /></div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Project Cost Breakdown</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: "Building Cost", value: selectedPermit.building_cost, color: "green" },
                    { label: "Electrical Cost", value: selectedPermit.electrical_cost, color: "blue" },
                    { label: "Mechanical Cost", value: selectedPermit.mechanical_cost, color: "orange" },
                    { label: "Electronics Cost", value: selectedPermit.electronics_cost, color: "purple" },
                    { label: "Plumbing Cost", value: selectedPermit.plumbing_cost, color: "cyan" },
                    { label: "Equipment Cost", value: selectedPermit.equipment_cost, color: "indigo" },
                  ].map((item, idx) => (
                    <div key={idx} className={`bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md border-l-4 border-${item.color}-500`}>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{item.label}</label>
                      <p className="text-xl font-black text-gray-800 mt-2">{formatCurrency(item.value)}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-white dark:bg-slate-800 rounded-xl border-2 border-dashed border-green-300">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-700 dark:text-gray-300">Total Estimated Cost:</span>
                    <span className="text-3xl font-black text-green-600">{formatCurrency(selectedPermit.total_estimated_cost)}</span>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              {selectedPermit.remarks && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border-2 border-yellow-100 dark:border-slate-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Remarks</h3>
                  <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4 border border-gray-200 dark:border-slate-600">
                    <p className="text-gray-900 dark:text-white">{selectedPermit.remarks}</p>
                  </div>
                </div>
              )}

              {/* Close Button */}
              <div className="flex justify-end pt-8 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-700 rounded-2xl p-6 border-t-4 border-gray-300 dark:border-slate-600">
                <button onClick={closeModal} className="px-8 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all font-medium shadow-md hover:shadow-lg flex items-center gap-2"><X className="w-5 h-5" />Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4"><CheckCircle className="h-10 w-10 text-green-600" /></div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Success!</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">{successMessage}</p>
              <button onClick={() => { setShowSuccessModal(false); setSuccessMessage(''); }} className="px-6 py-2 bg-[#4CAF50] text-white rounded-lg hover:bg-[#4CAF50]/80 transition-colors font-medium flex items-center mx-auto"><CheckCircle className="w-4 h-4 mr-2" />Continue</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}