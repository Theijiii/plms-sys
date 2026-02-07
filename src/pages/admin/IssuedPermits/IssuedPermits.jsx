import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Filter,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
  RefreshCw,
} from "lucide-react";

export default function IssuedPermits() {
  const [permits, setPermits] = useState([]);
  const [stats, setStats] = useState({ totalIssued: 0, totalActive: 0, totalExpired: 0, expiringSoon: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all"); // all | active | expired | expiring
  const [sortBy, setSortBy] = useState("expiration");
  const [sortDir, setSortDir] = useState("asc");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Detail modal
  const [selectedPermit, setSelectedPermit] = useState(null);

  const fetchPermits = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/backend/api/issued_permits.php");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success) {
        setPermits(data.permits || []);
        setStats(data.stats || { totalIssued: 0, totalActive: 0, totalExpired: 0, expiringSoon: 0 });
      } else {
        throw new Error(data.message || "Failed to fetch");
      }
    } catch (err) {
      console.error("IssuedPermits fetch error:", err);
      setError("Failed to load issued permits. " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermits();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  const getExpiryBadge = (permit) => {
    if (permit.isExpired) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-700">
          <XCircle className="w-3 h-3" /> Expired
        </span>
      );
    }
    if (permit.daysUntilExpiry !== null && permit.daysUntilExpiry <= 30) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-700">
          <AlertTriangle className="w-3 h-3" /> {permit.daysUntilExpiry}d left
        </span>
      );
    }
    if (permit.daysUntilExpiry !== null && permit.daysUntilExpiry <= 90) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700">
          <Clock className="w-3 h-3" /> {permit.daysUntilExpiry}d left
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-700">
        <CheckCircle2 className="w-3 h-3" /> Active
      </span>
    );
  };

  const getCategoryColor = (cat) => {
    switch (cat) {
      case "Business Permit": return "bg-blue-100 text-blue-700";
      case "Building Permit": return "bg-purple-100 text-purple-700";
      case "Franchise Permit": return "bg-orange-100 text-orange-700";
      case "Barangay Permit": return "bg-teal-100 text-teal-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  // Filtering + sorting
  const filtered = useMemo(() => {
    let list = [...permits];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          (p.applicantName || "").toLowerCase().includes(q) ||
          (p.businessName || "").toLowerCase().includes(q) ||
          (p.email || "").toLowerCase().includes(q) ||
          (p.id + "").toLowerCase().includes(q) ||
          (p.permitCategory || "").toLowerCase().includes(q)
      );
    }

    // Category
    if (categoryFilter !== "all") {
      list = list.filter((p) => p.permitCategory === categoryFilter);
    }

    // Status
    if (statusFilter === "expired") {
      list = list.filter((p) => p.isExpired);
    } else if (statusFilter === "active") {
      list = list.filter((p) => !p.isExpired);
    } else if (statusFilter === "expiring") {
      list = list.filter((p) => !p.isExpired && p.daysUntilExpiry !== null && p.daysUntilExpiry <= 30);
    }

    // Sort
    list.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortBy === "expiration") {
        return (new Date(a.expirationDate || "2099-12-31") - new Date(b.expirationDate || "2099-12-31")) * dir;
      }
      if (sortBy === "approved") {
        return (new Date(a.approvedDate || 0) - new Date(b.approvedDate || 0)) * dir;
      }
      if (sortBy === "name") {
        return (a.applicantName || "").localeCompare(b.applicantName || "") * dir;
      }
      if (sortBy === "category") {
        return (a.permitCategory || "").localeCompare(b.permitCategory || "") * dir;
      }
      return 0;
    });

    return list;
  }, [permits, search, categoryFilter, statusFilter, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages]);

  const exportCSV = () => {
    const header = ["ID", "Permit Category", "Type", "Applicant", "Business/Purpose", "Email", "Contact", "Approved Date", "Expiration Date", "Status", "Days Until Expiry"];
    const rows = filtered.map((p) => [
      p.id,
      p.permitCategory,
      p.permitType,
      p.applicantName,
      p.businessName,
      p.email,
      p.contactNumber,
      p.approvedDate || "",
      p.expirationDate || "",
      p.isExpired ? "Expired" : "Active",
      p.daysUntilExpiry ?? "",
    ]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `issued_permits_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-3 text-gray-600 text-lg">Loading issued permits...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FileText className="w-7 h-7 text-blue-600" />
            Issued Permits
          </h1>
          <p className="text-sm text-gray-500 mt-1">Track all approved permits and their expiration dates</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchPermits} className="flex items-center gap-1 px-3 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 transition">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={exportCSV} className="flex items-center gap-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Issued</p>
              <p className="text-3xl font-bold text-gray-800">{stats.totalIssued}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Permits</p>
              <p className="text-3xl font-bold text-green-600">{stats.totalActive}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Expired Permits</p>
              <p className="text-3xl font-bold text-red-600">{stats.totalExpired}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Expiring in 30 Days</p>
              <p className="text-3xl font-bold text-amber-600">{stats.expiringSoon}</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, business, email, ID..."
              className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          <div className="flex items-center gap-1">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="all">All Categories</option>
              <option value="Business Permit">Business Permit</option>
              <option value="Building Permit">Building Permit</option>
              <option value="Franchise Permit">Franchise Permit</option>
              <option value="Barangay Permit">Barangay Permit</option>
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="expiring">Expiring Soon (30d)</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="expiration">Sort by Expiration</option>
            <option value="approved">Sort by Approved Date</option>
            <option value="name">Sort by Name</option>
            <option value="category">Sort by Category</option>
          </select>

          <button
            onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
            className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50"
          >
            {sortDir === "asc" ? "↑ Asc" : "↓ Desc"}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3 font-semibold text-gray-600">ID</th>
                <th className="text-left p-3 font-semibold text-gray-600">Permit Category</th>
                <th className="text-left p-3 font-semibold text-gray-600">Applicant</th>
                <th className="text-left p-3 font-semibold text-gray-600">Business / Purpose</th>
                <th className="text-left p-3 font-semibold text-gray-600">Approved Date</th>
                <th className="text-left p-3 font-semibold text-gray-600">Expiration Date</th>
                <th className="text-left p-3 font-semibold text-gray-600">Status</th>
                <th className="text-left p-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {pageData.length > 0 ? (
                pageData.map((p, idx) => (
                  <tr
                    key={`${p.permitCategory}-${p.id}-${idx}`}
                    className={`hover:bg-gray-50 transition ${p.isExpired ? "bg-red-50/40" : ""}`}
                  >
                    <td className="p-3 font-mono text-xs">{p.id}</td>
                    <td className="p-3">
                      <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${getCategoryColor(p.permitCategory)}`}>
                        {p.permitCategory}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-gray-800">{p.applicantName || "N/A"}</div>
                      <div className="text-xs text-gray-400">{p.email}</div>
                    </td>
                    <td className="p-3 text-gray-700 max-w-[200px] truncate">{p.businessName || "N/A"}</td>
                    <td className="p-3 text-gray-600">{formatDate(p.approvedDate)}</td>
                    <td className="p-3">
                      <div className="text-gray-800 font-medium">{formatDate(p.expirationDate)}</div>
                      {p.daysUntilExpiry !== null && !p.isExpired && (
                        <div className="text-xs text-gray-400">{p.daysUntilExpiry} days left</div>
                      )}
                      {p.isExpired && p.daysUntilExpiry !== null && (
                        <div className="text-xs text-red-400">{Math.abs(p.daysUntilExpiry)} days overdue</div>
                      )}
                    </td>
                    <td className="p-3">{getExpiryBadge(p)}</td>
                    <td className="p-3">
                      <button
                        onClick={() => setSelectedPermit(p)}
                        className="px-3 py-1 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center p-8 text-gray-400">
                    No issued permits found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
          <div className="text-sm text-gray-500">
            Showing {pageData.length} of {filtered.length} permits
          </div>
          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value={10}>10/page</option>
              <option value={25}>25/page</option>
              <option value={50}>50/page</option>
            </select>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1 border rounded hover:bg-gray-100 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm px-2">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1 border rounded hover:bg-gray-100 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedPermit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedPermit(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 z-10 mx-4">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Permit Details</h2>
                <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${getCategoryColor(selectedPermit.permitCategory)}`}>
                  {selectedPermit.permitCategory}
                </span>
              </div>
              <button onClick={() => setSelectedPermit(null)} className="text-gray-400 hover:text-gray-700 text-xl leading-none">&times;</button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Permit ID</p>
                  <p className="font-mono font-medium">{selectedPermit.id}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Type</p>
                  <p className="font-medium">{selectedPermit.permitType}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Applicant Name</p>
                <p className="font-medium text-gray-800">{selectedPermit.applicantName || "N/A"}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Email</p>
                  <p className="text-sm">{selectedPermit.email || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Contact</p>
                  <p className="text-sm">{selectedPermit.contactNumber || "N/A"}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Business / Purpose</p>
                <p className="text-sm">{selectedPermit.businessName || "N/A"}</p>
              </div>

              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Address</p>
                <p className="text-sm">{selectedPermit.address || "N/A"}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Date Approved</p>
                  <p className="font-medium text-green-700">{formatDate(selectedPermit.approvedDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Expiration Date</p>
                  <p className={`font-medium ${selectedPermit.isExpired ? "text-red-700" : "text-gray-800"}`}>
                    {formatDate(selectedPermit.expirationDate)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <span className="text-xs text-gray-400 uppercase tracking-wide">Permit Status:</span>
                {getExpiryBadge(selectedPermit)}
                {selectedPermit.daysUntilExpiry !== null && (
                  <span className="text-sm text-gray-500">
                    ({selectedPermit.isExpired ? `${Math.abs(selectedPermit.daysUntilExpiry)} days overdue` : `${selectedPermit.daysUntilExpiry} days remaining`})
                  </span>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedPermit(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
