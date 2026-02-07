import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import Swal from "sweetalert2";
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
  Home,
  MapPin,
  Building,
  Image as ImageIcon,
  File,
  ChevronRight,
  ChevronDown,
  X,
  MessageSquare,
  MoreVertical,
  Filter,
  ArrowUpDown,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from "lucide-react";

export default function BuildingPermitApplication() {
  const [permits, setPermits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedPermit, setSelectedPermit] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionComment, setActionComment] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("application_id");
  const [sortDirection, setSortDirection] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [showSubmittedDocs, setShowSubmittedDocs] = useState(false);
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [exporting, setExporting] = useState(false);
  const [exportType, setExportType] = useState("");
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const actionsRef = useRef(null);

  const ITEMS_PER_PAGE = 10;
  const API_BASE = "/backend/building_permit";

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
    }
    if (fileName) {
      const ext = fileName.split('.').pop().toLowerCase();
      const map = { pdf: 'PDF Document', jpg: 'JPEG Image', jpeg: 'JPEG Image', png: 'PNG Image', gif: 'GIF Image' };
      return map[ext] || 'File';
    }
    return 'File';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try { return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
    catch (e) { return 'N/A'; }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₱0.00';
    return '₱' + parseFloat(amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const fetchPermits = useCallback(async () => {
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
      } else { throw new Error(data.message || "Failed to fetch data"); }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(`Failed to load data: ${err.message}`);
      setPermits([]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPermits(); }, [fetchPermits]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (actionsRef.current && !actionsRef.current.contains(e.target)) setShowActionsDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "Approved": return "text-[#4CAF50] bg-[#4CAF50]/10";
      case "Rejected": return "text-[#E53935] bg-[#E53935]/10";
      case "Pending": return "text-[#FDA811] bg-[#FDA811]/10";
      case "Under Review": return "text-[#4A90E2] bg-[#4A90E2]/10";
      default: return "text-gray-600 bg-gray-100";
    }
  };

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
        f.email?.toLowerCase().includes(term) ||
        f.id?.toLowerCase().includes(term)
      );
    }
    if (activeTab !== "all") {
      filtered = filtered.filter(f => f.permit_group?.toLowerCase().includes(activeTab.toLowerCase()));
    }
    if (sortField) {
      filtered.sort((a, b) => {
        let valA = a[sortField] || '';
        let valB = b[sortField] || '';
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [permits, searchTerm, activeTab, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredPermits.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedPermits = filteredPermits.slice(startIndex, endIndex);

  const stats = useMemo(() => ({
    total: permits.length,
    pending: permits.filter(p => p.status === 'Pending').length,
    approved: permits.filter(p => p.status === 'Approved').length,
    rejected: permits.filter(p => p.status === 'Rejected').length,
  }), [permits]);

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

  const handleView = (permit) => {
    setSelectedPermit(permit);
    setShowModal(true);
    setActionComment('');
    setShowSubmittedDocs(false);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPermit(null);
    setActionComment('');
    setShowSubmittedDocs(false);
    setShowFilePreview(false);
    setSelectedFile(null);
    setShowActionsDropdown(false);
  };

  const toggleSubmittedDocs = () => setShowSubmittedDocs(!showSubmittedDocs);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleApprove = async () => {
    if (!selectedPermit) return;

    const result = await Swal.fire({
      title: 'Approve Permit?',
      html: `
        <div class="text-left">
          <p class="mb-2">You are about to approve this building permit application:</p>
          <div class="bg-gray-50 p-3 rounded-lg mb-3">
            <p class="text-sm"><strong>Application ID:</strong> ${selectedPermit.id}</p>
            <p class="text-sm"><strong>Applicant:</strong> ${selectedPermit.full_name}</p>
            <p class="text-sm"><strong>Permit Group:</strong> ${selectedPermit.permit_group}</p>
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
      setPermits(prev => prev.map(p => p.id === selectedPermit.id ? { ...p, status: 'Approved', remarks: notes || p.remarks } : p));
      setSelectedPermit(prev => ({ ...prev, status: 'Approved', remarks: notes || prev.remarks }));
      setActionComment('');
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Permit approved successfully!',
        confirmButtonColor: '#4CAF50',
        timer: 2000,
        showConfirmButton: true
      });
    }
  };

  const handleReject = async () => {
    if (!selectedPermit) return;

    const result = await Swal.fire({
      title: 'Reject Application?',
      html: `
        <div class="text-left">
          <p class="mb-2">You are about to reject this building permit application:</p>
          <div class="bg-gray-50 p-3 rounded-lg mb-3">
            <p class="text-sm"><strong>Application ID:</strong> ${selectedPermit.id}</p>
            <p class="text-sm"><strong>Applicant:</strong> ${selectedPermit.full_name}</p>
            <p class="text-sm"><strong>Permit Group:</strong> ${selectedPermit.permit_group}</p>
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
      setPermits(prev => prev.map(p => p.id === selectedPermit.id ? { ...p, status: 'Rejected', remarks: result.value || p.remarks } : p));
      setSelectedPermit(prev => ({ ...prev, status: 'Rejected', remarks: result.value || prev.remarks }));
      setActionComment('');
      Swal.fire({
        icon: 'success',
        title: 'Application Rejected',
        text: 'The permit has been rejected.',
        confirmButtonColor: '#E53935',
        timer: 2000,
        showConfirmButton: true
      });
    }
  };

  const handleStatusUpdate = async (status, title, message, color = '#4CAF50') => {
    if (!selectedPermit) return;

    const result = await Swal.fire({
      title: title,
      html: `
        <div class="text-left">
          <p class="mb-2">${message}</p>
          <div class="bg-gray-50 p-3 rounded-lg mb-3">
            <p class="text-sm"><strong>Application ID:</strong> ${selectedPermit.id}</p>
            <p class="text-sm"><strong>Applicant:</strong> ${selectedPermit.full_name}</p>
            <p class="text-sm"><strong>Permit Group:</strong> ${selectedPermit.permit_group}</p>
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
      }
    });

    if (result.isConfirmed) {
      const notes = result.value || '';
      setPermits(prev => prev.map(p => p.id === selectedPermit.id ? { ...p, status: status, remarks: notes || p.remarks } : p));
      setSelectedPermit(prev => ({ ...prev, status: status, remarks: notes || prev.remarks }));
      setActionComment('');
      Swal.fire({
        icon: 'success',
        title: 'Status Updated!',
        text: `Status changed to ${status}`,
        confirmButtonColor: color,
        timer: 2000,
        showConfirmButton: true
      });
    }
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 25, 300));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 25, 25));
  const handleResetZoom = () => { setZoomLevel(100); setDragOffset({ x: 0, y: 0 }); };

  const handleMouseDown = (e) => { if (zoomLevel > 100) { setIsDragging(true); setDragStart({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y }); } };
  const handleMouseMove = (e) => { if (isDragging) setDragOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }); };
  const handleMouseUp = () => setIsDragging(false);

  const viewFile = (file) => {
    setSelectedFile(file);
    setShowFilePreview(true);
    setZoomLevel(100);
    setDragOffset({ x: 0, y: 0 });
  };

  const exportToCSV = () => {
    setExporting(true); setExportType("csv");
    const headers = ["Application ID","Applicant","Permit Group","Use of Permit","Barangay","City","Est. Cost","Storeys","Floor Area","Contact","Email","Proposed Date"];
    const csvContent = [headers.join(","), ...filteredPermits.map(f => [f.id, f.full_name, f.permit_group, f.use_of_permit, f.barangay, f.city_municipality, f.total_estimated_cost, f.number_of_storeys, f.total_floor_area, f.contact_number, f.email, formatDate(f.proposed_date)].map(field => `"${field || ''}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `building-applications-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); window.URL.revokeObjectURL(url);
    setExporting(false); setExportType("");
  };

  const exportToPDF = async () => {
    setExporting(true); setExportType("pdf");
    try {
      Swal.fire({ title: 'Generating PDF...', text: 'Please wait...', allowOutsideClick: false, showConfirmButton: false, didOpen: () => Swal.showLoading() });
      await new Promise(r => setTimeout(r, 300));
      const pdfContainer = document.createElement('div');
      pdfContainer.style.cssText = 'position:absolute;left:-9999px;width:1200px;background:#FBFBFB;padding:30px;font-family:Arial,sans-serif;';
      pdfContainer.innerHTML = `
        <div style="margin-bottom:20px;">
          <h1 style="color:#4D4A4A;font-size:24px;margin:0 0 5px 0;">Building Permit Applications Report</h1>
          <p style="color:#666;margin:0;">Generated on ${new Date().toLocaleDateString()} • ${filteredPermits.length} applications</p>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px;">
          ${[
            { title: 'Total', value: stats.total, color: '#4CAF50' },
            { title: 'Pending', value: stats.pending, color: '#FDA811' },
            { title: 'Approved', value: stats.approved, color: '#4A90E2' },
            { title: 'Rejected', value: stats.rejected, color: '#E53935' }
          ].map(s => `<div style="border:2px solid #E9E7E7;border-radius:8px;padding:15px;background:white;"><p style="color:#666;font-size:11px;margin:0 0 5px 0;">${s.title}</p><p style="color:${s.color};font-size:22px;font-weight:bold;margin:0;">${s.value}</p></div>`).join('')}
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:11px;">
          <thead><tr style="background:#f5f5f5;">
            ${["ID","Applicant","Permit Group","Use","Barangay","Est. Cost","Status"].map(h => `<th style="padding:8px;border:1px solid #ddd;text-align:left;">${h}</th>`).join('')}
          </tr></thead>
          <tbody>
            ${filteredPermits.slice(0, 50).map(f => `<tr>${[f.id, f.full_name, f.permit_group_short, f.use_of_permit, f.barangay, formatCurrency(f.total_estimated_cost), f.status].map(v => `<td style="padding:6px;border:1px solid #ddd;">${v || ''}</td>`).join('')}</tr>`).join('')}
          </tbody>
        </table>
      `;
      document.body.appendChild(pdfContainer);
      await new Promise(r => setTimeout(r, 100));
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
      pdf.save(`building-applications-${new Date().toISOString().split("T")[0]}.pdf`);
      Swal.fire({ icon: 'success', title: 'PDF Downloaded!', timer: 2000, showConfirmButton: false });
    } catch (error) {
      console.error("PDF error:", error);
      Swal.fire({ title: "Export Failed", text: error.message, icon: "error" });
    } finally { setExporting(false); setExportType(""); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBFBFB] p-6 flex items-center justify-center font-poppins">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4CAF50] mx-auto"></div>
          <p className="mt-4 text-[#4D4A4A]">Loading building permit applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFB] p-4 md:p-6 font-poppins">
      {error && (
        <div className="mb-6 p-4 bg-[#E53935] bg-opacity-20 border border-[#E53935] border-opacity-30 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-[#E53935] mr-3" />
            <div className="flex-1"><p className="text-[#4D4A4A]">{error}</p></div>
            <button onClick={fetchPermits} className="text-sm text-[#4CAF50] hover:underline">Retry</button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#4D4A4A] font-montserrat">Building Permit Applications</h1>
            <p className="text-[#4D4A4A] text-opacity-70 mt-1">Manage and review building permit applications</p>
          </div>
          <div className="flex items-center space-x-3 mt-4 md:mt-0">
            <button onClick={fetchPermits} className="p-2 rounded-lg bg-white border border-[#E9E7E7] hover:bg-gray-50 transition-colors" title="Refresh"><RefreshCw className="w-5 h-5 text-[#4D4A4A]" /></button>
            <button onClick={exportToCSV} disabled={exporting} className="px-4 py-2 bg-[#4CAF50] text-white rounded-lg hover:bg-opacity-90 transition-colors flex items-center space-x-2 disabled:opacity-50 font-montserrat">
              <DownloadCloud className="w-5 h-5" /><span>{exporting && exportType === "csv" ? "Exporting..." : "CSV"}</span>
            </button>
            <button onClick={exportToPDF} disabled={exporting} className="px-4 py-2 bg-[#E53935] text-white rounded-lg hover:bg-opacity-90 transition-colors flex items-center space-x-2 disabled:opacity-50 font-montserrat">
              <File className="w-5 h-5" /><span>{exporting && exportType === "pdf" ? "Generating..." : "PDF"}</span>
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { title: "Total", value: stats.total, icon: FileText, color: "#4CAF50" },
            { title: "Pending", value: stats.pending, icon: Clock, color: "#FDA811" },
            { title: "Approved", value: stats.approved, icon: CheckCircle, color: "#4A90E2" },
            { title: "Rejected", value: stats.rejected, icon: XCircle, color: "#E53935" },
          ].map((s, idx) => (
            <div key={idx} className="bg-white rounded-lg p-4 shadow-sm border border-[#E9E7E7]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#4D4A4A] text-opacity-70 font-poppins">{s.title}</p>
                  <p className="text-2xl font-bold text-[#4D4A4A] mt-1 font-montserrat">{s.value}</p>
                </div>
                <div className="p-2 rounded-lg" style={{ backgroundColor: s.color }}><s.icon className="w-5 h-5 text-white" /></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="mb-6 bg-white rounded-lg p-4 shadow-sm border border-[#E9E7E7]">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#4D4A4A] text-opacity-50 w-5 h-5" />
            <input type="text" placeholder="Search by name, barangay, permit group, email..." className="w-full pl-10 pr-4 py-2 rounded-lg border border-[#E9E7E7] bg-white text-[#4D4A4A] focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent font-poppins" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
          </div>
        </div>
      </div>

      {/* Tab Navigation & Table */}
      <div className="bg-white rounded-lg shadow-sm border border-[#E9E7E7] overflow-hidden">
        <div className="p-6 border-b border-[#E9E7E7]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-[#4D4A4A] font-montserrat">Applications</h3>
              <p className="text-sm text-[#4D4A4A] text-opacity-70">Showing {startIndex + 1}-{Math.min(endIndex, filteredPermits.length)} of {filteredPermits.length}</p>
            </div>
          </div>
          <nav className="flex space-x-4 overflow-x-auto">
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
                {[
                  { key: "application_id", label: "ID" },
                  { key: "full_name", label: "Applicant" },
                  { key: "permit_group", label: "Permit Group" },
                  { key: "use_of_permit", label: "Use" },
                  { key: "barangay", label: "Barangay" },
                  { key: "total_estimated_cost", label: "Est. Cost" },
                  { key: "status", label: "Status" },
                  { key: null, label: "Actions" },
                ].map((col) => (
                  <th key={col.label} className="px-6 py-3 text-left text-xs font-medium text-[#4D4A4A] uppercase tracking-wider font-montserrat">
                    {col.key ? (
                      <button onClick={() => handleSort(col.key)} className="flex items-center gap-1 hover:text-[#4CAF50] transition-colors">
                        {col.label}
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    ) : col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9E7E7]">
              {paginatedPermits.length > 0 ? paginatedPermits.map((permit) => (
                <tr key={permit.id} className="hover:bg-[#FBFBFB] transition-colors">
                  <td className="px-6 py-4"><span className="font-mono text-sm text-[#4D4A4A]">{permit.id}</span></td>
                  <td className="px-6 py-4">
                    <div><p className="font-medium text-[#4D4A4A] font-montserrat">{permit.full_name}</p><p className="text-sm text-[#4D4A4A] text-opacity-70">{permit.email}</p></div>
                  </td>
                  <td className="px-6 py-4"><span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">{permit.permit_group_short}</span></td>
                  <td className="px-6 py-4 text-[#4D4A4A] text-sm">{permit.use_of_permit}</td>
                  <td className="px-6 py-4 text-[#4D4A4A] text-sm">{permit.barangay}</td>
                  <td className="px-6 py-4 text-[#4D4A4A] text-sm font-medium">{formatCurrency(permit.total_estimated_cost)}</td>
                  <td className="px-6 py-4"><span className={`px-3 py-1 text-xs font-bold rounded-full ${getStatusColor(permit.status)}`}>{permit.status}</span></td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleView(permit)} title="View Details" className="p-2 bg-[#4A90E2] text-white rounded-lg hover:bg-[#FDA811]/80 transition-colors"><Eye className="w-5 h-5" /></button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="8" className="px-6 py-12 text-center">
                  <Building className="w-12 h-12 text-[#E9E7E7] mx-auto mb-4" />
                  <p className="text-[#4D4A4A] text-opacity-70">No applications match your search</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredPermits.length > ITEMS_PER_PAGE && (
          <div className="p-5 border-t border-[#E9E7E7]">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#4D4A4A] text-opacity-70">Page {currentPage} of {totalPages}</p>
              <div className="flex items-center space-x-2">
                <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-3 py-2 text-sm border border-[#E9E7E7] rounded-lg hover:bg-[#FBFBFB] transition-colors disabled:opacity-50">Previous</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const page = currentPage <= 3 ? i + 1 : currentPage + i - 2;
                  if (page < 1 || page > totalPages) return null;
                  return (
                    <button key={page} onClick={() => setCurrentPage(page)} className={`px-3 py-2 text-sm rounded-lg transition-colors ${currentPage === page ? 'bg-[#4CAF50] text-white' : 'border border-[#E9E7E7] hover:bg-[#FBFBFB]'}`}>{page}</button>
                  );
                })}
                <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="px-3 py-2 text-sm border border-[#E9E7E7] rounded-lg hover:bg-[#FBFBFB] transition-colors disabled:opacity-50">Next</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Modal */}
      {showModal && selectedPermit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 overflow-auto animate-fadeIn">
          <div className="w-full max-w-7xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl transform transition-all">
            {/* Modal Header */}
            <div className="relative p-6 bg-gradient-to-r from-gray-50 via-white to-gray-50 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 border-b-4 border-[#4CAF50]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-[#4CAF50] to-[#45a049] p-3 rounded-2xl shadow-xl"><Building className="w-10 h-10 text-white" /></div>
                  <div><h2 className="text-2xl font-bold text-gray-800 dark:text-white">Building Permit Application</h2><p className="text-sm text-gray-500">Review and process application</p></div>
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
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Status</p>
                  <span className={`inline-block px-3 py-1 text-sm font-bold rounded-full ${getStatusColor(selectedPermit.status)}`}>{selectedPermit.status}</span>
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
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-slate-700 dark:to-slate-600 p-4 rounded-xl">
                    <label className="text-xs font-bold text-blue-600 uppercase tracking-wide">Full Name</label>
                    <p className="text-lg font-bold text-gray-900 dark:text-white mt-2">{selectedPermit.full_name}</p>
                  </div>
                  {[
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

              {/* Review Comments */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border-2 border-yellow-100 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Review Comments</h3>
                {selectedPermit.remarks ? (
                  <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4 border border-gray-200 dark:border-slate-600 mb-4">
                    <p className="text-gray-900 dark:text-white">{selectedPermit.remarks}</p>
                  </div>
                ) : (
                  <div className="text-center py-6 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600 mb-4">
                    <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No comments yet.</p>
                  </div>
                )}
                <textarea value={actionComment} onChange={(e) => setActionComment(e.target.value)} placeholder="Add a comment..." className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent resize-none" rows="3" />
              </div>

              {/* Action Buttons Section */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border-2 border-gray-200 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Application Actions</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button 
                    onClick={handleApprove} 
                    className="px-6 py-3 bg-gradient-to-r from-[#4CAF50] to-[#45a049] text-white rounded-xl hover:shadow-lg transition-all font-bold flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" /> Approve
                  </button>
                  <button 
                    onClick={handleReject} 
                    className="px-6 py-3 bg-gradient-to-r from-[#E53935] to-[#d32f2f] text-white rounded-xl hover:shadow-lg transition-all font-bold flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-5 h-5" /> Reject
                  </button>
                  <button 
                    onClick={() => handleStatusUpdate('Under Review', 'Set to Under Review?', 'This will mark the application as under review.', '#4A90E2')}
                    className="px-6 py-3 bg-gradient-to-r from-[#4A90E2] to-[#357ABD] text-white rounded-xl hover:shadow-lg transition-all font-bold flex items-center justify-center gap-2"
                  >
                    <Clock className="w-5 h-5" /> Under Review
                  </button>
                  <button 
                    onClick={closeModal} 
                    className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:shadow-lg transition-all font-bold flex items-center justify-center gap-2"
                  >
                    <X className="w-5 h-5" /> Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      {showFilePreview && selectedFile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-0">
          <div className="relative w-full h-full flex flex-col">
            <div className="absolute top-0 left-0 right-0 z-20 p-4 flex justify-between items-center bg-gradient-to-b from-black/70 to-transparent">
              <div className="flex items-center gap-3 text-white">
                {isImageFile(selectedFile.file_type, selectedFile.name) ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                <span className="text-sm font-medium truncate max-w-xs">{selectedFile.name}</span>
              </div>
              <div className="flex items-center gap-2">
                {isImageFile(selectedFile.file_type, selectedFile.name) && (
                  <div className="flex items-center gap-1 mr-4 bg-black/40 rounded-lg p-1">
                    <button onClick={handleZoomOut} className="p-2 text-white hover:bg-white/10 rounded transition-colors" title="Zoom Out"><ZoomOut className="w-4 h-4" /></button>
                    <button onClick={handleResetZoom} className="px-3 py-2 text-xs text-white hover:bg-white/10 rounded transition-colors">{zoomLevel}%</button>
                    <button onClick={handleZoomIn} className="p-2 text-white hover:bg-white/10 rounded transition-colors" title="Zoom In"><ZoomIn className="w-4 h-4" /></button>
                  </div>
                )}
                <button onClick={() => { setShowFilePreview(false); setSelectedFile(null); setZoomLevel(100); setDragOffset({ x: 0, y: 0 }); }} className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"><X className="w-6 h-6" /></button>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center overflow-hidden" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
              {isImageFile(selectedFile.file_type, selectedFile.name) ? (
                <img src={selectedFile.url} alt={selectedFile.name} style={{ transform: `scale(${zoomLevel / 100}) translate(${dragOffset.x}px, ${dragOffset.y}px)`, cursor: zoomLevel > 100 ? (isDragging ? 'grabbing' : 'grab') : 'default', transition: isDragging ? 'none' : 'transform 0.2s ease' }} className="max-w-full max-h-full object-contain" draggable={false} />
              ) : selectedFile.file_type === 'application/pdf' || selectedFile.name?.toLowerCase().endsWith('.pdf') ? (
                <iframe src={selectedFile.url} className="w-full h-full" title={selectedFile.name} />
              ) : (
                <div className="text-center text-white p-8">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Cannot preview this file type.</p>
                  <a href={selectedFile.url} download className="mt-4 inline-block px-4 py-2 bg-[#4CAF50] text-white rounded-lg">Download File</a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}