import {
  LayoutDashboard,
  BarChart3,
  Briefcase,
  FileText,
  Building2,
  ClipboardList,
  Bus,
  Ticket,
  Home,
  ShieldCheck,
  GraduationCap,
  Activity,
} from "lucide-react";

const AdminSidebarItems = [
  // MAIN DASHBOARD
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/admin/dashboard",
    department: ["super"],
  },

  // BUSINESS PERMIT
  {
    id: "businessDashboard",
    label: "Permit Dashboard",
    icon: BarChart3,
    path: "/admin/businessdashboard",
    department: ["business", "super"],
  },
  {
    id: "businessPermit",
    label: "Business Permit Application",
    icon: Briefcase,
    path: "/admin/businesspermit",
    department: ["business", "super"],
  },
  {
    id: "businessProcessing",
    label: "Business Processing",
    icon: FileText,
    path: "/admin/businessprocessing",
    department: ["business", "super"],
  },

  // BUILDING PERMIT
  {
    id: "buildingDashboard",
    label: "Permit Dashboard",
    icon: ClipboardList,
    path: "/admin/buildingdashboard",
    department: ["building", "super"],
  },
  {
    id: "buildingPermit",
    label: "Permit Applications",
    icon: Building2,
    path: "/admin/buildingpermit",
    department: ["building", "super"],
  },

  {
    id: "professionalRegistration",
    label: "Registration Application",
    icon: GraduationCap,
    path: "/admin/professionals",
    department: ["building", "super"],
  },

  {
    id: "franchiseDashboard",
    label: "Permit Dashboard",
    icon: Ticket,
    path: "/admin/franchisedashboard",
    department: ["transport", "super"],
  },
  {
    id: "franchisePermit",
    label: "Permit Application",
    icon: Bus,
    path: "/admin/franchisepermit",
    department: ["transport", "super"],
  },

  {
    id: "brgydashboard",
    label: "Permit Dashboard",
    icon: Home,
    path: "/admin/brgydashboard",
    department: ["barangay", "super"],
  },
  {
    id: "brgyPermit",
    label: "Clearance Requests",
    icon: ShieldCheck,
    path: "/admin/brgypermit",
    department: ["barangay", "super"],
  },

  // AUDIT TRAIL (Super Admin only)
  {
    id: "auditTrail",
    label: "Audit Activity Trail",
    icon: Activity,
    path: "/admin/audittrail",
    department: ["super"],
  },
];

export default AdminSidebarItems;