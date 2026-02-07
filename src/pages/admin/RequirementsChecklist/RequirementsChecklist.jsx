import { useState, useMemo } from "react";
import {
  ClipboardCheck,
  Search,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  FileText,
  Briefcase,
  Building2,
  Bus,
  Home,
  AlertCircle,
  Info,
} from "lucide-react";

const PERMIT_REQUIREMENTS = {
  business: {
    label: "Business Permit",
    icon: Briefcase,
    color: "border-blue-500",
    headerBg: "bg-blue-50 dark:bg-blue-900/20",
    headerText: "text-blue-800 dark:text-blue-300",
    types: {
      new: {
        label: "New Business Permit",
        requirements: [
          { id: "b1", name: "Barangay Clearance", required: true, description: "Clearance from the barangay where the business is located" },
          { id: "b2", name: "DTI/SEC/CDA Registration", required: true, description: "Business name registration from DTI (sole), SEC (corporation), or CDA (cooperative)" },
          { id: "b3", name: "Community Tax Certificate (Cedula)", required: true, description: "Current year community tax certificate" },
          { id: "b4", name: "Contract of Lease / Land Title", required: true, description: "Proof of business location ownership or lease" },
          { id: "b5", name: "Fire Safety Inspection Certificate", required: true, description: "Certificate from the Bureau of Fire Protection" },
          { id: "b6", name: "Sanitary Permit", required: true, description: "Health/sanitary clearance for food-related businesses" },
          { id: "b7", name: "Zoning Clearance", required: true, description: "Clearance from the City Planning Office" },
          { id: "b8", name: "SSS/PhilHealth/Pag-IBIG Registration", required: false, description: "Employee benefit registrations (if with employees)" },
          { id: "b9", name: "Environmental Compliance Certificate", required: false, description: "For businesses with environmental impact" },
          { id: "b10", name: "2x2 ID Photo of Owner", required: true, description: "Recent photo of the business owner" },
        ],
      },
      renewal: {
        label: "Business Renewal",
        requirements: [
          { id: "br1", name: "Previous Business Permit", required: true, description: "Copy of the previous year's business permit" },
          { id: "br2", name: "Barangay Clearance (Updated)", required: true, description: "Current year barangay clearance" },
          { id: "br3", name: "Community Tax Certificate (Cedula)", required: true, description: "Current year community tax certificate" },
          { id: "br4", name: "Fire Safety Inspection Certificate", required: true, description: "Updated FSIC from BFP" },
          { id: "br5", name: "Sanitary Permit (Updated)", required: true, description: "Current year sanitary permit" },
          { id: "br6", name: "Financial Statement / ITR", required: true, description: "Latest financial statements or income tax return" },
          { id: "br7", name: "Official Receipt of Previous Payment", required: true, description: "Proof of previous year's permit fee payment" },
        ],
      },
    },
  },
  building: {
    label: "Building Permit",
    icon: Building2,
    color: "border-green-500",
    headerBg: "bg-green-50 dark:bg-green-900/20",
    headerText: "text-green-800 dark:text-green-300",
    types: {
      new: {
        label: "New Building Permit",
        requirements: [
          { id: "bp1", name: "Duly Accomplished Application Form", required: true, description: "Unified building permit application form" },
          { id: "bp2", name: "Certified True Copy of Land Title (TCT/OCT)", required: true, description: "Title of the property where construction will be done" },
          { id: "bp3", name: "Tax Declaration of Lot", required: true, description: "Latest tax declaration from the assessor's office" },
          { id: "bp4", name: "Current Real Property Tax Receipt", required: true, description: "Proof of real property tax payment" },
          { id: "bp5", name: "Five (5) Sets of Architectural Plans", required: true, description: "Signed and sealed by a licensed architect" },
          { id: "bp6", name: "Five (5) Sets of Structural Plans", required: true, description: "Signed and sealed by a licensed civil/structural engineer" },
          { id: "bp7", name: "Five (5) Sets of Electrical Plans", required: true, description: "Signed and sealed by a licensed electrical engineer" },
          { id: "bp8", name: "Five (5) Sets of Plumbing/Sanitary Plans", required: true, description: "Signed and sealed by a licensed sanitary engineer" },
          { id: "bp9", name: "Barangay Clearance", required: true, description: "Clearance from the barangay of the project location" },
          { id: "bp10", name: "Locational Clearance / Zoning", required: true, description: "From the City Planning and Development Office" },
          { id: "bp11", name: "Fire Safety Evaluation Clearance", required: true, description: "From the Bureau of Fire Protection" },
          { id: "bp12", name: "Lot Plan with Vicinity Map", required: true, description: "Geodetic engineer-prepared lot plan" },
          { id: "bp13", name: "Bill of Materials and Cost Estimate", required: true, description: "Detailed materials and cost breakdown" },
          { id: "bp14", name: "Structural Analysis/Design", required: false, description: "For multi-storey or special structures" },
          { id: "bp15", name: "Soil/Geotechnical Investigation", required: false, description: "For buildings 3 storeys and above" },
        ],
      },
      occupancy: {
        label: "Certificate of Occupancy",
        requirements: [
          { id: "occ1", name: "Building Permit (Original)", required: true, description: "The original approved building permit" },
          { id: "occ2", name: "Certificate of Completion", required: true, description: "Signed by the building official" },
          { id: "occ3", name: "Fire Safety Inspection Certificate", required: true, description: "Final FSIC from BFP" },
          { id: "occ4", name: "As-Built Plans", required: true, description: "Final plans reflecting actual construction" },
          { id: "occ5", name: "Logbook of Construction Activities", required: true, description: "Complete construction logbook" },
        ],
      },
    },
  },
  franchise: {
    label: "Franchise Permit (Transport)",
    icon: Bus,
    color: "border-purple-500",
    headerBg: "bg-purple-50 dark:bg-purple-900/20",
    headerText: "text-purple-800 dark:text-purple-300",
    types: {
      new: {
        label: "New Franchise / MTOP",
        requirements: [
          { id: "f1", name: "Duly Accomplished Application Form", required: true, description: "Complete franchise/MTOP application form" },
          { id: "f2", name: "LTO Official Receipt (OR)", required: true, description: "Current year LTO official receipt" },
          { id: "f3", name: "LTO Certificate of Registration (CR)", required: true, description: "Vehicle certificate of registration" },
          { id: "f4", name: "Driver's License", required: true, description: "Valid professional driver's license" },
          { id: "f5", name: "Barangay Clearance", required: true, description: "From the operator's barangay of residence" },
          { id: "f6", name: "TODA Endorsement / Certification", required: true, description: "Endorsement from the TODA organization" },
          { id: "f7", name: "Insurance Certificate (CTPL)", required: true, description: "Compulsory Third Party Liability insurance" },
          { id: "f8", name: "Vehicle Emission Test Result", required: true, description: "Valid emission compliance certificate" },
          { id: "f9", name: "NBI / Police Clearance", required: true, description: "NBI or police clearance of the operator" },
          { id: "f10", name: "2x2 ID Photo", required: true, description: "Recent ID photo of the operator" },
          { id: "f11", name: "Medical Certificate", required: false, description: "Health certificate of the operator" },
          { id: "f12", name: "Proof of Residency", required: true, description: "Proof of residence within the city" },
        ],
      },
      renewal: {
        label: "Franchise / MTOP Renewal",
        requirements: [
          { id: "fr1", name: "Previous Franchise Permit / MTOP", required: true, description: "Copy of the previous permit" },
          { id: "fr2", name: "LTO OR/CR (Updated)", required: true, description: "Current year LTO registration documents" },
          { id: "fr3", name: "Insurance Certificate (Updated CTPL)", required: true, description: "Current CTPL insurance" },
          { id: "fr4", name: "Emission Test (Updated)", required: true, description: "Valid emission compliance certificate" },
          { id: "fr5", name: "TODA Certification (Updated)", required: true, description: "Current TODA endorsement" },
          { id: "fr6", name: "Barangay Clearance (Updated)", required: true, description: "Current year barangay clearance" },
          { id: "fr7", name: "Vehicle Inspection Report", required: true, description: "Roadworthiness inspection from the city" },
        ],
      },
    },
  },
  barangay: {
    label: "Barangay Clearance",
    icon: Home,
    color: "border-amber-500",
    headerBg: "bg-amber-50 dark:bg-amber-900/20",
    headerText: "text-amber-800 dark:text-amber-300",
    types: {
      clearance: {
        label: "Barangay Clearance",
        requirements: [
          { id: "bc1", name: "Valid Government-Issued ID", required: true, description: "Any valid government-issued identification" },
          { id: "bc2", name: "Community Tax Certificate (Cedula)", required: true, description: "Current year cedula" },
          { id: "bc3", name: "Proof of Residency", required: true, description: "Utility bill, lease contract, or certificate of residency" },
          { id: "bc4", name: "2x2 ID Photo", required: true, description: "Recent 2x2 ID photo" },
          { id: "bc5", name: "Clearance Fee Payment", required: true, description: "Official receipt of clearance fee" },
          { id: "bc6", name: "Applicant Signature", required: true, description: "Signature on the application form" },
        ],
      },
    },
  },
};

