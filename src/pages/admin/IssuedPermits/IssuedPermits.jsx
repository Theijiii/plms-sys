import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import {
  Search,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
  RefreshCw,
  CalendarClock,
  Loader2,
  CalendarDays,
  Save,
  Briefcase,
  Building,
  Users,
  Home,
  Eye,
  AlertCircle,
  User,
  Calendar,
} from "lucide-react";

const DEPT_TO_CATEGORY = {
  business: "Business Permit",
  building: "Building Permit",
  transport: "Franchise Permit",
  barangay: "Barangay Permit",
};

const PERMIT_COLORS = {
  "Business Permit": "#4CAF50",
  "Franchise Permit": "#4A90E2",
  "Building Permit": "#FDA811",
  "Barangay Permit": "#9C27B0",
};

const PERMIT_ICONS = {
  "Business Permit": Briefcase,
  "Franchise Permit": Users,
  "Building Permit": Building,
  "Barangay Permit": Home,
};

const STATUS_COLORS = {
  Approved: "#4CAF50",
  APPROVED: "#4CAF50",
  Pending: "#FDA811",
  pending: "#FDA811",
  Rejected: "#E53935",
  rejected: "#E53935",
  "For Compliance": "#4A90E2",
  "Under Review": "#4A90E2",
};

const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch { return dateStr; }
};

