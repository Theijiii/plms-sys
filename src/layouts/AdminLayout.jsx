import React, { useState } from "react";
import { useLocation, Outlet } from "react-router-dom";
import AdminHeader from "../components/admin/header/AdminHeader";
import AdminSidebar from "../components/admin/sidebar/AdminSidebar";
import AdminSidebarItems from "../components/admin/sidebar/AdminSidebarItems";

const AdminLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  // Breadcrumb logic
  function getBreadcrumb() {
    for (const item of AdminSidebarItems) {
      if (item.path === location.pathname) return [item.label];
      if (item.subItems) {
        const sub = item.subItems.find(sub => sub.path === location.pathname);
        if (sub) return [item.label, sub.label];
      }
    }
    return ["Dashboard"];
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800">
      <AdminSidebar collapsed={sidebarCollapsed} />
      <div className="flex-1 flex flex-col">
        <AdminHeader
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          breadcrumb={getBreadcrumb()}
        />
        <main className="flex-1 overflow-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;