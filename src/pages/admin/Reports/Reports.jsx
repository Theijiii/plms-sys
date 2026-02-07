import { useState, useEffect, useMemo } from "react";
import {
  BarChart3,
  Download,
  RefreshCw,
  Briefcase,
  Building2,
  Bus,
  Home,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Calendar,
  Filter,
  PieChart,
} from "lucide-react";

const API_BASE = "/backend/api";

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [dateRange, setDateRange] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE}/dashboard_stats.php`);
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const data = await response.json();
      if (data.success) {
        setDashboardData(data);
      } else {
        throw new Error(data.message || "Failed to fetch data");
      }
    } catch (err) {
      console.error("Error fetching report data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const departmentStats = useMemo(() => {
    if (!dashboardData) return [];
    const depts = [
      {
        key: "business",
        label: "Business Permits",
        icon: Briefcase,
        color: "bg-blue-500",
        lightBg: "bg-blue-50 dark:bg-blue-900/20",
        textColor: "text-blue-700 dark:text-blue-300",
        data: dashboardData.business || {},
      },
      {
        key: "building",
        label: "Building Permits",
        icon: Building2,
        color: "bg-green-500",
        lightBg: "bg-green-50 dark:bg-green-900/20",
        textColor: "text-green-700 dark:text-green-300",
        data: dashboardData.building || {},
      },
      {
        key: "franchise",
        label: "Franchise / Transport",
        icon: Bus,
        color: "bg-purple-500",
        lightBg: "bg-purple-50 dark:bg-purple-900/20",
        textColor: "text-purple-700 dark:text-purple-300",
        data: dashboardData.franchise || {},
      },
      {
        key: "barangay",
        label: "Barangay Clearance",
        icon: Home,
        color: "bg-amber-500",
        lightBg: "bg-amber-50 dark:bg-amber-900/20",
        textColor: "text-amber-700 dark:text-amber-300",
        data: dashboardData.barangay || {},
      },
    ];
    if (departmentFilter !== "all") {
      return depts.filter((d) => d.key === departmentFilter);
    }
    return depts;
  }, [dashboardData, departmentFilter]);

  const grandTotals = useMemo(() => {
    if (!dashboardData) return { total: 0, approved: 0, pending: 0, rejected: 0 };
    const sources = [dashboardData.business, dashboardData.building, dashboardData.franchise, dashboardData.barangay].filter(Boolean);
    return {
      total: sources.reduce((s, d) => s + (d.total || 0), 0),
      approved: sources.reduce((s, d) => s + (d.approved || 0), 0),
      pending: sources.reduce((s, d) => s + (d.pending || 0), 0),
      rejected: sources.reduce((s, d) => s + (d.rejected || 0), 0),
    };
  }, [dashboardData]);

  const approvalRate = grandTotals.total > 0 ? ((grandTotals.approved / grandTotals.total) * 100).toFixed(1) : "0.0";

  const exportCSV = () => {
    if (!dashboardData) return;
    const rows = [
      ["Department", "Total", "Approved", "Pending", "Rejected", "Approval Rate"],
    ];
    departmentStats.forEach((dept) => {
      const d = dept.data;
      const total = d.total || 0;
      const approved = d.approved || 0;
      const rate = total > 0 ? ((approved / total) * 100).toFixed(1) + "%" : "0%";
      rows.push([dept.label, total, approved, d.pending || 0, d.rejected || 0, rate]);
    });
    rows.push(["TOTAL", grandTotals.total, grandTotals.approved, grandTotals.pending, grandTotals.rejected, approvalRate + "%"]);

    const csvContent = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `permit-report-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getBarWidth = (value, max) => {
    if (!max || max === 0) return "0%";
    return `${Math.max((value / max) * 100, 2)}%`;
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-lg min-h-screen font-[Montserrat,Arial,sans-serif]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-[#4A90E2]" />
            Permit Reports & Analytics
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Cross-department permit application overview</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-[#4A90E2] text-white rounded-xl text-sm font-medium hover:bg-[#3a7bc8] transition">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={exportCSV} disabled={!dashboardData} className="flex items-center gap-2 px-4 py-2 bg-[#4CAF50] text-white rounded-xl text-sm font-medium hover:bg-green-700 transition disabled:opacity-50">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-3 mb-6">
        <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className="px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-[#4A90E2] focus:outline-none">
          <option value="all">All Departments</option>
          <option value="business">Business</option>
          <option value="building">Building</option>
          <option value="franchise">Franchise / Transport</option>
          <option value="barangay">Barangay</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-[#4A90E2] border-t-transparent rounded-full" />
          <span className="ml-3 text-gray-500">Loading report data...</span>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-red-600 font-medium">{error}</p>
          <button onClick={fetchData} className="mt-3 text-sm text-[#4A90E2] hover:underline">Try again</button>
        </div>
      ) : (
        <>
          {/* Grand Total KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {[
              { label: "Total Applications", value: grandTotals.total, icon: FileText, bg: "bg-slate-50 dark:bg-slate-800", text: "text-slate-700 dark:text-slate-200" },
              { label: "Approved", value: grandTotals.approved, icon: CheckCircle, bg: "bg-green-50 dark:bg-green-900/20", text: "text-green-700 dark:text-green-300" },
              { label: "Pending", value: grandTotals.pending, icon: Clock, bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-700 dark:text-amber-300" },
              { label: "Rejected", value: grandTotals.rejected, icon: XCircle, bg: "bg-red-50 dark:bg-red-900/20", text: "text-red-700 dark:text-red-300" },
              { label: "Approval Rate", value: `${approvalRate}%`, icon: TrendingUp, bg: "bg-indigo-50 dark:bg-indigo-900/20", text: "text-indigo-700 dark:text-indigo-300" },
            ].map((card) => (
              <div key={card.label} className={`${card.bg} rounded-xl p-4 border border-gray-100 dark:border-slate-700`}>
                <div className="flex items-center gap-2 mb-1">
                  <card.icon className={`w-4 h-4 ${card.text} opacity-70`} />
                  <p className={`text-xs font-medium ${card.text} opacity-80`}>{card.label}</p>
                </div>
                <p className={`text-2xl font-bold ${card.text}`}>{card.value}</p>
              </div>
            ))}
          </div>

          {/* Department Breakdown */}
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-[#4A90E2]" /> Department Breakdown
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {departmentStats.map((dept) => {
              const DeptIcon = dept.icon;
              const d = dept.data;
              const total = d.total || 0;
              const approved = d.approved || 0;
              const pending = d.pending || 0;
              const rejected = d.rejected || 0;
              const rate = total > 0 ? ((approved / total) * 100).toFixed(1) : "0.0";
              return (
                <div key={dept.key} className={`${dept.lightBg} rounded-xl p-5 border border-gray-100 dark:border-slate-700`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 ${dept.color} rounded-lg flex items-center justify-center`}>
                      <DeptIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className={`font-bold ${dept.textColor}`}>{dept.label}</h3>
                      <p className="text-xs text-gray-500">{total} total applications</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className={`text-2xl font-bold ${dept.textColor}`}>{rate}%</p>
                      <p className="text-xs text-gray-500">approval rate</p>
                    </div>
                  </div>

                  {/* Mini bar chart */}
                  <div className="space-y-2">
                    {[
                      { label: "Approved", value: approved, color: "bg-green-500" },
                      { label: "Pending", value: pending, color: "bg-amber-500" },
                      { label: "Rejected", value: rejected, color: "bg-red-500" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-3">
                        <span className="text-xs text-gray-600 dark:text-gray-400 w-16">{item.label}</span>
                        <div className="flex-1 bg-white/50 dark:bg-slate-800/50 rounded-full h-4 overflow-hidden">
                          <div
                            className={`h-full ${item.color} rounded-full transition-all duration-500`}
                            style={{ width: getBarWidth(item.value, total) }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-8 text-right">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary Table */}
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#4A90E2]" /> Summary Table
          </h2>
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-700">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-800">
                <tr>
                  {["Department", "Total", "Approved", "Pending", "Rejected", "Approval Rate"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {departmentStats.map((dept) => {
                  const d = dept.data;
                  const total = d.total || 0;
                  const approved = d.approved || 0;
                  const rate = total > 0 ? ((approved / total) * 100).toFixed(1) : "0.0";
                  const DeptIcon = dept.icon;
                  return (
                    <tr key={dept.key} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <DeptIcon className={`w-4 h-4 ${dept.textColor}`} />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{dept.label}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-gray-900 dark:text-white">{total}</td>
                      <td className="px-5 py-4"><span className="text-sm font-medium text-green-700 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded">{approved}</span></td>
                      <td className="px-5 py-4"><span className="text-sm font-medium text-amber-700 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded">{d.pending || 0}</span></td>
                      <td className="px-5 py-4"><span className="text-sm font-medium text-red-700 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded">{d.rejected || 0}</span></td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                            <div className="bg-[#4CAF50] h-2 rounded-full" style={{ width: `${rate}%` }} />
                          </div>
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{rate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {/* Total row */}
                <tr className="bg-gray-50 dark:bg-slate-800 font-bold">
                  <td className="px-5 py-4 text-sm text-gray-900 dark:text-white">GRAND TOTAL</td>
                  <td className="px-5 py-4 text-sm text-gray-900 dark:text-white">{grandTotals.total}</td>
                  <td className="px-5 py-4 text-sm text-green-700">{grandTotals.approved}</td>
                  <td className="px-5 py-4 text-sm text-amber-700">{grandTotals.pending}</td>
                  <td className="px-5 py-4 text-sm text-red-700">{grandTotals.rejected}</td>
                  <td className="px-5 py-4">
                    <span className="text-sm font-bold text-[#4CAF50]">{approvalRate}%</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
