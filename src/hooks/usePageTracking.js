import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { logPageVisit } from "../services/ActivityLogger";

const PAGE_NAMES = {
  "/user/dashboard": "Dashboard",
  "/user/business/type": "Business Permit Type",
  "/user/business/new": "New Business Permit",
  "/user/business/renewal": "Business Permit Renewal",
  "/user/business/amendment": "Business Permit Amendment",
  "/user/business/liquor": "Business Liquor Permit",
  "/user/business/special": "Business Special Permit",
  "/user/building/type": "Building Permit Type",
  "/user/building/new": "New Building Permit",
  "/user/building/renewal": "Building Permit Renewal",
  "/user/building/ancillary": "Ancillary Permit",
  "/user/building/professional": "Professional Registration",
  "/user/franchise/type": "Franchise Permit Type",
  "/user/franchise/new": "New Franchise Permit",
  "/user/franchise/renew": "Franchise Permit Renewal",
  "/user/barangay/new": "New Barangay Permit",
  "/user/permittracker": "Permit Tracker",
  "/user/general": "General Settings",
  "/user/security": "Security Settings",
  "/user/activity": "Activity Trail",
  "/user/profile": "My Profile",
  "/admin/dashboard": "Admin Dashboard",
  "/admin/businesspermit": "Business Permit Applications",
  "/admin/businessdashboard": "Business Permit Dashboard",
  "/admin/businessprocessing": "Business Permit Processing",
  "/admin/buildingpermit": "Building Permit Applications",
  "/admin/buildingdashboard": "Building Permit Dashboard",
  "/admin/buildingprocessing": "Building Permit Processing",
  "/admin/professionals": "Professionals",
  "/admin/franchisedashboard": "Franchise Dashboard",
  "/admin/franchisepermit": "Franchise Permit Applications",
  "/admin/brgydashboard": "Barangay Permit Dashboard",
  "/admin/brgypermit": "Barangay Permit Applications",
  "/admin/permittracker": "Admin Permit Tracker",
  "/admin/audittrail": "Audit Trail",
};

export default function usePageTracking() {
  const location = useLocation();
  const lastPath = useRef("");

  useEffect(() => {
    const path = location.pathname;

    // Skip if same page or login/register/home pages
    if (
      path === lastPath.current ||
      path === "/login" ||
      path === "/register" ||
      path === "/home" ||
      path === "/"
    ) {
      return;
    }

    // Only log if user is authenticated
    const email = localStorage.getItem("email") || localStorage.getItem("goserveph_email");
    if (!email) return;

    lastPath.current = path;

    const pageName = PAGE_NAMES[path] || path.split("/").pop().replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    logPageVisit(pageName, path);
  }, [location.pathname]);
}
