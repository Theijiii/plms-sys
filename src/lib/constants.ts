import { GovernmentService } from "../types";
export const SERVICES: GovernmentService[] = [
  {
    id: "business-permit",
    title: "Business Permit Services",
    description: "Manage new applications and renewals of business permits",
  href: "/user/business/type", 
  },
  {
    id: "barangay-permit",
    title: "Barangay Permit Services",
    description: "Handle barangay clearance and barangay-level certifications",
  href: "/user/barangay/type",
    processes: [
      {
        title: "Barangay Clearance",
        description: "Apply for barangay clearance for personal or business use"
      },
      {
        title: "Residency Certificate",
        description: "Request proof of residency"
      }
    ]
  },
  {
    id: "building-permit",
    title: "Building Permit Services",
    description: "Submit and track building-related permits",
  href: "/user/building/type",
    processes: [
      {
        title: "Building Permit",
        description: "Apply for permission to start construction"
      },
      {
        title: "Occupancy Permit",
        description: "Request approval to occupy a finished building"
      }
    ]
  },
  {
    id: "franchise-permit",
    title: "Franchise Permit Services",
    description: "Apply for and manage transport/service-related franchises",
  href: "/user/franchise/type",
    processes: [
      {
        title: "New Franchise Application",
        description: "Submit an application for a franchise permit"
      },
      {
        title: "Franchise Renewal",
        description: "Renew your existing franchise permit"
      }
    ]
  },
  {
    id: "e-permit-tracker",
    title: "E-Permit Tracker",
    description: "Track and monitor all permit applications in one place",
    href: "/user/permittracker",
    processes: [
      {
        title: "Application Status",
        description: "Check the current status of your applications"
      },
      {
        title: "Notifications",
        description: "Receive alerts about updates and approvals"
      }
    ]
  }
];