export default function IssuedPermits() {
  const { user } = useAuth();
  const adminDept = user?.department || "super";
  const isSuper = adminDept === "super";

  const [permits, setPermits] = useState([]);
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, rejected: 0, totalExpired: 0, expiringSoon: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortDir, setSortDir] = useState("desc");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [selectedPermit, setSelectedPermit] = useState(null);
  const [expirationModal, setExpirationModal] = useState(null);
  const [editApprovedDate, setEditApprovedDate] = useState("");
  const [editExpirationDate, setEditExpirationDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  const fetchPermits = async () => {
    setLoading(true);
    setError(null);
    try {
      const deptParam = !isSuper && DEPT_TO_CATEGORY[adminDept] ? `?department=${encodeURIComponent(DEPT_TO_CATEGORY[adminDept])}` : "";
      const res = await fetch(`/backend/api/issued_permits.php${deptParam}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success) {
        setPermits(data.permits || []);
        setStats(data.stats || {});
      } else {
        throw new Error(data.message || "Failed to fetch");
      }
    } catch (err) {
      console.error("IssuedPermits fetch error:", err);
      setError("Failed to load permits. " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPermits(); }, []);

  // Available categories based on department
  const availableCategories = isSuper
    ? ["Business Permit", "Building Permit", "Franchise Permit", "Barangay Permit"]
    : DEPT_TO_CATEGORY[adminDept] ? [DEPT_TO_CATEGORY[adminDept]] : [];

  // Filtering + sorting
  const filtered = useMemo(() => {
    let list = [...permits];

    if (!isSuper && DEPT_TO_CATEGORY[adminDept]) {
      list = list.filter((p) => p.permitCategory === DEPT_TO_CATEGORY[adminDept]);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        (p.applicantName || "").toLowerCase().includes(q) ||
        (p.businessName || "").toLowerCase().includes(q) ||
        (p.email || "").toLowerCase().includes(q) ||
        (p.id + "").toLowerCase().includes(q) ||
        (p.permitCategory || "").toLowerCase().includes(q)
      );
    }
    if (categoryFilter !== "all") list = list.filter((p) => p.permitCategory === categoryFilter);
    if (statusFilter !== "all") {
      if (statusFilter === "expired") list = list.filter((p) => p.isExpired);
      else if (statusFilter === "expiring") list = list.filter((p) => !p.isExpired && p.daysUntilExpiry !== null && p.daysUntilExpiry <= 30);
      else list = list.filter((p) => p.status?.toLowerCase() === statusFilter.toLowerCase());
    }

    list.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortBy === "date") return (new Date(a.submittedDate || 0) - new Date(b.submittedDate || 0)) * dir;
      if (sortBy === "expiration") return (new Date(a.expirationDate || "2099-12-31") - new Date(b.expirationDate || "2099-12-31")) * dir;
      if (sortBy === "name") return (a.applicantName || "").localeCompare(b.applicantName || "") * dir;
      if (sortBy === "status") return (a.status || "").localeCompare(b.status || "") * dir;
      return 0;
    });
    return list;
  }, [permits, search, categoryFilter, statusFilter, sortBy, sortDir, isSuper, adminDept]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => { if (page > totalPages) setPage(1); }, [totalPages]);

  // Expiration modal handlers
  const openExpirationModal = (permit) => {
    const today = new Date().toISOString().split("T")[0];
    const approvedVal = permit.approvedDate ? permit.approvedDate.split(" ")[0] : today;
    setEditApprovedDate(approvedVal);
    const oneYear = new Date(approvedVal);
    oneYear.setFullYear(oneYear.getFullYear() + 1);
    setEditExpirationDate(permit.expirationDate ? permit.expirationDate.split(" ")[0] : oneYear.toISOString().split("T")[0]);
    setExpirationModal(permit);
    setSaveMessage(null);
  };

  const handleApprovedDateChange = (val) => {
    setEditApprovedDate(val);
    if (val) { const d = new Date(val); d.setFullYear(d.getFullYear() + 1); setEditExpirationDate(d.toISOString().split("T")[0]); }
  };

  const saveExpiration = async () => {
    if (!expirationModal) return;
    setSaving(true); setSaveMessage(null);
    try {
      const res = await fetch("/backend/api/update_expiration.php", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ permit_id: expirationModal.id, permit_category: expirationModal.permitCategory, approved_date: editApprovedDate, expiration_date: editExpirationDate }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveMessage({ type: "success", text: "Expiration date saved successfully!" });
        setTimeout(() => { setExpirationModal(null); setSaveMessage(null); fetchPermits(); }, 1500);
      } else throw new Error(data.message || "Save failed");
    } catch (err) {
      setSaveMessage({ type: "error", text: "Failed to save: " + err.message });
    } finally { setSaving(false); }
  };

  const exportCSV = () => {
    const header = ["ID", "Permit Category", "Type", "Status", "Applicant", "Business/Purpose", "Email", "Submitted", "Approved Date", "Expiration Date"];
    const rows = filtered.map((p) => [p.id, p.permitCategory, p.permitType, p.status, p.applicantName, p.businessName, p.email, p.submittedDate || "", p.approvedDate || "", p.expirationDate || ""]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `permit_applications_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status) => {
    const color = STATUS_COLORS[status] || "#4D4A4A";
    return (
      <span className="px-2 py-1 text-xs font-medium rounded-full" style={{ backgroundColor: `${color}15`, color }}>
        {status}
      </span>
    );
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen p-4 md:p-6 bg-[#FBFBFB] font-poppins flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#4CAF50] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#4D4A4A] font-montserrat">Loading permit applications...</p>
        </div>
      </div>
    );
  }

  // Error
  if (error && permits.length === 0) {
    return (
      <div className="min-h-screen p-4 md:p-6 bg-[#FBFBFB] font-poppins flex items-center justify-center">
        <div className="text-center bg-white rounded-lg p-8 shadow-sm border border-[#E9E7E7] max-w-md">
          <AlertCircle className="w-12 h-12 text-[#E53935] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#4D4A4A] font-montserrat mb-2">Failed to Load</h3>
          <p className="text-sm text-[#4D4A4A] text-opacity-70 mb-4">{error}</p>
          <button onClick={fetchPermits} className="bg-[#4CAF50] text-white px-6 py-2 rounded-lg hover:bg-[#45a049] transition-colors font-montserrat">
            <RefreshCw className="w-4 h-4 inline mr-2" />Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 bg-[#FBFBFB] font-poppins">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#4D4A4A] font-montserrat">
              Permit Applications
            </h1>
            <p className="text-[#4D4A4A] text-opacity-70 mt-2">
              {isSuper ? "All permit applications across departments" : `${DEPT_TO_CATEGORY[adminDept] || "Department"} applications`}
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-3 md:mt-0">
            <button onClick={fetchPermits} disabled={loading}
              className="flex items-center space-x-2 bg-white border border-[#E9E7E7] text-[#4D4A4A] px-4 py-2 rounded-lg hover:bg-[#FBFBFB] transition-colors font-montserrat text-sm">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /><span>Refresh</span>
            </button>
            <button onClick={exportCSV}
              className="flex items-center space-x-2 bg-[#4CAF50] text-white px-4 py-2 rounded-lg hover:bg-[#45a049] transition-colors font-montserrat text-sm">
              <Download className="w-4 h-4" /><span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { title: "Total Applications", value: stats.total || 0, icon: FileText, color: "#4CAF50", sub: "Across all statuses" },
          { title: "Approved", value: stats.approved || 0, icon: CheckCircle, color: "#4CAF50", sub: stats.total > 0 ? `${((stats.approved / stats.total) * 100).toFixed(1)}% approval rate` : "0%" },
          { title: "Pending", value: stats.pending || 0, icon: Clock, color: "#FDA811", sub: stats.total > 0 ? `${((stats.pending / stats.total) * 100).toFixed(1)}% awaiting review` : "0%" },
          { title: "Rejected", value: stats.rejected || 0, icon: XCircle, color: "#E53935", sub: stats.total > 0 ? `${((stats.rejected / stats.total) * 100).toFixed(1)}% rejection rate` : "0%" },
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

      {/* Per-Type Cards (Super admin only or show single) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {availableCategories.map((cat, idx) => {
          const catPermits = permits.filter((p) => p.permitCategory === cat);
          const catApproved = catPermits.filter((p) => p.status?.toUpperCase() === "APPROVED").length;
          const catPending = catPermits.filter((p) => p.status?.toLowerCase() === "pending").length;
          const catRejected = catPermits.filter((p) => p.status?.toLowerCase() === "rejected").length;
          const color = PERMIT_COLORS[cat] || "#4D4A4A";
          const Icon = PERMIT_ICONS[cat] || FileText;

          return (
            <div key={idx} className="bg-white rounded-lg p-5 shadow-sm border border-[#E9E7E7] hover:shadow-md transition-all"
              style={{ borderTopWidth: "3px", borderTopColor: color }}>
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}15` }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div>
                  <p className="font-semibold text-[#4D4A4A] font-montserrat text-sm">{cat.replace(" Permit", "")}</p>
                  <p className="text-xl font-bold font-montserrat" style={{ color }}>{catPermits.length}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-[#4CAF50]/10 rounded-lg py-1.5">
                  <p className="text-xs text-[#4D4A4A] text-opacity-60">Approved</p>
                  <p className="text-sm font-bold text-[#4CAF50]">{catApproved}</p>
                </div>
                <div className="bg-[#FDA811]/10 rounded-lg py-1.5">
                  <p className="text-xs text-[#4D4A4A] text-opacity-60">Pending</p>
                  <p className="text-sm font-bold text-[#FDA811]">{catPending}</p>
                </div>
                <div className="bg-[#E53935]/10 rounded-lg py-1.5">
                  <p className="text-xs text-[#4D4A4A] text-opacity-60">Rejected</p>
                  <p className="text-sm font-bold text-[#E53935]">{catRejected}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Expiration Alert Cards */}
      {(stats.totalExpired > 0 || stats.expiringSoon > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {stats.totalExpired > 0 && (
            <div className="bg-white rounded-lg p-5 shadow-sm border border-[#E9E7E7] border-l-4 border-l-[#E53935]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#4D4A4A] text-opacity-70 text-sm font-poppins">Expired Permits</p>
                  <p className="text-2xl font-bold text-[#E53935] font-montserrat mt-1">{stats.totalExpired}</p>
                  <p className="text-xs text-[#4D4A4A] text-opacity-60 mt-1">Permits past their expiration date</p>
                </div>
                <XCircle className="w-8 h-8 text-[#E53935]" />
              </div>
            </div>
          )}
          {stats.expiringSoon > 0 && (
            <div className="bg-white rounded-lg p-5 shadow-sm border border-[#E9E7E7] border-l-4 border-l-[#FDA811]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#4D4A4A] text-opacity-70 text-sm font-poppins">Expiring Soon (30 days)</p>
                  <p className="text-2xl font-bold text-[#FDA811] font-montserrat mt-1">{stats.expiringSoon}</p>
                  <p className="text-xs text-[#4D4A4A] text-opacity-60 mt-1">Approved permits expiring within 30 days</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-[#FDA811]" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-white rounded-lg shadow-sm border border-[#E9E7E7] p-5 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-[#4D4A4A] text-opacity-50" />
              <input type="text" placeholder="Search applications..." value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-4 py-2 bg-white border border-[#E9E7E7] rounded-lg text-sm text-[#4D4A4A] focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent font-poppins" />
            </div>
          </div>
          <div className="flex items-center space-x-3 flex-wrap gap-y-2">
            {isSuper && (
              <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                className="bg-white border border-[#E9E7E7] rounded-lg px-3 py-2 text-sm text-[#4D4A4A] focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent font-poppins">
                <option value="all">All Categories</option>
                {availableCategories.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
              </select>
            )}
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="bg-white border border-[#E9E7E7] rounded-lg px-3 py-2 text-sm text-[#4D4A4A] focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent font-poppins">
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
              <option value="expired">Expired</option>
              <option value="expiring">Expiring Soon</option>
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-[#E9E7E7] rounded-lg px-3 py-2 text-sm text-[#4D4A4A] focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent font-poppins">
              <option value="date">Sort by Date</option>
              <option value="expiration">Sort by Expiration</option>
              <option value="name">Sort by Name</option>
              <option value="status">Sort by Status</option>
            </select>
            <button onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
              className="px-3 py-2 bg-white border border-[#E9E7E7] rounded-lg text-sm text-[#4D4A4A] hover:bg-[#FBFBFB] font-poppins">
              {sortDir === "asc" ? "↑ Asc" : "↓ Desc"}
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-[#E9E7E7] overflow-hidden mb-6">
        <div className="p-5 border-b border-[#E9E7E7]">
          <h3 className="text-lg font-semibold text-[#4D4A4A] font-montserrat">Permit Applications</h3>
          <p className="text-sm text-[#4D4A4A] text-opacity-70 font-poppins">
            Showing {pageData.length} of {filtered.length} applications
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#FBFBFB]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#4D4A4A] uppercase tracking-wider font-montserrat">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#4D4A4A] uppercase tracking-wider font-montserrat">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#4D4A4A] uppercase tracking-wider font-montserrat">Applicant</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#4D4A4A] uppercase tracking-wider font-montserrat">Business / Purpose</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#4D4A4A] uppercase tracking-wider font-montserrat">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#4D4A4A] uppercase tracking-wider font-montserrat">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#4D4A4A] uppercase tracking-wider font-montserrat">Expiration</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#4D4A4A] uppercase tracking-wider font-montserrat">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#E9E7E7]">
              {pageData.length > 0 ? pageData.map((p, idx) => {
                const permitColor = PERMIT_COLORS[p.permitCategory] || "#4D4A4A";
                return (
                  <tr key={`${p.permitCategory}-${p.id}-${idx}`} className="hover:bg-[#FBFBFB] transition-colors">
                    <td className="px-4 py-3 text-sm font-mono font-semibold text-[#4D4A4A]">{p.id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: permitColor }}></div>
                        <span className="text-xs font-medium text-[#4D4A4A] font-poppins">{p.permitCategory.replace(" Permit", "")}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-[#4D4A4A]">{p.applicantName || "N/A"}</div>
                      <div className="text-xs text-[#4D4A4A] text-opacity-50">{p.email}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#4D4A4A] text-opacity-70 max-w-[180px] truncate">{p.businessName || "N/A"}</td>
                    <td className="px-4 py-3 text-xs text-[#4D4A4A] text-opacity-70">{formatDate(p.submittedDate || p.approvedDate)}</td>
                    <td className="px-4 py-3">{getStatusBadge(p.status)}</td>
                    <td className="px-4 py-3">
                      {p.status?.toUpperCase() === "APPROVED" ? (
                        <div>
                          <div className="text-xs text-[#4D4A4A] font-medium">{formatDate(p.expirationDate)}</div>
                          {p.isExpired && (
                            <span className="text-xs font-semibold text-[#E53935]">{Math.abs(p.daysUntilExpiry)}d overdue</span>
                          )}
                          {!p.isExpired && p.daysUntilExpiry !== null && p.daysUntilExpiry <= 30 && (
                            <span className="text-xs font-semibold text-[#FDA811]">{p.daysUntilExpiry}d left</span>
                          )}
                          {!p.isExpired && p.daysUntilExpiry !== null && p.daysUntilExpiry > 30 && (
                            <span className="text-xs text-[#4CAF50]">{p.daysUntilExpiry}d left</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-[#4D4A4A] text-opacity-40">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-1">
                        <button onClick={() => setSelectedPermit(p)}
                          className="p-1.5 text-[#4A90E2] hover:bg-[#4A90E2]/10 rounded-lg transition-colors" title="View Details">
                          <Eye className="w-4 h-4" />
                        </button>
                        {p.status?.toUpperCase() === "APPROVED" && (
                          <button onClick={() => openExpirationModal(p)}
                            className="p-1.5 text-[#4CAF50] hover:bg-[#4CAF50]/10 rounded-lg transition-colors" title="Set Expiration">
                            <CalendarClock className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <FileText className="w-12 h-12 text-[#4D4A4A] text-opacity-30 mx-auto mb-3" />
                    <p className="text-[#4D4A4A] text-opacity-60 font-poppins">No applications found matching your filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#E9E7E7] bg-[#FBFBFB]">
          <div className="text-sm text-[#4D4A4A] text-opacity-60 font-poppins">
            Page {page} of {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="border border-[#E9E7E7] rounded px-2 py-1 text-sm text-[#4D4A4A] font-poppins">
              <option value={10}>10/page</option>
              <option value={25}>25/page</option>
              <option value={50}>50/page</option>
            </select>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="p-1.5 border border-[#E9E7E7] rounded hover:bg-white disabled:opacity-40 transition-colors">
              <ChevronLeft className="w-4 h-4 text-[#4D4A4A]" />
            </button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="p-1.5 border border-[#E9E7E7] rounded hover:bg-white disabled:opacity-40 transition-colors">
              <ChevronRight className="w-4 h-4 text-[#4D4A4A]" />
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedPermit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedPermit(null)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg p-6 z-10 mx-4 border border-[#E9E7E7]">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-[#4D4A4A] font-montserrat">Application Details</h2>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PERMIT_COLORS[selectedPermit.permitCategory] || "#4D4A4A" }}></div>
                  <span className="text-sm text-[#4D4A4A] text-opacity-70 font-poppins">{selectedPermit.permitCategory}</span>
                </div>
              </div>
              <button onClick={() => setSelectedPermit(null)} className="text-[#4D4A4A] text-opacity-40 hover:text-opacity-100 text-xl leading-none">&times;</button>
            </div>

            <div className="space-y-4">
              <div className="flex justify-center mb-2">{getStatusBadge(selectedPermit.status)}</div>

              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-[#4D4A4A] text-opacity-50 font-montserrat uppercase tracking-wide">Permit ID</p><p className="font-mono font-semibold text-[#4D4A4A]">{selectedPermit.id}</p></div>
                <div><p className="text-xs text-[#4D4A4A] text-opacity-50 font-montserrat uppercase tracking-wide">Type</p><p className="font-medium text-[#4D4A4A]">{selectedPermit.permitType}</p></div>
              </div>

              <div className="bg-[#FBFBFB] rounded-lg p-4 border border-[#E9E7E7]">
                <div className="flex items-center mb-2"><User className="w-4 h-4 text-[#4D4A4A] text-opacity-50 mr-2" /><span className="text-sm font-medium text-[#4D4A4A]">{selectedPermit.applicantName || "N/A"}</span></div>
                <div className="text-xs text-[#4D4A4A] text-opacity-60 space-y-1 ml-6">
                  <p>{selectedPermit.email || "N/A"}</p>
                  <p>{selectedPermit.contactNumber || "N/A"}</p>
                  <p>{selectedPermit.address || "N/A"}</p>
                </div>
              </div>

              <div><p className="text-xs text-[#4D4A4A] text-opacity-50 font-montserrat uppercase tracking-wide">Business / Purpose</p><p className="text-sm text-[#4D4A4A]">{selectedPermit.businessName || "N/A"}</p></div>

              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[#E9E7E7]">
                <div className="text-center p-3 bg-[#FBFBFB] rounded-lg">
                  <Calendar className="w-4 h-4 mx-auto mb-1 text-[#4A90E2]" />
                  <p className="text-xs text-[#4D4A4A] text-opacity-50">Submitted</p>
                  <p className="text-xs font-semibold text-[#4D4A4A]">{formatDate(selectedPermit.submittedDate)}</p>
                </div>
                <div className="text-center p-3 bg-[#FBFBFB] rounded-lg">
                  <CheckCircle className="w-4 h-4 mx-auto mb-1 text-[#4CAF50]" />
                  <p className="text-xs text-[#4D4A4A] text-opacity-50">Approved</p>
                  <p className="text-xs font-semibold text-[#4CAF50]">{formatDate(selectedPermit.approvedDate)}</p>
                </div>
                <div className="text-center p-3 bg-[#FBFBFB] rounded-lg">
                  <AlertTriangle className="w-4 h-4 mx-auto mb-1 text-[#FDA811]" />
                  <p className="text-xs text-[#4D4A4A] text-opacity-50">Expires</p>
                  <p className={`text-xs font-semibold ${selectedPermit.isExpired ? "text-[#E53935]" : "text-[#4D4A4A]"}`}>{formatDate(selectedPermit.expirationDate)}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              {selectedPermit.status?.toUpperCase() === "APPROVED" && (
                <button onClick={() => { setSelectedPermit(null); openExpirationModal(selectedPermit); }}
                  className="flex items-center space-x-2 bg-[#4CAF50] text-white px-4 py-2 rounded-lg hover:bg-[#45a049] transition-colors font-montserrat text-sm">
                  <CalendarClock className="w-4 h-4" /><span>Set Expiration</span>
                </button>
              )}
              <button onClick={() => setSelectedPermit(null)}
                className="px-4 py-2 bg-white border border-[#E9E7E7] text-[#4D4A4A] rounded-lg hover:bg-[#FBFBFB] transition-colors font-montserrat text-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Set Expiration Modal */}
      {expirationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => !saving && setExpirationModal(null)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6 z-10 mx-4 border border-[#E9E7E7]">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-[#4D4A4A] font-montserrat flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-[#4CAF50]" /> Generate Expiration Date
                </h2>
                <p className="text-xs text-[#4D4A4A] text-opacity-60 mt-1 font-poppins">Visible to the applicant in their tracker.</p>
              </div>
              <button onClick={() => !saving && setExpirationModal(null)} className="text-[#4D4A4A] text-opacity-40 hover:text-opacity-100 text-xl leading-none">&times;</button>
            </div>

            <div className="bg-[#FBFBFB] rounded-lg p-3 mb-4 border border-[#E9E7E7]">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-[#4D4A4A] text-opacity-50 text-xs">Permit ID</span><p className="font-mono font-semibold text-[#4D4A4A]">{expirationModal.id}</p></div>
                <div><span className="text-[#4D4A4A] text-opacity-50 text-xs">Category</span><p className="text-xs font-medium" style={{ color: PERMIT_COLORS[expirationModal.permitCategory] }}>{expirationModal.permitCategory}</p></div>
                <div className="col-span-2"><span className="text-[#4D4A4A] text-opacity-50 text-xs">Applicant</span><p className="font-medium text-[#4D4A4A]">{expirationModal.applicantName || "N/A"}</p></div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#4D4A4A] mb-1 font-montserrat">Approved Date</label>
                <input type="date" value={editApprovedDate} onChange={(e) => handleApprovedDateChange(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E9E7E7] rounded-lg text-sm text-[#4D4A4A] focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent font-poppins" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4D4A4A] mb-1 font-montserrat">Expiration Date</label>
                <input type="date" value={editExpirationDate} onChange={(e) => setEditExpirationDate(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E9E7E7] rounded-lg text-sm text-[#4D4A4A] focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent font-poppins" />
                <p className="text-xs text-[#4D4A4A] text-opacity-50 mt-1">Defaults to 1 year after approval.</p>
              </div>

              {editApprovedDate && editExpirationDate && (
                <div className="bg-[#4CAF50]/10 border border-[#4CAF50]/30 rounded-lg p-3 text-sm">
                  <p className="text-[#4CAF50] font-semibold font-montserrat">Validity Period:</p>
                  <p className="text-[#4D4A4A]">
                    {formatDate(editApprovedDate)} → {formatDate(editExpirationDate)}
                    <span className="text-[#4CAF50] ml-1 font-semibold">({Math.round((new Date(editExpirationDate) - new Date(editApprovedDate)) / 86400000)} days)</span>
                  </p>
                </div>
              )}

              {saveMessage && (
                <div className={`p-3 rounded-lg text-sm border ${saveMessage.type === "success" ? "bg-[#4CAF50]/10 border-[#4CAF50]/30 text-[#4CAF50]" : "bg-[#E53935]/10 border-[#E53935]/30 text-[#E53935]"}`}>
                  {saveMessage.text}
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => !saving && setExpirationModal(null)} disabled={saving}
                className="px-4 py-2 bg-white border border-[#E9E7E7] text-[#4D4A4A] rounded-lg hover:bg-[#FBFBFB] transition-colors font-montserrat text-sm">Cancel</button>
              <button onClick={saveExpiration} disabled={saving || !editApprovedDate || !editExpirationDate}
                className="px-4 py-2 bg-[#4CAF50] text-white rounded-lg hover:bg-[#45a049] transition-colors font-montserrat text-sm flex items-center gap-1 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Saving..." : "Save Expiration"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
