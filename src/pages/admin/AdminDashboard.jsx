import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { Bar, Pie, Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";
import {
  FileText,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Building,
  Briefcase,
  Users,
  Home,
  User,
  Search,
  Download,
  RefreshCw,
  Calendar,
  DownloadCloud,
  Printer,
  Eye,
  BarChart,
  Activity,
  Layers
} from "lucide-react";
import { jsPDF } from "jspdf";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, LineElement, PointElement, Title, Tooltip, Legend, Filler);

const API_BASE = "/backend/api";

const PERMIT_COLORS = {
  Business: "#4CAF50",
  Franchise: "#4A90E2",
  Building: "#FDA811",
  Barangay: "#9C27B0"
};

const PERMIT_ICONS = {
  Business: Briefcase,
  Franchise: Users,
  Building: Building,
  Barangay: Home
};

const STATUS_COLORS = {
  Approved: "#4CAF50",
  Pending: "#FDA811",
  Rejected: "#E53935",
  Compliance: "#4A90E2"
};

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  } catch (e) { return 'N/A'; }
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [exporting, setExporting] = useState(false);
  const [exportType, setExportType] = useState("");
  const analyticsRef = useRef(null);
  const chartRef = useRef(null);

  // Fetch dashboard data from all permit types
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE}/dashboard_stats.php`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const data = await response.json();

      if (data.success) {
        setDashboardData(data);
      } else {
        throw new Error(data.message || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Computed stats
  const stats = useMemo(() => {
    if (!dashboardData) return { total: 0, approved: 0, pending: 0, rejected: 0, business: {}, franchise: {}, barangay: {}, building: {} };

    const b = dashboardData.business || {};
    const f = dashboardData.franchise || {};
    const br = dashboardData.barangay || {};
    const bl = dashboardData.building || {};

    const total = (b.total || 0) + (f.total || 0) + (br.total || 0) + (bl.total || 0);
    const approved = (b.approved || 0) + (f.approved || 0) + (br.approved || 0) + (bl.approved || 0);
    const pending = (b.pending || 0) + (f.pending || 0) + (br.pending || 0) + (bl.pending || 0);
    const rejected = (b.rejected || 0) + (f.rejected || 0) + (br.rejected || 0) + (bl.rejected || 0);

    return { total, approved, pending, rejected, business: b, franchise: f, barangay: br, building: bl };
  }, [dashboardData]);

  // All recent applications merged & sorted
  const recentApplications = useMemo(() => {
    if (!dashboardData) return [];

    const all = [
      ...(dashboardData.business?.recent || []),
      ...(dashboardData.franchise?.recent || []),
      ...(dashboardData.barangay?.recent || []),
      ...(dashboardData.building?.recent || [])
    ];

    // Sort by date descending
    all.sort((a, b) => {
      const da = new Date(a.date || 0);
      const db = new Date(b.date || 0);
      return db - da;
    });

    // Filter
    let filtered = all;
    if (typeFilter !== "all") {
      filtered = filtered.filter(a => a.permit_type === typeFilter);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(a =>
        a.applicant?.toLowerCase().includes(term) ||
        a.id?.toLowerCase().includes(term) ||
        a.business_name?.toLowerCase().includes(term) ||
        a.type?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [dashboardData, typeFilter, searchTerm]);

  // Most recent application (unfiltered)
  const mostRecentApplication = useMemo(() => {
    if (!dashboardData) return null;

    const all = [
      ...(dashboardData.business?.recent || []),
      ...(dashboardData.franchise?.recent || []),
      ...(dashboardData.barangay?.recent || []),
      ...(dashboardData.building?.recent || [])
    ];

    if (all.length === 0) return null;

    // Sort by date descending and get first
    all.sort((a, b) => {
      const da = new Date(a.date || 0);
      const db = new Date(b.date || 0);
      return db - da;
    });

    return all[0];
  }, [dashboardData]);

  // Today's applications
  const todaysApplications = useMemo(() => {
    if (!dashboardData) return [];

    const all = [
      ...(dashboardData.business?.recent || []),
      ...(dashboardData.franchise?.recent || []),
      ...(dashboardData.barangay?.recent || []),
      ...(dashboardData.building?.recent || [])
    ];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return all.filter(app => {
      if (!app.date) return false;
      const appDate = new Date(app.date);
      appDate.setHours(0, 0, 0, 0);
      return appDate.getTime() === today.getTime();
    });
  }, [dashboardData]);

  // Monthly trend data (aggregated across all types)
  const monthlyTrendData = useMemo(() => {
    if (!dashboardData) return { labels: [], applications: [], approvals: [], rejections: [] };

    const monthMap = {};

    const processMonthly = (monthlyArr) => {
      if (!monthlyArr) return;
      monthlyArr.forEach(m => {
        if (!m.month) return;
        if (!monthMap[m.month]) {
          monthMap[m.month] = { count: 0, approved: 0, rejected: 0 };
        }
        monthMap[m.month].count += parseInt(m.count || 0);
        monthMap[m.month].approved += parseInt(m.approved || 0);
        monthMap[m.month].rejected += parseInt(m.rejected || 0);
      });
    };

    processMonthly(dashboardData.business?.monthly);
    processMonthly(dashboardData.franchise?.monthly);
    processMonthly(dashboardData.barangay?.monthly);
    processMonthly(dashboardData.building?.monthly);

    const sortedMonths = Object.keys(monthMap).sort();
    const labels = sortedMonths.map(m => {
      const parts = m.split('-');
      return MONTH_NAMES[parseInt(parts[1]) - 1] + ' ' + parts[0].slice(2);
    });

    return {
      labels,
      applications: sortedMonths.map(m => monthMap[m].count),
      approvals: sortedMonths.map(m => monthMap[m].approved),
      rejections: sortedMonths.map(m => monthMap[m].rejected)
    };
  }, [dashboardData]);

  // Weekly trend data
  const weeklyTrendData = useMemo(() => {
    if (!dashboardData) return { labels: [], data: [] };

    const weekMap = {};

    const processWeekly = (weeklyArr, type) => {
      if (!weeklyArr) return;
      weeklyArr.forEach(w => {
        const key = w.week_start || w.week_num;
        if (!key) return;
        if (!weekMap[key]) {
          weekMap[key] = { total: 0, label: w.week_start ? formatDate(w.week_start) : `W${w.week_num}` };
        }
        weekMap[key].total += parseInt(w.count || 0);
      });
    };

    processWeekly(dashboardData.business?.weekly, 'Business');
    processWeekly(dashboardData.franchise?.weekly, 'Franchise');
    processWeekly(dashboardData.barangay?.weekly, 'Barangay');
    processWeekly(dashboardData.building?.weekly, 'Building');

    const sortedKeys = Object.keys(weekMap).sort();

    return {
      labels: sortedKeys.map(k => weekMap[k].label),
      data: sortedKeys.map(k => weekMap[k].total)
    };
  }, [dashboardData]);

  // Per-type monthly trend for stacked chart
  const perTypeMonthlyData = useMemo(() => {
    if (!dashboardData) return { labels: [], business: [], franchise: [], barangay: [], building: [] };

    const allMonths = new Set();
    const typeMonths = { business: {}, franchise: {}, barangay: {}, building: {} };

    const collectMonths = (monthlyArr, type) => {
      if (!monthlyArr) return;
      monthlyArr.forEach(m => {
        if (!m.month) return;
        allMonths.add(m.month);
        typeMonths[type][m.month] = parseInt(m.count || 0);
      });
    };

    collectMonths(dashboardData.business?.monthly, 'business');
    collectMonths(dashboardData.franchise?.monthly, 'franchise');
    collectMonths(dashboardData.barangay?.monthly, 'barangay');
    collectMonths(dashboardData.building?.monthly, 'building');

    const sorted = Array.from(allMonths).sort();
    const labels = sorted.map(m => {
      const parts = m.split('-');
      return MONTH_NAMES[parseInt(parts[1]) - 1] + ' ' + parts[0].slice(2);
    });

    return {
      labels,
      business: sorted.map(m => typeMonths.business[m] || 0),
      franchise: sorted.map(m => typeMonths.franchise[m] || 0),
      barangay: sorted.map(m => typeMonths.barangay[m] || 0),
      building: sorted.map(m => typeMonths.building[m] || 0)
    };
  }, [dashboardData]);

  // PDF Export - comprehensive multi-page data-driven report
  const exportPDF = async () => {
    setExporting(true);
    setExportType("pdf");
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const m = 14;
      const contentWidth = pageWidth - m * 2;
      const col4 = contentWidth / 4;
      const col2 = contentWidth / 2;
      let y = 0;
      let pageNum = 1;
      const totalPages = 3;

      // Helper: draw page footer
      const drawFooter = (pg) => {
        pdf.setDrawColor(200, 200, 200);
        pdf.line(m, pageHeight - 13, pageWidth - m, pageHeight - 13);
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(150, 150, 150);
        pdf.text('Permit Licensing Management System — Admin Dashboard Report', m, pageHeight - 8);
        pdf.text(`Page ${pg} of ${totalPages}`, pageWidth - m, pageHeight - 8, { align: 'right' });
      };

      // Helper: section title
      const sectionTitle = (title, yPos) => {
        pdf.setFillColor(240, 240, 240);
        pdf.roundedRect(m, yPos, contentWidth, 8, 1, 1, 'F');
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(77, 74, 74);
        pdf.text(title, m + 4, yPos + 5.5);
        return yPos + 12;
      };

      // Helper: draw a table
      const drawTable = (headers, rows, colWidths, startY) => {
        let ty = startY;
        // Header row
        pdf.setFillColor(76, 175, 80);
        pdf.rect(m, ty, contentWidth, 7, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'bold');
        let tx = m + 2;
        headers.forEach((h, i) => {
          pdf.text(h, tx, ty + 5);
          tx += colWidths[i];
        });
        ty += 7;

        // Data rows
        rows.forEach((row, idx) => {
          if (ty > pageHeight - 20) {
            drawFooter(pageNum);
            pdf.addPage();
            pageNum++;
            ty = 15;
          }
          pdf.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 248);
          pdf.rect(m, ty, contentWidth, 6.5, 'F');
          pdf.setTextColor(77, 74, 74);
          pdf.setFontSize(6.5);
          pdf.setFont('helvetica', 'normal');
          tx = m + 2;
          row.forEach((cell, i) => {
            const cellStr = String(cell);
            // Color-code status columns
            if (headers[i] === 'Status') {
              const s = cellStr.toLowerCase();
              if (s === 'approved') pdf.setTextColor(76, 175, 80);
              else if (s === 'pending') pdf.setTextColor(253, 168, 17);
              else if (s === 'rejected') pdf.setTextColor(229, 57, 53);
              pdf.setFont('helvetica', 'bold');
            }
            pdf.text(cellStr.substring(0, Math.floor(colWidths[i] / 1.8)), tx, ty + 4.5);
            pdf.setTextColor(77, 74, 74);
            pdf.setFont('helvetica', 'normal');
            tx += colWidths[i];
          });
          ty += 6.5;
        });
        return ty;
      };

      // Compute analysis data
      const typesRanked = [
        { name: 'Business', ...stats.business },
        { name: 'Franchise', ...stats.franchise },
        { name: 'Barangay', ...stats.barangay },
        { name: 'Building', ...stats.building }
      ].sort((a, b) => (b.total || 0) - (a.total || 0));

      const highestType = typesRanked[0] || {};
      const lowestType = typesRanked[typesRanked.length - 1] || {};

      const bestApproval = [...typesRanked].sort((a, b) => {
        const rateA = (a.total || 0) > 0 ? (a.approved || 0) / a.total : 0;
        const rateB = (b.total || 0) > 0 ? (b.approved || 0) / b.total : 0;
        return rateB - rateA;
      })[0] || {};
      const bestApprovalRate = (bestApproval.total || 0) > 0 ? (((bestApproval.approved || 0) / bestApproval.total) * 100).toFixed(1) : '0';

      // ================================================================
      // PAGE 1: OVERVIEW & SUMMARY
      // ================================================================
      // Header banner
      pdf.setFillColor(76, 175, 80);
      pdf.rect(0, 0, pageWidth, 30, 'F');
      pdf.setFillColor(56, 142, 60);
      pdf.rect(0, 30, pageWidth, 3, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(22);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Admin Dashboard Report', m, 15);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Permit Licensing Management System — Comprehensive Analytics', m, 24);
      pdf.setFontSize(8);
      pdf.text(`Generated: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`, pageWidth - m, 15, { align: 'right' });
      pdf.text(`Total Records: ${stats.total} applications across 4 permit types`, pageWidth - m, 24, { align: 'right' });

      // Section: Summary Statistics
      y = sectionTitle('1. Summary Statistics', 40);

      const summaryCards = [
        { label: 'Total Applications', value: stats.total.toString(), color: [76, 175, 80] },
        { label: 'Approved', value: stats.approved.toString(), color: [76, 175, 80] },
        { label: 'Pending', value: stats.pending.toString(), color: [253, 168, 17] },
        { label: 'Rejected', value: stats.rejected.toString(), color: [229, 57, 53] }
      ];
      summaryCards.forEach((item, i) => {
        const x = m + (i * col4);
        pdf.setFillColor(248, 248, 248);
        pdf.roundedRect(x, y, col4 - 3, 18, 2, 2, 'F');
        pdf.setFontSize(7.5);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(120, 120, 120);
        pdf.text(item.label, x + 4, y + 7);
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...item.color);
        pdf.text(item.value, x + 4, y + 15.5);
      });

      // Section: Performance Rates
      y = sectionTitle('2. Performance Rates', y + 24);

      const rateCards = [
        { label: 'Approval Rate', value: `${approvalRate}%`, color: [76, 175, 80] },
        { label: 'Pending Rate', value: `${pendingRate}%`, color: [253, 168, 17] },
        { label: 'Rejection Rate', value: `${rejectionRate}%`, color: [229, 57, 53] },
        { label: 'Compliance / Under Review', value: String((stats.business.compliance || 0) + (stats.franchise.under_review || 0)), color: [74, 144, 226] }
      ];
      rateCards.forEach((item, i) => {
        const x = m + (i * col4);
        pdf.setFillColor(248, 248, 248);
        pdf.roundedRect(x, y, col4 - 3, 18, 2, 2, 'F');
        pdf.setFontSize(7.5);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(120, 120, 120);
        pdf.text(item.label, x + 4, y + 7);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...item.color);
        pdf.text(item.value, x + 4, y + 15.5);
      });

      // Section: Key Insights
      y = sectionTitle('3. Key Insights', y + 24);

      const insights = [
        { label: 'Highest Volume Permit', value: `${highestType.name || 'N/A'} (${highestType.total || 0} applications)`, color: [76, 175, 80] },
        { label: 'Lowest Volume Permit', value: `${lowestType.name || 'N/A'} (${lowestType.total || 0} applications)`, color: [229, 57, 53] },
        { label: 'Best Approval Rate', value: `${bestApproval.name || 'N/A'} (${bestApprovalRate}%)`, color: [74, 144, 226] },
        { label: 'Active Permit Types', value: `${typesRanked.filter(t => (t.total || 0) > 0).length} of 4 types have data`, color: [156, 39, 176] }
      ];
      insights.forEach((item, i) => {
        const x = m + (i * col4);
        pdf.setFillColor(248, 248, 248);
        pdf.roundedRect(x, y, col4 - 3, 18, 2, 2, 'F');
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(120, 120, 120);
        pdf.text(item.label, x + 4, y + 7);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...item.color);
        const lines = pdf.splitTextToSize(item.value, col4 - 10);
        pdf.text(lines, x + 4, y + 13);
      });

      // Section: Per Permit Type Breakdown
      y = sectionTitle('4. Per Permit Type Breakdown', y + 24);

      const typeColors = {
        Business: [76, 175, 80],
        Franchise: [74, 144, 226],
        Barangay: [156, 39, 176],
        Building: [253, 168, 17]
      };

      // Type table
      const typeHeaders = ['Permit Type', 'Total', 'Approved', 'Pending', 'Rejected', 'Approval Rate', 'Share of Total'];
      const typeColW = [30, 22, 22, 22, 22, 28, 28];
      const typeRows = typesRanked.map(t => {
        const total = t.total || 0;
        const approved = t.approved || 0;
        const pending = t.pending || 0;
        const rejected = t.rejected || 0;
        const rate = total > 0 ? ((approved / total) * 100).toFixed(1) + '%' : '0%';
        const share = stats.total > 0 ? ((total / stats.total) * 100).toFixed(1) + '%' : '0%';
        return [t.name, String(total), String(approved), String(pending), String(rejected), rate, share];
      });
      // Add totals row
      typeRows.push(['TOTAL', String(stats.total), String(stats.approved), String(stats.pending), String(stats.rejected), `${approvalRate}%`, '100%']);

      y = drawTable(typeHeaders, typeRows, typeColW, y);

      // Per-type colored summary blocks
      y += 4;
      const typeBlocks = [
        { name: 'Business', data: stats.business, color: [76, 175, 80] },
        { name: 'Franchise', data: stats.franchise, color: [74, 144, 226] },
        { name: 'Barangay', data: stats.barangay, color: [156, 39, 176] },
        { name: 'Building', data: stats.building, color: [253, 168, 17] }
      ];
      typeBlocks.forEach((t, i) => {
        const x = m + (i * col4);
        pdf.setFillColor(...t.color);
        pdf.roundedRect(x, y, col4 - 3, 22, 2, 2, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text(t.name, x + 4, y + 7);
        pdf.setFontSize(14);
        pdf.text(String(t.data.total || 0), x + 4, y + 15);
        pdf.setFontSize(6.5);
        pdf.setFont('helvetica', 'normal');
        const pct = (t.data.total || 0) > 0 ? (((t.data.approved || 0) / t.data.total) * 100).toFixed(0) : 0;
        pdf.text(`A:${t.data.approved || 0}(${pct}%) P:${t.data.pending || 0} R:${t.data.rejected || 0}`, x + 4, y + 20);
      });

      drawFooter(pageNum);

      // ================================================================
      // PAGE 2: MONTHLY & WEEKLY TRENDS
      // ================================================================
      pdf.addPage();
      pageNum++;
      y = 15;

      // Monthly Trends Section
      y = sectionTitle('5. Monthly Application Trends (Last 12 Months)', y);

      if (monthlyTrendData.labels.length > 0) {
        const mHeaders = ['Month', 'Total Apps', 'Approved', 'Rejected', 'Pending (est.)', 'Approval Rate'];
        const mColW = [28, 28, 28, 28, 28, 28];
        const mRows = monthlyTrendData.labels.map((label, i) => {
          const total = monthlyTrendData.applications[i] || 0;
          const approved = monthlyTrendData.approvals[i] || 0;
          const rejected = monthlyTrendData.rejections[i] || 0;
          const pending = Math.max(0, total - approved - rejected);
          const rate = total > 0 ? ((approved / total) * 100).toFixed(1) + '%' : '—';
          return [label, String(total), String(approved), String(rejected), String(pending), rate];
        });

        // Monthly totals row
        const mTotalApps = monthlyTrendData.applications.reduce((a, b) => a + b, 0);
        const mTotalApproved = monthlyTrendData.approvals.reduce((a, b) => a + b, 0);
        const mTotalRejected = monthlyTrendData.rejections.reduce((a, b) => a + b, 0);
        const mTotalPending = Math.max(0, mTotalApps - mTotalApproved - mTotalRejected);
        const mTotalRate = mTotalApps > 0 ? ((mTotalApproved / mTotalApps) * 100).toFixed(1) + '%' : '—';
        mRows.push(['TOTAL', String(mTotalApps), String(mTotalApproved), String(mTotalRejected), String(mTotalPending), mTotalRate]);

        // Peak & low months
        let peakMonth = '', peakVal = 0, lowMonth = '', lowVal = Infinity;
        monthlyTrendData.labels.forEach((label, i) => {
          const v = monthlyTrendData.applications[i] || 0;
          if (v > peakVal) { peakVal = v; peakMonth = label; }
          if (v < lowVal) { lowVal = v; lowMonth = label; }
        });

        y = drawTable(mHeaders, mRows, mColW, y);

        // Monthly insights
        y += 4;
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(76, 175, 80);
        pdf.text(`Peak Month: ${peakMonth} (${peakVal} applications)`, m, y);
        pdf.setTextColor(229, 57, 53);
        pdf.text(`Lowest Month: ${lowMonth} (${lowVal} applications)`, m + contentWidth / 2, y);
        y += 5;
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 100, 100);
        const avgMonthly = monthlyTrendData.labels.length > 0 ? (mTotalApps / monthlyTrendData.labels.length).toFixed(1) : '0';
        pdf.text(`Average per month: ${avgMonthly} applications | Data covers ${monthlyTrendData.labels.length} month(s)`, m, y);
      } else {
        pdf.setFontSize(9);
        pdf.setTextColor(150, 150, 150);
        pdf.text('No monthly trend data available.', m, y + 5);
        y += 12;
      }

      // Weekly Trends Section
      y += 8;
      y = sectionTitle('6. Weekly Application Trends (Last 8 Weeks)', y);

      if (weeklyTrendData.labels.length > 0) {
        const wHeaders = ['Week Starting', 'Total Applications', 'Avg Daily (est.)'];
        const wColW = [60, 55, 55];
        const wRows = weeklyTrendData.labels.map((label, i) => {
          const total = weeklyTrendData.data[i] || 0;
          const avgDaily = (total / 7).toFixed(1);
          return [label, String(total), avgDaily];
        });

        // Weekly totals
        const wTotal = weeklyTrendData.data.reduce((a, b) => a + b, 0);
        const wAvg = weeklyTrendData.labels.length > 0 ? (wTotal / weeklyTrendData.labels.length).toFixed(1) : '0';
        wRows.push(['TOTAL / AVG', String(wTotal), wAvg]);

        let peakWeek = '', peakWVal = 0, lowWeek = '', lowWVal = Infinity;
        weeklyTrendData.labels.forEach((label, i) => {
          const v = weeklyTrendData.data[i] || 0;
          if (v > peakWVal) { peakWVal = v; peakWeek = label; }
          if (v < lowWVal) { lowWVal = v; lowWeek = label; }
        });

        y = drawTable(wHeaders, wRows, wColW, y);

        y += 4;
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(76, 175, 80);
        pdf.text(`Busiest Week: ${peakWeek} (${peakWVal} applications)`, m, y);
        pdf.setTextColor(229, 57, 53);
        pdf.text(`Slowest Week: ${lowWeek} (${lowWVal} applications)`, m + contentWidth / 2, y);
        y += 5;
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 100, 100);
        pdf.text(`Weekly average: ${wAvg} applications | Data covers ${weeklyTrendData.labels.length} week(s)`, m, y);
      } else {
        pdf.setFontSize(9);
        pdf.setTextColor(150, 150, 150);
        pdf.text('No weekly trend data available.', m, y + 5);
        y += 12;
      }

      // Per-Type Monthly Breakdown
      y += 8;
      y = sectionTitle('7. Monthly Breakdown by Permit Type', y);

      if (perTypeMonthlyData.labels.length > 0) {
        const ptHeaders = ['Month', 'Business', 'Franchise', 'Barangay', 'Building', 'Total'];
        const ptColW = [28, 28, 28, 28, 28, 28];
        const ptRows = perTypeMonthlyData.labels.map((label, i) => {
          const bus = perTypeMonthlyData.business[i] || 0;
          const frn = perTypeMonthlyData.franchise[i] || 0;
          const brg = perTypeMonthlyData.barangay[i] || 0;
          const bld = perTypeMonthlyData.building[i] || 0;
          return [label, String(bus), String(frn), String(brg), String(bld), String(bus + frn + brg + bld)];
        });

        // Totals
        const ptTotals = ['TOTAL',
          String(perTypeMonthlyData.business.reduce((a, b) => a + b, 0)),
          String(perTypeMonthlyData.franchise.reduce((a, b) => a + b, 0)),
          String(perTypeMonthlyData.barangay.reduce((a, b) => a + b, 0)),
          String(perTypeMonthlyData.building.reduce((a, b) => a + b, 0)),
          String(perTypeMonthlyData.business.reduce((a, b) => a + b, 0) + perTypeMonthlyData.franchise.reduce((a, b) => a + b, 0) + perTypeMonthlyData.barangay.reduce((a, b) => a + b, 0) + perTypeMonthlyData.building.reduce((a, b) => a + b, 0))
        ];
        ptRows.push(ptTotals);

        y = drawTable(ptHeaders, ptRows, ptColW, y);
      } else {
        pdf.setFontSize(9);
        pdf.setTextColor(150, 150, 150);
        pdf.text('No per-type monthly data available.', m, y + 5);
      }

      drawFooter(pageNum);

      // ================================================================
      // PAGE 3: RECENT APPLICATIONS
      // ================================================================
      pdf.addPage();
      pageNum++;
      y = 15;

      y = sectionTitle('8. Recent Applications (All Permit Types)', y);

      const appHeaders = ['#', 'ID', 'Applicant', 'Permit Type', 'App. Type', 'Date', 'Status'];
      const appColW = [8, 22, 42, 26, 30, 26, 20];
      const appRows = recentApplications.slice(0, 20).map((app, i) => [
        String(i + 1),
        app.id || '',
        (app.applicant || 'N/A'),
        app.permit_type || '',
        (app.type || 'N/A'),
        app.date ? new Date(app.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }) : 'N/A',
        app.status || ''
      ]);

      if (appRows.length > 0) {
        y = drawTable(appHeaders, appRows, appColW, y);
      } else {
        pdf.setFontSize(9);
        pdf.setTextColor(150, 150, 150);
        pdf.text('No recent applications to display.', m, y + 5);
        y += 12;
      }

      // Application Summary by Status
      y += 6;
      y = sectionTitle('9. Application Status Summary', y);

      const statusSummary = [
        ['Approved', String(stats.approved), `${approvalRate}%`, 'Applications that have been reviewed and approved'],
        ['Pending', String(stats.pending), `${pendingRate}%`, 'Applications awaiting review or action'],
        ['Rejected', String(stats.rejected), `${rejectionRate}%`, 'Applications that were denied or returned'],
      ];
      if ((stats.business.compliance || 0) > 0) {
        statusSummary.push(['Compliance', String(stats.business.compliance), `${stats.total > 0 ? ((stats.business.compliance / stats.total) * 100).toFixed(1) : 0}%`, 'Business permits under compliance review']);
      }
      if ((stats.franchise.under_review || 0) > 0) {
        statusSummary.push(['Under Review', String(stats.franchise.under_review), `${stats.total > 0 ? ((stats.franchise.under_review / stats.total) * 100).toFixed(1) : 0}%`, 'Franchise permits under detailed review']);
      }

      const statusHeaders = ['Status', 'Count', 'Percentage', 'Description'];
      const statusColW = [30, 25, 25, 94];
      y = drawTable(statusHeaders, statusSummary, statusColW, y);

      // Ranking Section
      y += 6;
      y = sectionTitle('10. Permit Type Rankings & Analysis', y);

      const rankHeaders = ['Rank', 'Permit Type', 'Total', 'Approved', 'Approval Rate', 'Share'];
      const rankColW = [15, 35, 25, 25, 35, 30];
      const rankRows = typesRanked.map((t, i) => {
        const total = t.total || 0;
        const approved = t.approved || 0;
        const rate = total > 0 ? ((approved / total) * 100).toFixed(1) + '%' : '0%';
        const share = stats.total > 0 ? ((total / stats.total) * 100).toFixed(1) + '%' : '0%';
        return [`#${i + 1}`, t.name, String(total), String(approved), rate, share];
      });
      y = drawTable(rankHeaders, rankRows, rankColW, y);

      // Final notes
      y += 8;
      pdf.setFillColor(248, 248, 248);
      pdf.roundedRect(m, y, contentWidth, 20, 2, 2, 'F');
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(77, 74, 74);
      pdf.text('Report Notes:', m + 4, y + 6);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(120, 120, 120);
      pdf.setFontSize(7);
      pdf.text(`• This report was auto-generated from live database records on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.`, m + 4, y + 11);
      pdf.text(`• Data covers ${monthlyTrendData.labels.length} months and ${weeklyTrendData.labels.length} weeks of application history across 4 permit databases.`, m + 4, y + 15);

      drawFooter(pageNum);

      pdf.save(`admin-dashboard-report-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setExporting(false);
      setExportType("");
    }
  };

  // CSV Export
  const exportCSV = () => {
    setExporting(true);
    setExportType("csv");
    try {
      const headers = [
        'ID', 'Applicant', 'Permit Type', 'Application Type', 'Status', 'Date', 'Business Name'
      ];

      const rows = recentApplications.map(app => [
        app.id,
        app.applicant,
        app.permit_type,
        app.type,
        app.status,
        app.date,
        app.business_name || ''
      ]);

      // Summary section
      const summary = [
        [],
        ['=== DASHBOARD SUMMARY ==='],
        ['Total Applications', stats.total],
        ['Approved', stats.approved],
        ['Pending', stats.pending],
        ['Rejected', stats.rejected],
        [],
        ['=== PER TYPE BREAKDOWN ==='],
        ['Type', 'Total', 'Approved', 'Pending', 'Rejected'],
        ['Business', stats.business.total || 0, stats.business.approved || 0, stats.business.pending || 0, stats.business.rejected || 0],
        ['Franchise', stats.franchise.total || 0, stats.franchise.approved || 0, stats.franchise.pending || 0, stats.franchise.rejected || 0],
        ['Barangay', stats.barangay.total || 0, stats.barangay.approved || 0, stats.barangay.pending || 0, stats.barangay.rejected || 0],
        ['Building', stats.building.total || 0, stats.building.approved || 0, stats.building.pending || 0, stats.building.rejected || 0],
      ];

      const csvContent = [
        headers.join(','),
        ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
        ...summary.map(r => r.join(','))
      ].join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `admin-dashboard-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('CSV export error:', err);
    } finally {
      setExporting(false);
      setExportType("");
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen p-4 md:p-6 bg-[#FBFBFB] font-poppins flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#4CAF50] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#4D4A4A] font-montserrat">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !dashboardData) {
    return (
      <div className="min-h-screen p-4 md:p-6 bg-[#FBFBFB] font-poppins flex items-center justify-center">
        <div className="text-center bg-white rounded-lg p-8 shadow-sm border border-[#E9E7E7] max-w-md">
          <AlertCircle className="w-12 h-12 text-[#E53935] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#4D4A4A] font-montserrat mb-2">Failed to Load Dashboard</h3>
          <p className="text-sm text-[#4D4A4A] text-opacity-70 mb-4">{error}</p>
          <button onClick={fetchDashboardData} className="bg-[#4CAF50] text-white px-6 py-2 rounded-lg hover:bg-[#45a049] transition-colors font-montserrat">
            <RefreshCw className="w-4 h-4 inline mr-2" />Retry
          </button>
        </div>
      </div>
    );
  }

  const approvalRate = stats.total > 0 ? ((stats.approved / stats.total) * 100).toFixed(1) : 0;
  const rejectionRate = stats.total > 0 ? ((stats.rejected / stats.total) * 100).toFixed(1) : 0;
  const pendingRate = stats.total > 0 ? ((stats.pending / stats.total) * 100).toFixed(1) : 0;

  return (
    <div className="min-h-screen p-4 md:p-6 bg-[#FBFBFB] font-poppins">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#4D4A4A] font-montserrat">
              Admin Dashboard
            </h1>
            <p className="text-[#4D4A4A] text-opacity-70 mt-2">
              Real-time overview of all permit types and system-wide analytics
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-3 md:mt-0">
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="flex items-center space-x-2 bg-white border border-[#E9E7E7] text-[#4D4A4A] px-4 py-2 rounded-lg hover:bg-[#FBFBFB] transition-colors font-montserrat text-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <div className="relative">
              <button
                onClick={() => setExporting(!exporting)}
                className="flex items-center space-x-2 bg-[#4CAF50] text-white px-4 py-2 rounded-lg hover:bg-[#45a049] transition-colors font-montserrat text-sm"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
              {exporting && !exportType && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-[#E9E7E7] py-2 z-50">
                  <button onClick={exportPDF} className="w-full text-left px-4 py-2 text-sm text-[#4D4A4A] hover:bg-[#FBFBFB] font-poppins flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-[#E53935]" /> Export as PDF
                  </button>
                  <button onClick={exportCSV} className="w-full text-left px-4 py-2 text-sm text-[#4D4A4A] hover:bg-[#FBFBFB] font-poppins flex items-center">
                    <BarChart className="w-4 h-4 mr-2 text-[#4CAF50]" /> Export as CSV
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#E9E7E7] mb-6 bg-white rounded-lg p-1">
        {[
          { key: "dashboard", label: "Dashboard", icon: Layers },
          { key: "analytics", label: "Analytics", icon: Activity },
          { key: "reports", label: "Reports", icon: FileText }
        ].map(tab => (
          <button
            key={tab.key}
            className={`py-2 px-6 font-medium font-montserrat rounded-lg transition-all flex items-center space-x-2 ${
              activeTab === tab.key ? "bg-[#4CAF50] text-white" : "text-[#4D4A4A] hover:bg-[#FBFBFB]"
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === "dashboard" && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { title: "Total Applications", value: stats.total, icon: FileText, color: "#4CAF50", sub: "Across all permit types" },
              { title: "Approved", value: stats.approved, icon: CheckCircle, color: "#4CAF50", sub: `${approvalRate}% approval rate` },
              { title: "Pending", value: stats.pending, icon: Clock, color: "#FDA811", sub: `${pendingRate}% awaiting review` },
              { title: "Rejected", value: stats.rejected, icon: XCircle, color: "#E53935", sub: `${rejectionRate}% rejection rate` }
            ].map((stat, idx) => (
              <div key={idx} className="bg-white rounded-lg p-5 shadow-sm border border-[#E9E7E7] transition-all hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#4D4A4A] text-opacity-70 font-poppins">{stat.title}</p>
                    <p className="text-2xl font-bold text-[#4D4A4A] mt-2 font-montserrat">{stat.value}</p>
                    <p className="text-xs text-[#4D4A4A] text-opacity-60 mt-1">{stat.sub}</p>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: stat.color }}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Per-Type Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { name: "Business", data: stats.business, icon: Briefcase, color: "#4CAF50" },
              { name: "Franchise", data: stats.franchise, icon: Users, color: "#4A90E2" },
              { name: "Barangay", data: stats.barangay, icon: Home, color: "#9C27B0" },
              { name: "Building", data: stats.building, icon: Building, color: "#FDA811" }
            ].map((type, idx) => (
              <div key={idx} className="bg-white rounded-lg p-5 shadow-sm border border-[#E9E7E7] hover:shadow-md transition-all"
                style={{ borderTopWidth: '3px', borderTopColor: type.color }}>
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${type.color}15` }}>
                    <type.icon className="w-5 h-5" style={{ color: type.color }} />
                  </div>
                  <div>
                    <p className="font-semibold text-[#4D4A4A] font-montserrat">{type.name} Permit</p>
                    <p className="text-xl font-bold font-montserrat" style={{ color: type.color }}>{type.data.total || 0}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-[#4CAF50]/10 rounded-lg py-1.5">
                    <p className="text-xs text-[#4D4A4A] text-opacity-60">Approved</p>
                    <p className="text-sm font-bold text-[#4CAF50]">{type.data.approved || 0}</p>
                  </div>
                  <div className="bg-[#FDA811]/10 rounded-lg py-1.5">
                    <p className="text-xs text-[#4D4A4A] text-opacity-60">Pending</p>
                    <p className="text-sm font-bold text-[#FDA811]">{type.data.pending || 0}</p>
                  </div>
                  <div className="bg-[#E53935]/10 rounded-lg py-1.5">
                    <p className="text-xs text-[#4D4A4A] text-opacity-60">Rejected</p>
                    <p className="text-sm font-bold text-[#E53935]">{type.data.rejected || 0}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Bar Chart - Applications by Type */}
            <div className="lg:col-span-2 bg-white rounded-lg p-5 shadow-sm border border-[#E9E7E7]">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-[#4D4A4A] font-montserrat">Applications by Permit Type</h3>
                <p className="text-sm text-[#4D4A4A] text-opacity-70">Distribution across all permit categories</p>
              </div>
              <div className="h-[300px]">
                <Bar
                  data={{
                    labels: ["Business", "Franchise", "Building", "Barangay"],
                    datasets: [
                      {
                        label: "Total",
                        data: [
                          stats.business.total || 0,
                          stats.franchise.total || 0,
                          stats.building.total || 0,
                          stats.barangay.total || 0
                        ],
                        backgroundColor: ["#4CAF50", "#4A90E2", "#FDA811", "#9C27B0"],
                        borderRadius: 8,
                        borderWidth: 0,
                      },
                      {
                        label: "Approved",
                        data: [
                          stats.business.approved || 0,
                          stats.franchise.approved || 0,
                          stats.building.approved || 0,
                          stats.barangay.approved || 0
                        ],
                        backgroundColor: ["#4CAF5080", "#4A90E280", "#FDA81180", "#9C27B080"],
                        borderRadius: 8,
                        borderWidth: 0,
                      }
                    ],
                  }}
                  options={{
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        labels: { color: "#4D4A4A", font: { family: 'Poppins' }, usePointStyle: true }
                      },
                    },
                    scales: {
                      x: { ticks: { color: "#4D4A4A", font: { family: 'Poppins' } }, grid: { color: "rgba(233, 231, 231, 0.5)" } },
                      y: { ticks: { color: "#4D4A4A", font: { family: 'Poppins' } }, grid: { color: "rgba(233, 231, 231, 0.5)" }, beginAtZero: true },
                    },
                  }}
                />
              </div>
            </div>

            {/* Doughnut - Status Distribution */}
            <div className="bg-white rounded-lg p-5 shadow-sm border border-[#E9E7E7]">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-[#4D4A4A] font-montserrat">Status Distribution</h3>
                <p className="text-sm text-[#4D4A4A] text-opacity-70">Overall approval status</p>
              </div>
              <div className="h-[250px] flex items-center justify-center">
                <Doughnut
                  data={{
                    labels: ["Approved", "Pending", "Rejected"],
                    datasets: [{
                      data: [stats.approved, stats.pending, stats.rejected],
                      backgroundColor: ["#4CAF50", "#FDA811", "#E53935"],
                      hoverBackgroundColor: ["#45a049", "#fc9d0b", "#d32f2f"],
                      borderColor: "#ffffff",
                      borderWidth: 3,
                    }],
                  }}
                  options={{
                    maintainAspectRatio: false,
                    cutout: '65%',
                    plugins: {
                      legend: {
                        position: "bottom",
                        labels: { color: "#4D4A4A", font: { family: 'Poppins' }, padding: 15, usePointStyle: true },
                      },
                    },
                  }}
                />
              </div>
              {/* Center label */}
              <div className="text-center -mt-2">
                <p className="text-2xl font-bold text-[#4D4A4A] font-montserrat">{stats.total}</p>
                <p className="text-xs text-[#4D4A4A] text-opacity-60">Total</p>
              </div>
            </div>
          </div>

          {/* Monthly Trend (Quick View) */}
          <div className="bg-white rounded-lg p-5 shadow-sm border border-[#E9E7E7] mb-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-[#4D4A4A] font-montserrat">Monthly Application Trends</h3>
              <p className="text-sm text-[#4D4A4A] text-opacity-70">Total applications, approvals, and rejections over time</p>
            </div>
            <div className="h-[280px]">
              <Line
                data={{
                  labels: monthlyTrendData.labels,
                  datasets: [
                    {
                      label: "Total Applications",
                      data: monthlyTrendData.applications,
                      borderColor: "#4CAF50",
                      backgroundColor: "rgba(76, 175, 80, 0.08)",
                      tension: 0.4,
                      fill: true,
                      pointRadius: 4,
                      pointBackgroundColor: "#4CAF50",
                      borderWidth: 2,
                    },
                    {
                      label: "Approved",
                      data: monthlyTrendData.approvals,
                      borderColor: "#4A90E2",
                      backgroundColor: "rgba(74, 144, 226, 0.08)",
                      tension: 0.4,
                      fill: true,
                      pointRadius: 4,
                      pointBackgroundColor: "#4A90E2",
                      borderWidth: 2,
                    },
                    {
                      label: "Rejected",
                      data: monthlyTrendData.rejections,
                      borderColor: "#E53935",
                      backgroundColor: "rgba(229, 57, 53, 0.05)",
                      tension: 0.4,
                      fill: true,
                      pointRadius: 4,
                      pointBackgroundColor: "#E53935",
                      borderWidth: 2,
                    }
                  ],
                }}
                options={{
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { labels: { color: "#4D4A4A", font: { family: 'Poppins' }, usePointStyle: true } },
                  },
                  scales: {
                    x: { ticks: { color: "#4D4A4A", font: { family: 'Poppins', size: 10 } }, grid: { color: "rgba(233, 231, 231, 0.5)" } },
                    y: { ticks: { color: "#4D4A4A", font: { family: 'Poppins' } }, grid: { color: "rgba(233, 231, 231, 0.5)" }, beginAtZero: true },
                  },
                }}
              />
            </div>
          </div>

          {/* Most Recent & Today's Applications */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Most Recent Application */}
            <div className="bg-white rounded-lg p-5 shadow-sm border border-[#E9E7E7]">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-[#4D4A4A] font-montserrat">Most Recent Application</h4>
                <Clock className="w-4 h-4 text-[#4CAF50]" />
              </div>
              {mostRecentApplication ? (
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-mono font-semibold text-[#4D4A4A]">{mostRecentApplication.id}</p>
                      <p className="text-xs text-[#4D4A4A] text-opacity-70 mt-1">{mostRecentApplication.permit_type} Permit</p>
                    </div>
                    <span
                      className="px-2 py-1 text-xs font-medium rounded-full"
                      style={{ 
                        backgroundColor: `${STATUS_COLORS[mostRecentApplication.status] || '#4D4A4A'}15`, 
                        color: STATUS_COLORS[mostRecentApplication.status] || '#4D4A4A' 
                      }}
                    >
                      {mostRecentApplication.status}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <User className="w-4 h-4 text-[#4D4A4A] text-opacity-50 mr-2" />
                      <span className="text-[#4D4A4A] truncate">{mostRecentApplication.applicant || 'N/A'}</span>
                    </div>
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 text-[#4D4A4A] text-opacity-50 mr-2" />
                      <span className="text-[#4D4A4A] text-opacity-70 text-xs truncate">{mostRecentApplication.type || 'N/A'}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 text-[#4D4A4A] text-opacity-50 mr-2" />
                      <span className="text-[#4D4A4A] text-opacity-70 text-xs">{formatDate(mostRecentApplication.date)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <FileText className="w-8 h-8 text-[#4D4A4A] text-opacity-30 mx-auto mb-2" />
                  <p className="text-xs text-[#4D4A4A] text-opacity-60 font-poppins">No applications yet</p>
                </div>
              )}
            </div>

            {/* Today's Applications */}
            <div className="bg-white rounded-lg p-5 shadow-sm border border-[#E9E7E7]">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-[#4D4A4A] font-montserrat">Today's Applications</h4>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-[#4A90E2]" />
                  <span className="text-lg font-bold text-[#4A90E2] font-montserrat">{todaysApplications.length}</span>
                </div>
              </div>
              {todaysApplications.length > 0 ? (
                <div className="space-y-2">
                  {todaysApplications.slice(0, 3).map((app, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-[#FBFBFB] rounded-lg border border-[#E9E7E7]">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <div 
                          className="w-2 h-2 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: PERMIT_COLORS[app.permit_type] || '#4D4A4A' }}
                        ></div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-mono font-semibold text-[#4D4A4A] truncate">{app.id}</p>
                          <p className="text-xs text-[#4D4A4A] text-opacity-70 truncate">{app.applicant}</p>
                        </div>
                      </div>
                      <span
                        className="px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ml-2"
                        style={{ 
                          backgroundColor: `${STATUS_COLORS[app.status] || '#4D4A4A'}15`, 
                          color: STATUS_COLORS[app.status] || '#4D4A4A' 
                        }}
                      >
                        {app.status}
                      </span>
                    </div>
                  ))}
                  {todaysApplications.length > 3 && (
                    <p className="text-xs text-center text-[#4D4A4A] text-opacity-60 mt-2">
                      +{todaysApplications.length - 3} more today
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Calendar className="w-8 h-8 text-[#4D4A4A] text-opacity-30 mx-auto mb-2" />
                  <p className="text-xs text-[#4D4A4A] text-opacity-60 font-poppins">No applications today</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Insights Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg p-5 shadow-sm border border-[#E9E7E7]">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-[#4D4A4A] font-montserrat">Permit Type Share</h4>
                <Layers className="w-4 h-4 text-[#4D4A4A] text-opacity-50" />
              </div>
              <div className="space-y-2">
                {[
                  { name: 'Business', count: stats.business.total || 0, color: '#4CAF50' },
                  { name: 'Franchise', count: stats.franchise.total || 0, color: '#4A90E2' },
                  { name: 'Barangay', count: stats.barangay.total || 0, color: '#9C27B0' },
                  { name: 'Building', count: stats.building.total || 0, color: '#FDA811' }
                ].map((t, i) => {
                  const pct = stats.total > 0 ? ((t.count / stats.total) * 100).toFixed(0) : 0;
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[#4D4A4A] font-poppins">{t.name}</span>
                        <span className="font-bold" style={{ color: t.color }}>{t.count} ({pct}%)</span>
                      </div>
                      <div className="bg-gray-100 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: t.color }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-lg p-5 shadow-sm border border-[#E9E7E7]">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-[#4D4A4A] font-montserrat">Status Overview</h4>
                <Activity className="w-4 h-4 text-[#4D4A4A] text-opacity-50" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-[#4CAF50] mr-2"></div>
                    <span className="text-xs text-[#4D4A4A] font-poppins">Approved</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-[#4CAF50] font-montserrat">{stats.approved}</span>
                    <span className="text-xs text-[#4D4A4A] text-opacity-60 ml-1">({approvalRate}%)</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-[#FDA811] mr-2"></div>
                    <span className="text-xs text-[#4D4A4A] font-poppins">Pending</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-[#FDA811] font-montserrat">{stats.pending}</span>
                    <span className="text-xs text-[#4D4A4A] text-opacity-60 ml-1">({pendingRate}%)</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-[#E53935] mr-2"></div>
                    <span className="text-xs text-[#4D4A4A] font-poppins">Rejected</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-[#E53935] font-montserrat">{stats.rejected}</span>
                    <span className="text-xs text-[#4D4A4A] text-opacity-60 ml-1">({rejectionRate}%)</span>
                  </div>
                </div>
                {(stats.business.compliance > 0 || stats.franchise.under_review > 0) && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-[#4A90E2] mr-2"></div>
                      <span className="text-xs text-[#4D4A4A] font-poppins">Compliance/Review</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-[#4A90E2] font-montserrat">{(stats.business.compliance || 0) + (stats.franchise.under_review || 0)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg p-5 shadow-sm border border-[#E9E7E7]">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-[#4D4A4A] font-montserrat">System Summary</h4>
                <BarChart className="w-4 h-4 text-[#4D4A4A] text-opacity-50" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#4D4A4A] text-opacity-70 font-poppins">Total Applications</span>
                  <span className="text-lg font-bold text-[#4D4A4A] font-montserrat">{stats.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#4D4A4A] text-opacity-70 font-poppins">Active Permit Types</span>
                  <span className="text-lg font-bold text-[#4A90E2] font-montserrat">4</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#4D4A4A] text-opacity-70 font-poppins">Approval Rate</span>
                  <span className="text-lg font-bold text-[#4CAF50] font-montserrat">{approvalRate}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#4D4A4A] text-opacity-70 font-poppins">Data Points (Months)</span>
                  <span className="text-lg font-bold text-[#FDA811] font-montserrat">{monthlyTrendData.labels.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Applications */}
          <div className="bg-white rounded-lg shadow-sm border border-[#E9E7E7] p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-[#4D4A4A] font-montserrat">Recent Permit Applications</h3>
                <p className="text-sm text-[#4D4A4A] text-opacity-70">Latest applications across all permit types</p>
              </div>
              <div className="flex items-center space-x-3 mt-3 md:mt-0">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-[#4D4A4A] text-opacity-50" />
                  <input
                    type="text"
                    placeholder="Search applications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-white border border-[#E9E7E7] rounded-lg text-sm text-[#4D4A4A] focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent font-poppins w-56"
                  />
                </div>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="bg-white border border-[#E9E7E7] rounded-lg px-3 py-2 text-sm text-[#4D4A4A] focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent font-poppins"
                >
                  <option value="all">All Types</option>
                  <option value="Business">Business</option>
                  <option value="Franchise">Franchise</option>
                  <option value="Barangay">Barangay</option>
                  <option value="Building">Building</option>
                </select>
              </div>
            </div>

            {recentApplications.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-[#4D4A4A] text-opacity-30 mx-auto mb-3" />
                <p className="text-[#4D4A4A] text-opacity-60 font-poppins">No recent applications found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {recentApplications.slice(0, 10).map((app, i) => {
                  const PermitIcon = PERMIT_ICONS[app.permit_type] || FileText;
                  const permitColor = PERMIT_COLORS[app.permit_type] || "#4D4A4A";
                  const statusColor = STATUS_COLORS[app.status] || "#4D4A4A";

                  return (
                    <div
                      key={`${app.id}-${i}`}
                      className="border border-[#E9E7E7] rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
                      style={{ borderLeftWidth: '4px', borderLeftColor: permitColor }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg" style={{ backgroundColor: `${permitColor}15` }}>
                            <PermitIcon className="w-5 h-5" style={{ color: permitColor }} />
                          </div>
                          <div>
                            <p className="text-sm font-mono font-semibold text-[#4D4A4A]">{app.id}</p>
                            <p className="text-xs text-[#4D4A4A] text-opacity-70">{app.permit_type} Permit</p>
                          </div>
                        </div>
                        <span
                          className="px-2 py-1 text-xs font-medium rounded-full"
                          style={{ backgroundColor: `${statusColor}15`, color: statusColor }}
                        >
                          {app.status}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-[#4D4A4A] text-opacity-50 mr-2 flex-shrink-0" />
                          <p className="text-sm text-[#4D4A4A] font-poppins truncate">{app.applicant || 'N/A'}</p>
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 text-[#4D4A4A] text-opacity-50 mr-2 flex-shrink-0" />
                          <p className="text-xs text-[#4D4A4A] text-opacity-70 font-poppins">{formatDate(app.date)}</p>
                        </div>
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 text-[#4D4A4A] text-opacity-50 mr-2 flex-shrink-0" />
                          <p className="text-xs text-[#4D4A4A] text-opacity-70 font-poppins truncate">{app.type || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "analytics" && (
        <div className="space-y-6" ref={analyticsRef}>
          {/* Analytics Header */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-[#4D4A4A] font-montserrat">Analytics Overview</h2>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-5 shadow-sm border border-[#E9E7E7] border-l-4 border-l-[#4CAF50]">
              <p className="text-[#4D4A4A] text-opacity-70 text-sm font-poppins">Approval Rate</p>
              <p className="text-2xl font-bold text-[#4CAF50] font-montserrat mt-1">{approvalRate}%</p>
              <div className="mt-2 bg-gray-100 rounded-full h-2">
                <div className="bg-[#4CAF50] h-2 rounded-full" style={{ width: `${approvalRate}%` }}></div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-5 shadow-sm border border-[#E9E7E7] border-l-4 border-l-[#FDA811]">
              <p className="text-[#4D4A4A] text-opacity-70 text-sm font-poppins">Pending Rate</p>
              <p className="text-2xl font-bold text-[#FDA811] font-montserrat mt-1">{pendingRate}%</p>
              <div className="mt-2 bg-gray-100 rounded-full h-2">
                <div className="bg-[#FDA811] h-2 rounded-full" style={{ width: `${pendingRate}%` }}></div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-5 shadow-sm border border-[#E9E7E7] border-l-4 border-l-[#E53935]">
              <p className="text-[#4D4A4A] text-opacity-70 text-sm font-poppins">Rejection Rate</p>
              <p className="text-2xl font-bold text-[#E53935] font-montserrat mt-1">{rejectionRate}%</p>
              <div className="mt-2 bg-gray-100 rounded-full h-2">
                <div className="bg-[#E53935] h-2 rounded-full" style={{ width: `${rejectionRate}%` }}></div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-5 shadow-sm border border-[#E9E7E7] border-l-4 border-l-[#4A90E2]">
              <p className="text-[#4D4A4A] text-opacity-70 text-sm font-poppins">Most Active Type</p>
              <p className="text-2xl font-bold text-[#4A90E2] font-montserrat mt-1">
                {(() => {
                  const types = [
                    { name: 'Business', count: stats.business.total || 0 },
                    { name: 'Franchise', count: stats.franchise.total || 0 },
                    { name: 'Barangay', count: stats.barangay.total || 0 },
                    { name: 'Building', count: stats.building.total || 0 }
                  ];
                  return types.sort((a, b) => b.count - a.count)[0]?.name || 'N/A';
                })()}
              </p>
              <p className="text-xs text-[#4D4A4A] text-opacity-60 mt-1">Highest application volume</p>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Trends */}
            <div className="bg-white rounded-lg p-5 shadow-sm border border-[#E9E7E7]">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-[#4D4A4A] font-montserrat">Monthly Application Trends</h3>
                <p className="text-sm text-[#4D4A4A] text-opacity-70">Applications, approvals, and rejections over time</p>
              </div>
              <div className="h-80">
                <Line
                  ref={chartRef}
                  data={{
                    labels: monthlyTrendData.labels,
                    datasets: [
                      {
                        label: "Applications",
                        data: monthlyTrendData.applications,
                        borderColor: "#4CAF50",
                        backgroundColor: "rgba(76, 175, 80, 0.1)",
                        tension: 0.4,
                        fill: true,
                        pointRadius: 4,
                        pointBackgroundColor: "#4CAF50",
                      },
                      {
                        label: "Approved",
                        data: monthlyTrendData.approvals,
                        borderColor: "#4A90E2",
                        backgroundColor: "rgba(74, 144, 226, 0.1)",
                        tension: 0.4,
                        fill: true,
                        pointRadius: 4,
                        pointBackgroundColor: "#4A90E2",
                      },
                      {
                        label: "Rejected",
                        data: monthlyTrendData.rejections,
                        borderColor: "#E53935",
                        backgroundColor: "rgba(229, 57, 53, 0.05)",
                        tension: 0.4,
                        fill: true,
                        pointRadius: 4,
                        pointBackgroundColor: "#E53935",
                      }
                    ],
                  }}
                  options={{
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { labels: { color: "#4D4A4A", font: { family: 'Poppins' }, usePointStyle: true } },
                    },
                    scales: {
                      x: { ticks: { color: "#4D4A4A", font: { family: 'Poppins', size: 10 } }, grid: { color: "rgba(233, 231, 231, 0.5)" } },
                      y: { ticks: { color: "#4D4A4A", font: { family: 'Poppins' } }, grid: { color: "rgba(233, 231, 231, 0.5)" }, beginAtZero: true },
                    },
                  }}
                />
              </div>
            </div>

            {/* Weekly Trend */}
            <div className="bg-white rounded-lg p-5 shadow-sm border border-[#E9E7E7]">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-[#4D4A4A] font-montserrat">Weekly Applications Trend</h3>
                <p className="text-sm text-[#4D4A4A] text-opacity-70">Last 8 weeks application volume</p>
              </div>
              <div className="h-80">
                <Line
                  data={{
                    labels: weeklyTrendData.labels,
                    datasets: [{
                      label: "Applications",
                      data: weeklyTrendData.data,
                      borderColor: "#4A90E2",
                      backgroundColor: "rgba(74, 144, 226, 0.15)",
                      tension: 0.4,
                      fill: true,
                      pointRadius: 5,
                      pointBackgroundColor: "#4A90E2",
                      pointBorderColor: "#fff",
                      pointBorderWidth: 2,
                    }],
                  }}
                  options={{
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { labels: { color: "#4D4A4A", font: { family: 'Poppins' }, usePointStyle: true } },
                    },
                    scales: {
                      x: { ticks: { color: "#4D4A4A", font: { family: 'Poppins', size: 9 }, maxRotation: 45 }, grid: { color: "rgba(233, 231, 231, 0.5)" } },
                      y: { ticks: { color: "#4D4A4A", font: { family: 'Poppins' } }, grid: { color: "rgba(233, 231, 231, 0.5)" }, beginAtZero: true },
                    },
                  }}
                />
              </div>
            </div>

            {/* Per-Type Monthly Stacked Bar */}
            <div className="bg-white rounded-lg p-5 shadow-sm border border-[#E9E7E7]">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-[#4D4A4A] font-montserrat">Applications by Type (Monthly)</h3>
                <p className="text-sm text-[#4D4A4A] text-opacity-70">Stacked breakdown per permit type</p>
              </div>
              <div className="h-80">
                <Bar
                  data={{
                    labels: perTypeMonthlyData.labels,
                    datasets: [
                      { label: "Business", data: perTypeMonthlyData.business, backgroundColor: "#4CAF50", borderRadius: 4 },
                      { label: "Franchise", data: perTypeMonthlyData.franchise, backgroundColor: "#4A90E2", borderRadius: 4 },
                      { label: "Barangay", data: perTypeMonthlyData.barangay, backgroundColor: "#9C27B0", borderRadius: 4 },
                      { label: "Building", data: perTypeMonthlyData.building, backgroundColor: "#FDA811", borderRadius: 4 }
                    ],
                  }}
                  options={{
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { labels: { color: "#4D4A4A", font: { family: 'Poppins', size: 11 }, usePointStyle: true } },
                    },
                    scales: {
                      x: { stacked: true, ticks: { color: "#4D4A4A", font: { family: 'Poppins', size: 10 } }, grid: { color: "rgba(233, 231, 231, 0.5)" } },
                      y: { stacked: true, ticks: { color: "#4D4A4A", font: { family: 'Poppins' } }, grid: { color: "rgba(233, 231, 231, 0.5)" }, beginAtZero: true },
                    },
                  }}
                />
              </div>
            </div>

            {/* Permit Type Pie */}
            <div className="bg-white rounded-lg p-5 shadow-sm border border-[#E9E7E7]">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-[#4D4A4A] font-montserrat">Permit Type Distribution</h3>
                <p className="text-sm text-[#4D4A4A] text-opacity-70">Proportion of each permit category</p>
              </div>
              <div className="h-80">
                <Pie
                  data={{
                    labels: ["Business", "Franchise", "Barangay", "Building"],
                    datasets: [{
                      data: [
                        stats.business.total || 0,
                        stats.franchise.total || 0,
                        stats.barangay.total || 0,
                        stats.building.total || 0
                      ],
                      backgroundColor: ["#4CAF50", "#4A90E2", "#9C27B0", "#FDA811"],
                      borderWidth: 3,
                      borderColor: "#fff",
                    }],
                  }}
                  options={{
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "bottom",
                        labels: { color: "#4D4A4A", font: { family: 'Poppins', size: 12 }, padding: 15, usePointStyle: true }
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>

          {/* Per-Type Status Comparison Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-5 shadow-sm border border-[#E9E7E7]">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-[#4D4A4A] font-montserrat">Status Comparison by Type</h3>
                <p className="text-sm text-[#4D4A4A] text-opacity-70">Approved vs Pending vs Rejected per permit type</p>
              </div>
              <div className="h-80">
                <Bar
                  data={{
                    labels: ['Business', 'Franchise', 'Barangay', 'Building'],
                    datasets: [
                      {
                        label: 'Approved',
                        data: [
                          stats.business.approved || 0,
                          stats.franchise.approved || 0,
                          stats.barangay.approved || 0,
                          stats.building.approved || 0
                        ],
                        backgroundColor: '#4CAF50',
                        borderRadius: 4,
                      },
                      {
                        label: 'Pending',
                        data: [
                          stats.business.pending || 0,
                          stats.franchise.pending || 0,
                          stats.barangay.pending || 0,
                          stats.building.pending || 0
                        ],
                        backgroundColor: '#FDA811',
                        borderRadius: 4,
                      },
                      {
                        label: 'Rejected',
                        data: [
                          stats.business.rejected || 0,
                          stats.franchise.rejected || 0,
                          stats.barangay.rejected || 0,
                          stats.building.rejected || 0
                        ],
                        backgroundColor: '#E53935',
                        borderRadius: 4,
                      }
                    ],
                  }}
                  options={{
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    plugins: {
                      legend: { labels: { color: "#4D4A4A", font: { family: 'Poppins' }, usePointStyle: true } },
                    },
                    scales: {
                      x: { ticks: { color: "#4D4A4A", font: { family: 'Poppins' } }, grid: { color: "rgba(233, 231, 231, 0.5)" }, beginAtZero: true },
                      y: { ticks: { color: "#4D4A4A", font: { family: 'Poppins', size: 11 } }, grid: { display: false } },
                    },
                  }}
                />
              </div>
            </div>

            <div className="bg-white rounded-lg p-5 shadow-sm border border-[#E9E7E7]">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-[#4D4A4A] font-montserrat">Approval Rate Comparison</h3>
                <p className="text-sm text-[#4D4A4A] text-opacity-70">Approval percentage per permit type</p>
              </div>
              <div className="h-80">
                <Bar
                  data={{
                    labels: ['Business', 'Franchise', 'Barangay', 'Building'],
                    datasets: [{
                      label: 'Approval Rate (%)',
                      data: [
                        stats.business.total > 0 ? ((stats.business.approved || 0) / stats.business.total * 100).toFixed(1) : 0,
                        stats.franchise.total > 0 ? ((stats.franchise.approved || 0) / stats.franchise.total * 100).toFixed(1) : 0,
                        stats.barangay.total > 0 ? ((stats.barangay.approved || 0) / stats.barangay.total * 100).toFixed(1) : 0,
                        stats.building.total > 0 ? ((stats.building.approved || 0) / stats.building.total * 100).toFixed(1) : 0,
                      ],
                      backgroundColor: ['#4CAF50', '#4A90E2', '#9C27B0', '#FDA811'],
                      borderRadius: 8,
                      borderWidth: 0,
                      barThickness: 40,
                    }],
                  }}
                  options={{
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          label: (ctx) => `${ctx.parsed.y}%`
                        }
                      }
                    },
                    scales: {
                      x: { ticks: { color: "#4D4A4A", font: { family: 'Poppins' } }, grid: { color: "rgba(233, 231, 231, 0.5)" } },
                      y: { ticks: { color: "#4D4A4A", font: { family: 'Poppins' }, callback: (v) => v + '%' }, grid: { color: "rgba(233, 231, 231, 0.5)" }, beginAtZero: true, max: 100 },
                    },
                  }}
                />
              </div>
            </div>
          </div>

          {/* Per-Type Status Breakdown */}
          <div className="bg-white rounded-lg p-5 shadow-sm border border-[#E9E7E7]">
            <h3 className="text-lg font-semibold text-[#4D4A4A] font-montserrat mb-4">Per-Type Status Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { name: "Business", data: stats.business, color: "#4CAF50", icon: Briefcase },
                { name: "Franchise", data: stats.franchise, color: "#4A90E2", icon: Users },
                { name: "Barangay", data: stats.barangay, color: "#9C27B0", icon: Home },
                { name: "Building", data: stats.building, color: "#FDA811", icon: Building }
              ].map((type, idx) => {
                const total = type.data.total || 0;
                const approved = type.data.approved || 0;
                const pending = type.data.pending || 0;
                const rejected = type.data.rejected || 0;
                const approvalPct = total > 0 ? ((approved / total) * 100).toFixed(0) : 0;

                return (
                  <div key={idx} className="border border-[#E9E7E7] rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <type.icon className="w-5 h-5" style={{ color: type.color }} />
                      <span className="font-semibold text-[#4D4A4A] font-montserrat">{type.name}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-[#4D4A4A] text-opacity-70">Total</span>
                        <span className="font-bold text-[#4D4A4A]">{total}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#4CAF50]">Approved</span>
                        <span className="font-bold text-[#4CAF50]">{approved}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#FDA811]">Pending</span>
                        <span className="font-bold text-[#FDA811]">{pending}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#E53935]">Rejected</span>
                        <span className="font-bold text-[#E53935]">{rejected}</span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-[#E9E7E7]">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-[#4D4A4A] text-opacity-60">Approval Rate</span>
                          <span className="font-bold" style={{ color: type.color }}>{approvalPct}%</span>
                        </div>
                        <div className="bg-gray-100 rounded-full h-2">
                          <div className="h-2 rounded-full" style={{ width: `${approvalPct}%`, backgroundColor: type.color }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === "reports" && (
        <div className="space-y-6">
          {/* Reports Header */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-[#4D4A4A] font-montserrat">Reports & Exports</h2>
            <div className="text-sm text-[#4D4A4A] text-opacity-70 font-poppins">
              Last generated: {new Date().toLocaleDateString()}
            </div>
          </div>

          {/* Report Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Summary Report */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-[#E9E7E7]">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-[#4CAF50]/10 rounded-lg flex items-center justify-center mr-4">
                  <FileText className="w-6 h-6 text-[#4CAF50]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#4D4A4A] font-montserrat">Summary Report</h3>
                  <p className="text-sm text-[#4D4A4A] text-opacity-70 font-poppins">Overview of all {stats.total} applications</p>
                </div>
              </div>
              <div className="mb-4 text-sm text-[#4D4A4A] text-opacity-70 space-y-1">
                <p>Business: {stats.business.total || 0} | Franchise: {stats.franchise.total || 0}</p>
                <p>Barangay: {stats.barangay.total || 0} | Building: {stats.building.total || 0}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={exportPDF}
                  className="flex-1 bg-[#E53935] hover:bg-[#d32f2f] text-white py-2 px-3 rounded-lg text-sm transition-colors font-montserrat flex items-center justify-center"
                >
                  <Printer className="w-4 h-4 mr-1" /> PDF
                </button>
                <button
                  onClick={exportCSV}
                  className="flex-1 bg-[#4CAF50] hover:bg-[#45a049] text-white py-2 px-3 rounded-lg text-sm transition-colors font-montserrat flex items-center justify-center"
                >
                  <DownloadCloud className="w-4 h-4 mr-1" /> CSV
                </button>
              </div>
            </div>

            {/* Analytics Report */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-[#E9E7E7]">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-[#4A90E2]/10 rounded-lg flex items-center justify-center mr-4">
                  <TrendingUp className="w-6 h-6 text-[#4A90E2]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#4D4A4A] font-montserrat">Analytics Report</h3>
                  <p className="text-sm text-[#4D4A4A] text-opacity-70 font-poppins">Charts & trends analysis</p>
                </div>
              </div>
              <div className="mb-4 text-sm text-[#4D4A4A] text-opacity-70 space-y-1">
                <p>Approval Rate: {approvalRate}%</p>
                <p>Monthly data points: {monthlyTrendData.labels.length} months</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={exportPDF}
                  className="flex-1 bg-[#E53935] hover:bg-[#d32f2f] text-white py-2 px-3 rounded-lg text-sm transition-colors font-montserrat flex items-center justify-center"
                >
                  <Printer className="w-4 h-4 mr-1" /> PDF
                </button>
                <button
                  onClick={exportCSV}
                  className="flex-1 bg-[#4CAF50] hover:bg-[#45a049] text-white py-2 px-3 rounded-lg text-sm transition-colors font-montserrat flex items-center justify-center"
                >
                  <DownloadCloud className="w-4 h-4 mr-1" /> CSV
                </button>
              </div>
            </div>

            {/* Per-Type Report */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-[#E9E7E7]">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-[#FDA811]/10 rounded-lg flex items-center justify-center mr-4">
                  <Layers className="w-6 h-6 text-[#FDA811]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#4D4A4A] font-montserrat">Per-Type Report</h3>
                  <p className="text-sm text-[#4D4A4A] text-opacity-70 font-poppins">Breakdown by permit type</p>
                </div>
              </div>
              <div className="mb-4 text-sm text-[#4D4A4A] text-opacity-70 space-y-1">
                <p>4 permit categories analyzed</p>
                <p>Status & trend breakdowns included</p>
              </div>
              <button
                onClick={exportCSV}
                className="w-full bg-[#4CAF50] hover:bg-[#45a049] text-white py-2 rounded-lg text-sm transition-colors font-montserrat flex items-center justify-center"
              >
                <DownloadCloud className="w-4 h-4 mr-1" /> Generate Report
              </button>
            </div>
          </div>

          {/* Live Data Table */}
          <div className="bg-white rounded-lg shadow-sm border border-[#E9E7E7] overflow-hidden">
            <div className="p-5 border-b border-[#E9E7E7]">
              <h3 className="text-lg font-semibold text-[#4D4A4A] font-montserrat">All Recent Applications (Top 10)</h3>
              <p className="text-sm text-[#4D4A4A] text-opacity-70 font-poppins">Live data from all permit databases</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#FBFBFB]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#4D4A4A] uppercase tracking-wider font-montserrat">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#4D4A4A] uppercase tracking-wider font-montserrat">Applicant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#4D4A4A] uppercase tracking-wider font-montserrat">Permit Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#4D4A4A] uppercase tracking-wider font-montserrat">Application Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#4D4A4A] uppercase tracking-wider font-montserrat">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#4D4A4A] uppercase tracking-wider font-montserrat">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-[#E9E7E7]">
                  {recentApplications.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-sm text-[#4D4A4A] text-opacity-60 font-poppins">
                        No applications found
                      </td>
                    </tr>
                  ) : (
                    recentApplications.slice(0, 10).map((app, i) => {
                      const permitColor = PERMIT_COLORS[app.permit_type] || "#4D4A4A";
                      const statusColor = STATUS_COLORS[app.status] || "#4D4A4A";

                      return (
                        <tr key={`${app.id}-${i}`} className="hover:bg-[#FBFBFB] transition-colors">
                          <td className="px-6 py-4 text-sm font-mono font-semibold text-[#4D4A4A]">{app.id}</td>
                          <td className="px-6 py-4 text-sm text-[#4D4A4A] font-poppins">{app.applicant || 'N/A'}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: `${permitColor}15`, color: permitColor }}>
                              {app.permit_type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-[#4D4A4A] font-poppins">{app.type || 'N/A'}</td>
                          <td className="px-6 py-4 text-sm text-[#4D4A4A] font-poppins">{formatDate(app.date)}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: `${statusColor}15`, color: statusColor }}>
                              {app.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Export overlay */}
      {exporting && exportType && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 shadow-xl text-center">
            <div className="w-12 h-12 border-4 border-[#4CAF50] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[#4D4A4A] font-montserrat">Generating {exportType.toUpperCase()} report...</p>
          </div>
        </div>
      )}
    </div>
  );
}