import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function PermitTracker() {
  const navigate = useNavigate();
  const [tracking, setTracking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI state
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedTx, setSelectedTx] = useState(null);

  // Normalize different mock shapes into a common transaction shape
  const normalize = (entry, source, idx) => {
    const id = entry.id || entry.permit?.permitNo || entry.permit_number || `${source}-${idx}`;
    const applicantName =
      entry.applicant?.full_name || entry.applicant?.contact_person || [entry.applicant?.first_name, entry.applicant?.last_name].filter(Boolean).join(" ") || entry.name || "";
    const permitType = entry.permit_type || (entry.permit && entry.permit.status ? entry.permit.status : "") || entry.permit?.permitNo || entry.permit_number || "";
    const status = entry.status || entry.permit?.status || entry.review_status || entry.internal_status || "Pending";
    const timestamp = entry.submitted_at || entry.last_updated || entry.permit?.issued || entry.date_submitted || entry.date_paid || null;
    const comment = entry.internal_notes || entry.review_comments || entry.remarks || "";

    return {
      id,
      permitType,
      applicantName,
      status,
      timestamp,
      comment,
      source,
      raw: entry,
    };
  };

  const mergeMocks = () => {
    const all = [];
    [
      { data: franchiseFormMock, source: "franchise-form" },
      { data: franchiseAdminMock, source: "franchise-admin" },
      { data: businessAdminMock, source: "business" },
      { data: buildingAdminMock, source: "building" },
      { data: barangayAdminMock, source: "barangay" },
    ].forEach((group) => {
      if (!Array.isArray(group.data)) return;
      group.data.forEach((e, i) => all.push(normalize(e, group.source, i)));
    });

    // dedupe by id (keeping first occurrence)
    const map = new Map();
    all.forEach((t) => {
      if (!map.has(t.id)) map.set(t.id, t);
    });
    return Array.from(map.values());
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    fetch("/api/permittracker/track")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!mounted) return;
        const fetched = Array.isArray(data) ? data : [];
        // normalize fetched if they already match our shape, prefer them first
        const mocks = mergeMocks();
        // combine: fetched first, then mocks (avoid duplicates)
        const map = new Map();
        fetched.forEach((t, i) => {
          const id = t.id || `fetched-${i}`;
          map.set(id, { id, permitType: t.permitType || t.permit_type || t.permit_number || "", applicantName: t.applicantName || t.applicant?.full_name || "", status: t.status || "", timestamp: t.timestamp || t.date || t.submitted_at || null, comment: t.comment || "", source: "api", raw: t });
        });
        mocks.forEach((m) => {
          if (!map.has(m.id)) map.set(m.id, m);
        });
        setTracking(Array.from(map.values()));
        setLoading(false);
      })
      .catch((err) => {
        console.warn("E-Permit Tracker Service error, loading local mocks and tx_log:", err);
        try {
          const local = getTxs ? getTxs() : JSON.parse(localStorage.getItem("tx_log") || "[]");
          const localNorm = Array.isArray(local)
            ? local.map((t, i) => ({ id: t.id || `local-${i}`, permitType: t.permitType || t.permit_type || "", applicantName: t.applicantName || t.applicant?.full_name || "", status: t.status || "", timestamp: t.timestamp || t.date || t.submitted_at || null, comment: t.comment || "", source: "local", raw: t }))
            : [];
          const mocks = mergeMocks();

          // merge local, then mocks (dedupe by id)
          const map = new Map();
          localNorm.forEach((t) => map.set(t.id, t));
          mocks.forEach((m) => {
            if (!map.has(m.id)) map.set(m.id, m);
          });

          if (mounted) setTracking(Array.from(map.values()));
        } catch (e) {
          console.error("Failed to load fallback tx_log:", e);
          if (mounted) setError("Failed to load transactions");
        } finally {
          if (mounted) setLoading(false);
        }
      });

    return () => (mounted = false);
  }, []);

  const formatDate = (iso) => {
    if (!iso) return "N/A";
    try {
      const d = new Date(iso);
      return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(d);
    } catch (e) {
      return iso;
    }
  };

  const statusClass = (status) =>
    status === "Approved" ? "text-green-700 bg-green-100" : status === "Pending" ? "text-yellow-700 bg-yellow-100" : "text-red-700 bg-red-100";

  // Derived list: filter, search, sort
  const filtered = useMemo(() => {
    let list = tracking || [];
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((t) => (t.id + " " + (t.permitType || "") + " " + (t.applicantName || "")).toLowerCase().includes(q));
    }
    if (statusFilter !== "all") {
      list = list.filter((t) => t.status === statusFilter);
    }
    list = list.slice().sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortBy === "date") {
        return (new Date(a.timestamp || a.date || 0) - new Date(b.timestamp || b.date || 0)) * dir;
      }
      if (sortBy === "id") return (a.id || "").localeCompare(b.id || "") * dir;
      if (sortBy === "status") return (a.status || "").localeCompare(b.status || "") * dir;
      return 0;
    });
    return list;
  }, [tracking, query, statusFilter, sortBy, sortDir]);

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > pages) setPage(1);
  }, [pages]);

  const handleView = (t) => {
    setSelectedTx(t);
  };

  const handleEdit = (id) => {
    // navigate to edit page if exists
    if (navigate) navigate(`/admin/permit-tracker/edit/${id}`);
  };

  const handleDelete = async (id) => {
    const ok = window.confirm("Are you sure you want to delete transaction " + id + "?");
    if (!ok) return;

    try {
      // attempt server delete; fall back to local removal
      const res = await fetch(`/api/permittracker/delete/${id}`, { method: "DELETE" });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      // update local state
      setTracking((prev) => prev.filter((t) => t.id !== id));
      // also remove from local tx_log if present
      try {
        const stored = JSON.parse(localStorage.getItem("tx_log") || "[]");
        const remaining = stored.filter((t) => t.id !== id);
        localStorage.setItem("tx_log", JSON.stringify(remaining));
      } catch (e) {
        // ignore
      }
    } catch (err) {
      // server failed, attempt local-only delete
      console.warn("Delete API failed, deleting locally:", err);
      setTracking((prev) => prev.filter((t) => t.id !== id));
      try {
        const stored = JSON.parse(localStorage.getItem("tx_log") || "[]");
        const remaining = stored.filter((t) => t.id !== id);
        localStorage.setItem("tx_log", JSON.stringify(remaining));
      } catch (e) {
        console.error("Failed to update local tx_log:", e);
      }
    }
  };

  const exportCSV = () => {
    const rows = [
      ["ID", "Permit Type", "Applicant", "Status", "Date", "Comment"],
      ...filtered.map((t) => [t.id || "", t.permitType || "", t.applicantName || "", t.status || "", t.timestamp || t.date || "", (t.comment || "").replace(/\n/g, " ")]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions_${new Date().toISOString()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const loadSample = () => {
    try {
      const sample = getTxs ? getTxs() : JSON.parse(localStorage.getItem("tx_log") || "[]");
      setTracking(Array.isArray(sample) ? sample : []);
    } catch (e) {
      console.error("Load sample failed:", e);
      setError("Failed to load sample data");
    }
  };

  if (loading) return <p>Loading transactions...</p>;

  return (
    <div className="p-6 bg-gray-50 rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">E-Permit Tracker</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            title="Export visible transactions to CSV"
          >
            Export CSV
          </button>
          <button
            onClick={loadSample}
            className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            title="Reload sample data from local tx_log"
          >
            Load sample
          </button>
        </div>
      </div>

      {error && <div className="mb-4 text-red-600">{error}</div>}

      <div className="flex gap-3 items-center mb-3">
        <input
          aria-label="Search transactions"
          className="border p-2 rounded w-64"
          placeholder="Search by ID, applicant, permit type..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border p-2 rounded">
          <option value="all">All status</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="border p-2 rounded">
          <option value="date">Sort by Date</option>
          <option value="id">Sort by ID</option>
          <option value="status">Sort by Status</option>
        </select>

        <button
          onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
          className="px-2 py-1 border rounded"
          title="Toggle sort direction"
        >
          {sortDir === "asc" ? "↑" : "↓"}
        </button>

        <div className="ml-auto flex items-center gap-2">
          <label className="text-sm">Page size</label>
          <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="border p-1 rounded">
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border border-gray-200 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border text-left">ID</th>
              <th className="p-2 border text-left">Permit Type</th>
              <th className="p-2 border text-left">Applicant</th>
              <th className="p-2 border text-left">Status</th>
              <th className="p-2 border text-left">Date</th>
              <th className="p-2 border text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageData.length > 0 ? (
              pageData.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="p-2 border">{t.id}</td>
                  <td className="p-2 border">{t.permitType || "-"}</td>
                  <td className="p-2 border">{t.applicantName || "-"}</td>
                  <td className="p-2 border">
                    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${statusClass(t.status)}`}>
                      {t.status || "Unknown"}
                    </span>
                  </td>
                  <td className="p-2 border">{formatDate(t.timestamp || t.date)}</td>
                  <td className="p-2 border flex gap-2">
                    <button onClick={() => handleView(t)} className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
                      View
                    </button>
                    <button onClick={() => handleEdit(t.id)} className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(t.id)} className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600">
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center p-4 text-gray-500">
                  No transactions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-600">Showing {pageData.length} of {total} transactions</div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-2 py-1 border rounded" disabled={page === 1}>
            Prev
          </button>
          <div className="px-3 py-1 border rounded">{page} / {pages}</div>
          <button onClick={() => setPage((p) => Math.min(pages, p + 1))} className="px-2 py-1 border rounded" disabled={page === pages}>
            Next
          </button>
        </div>
      </div>

      {/* Detail modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-30" onClick={() => setSelectedTx(null)} />
          <div className="relative bg-white rounded shadow-lg w-full max-w-2xl p-6 z-10">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-xl font-semibold">Transaction {selectedTx.id}</h2>
              <button aria-label="Close" onClick={() => setSelectedTx(null)} className="text-gray-600 hover:text-black">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">Permit type</div>
                <div className="font-medium">{selectedTx.permitType || "-"}</div>

                <div className="text-sm text-gray-500 mt-2">Applicant</div>
                <div className="font-medium">{selectedTx.applicantName || "-"}</div>

                <div className="text-sm text-gray-500 mt-2">Status</div>
                <div className={`inline-block px-2 py-0.5 mt-1 text-sm rounded ${statusClass(selectedTx.status)}`}>{selectedTx.status}</div>
              </div>

              <div>
                <div className="text-sm text-gray-500">Date</div>
                <div className="font-medium">{formatDate(selectedTx.timestamp || selectedTx.date)}</div>

                <div className="text-sm text-gray-500 mt-2">Reference / Comment</div>
                <div className="whitespace-pre-wrap mt-1">{selectedTx.comment || "-"}</div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => { setSelectedTx(null); handleEdit(selectedTx.id); }} className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600">Edit</button>
              <button onClick={() => { handleDelete(selectedTx.id); setSelectedTx(null); }} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">Delete</button>
              <button onClick={() => setSelectedTx(null)} className="px-3 py-1 border rounded">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
