import { Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"; // Import AuthProvider
import UserLayout from "./layouts/UserLayout"
import AdminLayout from "./layouts/AdminLayout"
import ProtectedRoute from "./components/ProtectedRoute";
import UserDashboard from "./pages/user/UserDashboard"
import Plms from "./pages/plms";
import Login from "./pages/user/Login"
import Register from "./pages/user/Register"

import BusPermitType from "./pages/user/BusinessPermit/BusPermitType"
import BusinessNew from "./pages/user/BusinessPermit/BusinessNew"
import BusinessRenewal from "./pages/user/BusinessPermit/BusinessRenewal"
import BusinessLiquor from "./pages/user/BusinessPermit/BusinessLiquor"
import BusinessSpecial from "./pages/user/BusinessPermit/BusinessSpecial"
import BusinessAmendment from "./pages/user/BusinessPermit/BusinessAmend"

import BuildingNew from "./pages/user/BuildingPermit/BuildingNew"
import BuildingPermitType from "./pages/user/BuildingPermit/BuildingPermitType"
import RenewalBuilding from "./pages/user/BuildingPermit/RenewalBuilding"
import AncillaryPermits from "./pages/user/BuildingPermit/Ancillary/Ancillary"
import OccupancyPermit from "./pages/user/BuildingPermit/OccupancyPermit"
import ProfessionalRegistration from "./pages/user/BuildingPermit/ProfessionalRegistration"
import FranchisePermitType from "./pages/user/FranchisePermit/FranchisePermitType"
import FranchiseNew from "./pages/user/FranchisePermit/FranchiseNew"
import FranchiseRenewal from "./pages/user/FranchisePermit/FranchiseRenewal"


import BarangayNew from "./pages/user/BarangayPermit/BarangayNew"
import UserTracker from "./pages/user/PermitTracker/UserTracker"
import UserGeneralSettings from "./pages/user/Settings/General"
import UserSecuritySettings from "./pages/user/Settings/Security"

// Admin imports
import AdminDashboard from "./pages/admin/AdminDashboard";

import BusPermitAnalytics from "./pages/admin/BusinessPermit/Business";
import BusPermitApplication from "./pages/admin/BusinessPermit/BusPermitApplication";
import BusinessProcess from "./pages/admin/BusinessPermit/BusinessProcessing";

import Building from "./pages/admin/BuildingPermit/Building";
import BuildingDashboard from "./pages/admin/BuildingPermit/BuildingDashboard";
import BuildingProcess from "./pages/admin/BuildingPermit/BuildingProcess";
import Professionals from "./pages/admin/BuildingPermit/Professionals";

import Franchise from "./pages/admin/FranchisePermit/Franchise";
import FranchisePermitApplication from "./pages/admin/FranchisePermit/FranchisePermitApplication" 

import BarangayPermitAnalytics from "./pages/admin/BarangayPermit/Barangay";
import BrgyPermitApplication from "./pages/admin/BarangayPermit/BrgyPermitApplication";

import Tracker from "./pages/admin/PermitTracker/Tracker";
import AuditTrail from "./pages/admin/AuditTrail/AuditTrail";
import UserAuditTrail from "./pages/user/AuditTrail/UserAuditTrail";
import LandingPage from "./pages/plms";



function App() {
  return (
    <AuthProvider> {/* Wrap entire app with AuthProvider */}
      <Routes>
        {/* Public routes (no authentication required) */}
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />


        {/* Protected User routes */}
        <Route 
          path="/user" 
          element={
            <ProtectedRoute requiredRole="user">
              <UserLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<UserDashboard />} />
          <Route path="dashboard" element={<UserDashboard />} />

          {/* Legacy/redirects */}
          <Route path="newbusiness" element={<Navigate to="/user/business/new" replace />} />
          <Route path="newfranchise" element={<Navigate to="/user/franchise/new" replace />} />
          <Route path="businesspermittype" element={<Navigate to="/user/business/type" replace />} />
          <Route path="franchisepermit" element={<Navigate to="/user/franchise/type" replace />} />

          {/* Business routes */}
          <Route path="business/new" element={<BusinessNew />} />
          <Route path="business/type" element={<BusPermitType />} />
          <Route path="business/renewal" element={<BusinessRenewal />} />
          <Route path="business/amendment" element={<BusinessAmendment />} />
          <Route path="business/liquor" element={<BusinessLiquor />} />
          <Route path="business/special" element={<BusinessSpecial />} />

          {/* Building routes */}
          <Route path="building/new" element={<BuildingNew />} />
          <Route path="building/type" element={<BuildingPermitType />} />
          <Route path="building/renewal" element={<RenewalBuilding />} />
          <Route path="building/ancillary" element={<AncillaryPermits />} />
          <Route path="building/occupancy" element={<OccupancyPermit />} />
          <Route path="building/professional" element={<ProfessionalRegistration />} />

          {/* Franchise routes */}
          <Route path="franchise/new" element={<FranchiseNew />} />
          <Route path="franchise/renew" element={<FranchiseRenewal />} />
          <Route path="franchise/type" element={<FranchisePermitType />} />

          {/* Barangay routes */}
          <Route path="barangay/new" element={<BarangayNew />} />

          {/* Other user routes */}
          <Route path="permittracker" element={<UserTracker />} />
          <Route path="general" element={<UserGeneralSettings />} />
          <Route path="security" element={<UserSecuritySettings />} />
          <Route path="activity" element={<UserAuditTrail />} />
        </Route>

        {/* Protected Admin routes with Department Restrictions */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          
          {/* Business Department Routes - Only accessible by Business Admin and Super Admin */}
          <Route 
            path="businesspermit" 
            element={
              <ProtectedRoute requiredRole="admin" allowedDepartments={['business', 'super']}>
                <BusPermitApplication />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="businessdashboard" 
            element={
              <ProtectedRoute requiredRole="admin" allowedDepartments={['business', 'super']}>
                <BusPermitAnalytics />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="businessprocessing" 
            element={
              <ProtectedRoute requiredRole="admin" allowedDepartments={['business', 'super']}>
                <BusinessProcess />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="buildingpermit" 
            element={
              <ProtectedRoute requiredRole="admin" allowedDepartments={['building', 'super']}>
                <Building />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="buildingdashboard" 
            element={
              <ProtectedRoute requiredRole="admin" allowedDepartments={['building', 'super']}>
                <BuildingDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="buildingprocessing" 
            element={
              <ProtectedRoute requiredRole="admin" allowedDepartments={['building', 'super']}>
                <BuildingProcess />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="professionals" 
            element={
              <ProtectedRoute requiredRole="admin" allowedDepartments={['building', 'super']}>
                <Professionals />
              </ProtectedRoute>
            } 
          />
          

          <Route 
            path="franchisedashboard" 
            element={
              <ProtectedRoute requiredRole="admin" allowedDepartments={['transport', 'super']}>
                <Franchise />
              </ProtectedRoute>
            } 
          />
                    {/* Transport Department Routes - Only accessible by Transport Admin and Super Admin */}
          <Route 
            path="franchisepermit" 
            element={
              <ProtectedRoute requiredRole="admin" allowedDepartments={['transport', 'super']}>
                <FranchisePermitApplication />
              </ProtectedRoute>
            } 
          />
          

 <Route 
  path="brgydashboard" 
  element={
    <ProtectedRoute requiredRole="admin" allowedDepartments={['barangay','super']}>
      <BarangayPermitAnalytics />  {/* Dashboard/analytics component */}
    </ProtectedRoute>
  } 
/>

<Route 
  path="brgypermit" 
  element={
    <ProtectedRoute requiredRole="admin" allowedDepartments={['barangay','super']}>
      <BrgyPermitApplication />  {/* Clearance requests component */}
    </ProtectedRoute>
  } 
/>
          

          <Route 
            path="permittracker" 
            element={
              <ProtectedRoute requiredRole="admin" allowedDepartments={['super']}>
                <Tracker />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="audittrail" 
            element={
              <ProtectedRoute requiredRole="admin" allowedDepartments={['super']}>
                <AuditTrail />
              </ProtectedRoute>
            } 
          />
          
          {/* Redirect for compatibility */}
          <Route path="barangay" element={<Navigate to="/admin/barangaypermit" replace />} />
        </Route>
        
        {/* 404 - Catch all route */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;