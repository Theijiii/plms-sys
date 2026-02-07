import React, { useState, useEffect, useMemo } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, User, Briefcase, Building2, Bus, Home } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import AdminSidebarItems from './AdminSidebarItems';

function AdminSidebar({ collapsed }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [expandedItem, setExpandedItem] = useState(new Set());
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Get user info from AuthContext
  const adminName = user?.name || user?.email || "Admin";
  const adminDepartment = user?.department || 
                       localStorage.getItem("goserveph_department") || 
                       sessionStorage.getItem("admin_department") || 
                       "";

  // Helper function to get department icon
  const getDepartmentIcon = (department) => {
    switch(department) {
      case 'business': return Briefcase;
      case 'building': return Building2;
      case 'transport': return Bus;
      case 'barangay': return Home;
      default: return Briefcase;
    }
  };

  // Debug logging
  useEffect(() => {
    console.log("🔍 [AdminSidebar] User data:", {
      user,
      adminName,
      adminDepartment,
      localStorageDepartment: localStorage.getItem("goserveph_department")
    });
  }, [user]);

  // AdminSidebar.jsx - Updated filteredItems logic
  const filteredItems = useMemo(() => {
    if (!adminDepartment) {
      console.log("⚠️ No department found, showing empty sidebar");
      return [];
    }

    console.log(`🔍 Filtering sidebar for department: ${adminDepartment}`);

    // For SUPER ADMIN: Group items by department
    if (adminDepartment === 'super') {
      // Create department groups
      const departmentGroups = {};
      
      const superOnlyItems = [];

      AdminSidebarItems.forEach(item => {
        // Skip main dashboard for now
        if (item.id === 'dashboard') return;
        
        // Find which department this item belongs to (excluding 'super')
        const itemDept = item.department.find(dept => dept !== 'super');
        
        if (itemDept) {
          if (!departmentGroups[itemDept]) {
            // Create department group with icon
            departmentGroups[itemDept] = {
              id: `${itemDept}Department`,
              label: `${itemDept.charAt(0).toUpperCase() + itemDept.slice(1)} Department`,
              icon: getDepartmentIcon(itemDept),
              department: ['super'],
              subItems: []
            };
          }
          
          // Add item to department group
          departmentGroups[itemDept].subItems.push(item);
        } else {
          // Items only for super admin (no other department) — show as top-level
          superOnlyItems.push(item);
        }
      });

      // Create final array with main dashboard first, then department groups, then super-only items
      const result = [];
      
      // Add main dashboard item first
      const dashboardItem = AdminSidebarItems.find(item => item.id === 'dashboard');
      if (dashboardItem) {
        result.push(dashboardItem);
      }
      
      // Add department groups in specific order
      const departmentOrder = ['business', 'building', 'transport', 'barangay'];
      departmentOrder.forEach(dept => {
        if (departmentGroups[dept]) {
          result.push(departmentGroups[dept]);
        }
      });

      // Add super-admin-only items at the end
      superOnlyItems.forEach(item => result.push(item));

      return result.filter(Boolean);
    }

    // For REGULAR DEPARTMENT ADMINS: Show flat items for their department
    return AdminSidebarItems.filter(item => 
      item.department.includes(adminDepartment)
    );
  }, [adminDepartment]);

  useEffect(() => {
    const newExpanded = new Set();
    filteredItems.forEach(item => {
      if (item.subItems) {
        const isActiveSubItem = item.subItems.some(
          sub => location.pathname === sub.path
        );
        if (isActiveSubItem) newExpanded.add(item.id);
      }
    });

    // Only update if different to prevent infinite loop
    setExpandedItem(prev => {
      const isEqual =
        prev.size === newExpanded.size &&
        [...prev].every(x => newExpanded.has(x));
      return isEqual ? prev : newExpanded;
    });
  }, [location.pathname, filteredItems]);

  const toggleExpanded = (item) => {
    const newExpanded = new Set(expandedItem);
    if (newExpanded.has(item.id)) {
      newExpanded.delete(item.id);
    } else {
      newExpanded.add(item.id);

      // Navigate to first sub-item if none active
      if (
        item.subItems &&
        item.subItems.length > 0 &&
        !item.subItems.some(sub => sub.path === location.pathname)
      ) {
        navigate(item.subItems[0].path);
      }
    }
    setExpandedItem(newExpanded);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className={`${
        collapsed ? 'w-[80px]' : 'w-64'
      } bg-white border-r border-slate-200/50 flex flex-col transition-width duration-200 dark:bg-slate-900 dark:border-slate-700`}>

      {/* Logo */}
      <div className="h-[84px] flex items-center px-4 space-x-3 border-b-4 border-[#FDA811]">
        <NavLink to="/admin/dashboard" className="flex items-center space-x-3">
          <img
            src="/GSM_logo.png"
            alt="Logo"
            className={`object-cover rounded-xl transition-all duration-200 ${collapsed ? 'w-10 h-10' : 'w-13 h-13'}`}
          />
          {!collapsed && (
            <div>
              <h1 className="text-xl font-bold dark:text-white">GoServePH</h1>
              <p className="text-xs text-slate-500">Admin Dashboard</p>
              
                <p className="text-xs text-blue-600 font-medium">
                  {adminDepartment === 'super' ? 'Super Admin' : 
                   adminDepartment === 'business' ? 'Business ' :
                   adminDepartment === 'building' ? 'Building ' :
                   adminDepartment === 'transport' ? 'Transport ' :
                   adminDepartment === 'barangay' ? 'Barangay ' : 
                   adminDepartment.charAt(0).toUpperCase() + adminDepartment.slice(1)} Department
                </p>
            
            </div>
          )}
        </NavLink>
      </div>

      {/* User Section */}
      {!collapsed && (
        <div className="px-4 mt-2">
          <div
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className={`flex items-center justify-between cursor-pointer px-4 py-3 border rounded-xl border-slate-300 dark:border-slate-700 transition-colors duration-200 ${
              userMenuOpen ? 'bg-[#4A90E2] text-white' : 'bg-white text-slate-700 dark:text-slate-200'
            }`}
          >
            <div className="flex items-center">
              <User className={`w-6 h-6 transition-colors duration-200 ${userMenuOpen ? 'text-white' : 'text-slate-600 dark:text-slate-400'}`} />
              <div className="ml-2">
                <p className="text-sm font-medium">Hi, {adminName}</p>
  
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${userMenuOpen ? 'rotate-180 text-white' : 'text-slate-500'}`} />
          </div>

          {userMenuOpen && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center p-2 rounded-xl mt-2 transition-all duration-200 text-slate-600 dark:text-slate-400 hover:bg-red-500 hover:text-white dark:hover:bg-red-500 dark:hover:text-white"
            >
              <LogOut className="w-5 h-5" />
              <span className="ml-2 text-sm font-medium">Logout</span>
            </button>
          )}
        </div>
      )}

      <hr className="border-t border-slate-300 dark:border-slate-700 mt-2" />

      {/* Navigation Links - Show message if no items */}
      <nav className="flex-1 p-2 space-y-2 overflow-y-auto">
        {filteredItems.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-sm text-slate-500">No menu items available</p>
            <p className="text-xs text-slate-400 mt-1">
              Department: {adminDepartment || 'Not set'}<br/>
              Contact super admin for access
            </p>
          </div>
        ) : (
          filteredItems.map(item => {
            const isActive =
              item.path === location.pathname ||
              (item.subItems && item.subItems.some(sub => sub.path === location.pathname));

            return (
              <div key={item.id}>
                {item.subItems ? (
                  <>
                    <button
                      className={`w-full flex justify-between items-center p-2 rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'bg-[#4CAF50] text-white font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-[#4CAF50] hover:text-white dark:hover:bg-[#4CAF50] dark:hover:text-white'
                      }`}
                      onClick={() => toggleExpanded(item)}
                    >
                      <div className="flex items-center justify-center">
                        {/* Check if item.icon exists and is a component */}
                        {item.icon && (
                          <item.icon className={`transition-all duration-200 ${collapsed ? 'w-5 h-5' : 'w-6 h-6'}`} />
                        )}
                        {!collapsed && <span className="ml-2 text-sm font-medium">{item.label}</span>}
                      </div>
                      {!collapsed && item.subItems && (
                        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${expandedItem.has(item.id) ? 'rotate-180' : ''}`} />
                      )}
                    </button>

                    {!collapsed && expandedItem.has(item.id) && (
                      <div className="ml-8 mt-2 space-y-1 border-l border-slate-300">
                        {item.subItems.map(subitem => (
                          <NavLink
                            key={subitem.id}
                            to={subitem.path}
                            className={({ isActive }) =>
                              `block w-full ml-2 text-sm text-left p-2 ${
                                isActive
                                  ? 'border-l-4 border-[#FDA811] text-[#4CAF50] font-semibold bg-transparent'
                                  : 'text-slate-700 dark:text-slate-500 hover:bg-slate-200 dark:hover:text-slate-600 dark:hover:bg-slate-100'
                              }`
                            }
                          >
                            {subitem.label}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `w-full flex items-center p-2 rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'bg-[#4CAF50] text-white font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-[#4CAF50] hover:text-white dark:hover:bg-[#4CAF50] dark:hover:text-white'
                      }`}
                  >
                    <div className="flex items-center justify-center">
                      {item.icon && (
                        <item.icon className={`transition-all duration-200 ${collapsed ? 'w-5 h-5' : 'w-6 h-6'}`} />
                      )}
                      {!collapsed && <span className="ml-2 text-sm font-medium">{item.label}</span>}
                    </div>
                  </NavLink>
                )}
              </div>
            );
          })
        )}
      </nav>
    </div>
  );
}

export default AdminSidebar;