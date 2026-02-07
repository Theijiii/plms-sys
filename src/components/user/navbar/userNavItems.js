import { LayoutDashboard, Briefcase, Building2, Bus, Home, Search,Settings } from "lucide-react";

const userNavItems = [
  { id: "dashboard", 
    label: "Dashboard", 
    icon: LayoutDashboard, 
    path: "/user/dashboard" 
  },
  { 
    id: "businesspermit", 
    label: "Business Permit", 
    icon: Briefcase, 
    path: "/user/businesspermit" 
  },
  { 
    id: "buildingpermit", 
    label: "Building Permit", 
    icon: Building2, 
    path: "/user/buildingpermit" 
  },
  { 
    id: "franchisepermit", 
    label: "Franchise Permit", 
    icon: Bus, 
    path: "/user/franchise/type" 
  },
  { 
    id: "barangaypermit", 
    label: "Barangay Permit", 
    icon: Home, 
    path: "/user/barangaypermit" 
  },
  { 
    id: "permittracker", 
    label: "Permit Tracker", 
    icon: Search, 
    path: "/user/permittracker" 
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    subItems: [
      {
        id: "UserGeneralSettings",
        label: "General",
        path: "/user/general"
      },
      {
        id: "UserSecuritySettings",
        label: "Security",
        path: "/user/security"
      }
    ]
  }
]

export default userNavItems;