export default function RequirementsChecklist() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedDepts, setExpandedDepts] = useState(new Set(["business", "building", "franchise", "barangay"]));
  const [expandedTypes, setExpandedTypes] = useState(new Set());

  const toggleDept = (dept) => {
    setExpandedDepts((prev) => {
      const next = new Set(prev);
      next.has(dept) ? next.delete(dept) : next.add(dept);
      return next;
    });
  };

  const toggleType = (key) => {
    setExpandedTypes((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const filteredRequirements = useMemo(() => {
    if (!searchQuery.trim()) return PERMIT_REQUIREMENTS;
    const term = searchQuery.toLowerCase();
    const result = {};
    Object.entries(PERMIT_REQUIREMENTS).forEach(([deptKey, dept]) => {
      const filteredTypes = {};
      Object.entries(dept.types).forEach(([typeKey, type]) => {
        const filteredReqs = type.requirements.filter(
          (r) =>
            r.name.toLowerCase().includes(term) ||
            r.description.toLowerCase().includes(term)
        );
        if (filteredReqs.length > 0) {
          filteredTypes[typeKey] = { ...type, requirements: filteredReqs };
        }
      });
      if (Object.keys(filteredTypes).length > 0) {
        result[deptKey] = { ...dept, types: filteredTypes };
      }
    });
    return result;
  }, [searchQuery]);

  const totalRequirements = useMemo(() => {
    let count = 0;
    Object.values(PERMIT_REQUIREMENTS).forEach((dept) => {
      Object.values(dept.types).forEach((type) => {
        count += type.requirements.length;
      });
    });
    return count;
  }, []);

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-lg min-h-screen font-[Montserrat,Arial,sans-serif]">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <ClipboardCheck className="w-7 h-7 text-[#4A90E2]" />
          Requirements Checklist
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Complete reference of document requirements for all permit types ({totalRequirements} items)
        </p>
      </div>

      {/* Info Banner */}
      <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-700 dark:text-blue-300">
          <p className="font-semibold mb-1">Admin Reference Guide</p>
          <p>Use this checklist when reviewing applications to ensure all required documents are submitted. Items marked <span className="text-red-600 font-semibold">*Required</span> must be present before approval.</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search requirements across all permit types..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-[#4A90E2] focus:outline-none"
        />
      </div>

      {/* Requirements by Department */}
      <div className="space-y-4">
        {Object.entries(filteredRequirements).map(([deptKey, dept]) => {
          const DeptIcon = dept.icon;
          const isExpanded = expandedDepts.has(deptKey);
          return (
            <div key={deptKey} className={`border-l-4 ${dept.color} rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden`}>
              {/* Department Header */}
              <button
                onClick={() => toggleDept(deptKey)}
                className={`w-full flex items-center justify-between px-5 py-4 ${dept.headerBg} transition hover:opacity-90`}
              >
                <div className="flex items-center gap-3">
                  <DeptIcon className={`w-5 h-5 ${dept.headerText}`} />
                  <span className={`font-bold ${dept.headerText}`}>{dept.label}</span>
                  <span className="text-xs bg-white/70 dark:bg-slate-800/70 px-2 py-0.5 rounded-full text-gray-600 dark:text-gray-400">
                    {Object.values(dept.types).reduce((sum, t) => sum + t.requirements.length, 0)} items
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronUp className={`w-5 h-5 ${dept.headerText}`} />
                ) : (
                  <ChevronDown className={`w-5 h-5 ${dept.headerText}`} />
                )}
              </button>

              {/* Types */}
              {isExpanded && (
                <div className="divide-y divide-gray-100 dark:divide-slate-700">
                  {Object.entries(dept.types).map(([typeKey, type]) => {
                    const fullKey = `${deptKey}-${typeKey}`;
                    const isTypeExpanded = expandedTypes.has(fullKey);
                    const requiredCount = type.requirements.filter((r) => r.required).length;
                    return (
                      <div key={typeKey}>
                        <button
                          onClick={() => toggleType(fullKey)}
                          className="w-full flex items-center justify-between px-6 py-3 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 transition"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{type.label}</span>
                            <span className="text-xs text-gray-400">
                              {requiredCount} required, {type.requirements.length - requiredCount} optional
                            </span>
                          </div>
                          {isTypeExpanded ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          )}
                        </button>

                        {isTypeExpanded && (
                          <div className="px-6 pb-4">
                            <div className="space-y-2">
                              {type.requirements.map((req) => (
                                <div
                                  key={req.id}
                                  className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700"
                                >
                                  <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${req.required ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-400"}`}>
                                    {req.required ? (
                                      <AlertCircle className="w-3 h-3" />
                                    ) : (
                                      <CheckCircle className="w-3 h-3" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{req.name}</span>
                                      {req.required ? (
                                        <span className="text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-900/30 px-1.5 py-0.5 rounded">REQUIRED</span>
                                      ) : (
                                        <span className="text-[10px] font-bold text-gray-500 bg-gray-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">OPTIONAL</span>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{req.description}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {Object.keys(filteredRequirements).length === 0 && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No requirements match your search</p>
        </div>
      )}
    </div>
  );
}
