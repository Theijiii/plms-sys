import { useEffect, useState, useMemo } from "react";
import {
  Bar,
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
  RefreshCw,
  Eye,
  Printer,
  TrendingDown,
  Users,
  Award,
  Briefcase,
  FileSpreadsheet,
  GraduationCap,
  Building2,
  X,
  User,
  Mail,
  Phone,
  MapPin
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import Swal from "sweetalert2";

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

const API_BASE = "/backend/building_permit";

const PROFESSIONS = {
  Architect: ["Designer of Record", "Interior Design Consultant", "Landscape Designer", "Consultant"],
  "Civil Engineer": ["Designer of Record", "Structural Designer", "Inspector / Supervisor", "Contractor"],
  "Structural Engineer": ["Structural Designer", "Inspector / Supervisor", "Consultant"],
  "Electrical Engineer": ["Electrical Designer", "Inspector / Supervisor", "Consultant"],
  "Mechanical Engineer": ["Mechanical Designer", "Consultant"],
  "Electronics Engineer": ["Electronics Designer", "Consultant"],
  "Sanitary Engineer": ["Sanitary / Plumbing Designer", "Consultant"],
  "Master Plumber": ["Plumbing Designer", "Consultant"],
  "Geodetic Engineer": ["Surveyor"],
  "Interior Designer": ["Interior Design Consultant"],
  "Landscape Architect": ["Landscape Designer"],
  "Environmental Planner": ["Environmental Consultant"],
  "Fire Protection Engineer": ["Fire Safety Consultant"],
  Contractor: ["Contractor"],
};

const PROFESSION_COLORS = {
  "Architect": "#4CAF50",
  "Civil Engineer": "#FDA811",
  "Structural Engineer": "#4A90E2",
  "Electrical Engineer": "#9C27B0",
  "Mechanical Engineer": "#2196F3",
  "Electronics Engineer": "#795548",
  "Sanitary Engineer": "#607D8B",
  "Master Plumber": "#3F51B5",
  "Geodetic Engineer": "#E91E63",
  "Interior Designer": "#FF9800",
  "Landscape Architect": "#4CAF50",
  "Environmental Planner": "#8BC34A",
  "Fire Protection Engineer": "#F44336",
  "Contractor": "#00BCD4"
};

export default function ProfessionalsRegistration() {
  const [registrations, setRegistrations] = useState([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [professionFilter, setProfessionFilter] = useState("all");
  const [exporting, setExporting] = useState(false);
  const [exportType, setExportType] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("dashboard");
  const itemsPerPage = 15;

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE}/professional_registration.php`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setRegistrations(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch registrations');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching registrations:', err);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const total = registrations.length;
    const approved = registrations.filter(r => r.status?.toUpperCase() === "APPROVED").length;
    const rejected = registrations.filter(r => r.status?.toUpperCase() === "REJECTED").length;
    const pending = registrations.filter(r => r.status?.toUpperCase() === "PENDING" || !r.status).length;

    const professionStats = Object.keys(PROFESSIONS).map(profession => {
      const count = registrations.filter(r => r.profession === profession).length;
      const approvedCount = registrations.filter(r => 
        r.profession === profession && r.status?.toUpperCase() === "APPROVED"
      ).length;
      const approvalRate = count > 0 ? ((approvedCount / count) * 100).toFixed(1) : 0;
      
      return {
        profession,
        count,
        approvedCount,
        approvalRate,
        color: PROFESSION_COLORS[profession] || "#4CAF50"
      };
    }).filter(p => p.count > 0)
      .sort((a, b) => b.count - a.count);

    const topProfession = professionStats[0] || { profession: "N/A", count: 0 };
    const avgProcessingTime = 5;
    const lastMonthCount = Math.floor(total * 0.85);
    const trend = total > 0 ? ((total - lastMonthCount) / lastMonthCount * 100).toFixed(1) : 0;
    
    return {
      total,
      approved,
      rejected,
      pending,
      professionStats,
      topProfession,
      avgProcessingTime,
      trend,
      approvalRate: total > 0 ? ((approved / total) * 100).toFixed(1) : 0,
      completionRate: total > 0 ? (((approved + rejected) / total) * 100).toFixed(1) : 0
    };
  }, [registrations]);

  const monthlyData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const last6Months = months.slice(Math.max(0, currentMonth - 5), currentMonth + 1);
    const top3Professions = stats.professionStats.slice(0, 3);
    
    const monthlyCounts = {};
    top3Professions.forEach(prof => {
      monthlyCounts[prof.profession] = Array(last6Months.length).fill(0);
    });
    
    registrations.forEach(reg => {
      if (!reg.date_submitted) return;
      
      const regDate = new Date(reg.date_submitted);
      const monthIndex = regDate.getMonth();
      const year = regDate.getFullYear();
      
      if (year === currentYear && monthIndex <= currentMonth && monthIndex >= currentMonth - 5) {
        const monthInRange = monthIndex - (currentMonth - 5);
        if (monthInRange >= 0) {
          top3Professions.forEach(prof => {
            if (reg.profession === prof.profession) {
              monthlyCounts[prof.profession][monthInRange]++;
            }
          });
        }
      }
    });
    
    const colors = ["#4CAF50", "#FDA811", "#4A90E2"];
    return {
      labels: last6Months,
      datasets: top3Professions.map((prof, idx) => ({
        label: prof.profession,
        data: monthlyCounts[prof.profession] || Array(last6Months.length).fill(0),
        borderColor: colors[idx],
        backgroundColor: colors[idx] + "20",
        fill: true,
        tension: 0.4
      }))
    };
  }, [registrations, stats.professionStats]);

  const statusChartData = useMemo(() => ({
    labels: ["Approved", "Rejected", "Pending"],
    datasets: [{
      data: [stats.approved || 0, stats.rejected || 0, stats.pending || 0],
      backgroundColor: ['#4CAF50', '#E53935', '#4A90E2'],
      hoverBackgroundColor: ['#45a049', '#d32f2f', '#3d7bc7'],
      borderColor: '#ffffff',
      borderWidth: 3,
    }]
  }), [stats]);

  const getStatusText = (status) => {
    const statusUpper = (status || "").toUpperCase();
    switch (statusUpper) {
      case "APPROVED":
        return { text: "Approved", color: "text-[#4CAF50]", bgColor: "bg-[#4CAF50]/10", icon: CheckCircle };
      case "REJECTED":
        return { text: "Rejected", color: "text-[#E53935]", bgColor: "bg-[#E53935]/10", icon: XCircle };
      case "PENDING":
      default:
        return { text: "Pending", color: "text-[#4A90E2]", bgColor: "bg-[#4A90E2]/10", icon: Clock };
    }
  };

  useEffect(() => {
    let filtered = [...registrations];
    const searchLower = searchTerm.toLowerCase();

    if (startDate && endDate) {
      filtered = filtered.filter(r => {
        if (!r.date_submitted) return false;
        const regDate = new Date(r.date_submitted);
        return regDate >= startDate && regDate <= endDate;
      });
    }

    if (searchTerm) {
      filtered = filtered.filter(r => 
        r.first_name?.toLowerCase().includes(searchLower) ||
        r.last_name?.toLowerCase().includes(searchLower) ||
        r.profession?.toLowerCase().includes(searchLower) ||
        r.prc_license?.toLowerCase().includes(searchLower) ||
        r.registration_id?.toLowerCase().includes(searchLower)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(r => {
        const status = (r.status || "").toUpperCase();
        return status === statusFilter.toUpperCase();
      });
    }

    if (professionFilter !== "all") {
      filtered = filtered.filter(r => r.profession === professionFilter);
    }

    setFilteredRegistrations(filtered);
    setCurrentPage(1);
  }, [registrations, startDate, endDate, searchTerm, statusFilter, professionFilter]);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const exportToCSV = () => {
    setExporting(true);
    setExportType("csv");
    
    const headers = [
      "Registration ID", "Name", "Profession", "Role", "PRC License", 
      "PRC Expiry", "PTR Number", "TIN", "Contact", "Email", 
      "Birth Date", "Status", "Date Submitted"
    ];
    
    const csvContent = [
      headers.join(","),
      ...registrations.map(r => [
        r.registration_id,
        `${r.last_name}, ${r.first_name} ${r.middle_initial || ''}`.trim(),
        r.profession,
        r.role_in_project,
        r.prc_license,
        r.prc_expiry,
        r.ptr_number,
        r.tin,
        r.contact_number,
        r.email,
        r.birth_date,
        getStatusText(r.status).text,
        r.date_submitted ? new Date(r.date_submitted).toLocaleDateString() : ''
      ].map(field => `"${field || ''}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `professional-registrations-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    setExporting(false);
    setExportType("");
  };

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
          <h1 style="color: #4D4A4A; font-size: 28px; margin: 0 0 10px 0;">Professional Registration Analytics</h1>
          <p style="color: #666; margin: 0;">Generated on ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px;">
          ${[
            { title: 'Total Registrations', value: stats.total, color: '#4CAF50' },
            { title: 'Approved', value: stats.approved, color: '#4CAF50' },
            { title: 'Pending', value: stats.pending, color: '#4A90E2' },
            { title: 'Rejected', value: stats.rejected, color: '#E53935' }
          ].map(stat => `
            <div style="border: 2px solid #E9E7E7; border-radius: 8px; padding: 20px; background: white;">
              <p style="color: #666; font-size: 12px; margin: 0 0 10px 0;">${stat.title}</p>
              <p style="color: ${stat.color}; font-size: 32px; font-weight: bold; margin: 0;">${stat.value}</p>
            </div>
          `).join('')}
        </div>
        
        <div style="margin-bottom: 30px;">
          <h2 style="color: #4D4A4A; font-size: 20px; margin: 0 0 15px 0;">Top Professions</h2>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
            ${stats.professionStats.slice(0, 6).map((prof, idx) => {
              const percentage = stats.total > 0 ? ((prof.count / stats.total) * 100).toFixed(1) : 0;
              return `
                <div style="border: 2px solid #E9E7E7; border-radius: 8px; padding: 12px; background: white; border-left: 5px solid ${prof.color};">
                  <p style="color: #4D4A4A; font-size: 12px; margin: 0 0 5px 0; font-weight: 500;">${prof.profession}</p>
                  <p style="color: #4D4A4A; font-size: 20px; font-weight: bold; margin: 0;">${prof.count}</p>
                  <p style="color: #666; font-size: 11px; margin: 3px 0 0 0;">${percentage}% of total</p>
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

      pdf.save(`professional-registrations-${new Date().toISOString().split("T")[0]}.pdf`);

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

  const totalPages = Math.ceil(filteredRegistrations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRegistrations = filteredRegistrations.slice(startIndex, endIndex);

  const openModal = (registration) => {
    setSelectedRegistration(registration);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedRegistration(null);
    setShowModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBFBFB] p-6 flex items-center justify-center font-poppins">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4CAF50] mx-auto"></div>
          <p className="mt-4 text-[#4D4A4A]">Loading professional registrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFB] p-4 md:p-6 font-poppins">
      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-[#E9E7E7]">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`pb-4 px-2 font-medium transition-colors relative ${
                activeTab === "dashboard"
                  ? "text-[#4CAF50]"
                  : "text-[#4D4A4A] hover:text-[#4CAF50]"
              }`}
            >
              Dashboard
              {activeTab === "dashboard" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4CAF50]"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab("application")}
              className={`pb-4 px-2 font-medium transition-colors relative ${
                activeTab === "application"
                  ? "text-[#4CAF50]"
                  : "text-[#4D4A4A] hover:text-[#4CAF50]"
              }`}
            >
              Application
              {activeTab === "application" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4CAF50]"></div>
              )}
            </button>
          </div>
        </div>
      </div>

      {activeTab === "dashboard" && (
        <>
          {/* Header */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-[#4D4A4A] font-montserrat">
                  Professional Registration Dashboard
                </h1>
                <p className="text-[#4D4A4A] text-opacity-70 mt-2">
                  Track and analyze professional registrations by profession and status
                </p>
              </div>
              <div className="flex items-center space-x-3 mt-4 md:mt-0">
                <button
                  onClick={fetchRegistrations}
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
                  title: "Total Registrations",
                  value: stats.total,
                  icon: Users,
                  color: "#4CAF50",
                  trend: `${stats.trend}%`,
                  trendUp: stats.trend > 0,
                  description: "All professionals"
                },
                {
                  title: "Approved",
                  value: stats.approved,
                  icon: CheckCircle,
                  color: "#4CAF50",
                  trend: `${stats.approvalRate}% approval rate`,
                  trendUp: true,
                  description: "Verified professionals"
                },
                {
                  title: "Top Profession",
                  value: stats.topProfession.profession,
                  icon: Award,
                  color: stats.topProfession.color || '#4CAF50',
                  trend: `${stats.topProfession.count} registrations`,
                  trendUp: true,
                  description: "Most registered"
                },
                {
                  title: "Pending Review",
                  value: stats.pending,
                  icon: Clock,
                  color: "#4A90E2",
                  trend: `${stats.avgProcessingTime} days avg`,
                  trendUp: false,
                  description: "Awaiting approval"
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 shadow-sm border border-[#E9E7E7]">
                <p className="text-sm text-[#4D4A4A] text-opacity-70">Approval Rate</p>
                <p className="text-xl font-bold text-[#4CAF50]">{stats.approvalRate}%</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-[#E9E7E7]">
                <p className="text-sm text-[#4D4A4A] text-opacity-70">Avg Processing</p>
                <p className="text-xl font-bold text-[#4A90E2]">{stats.avgProcessingTime} days</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-[#E9E7E7]">
                <p className="text-sm text-[#4D4A4A] text-opacity-70">Completion Rate</p>
                <p className="text-xl font-bold text-[#9C27B0]">{stats.completionRate}%</p>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Line Chart - Trends by Profession */}
            <div className="lg:col-span-2 bg-white rounded-lg p-5 shadow-sm border border-[#E9E7E7]">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-[#4D4A4A] font-montserrat">Monthly Trends by Profession</h3>
                  <p className="text-sm text-[#4D4A4A] text-opacity-70">Registrations for top professions</p>
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
                        grid: { color: 'rgba(233, 231, 231, 0.5)' },
                        ticks: { color: '#4D4A4A', font: { family: 'Poppins' } }
                      },
                      y: {
                        grid: { color: 'rgba(233, 231, 231, 0.5)' },
                        ticks: { color: '#4D4A4A', font: { family: 'Poppins' } }
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
                <p className="text-sm text-[#4D4A4A] text-opacity-70">By approval status</p>
              </div>
              <div className="h-[250px] flex items-center justify-center">
                <Doughnut
                  data={statusChartData}
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
                          font: { family: 'Poppins' }
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Bar Chart - Professions */}
          <div className="mb-6 bg-white rounded-lg p-5 shadow-sm border border-[#E9E7E7]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-[#4D4A4A] font-montserrat">Registrations by Profession</h3>
                <p className="text-sm text-[#4D4A4A] text-opacity-70">Distribution across different professional fields</p>
              </div>
            </div>
            <div className="h-[300px]">
              <Bar
                data={{
                  labels: stats.professionStats.map(p => p.profession),
                  datasets: [{
                    label: "Registrations",
                    data: stats.professionStats.map(p => p.count),
                    backgroundColor: stats.professionStats.map(p => p.color),
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: "#E9E7E7",
                  }]
                }}
                options={{
                  maintainAspectRatio: false,
                  responsive: true,
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { 
                      ticks: { color: '#4D4A4A', font: { family: 'Poppins' } }, 
                      grid: { color: 'rgba(233, 231, 231, 0.5)' } 
                    },
                    y: { 
                      ticks: { color: '#4D4A4A', font: { family: 'Poppins' } }, 
                      grid: { color: 'rgba(233, 231, 231, 0.5)' }, 
                      beginAtZero: true 
                    },
                  },
                }}
              />
            </div>
            
            {/* Profession Summary Cards */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {stats.professionStats.slice(0, 8).map((prof, idx) => (
                <div 
                  key={idx}
                  className="p-3 rounded-lg border border-[#E9E7E7] hover:shadow transition-all"
                  style={{ borderLeftColor: prof.color, borderLeftWidth: '4px' }}
                >
                  <div className="flex items-center mb-2">
                    <Award className="w-5 h-5 mr-2" style={{ color: prof.color }} />
                    <span className="text-sm font-medium text-[#4D4A4A] font-poppins truncate">
                      {prof.profession}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-[#4D4A4A] font-montserrat">
                      {prof.count}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-[#FBFBFB] text-[#4D4A4A]">
                      {prof.approvalRate}% approved
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {activeTab === "application" && (
        <>
          {/* Filters and Controls */}
          <div className="mb-6">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-[#E9E7E7]">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#4D4A4A] text-opacity-50 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search by name, profession, or PRC license..."
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
                    <option value="rejected">Rejected</option>
                  </select>

                  <select
                    value={professionFilter}
                    onChange={(e) => setProfessionFilter(e.target.value)}
                    className="px-4 py-2 rounded-lg border border-[#E9E7E7] bg-white text-[#4D4A4A] focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent font-poppins"
                  >
                    <option value="all">All Professions</option>
                    {Object.keys(PROFESSIONS).map(profession => (
                      <option key={profession} value={profession}>
                        {profession}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-lg shadow-sm border border-[#E9E7E7] overflow-hidden">
            <div className="p-5 border-b border-[#E9E7E7]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-[#4D4A4A] font-montserrat">Professional Registrations</h3>
                  <p className="text-sm text-[#4D4A4A] text-opacity-70">
                    Showing {startIndex + 1}-{Math.min(endIndex, filteredRegistrations.length)} of {filteredRegistrations.length} registrations
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
                      Registration ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#4D4A4A] uppercase tracking-wider font-montserrat">
                      Professional
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#4D4A4A] uppercase tracking-wider font-montserrat">
                      Profession
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#4D4A4A] uppercase tracking-wider font-montserrat">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#4D4A4A] uppercase tracking-wider font-montserrat">
                      PRC License
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#4D4A4A] uppercase tracking-wider font-montserrat">
                      Date Submitted
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
                  {currentRegistrations.map((reg, index) => {
                    const statusInfo = getStatusText(reg.status);
                    const StatusIcon = statusInfo.icon;
                    
                    return (
                      <tr key={index} className="hover:bg-[#FBFBFB] transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-mono text-sm text-[#4D4A4A] font-medium">
                            {reg.registration_id}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-[#4D4A4A] font-montserrat">
                              {reg.last_name}, {reg.first_name} {reg.middle_initial}
                            </p>
                            <p className="text-sm text-[#4D4A4A] text-opacity-70 font-poppins">
                              {reg.email}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <Award 
                              className="w-5 h-5 mr-3" 
                              style={{ color: PROFESSION_COLORS[reg.profession] || "#4CAF50" }} 
                            />
                            <span className="text-[#4D4A4A] font-poppins">
                              {reg.profession || "N/A"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-[#4D4A4A] font-poppins">
                            {reg.role_in_project || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-[#4D4A4A] font-poppins">
                            {reg.prc_license || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-[#4D4A4A] text-opacity-70 font-poppins">
                            {reg.date_submitted ? new Date(reg.date_submitted).toLocaleDateString() : "N/A"}
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
                              onClick={() => openModal(reg)}
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

            {filteredRegistrations.length === 0 && !loading && (
              <div className="p-12 text-center">
                <GraduationCap className="w-12 h-12 text-[#E9E7E7] mx-auto mb-4" />
                <p className="text-[#4D4A4A] text-opacity-70">No registrations match your filters</p>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setProfessionFilter("all");
                    setDateRange([null, null]);
                  }}
                  className="mt-4 text-[#4CAF50] hover:underline font-poppins"
                >
                  Clear all filters
                </button>
              </div>
            )}

            {/* Pagination */}
            {filteredRegistrations.length > itemsPerPage && (
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
        </>
      )}

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

      {/* Registration Details Modal */}
      {showModal && selectedRegistration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 overflow-auto animate-fadeIn">
          <div className="w-full max-w-4xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl transform transition-all">
            <div className="relative p-6 bg-gradient-to-r from-gray-50 via-white to-gray-50 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 border-b-4 border-green-400">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-green-400 to-green-500 p-3 rounded-2xl shadow-xl">
                    <GraduationCap className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Professional Registration</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Registration Details</p>
                  </div>
                </div>
                
                <button 
                  onClick={closeModal}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md border-l-4 border-blue-500">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Registration ID</p>
                  <p className="text-lg font-bold text-gray-800 dark:text-white font-mono">
                    {selectedRegistration.registration_id}
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md border-l-4 border-purple-500">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Date Submitted</p>
                  <p className="text-lg font-bold text-gray-800 dark:text-white">
                    {selectedRegistration.date_submitted ? new Date(selectedRegistration.date_submitted).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md border-l-4 border-green-500">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Status</p>
                  <span className={`inline-block px-3 py-1 text-sm font-bold rounded-full ${getStatusText(selectedRegistration.status).bgColor} ${getStatusText(selectedRegistration.status).color}`}>
                    {getStatusText(selectedRegistration.status).text}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-800">
              {/* Personal Information */}
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
                      {selectedRegistration.last_name}, {selectedRegistration.first_name} {selectedRegistration.middle_initial} {selectedRegistration.suffix}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Birth Date</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedRegistration.birth_date ? new Date(selectedRegistration.birth_date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Contact Number</label>
                    <p className="text-gray-900 dark:text-white mt-1 flex items-center">
                      <Phone className="w-4 h-4 mr-2" />
                      {selectedRegistration.contact_number || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email Address</label>
                    <p className="text-gray-900 dark:text-white mt-1 flex items-center">
                      <Mail className="w-4 h-4 mr-2" />
                      {selectedRegistration.email || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border-2 border-green-100 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl shadow-lg">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Professional Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Profession</label>
                    <p className="text-xl font-bold text-[#4CAF50] mt-1">
                      {selectedRegistration.profession || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Role in Project</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedRegistration.role_in_project || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">PRC License Number</label>
                    <p className="text-gray-900 dark:text-white mt-1 font-mono">
                      {selectedRegistration.prc_license || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">PRC License Expiry</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedRegistration.prc_expiry ? new Date(selectedRegistration.prc_expiry).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">PTR Number</label>
                    <p className="text-gray-900 dark:text-white mt-1 font-mono">
                      {selectedRegistration.ptr_number || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">TIN</label>
                    <p className="text-gray-900 dark:text-white mt-1 font-mono">
                      {selectedRegistration.tin || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
