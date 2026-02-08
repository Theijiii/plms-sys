import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { ArrowRight, ArrowLeft, Droplets, Fence, Hammer, HardHat, Home, Radio, Signpost, Zap, Settings, CheckCircle, Loader2, Search, Shield } from "lucide-react";
import { logPermitSubmission } from '../../../../services/ActivityLogger';

const COLORS = { primary: '#4A90E2', secondary: '#000000', accent: '#FDA811', success: '#4CAF50', danger: '#E53935', background: '#FBFBFB', font: 'Montserrat, Arial, sans-serif' };
const API_BASE = "/backend/building_permit/ancillary_permit.php";
const BARANGAY_API = "/backend/barangay_permit/admin_fetch.php";
const PROFESSIONAL_API = "/backend/building_permit/professional_registration.php";
const labelStyle = { color: '#000000', fontFamily: 'Montserrat, Arial, sans-serif' };
const inputCls = "p-3 border border-black rounded-lg w-full";

const PERMIT_TYPES = [
  { id: 'demolition', title: 'Demolition Permit', icon: Hammer, color: '#F44336', description: 'Required for partial or complete demolition of buildings or structures.', fields: [
    { name: 'structure_type', label: 'Structure Type', type: 'select', options: ['Residential','Commercial','Industrial','Mixed-Use','Others'], required: true },
    { name: 'demolition_method', label: 'Demolition Method', type: 'select', options: ['Manual','Mechanical','Implosion','Selective','Others'], required: true },
    { name: 'debris_disposal_plan', label: 'Debris Disposal Plan', type: 'textarea', placeholder: 'Describe how debris will be disposed...', required: true },
    { name: 'estimated_volume', label: 'Estimated Volume (cubic meters)', type: 'number', placeholder: 'e.g. 500', required: true },
  ]},
  { id: 'electrical', title: 'Electrical Permit', icon: Zap, color: '#FFC107', description: 'Mandatory for electrical installations, repairs, or modifications.', fields: [
    { name: 'total_connected_load', label: 'Total Connected Load (kW)', type: 'number', placeholder: 'e.g. 50', required: true },
    { name: 'total_transformer_capacity', label: 'Total Transformer Capacity (kVA)', type: 'number', placeholder: 'e.g. 100', required: true },
    { name: 'contractor_name', label: 'Contractor Name', type: 'text', placeholder: 'Enter contractor name', required: false },
    { name: 'scope_of_work', label: 'Scope of Electrical Work', type: 'textarea', placeholder: 'Describe the electrical work scope...', required: true },
  ]},
  { id: 'electronics', title: 'Electronics Permit', icon: Radio, color: '#607D8B', description: 'Required for electronic systems including communication, security, and automation.', fields: [
    { name: 'system_type', label: 'System Type', type: 'select', options: ['Communication','Security/CCTV','Fire Alarm','Automation','Network/IT','Others'], required: true },
    { name: 'equipment_specifications', label: 'Equipment Specifications', type: 'textarea', placeholder: 'List equipment specs, brands, models...', required: true },
    { name: 'communication_type', label: 'Communication Type', type: 'text', placeholder: 'e.g. Fiber Optic, WiFi', required: false },
  ]},
  { id: 'excavation', title: 'Excavation Permit', icon: HardHat, color: '#795548', description: 'Required for digging, trenching, or earth-moving activities.', fields: [
    { name: 'excavation_depth', label: 'Excavation Depth (meters)', type: 'number', placeholder: 'e.g. 3', required: true },
    { name: 'excavation_area', label: 'Excavation Area (sq. meters)', type: 'number', placeholder: 'e.g. 200', required: true },
    { name: 'soil_type', label: 'Soil Type', type: 'select', options: ['Clay','Sandy','Rocky','Loam','Gravel','Mixed'], required: true },
    { name: 'purpose_of_excavation', label: 'Purpose of Excavation', type: 'textarea', placeholder: 'Describe the purpose...', required: true },
    { name: 'shoring_method', label: 'Shoring Method', type: 'select', options: ['Sheet Piling','Soldier Pile','Bracing','Anchored','None Required'], required: true },
  ]},
  { id: 'fencing', title: 'Fencing Permit', icon: Fence, color: '#4CAF50', description: 'Required for construction of perimeter fences, walls, or boundary enclosures.', fields: [
    { name: 'fence_type', label: 'Fence Type', type: 'select', options: ['Concrete Block','Metal/Steel','Wood','Chain Link','Combination','Others'], required: true },
    { name: 'fence_height', label: 'Fence Height (meters)', type: 'number', placeholder: 'e.g. 2.5', required: true },
    { name: 'fence_length', label: 'Total Fence Length (meters)', type: 'number', placeholder: 'e.g. 100', required: true },
    { name: 'fence_material', label: 'Primary Material', type: 'text', placeholder: 'e.g. CHB, Steel Bars', required: true },
  ]},
  { id: 'mechanical', title: 'Mechanical Permit', icon: Settings, color: '#9C27B0', description: 'Required for HVAC, ventilation, and mechanical installations.', fields: [
    { name: 'equipment_type', label: 'Equipment Type', type: 'select', options: ['HVAC System','Elevator/Escalator','Boiler','Pressure Vessel','Generator','Others'], required: true },
    { name: 'capacity_rating', label: 'Capacity / Rating', type: 'text', placeholder: 'e.g. 5 TR, 100 HP', required: true },
    { name: 'equipment_brand', label: 'Equipment Brand / Model', type: 'text', placeholder: 'Enter brand and model', required: false },
    { name: 'scope_of_work', label: 'Scope of Mechanical Work', type: 'textarea', placeholder: 'Describe the mechanical work scope...', required: true },
  ]},
  { id: 'occupancy', title: 'Occupancy Permit', icon: Home, color: '#E91E63', description: 'Required before occupying a building to certify it meets safety standards.', fields: [
    { name: 'building_use', label: 'Building Use / Purpose', type: 'select', options: ['Residential','Commercial','Industrial','Institutional','Mixed-Use','Others'], required: true },
    { name: 'number_of_occupants', label: 'Expected Number of Occupants', type: 'number', placeholder: 'e.g. 50', required: true },
    { name: 'fire_safety_clearance', label: 'Fire Safety Inspection Certificate No.', type: 'text', placeholder: 'Enter FSIC number', required: true },
    { name: 'certificate_of_completion', label: 'Certificate of Completion No.', type: 'text', placeholder: 'Enter certificate number', required: true },
  ]},
  { id: 'plumbing', title: 'Plumbing Permit', icon: Droplets, color: '#2196F3', description: 'Required for plumbing systems including water supply, drainage, and sanitary.', fields: [
    { name: 'plumbing_work_type', label: 'Type of Plumbing Work', type: 'select', options: ['New Installation','Renovation','Repair','Extension','Relocation'], required: true },
    { name: 'number_of_fixtures', label: 'Number of Fixtures', type: 'number', placeholder: 'e.g. 15', required: true },
    { name: 'water_source', label: 'Water Source', type: 'select', options: ['Municipal Water','Deep Well','Shallow Well','Rain Harvesting','Others'], required: true },
    { name: 'drainage_type', label: 'Drainage System Type', type: 'select', options: ['Septic Tank','Sewage Treatment Plant','Municipal Sewer','Others'], required: true },
  ]},
  { id: 'signage', title: 'Signage Permit', icon: Signpost, color: '#FF9800', description: 'Required for installation of business signs, billboards, and advertising displays.', fields: [
    { name: 'sign_type', label: 'Sign Type', type: 'select', options: ['Wall-Mounted','Free-Standing','Projecting','Roof Sign','Billboard','LED/Digital','Others'], required: true },
    { name: 'sign_dimensions', label: 'Sign Dimensions (W x H)', type: 'text', placeholder: 'e.g. 3m x 2m', required: true },
    { name: 'sign_material', label: 'Sign Material', type: 'text', placeholder: 'e.g. Acrylic, Metal', required: true },
    { name: 'illuminated', label: 'Illuminated?', type: 'select', options: ['Yes - Internal','Yes - External','Yes - LED/Neon','No'], required: true },
  ]},
];

const STEPS = [
  { id: 1, title: 'Select Permit', description: 'Choose permit type' },
  { id: 2, title: 'Applicant Info', description: 'Personal details' },
  { id: 3, title: 'Professional', description: 'Licensed professional' },
  { id: 4, title: 'Project Details', description: 'Specific requirements' },
  { id: 5, title: 'Documents', description: 'Upload & declare' },
  { id: 6, title: 'Review', description: 'Review application' },
];

export default function AncillaryPermits() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPermit, setSelectedPermit] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Barangay clearance verification states
  const [verifyingBarangayId, setVerifyingBarangayId] = useState(false);
  const [barangayVerified, setBarangayVerified] = useState(false);
  const [barangayPermitData, setBarangayPermitData] = useState(null);

  // Professional verification states
  const [verifyingProfessional, setVerifyingProfessional] = useState(false);
  const [professionalVerified, setProfessionalVerified] = useState(false);
  const [professionalData, setProfessionalData] = useState(null);

  const [formData, setFormData] = useState({
    first_name: '', last_name: '', middle_initial: '', contact_number: '', email: '',
    owner_address: '', property_address: '', building_permit_number: '', barangay_clearance: '',
    tct_or_tax_dec: '', professional_name: '', professional_role: '',
    prc_id: '', ptr_number: '', prc_expiry: '', project_description: '',
    document_plans: null, document_id: null, signature_file: null, agree_declaration: false,
    date_submitted: new Date().toISOString().split('T')[0],
  });
  const [typeData, setTypeData] = useState({});

  const handleChange = (e) => {
    const { name, value, type, files, checked } = e.target;
    if (name === 'contact_number') {
      const num = value.replace(/[^0-9]/g, '');
      if (num === '' || num.startsWith('09')) setFormData(prev => ({ ...prev, [name]: num }));
      return;
    }
    if (name === 'barangay_clearance') {
      setBarangayVerified(false);
      setBarangayPermitData(null);
    }
    if (name === 'prc_id') {
      setProfessionalVerified(false);
      setProfessionalData(null);
    }
    if (['tct_or_tax_dec', 'barangay_clearance'].includes(name)) {
      setFormData(prev => ({ ...prev, [name]: value.replace(/[^0-9]/g, '') }));
      return;
    }
    if (type === 'file') setFormData(prev => ({ ...prev, [name]: files[0] || null }));
    else if (type === 'checkbox') setFormData(prev => ({ ...prev, [name]: checked }));
    else setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTypeDataChange = (e) => {
    const { name, value } = e.target;
    setTypeData(prev => ({ ...prev, [name]: value }));
  };

  const handlePermitSelect = (permit) => {
    setSelectedPermit(permit);
    setTypeData({});
    Swal.fire({
      title: permit.title,
      html: `<p style="font-family:${COLORS.font}">${permit.description}</p>`,
      icon: 'info',
      confirmButtonText: 'Continue to Application',
      confirmButtonColor: COLORS.success,
      showCancelButton: true, cancelButtonText: 'Back', cancelButtonColor: '#6b7280',
    }).then((r) => {
      if (r.isConfirmed) { setCurrentStep(2); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    });
  };

  // Verify Barangay Clearance ID and auto-fill applicant info
  const verifyBarangayClearanceId = async () => {
    const barangayId = formData.barangay_clearance.trim();
    if (!barangayId) {
      Swal.fire({ icon: 'warning', title: 'Enter Barangay Clearance ID', text: 'Please enter a barangay clearance ID to verify.', confirmButtonColor: COLORS.primary });
      return;
    }
    if (barangayVerified && barangayPermitData) {
      Swal.fire({ icon: 'success', title: 'Already Verified', text: 'This barangay clearance ID is already verified.', confirmButtonColor: COLORS.success });
      return;
    }
    setVerifyingBarangayId(true);
    try {
      const response = await fetch(BARANGAY_API);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      let permits = [];
      if (data.success && data.data) permits = data.data;
      else if (Array.isArray(data)) permits = data;
      else permits = data.permits || [];

      const foundPermit = permits.find(p => {
        const pId = p.applicant_id ? p.applicant_id.toString() : '';
        const pmId = p.permit_id ? p.permit_id.toString() : '';
        const search = barangayId.toString();
        return (pId === search || pmId === search) && p.status === 'approved';
      });

      if (foundPermit) {
        setBarangayVerified(true);
        setBarangayPermitData(foundPermit);
        const address = [foundPermit.house_no, foundPermit.street, foundPermit.barangay, foundPermit.city_municipality, foundPermit.province].filter(Boolean).join(', ');
        setFormData(prev => ({
          ...prev,
          first_name: foundPermit.first_name || prev.first_name,
          last_name: foundPermit.last_name || prev.last_name,
          middle_initial: foundPermit.middle_name || prev.middle_initial,
          contact_number: foundPermit.mobile_number || prev.contact_number,
          email: foundPermit.email || prev.email,
          owner_address: address || prev.owner_address,
        }));
        Swal.fire({ icon: 'success', title: 'Verified & Auto-filled!',
          html: `<div style="font-family:${COLORS.font};text-align:left">
            <p><strong>Name:</strong> ${foundPermit.first_name} ${foundPermit.middle_name || ''} ${foundPermit.last_name}</p>
            <p><strong>Email:</strong> ${foundPermit.email || 'N/A'}</p>
            <p><strong>Contact:</strong> ${foundPermit.mobile_number || 'N/A'}</p>
            <p><strong>Address:</strong> ${address || 'N/A'}</p>
            <p class="mt-2 text-green-600"><strong>Status:</strong> Approved</p>
          </div>`, confirmButtonColor: COLORS.success });
      } else {
        Swal.fire({ icon: 'error', title: 'Not Found', text: 'Barangay clearance ID not found or not approved. Please check the ID and try again.', confirmButtonColor: COLORS.danger });
      }
    } catch (error) {
      console.error('Error verifying barangay clearance:', error);
      Swal.fire({ icon: 'error', title: 'Verification Error', text: 'Error connecting to verification service. Please try again later.', confirmButtonColor: COLORS.danger });
    } finally { setVerifyingBarangayId(false); }
  };

  // Verify Professional via PRC License from registration DB
  const verifyProfessional = async () => {
    const prcId = formData.prc_id.trim();
    if (!prcId) {
      Swal.fire({ icon: 'warning', title: 'Enter PRC License', text: 'Please enter a PRC license number to verify.', confirmButtonColor: COLORS.primary });
      return;
    }
    if (professionalVerified && professionalData) {
      Swal.fire({ icon: 'success', title: 'Already Verified', text: 'This professional is already verified.', confirmButtonColor: COLORS.success });
      return;
    }
    setVerifyingProfessional(true);
    try {
      const response = await fetch(PROFESSIONAL_API);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      let registrations = [];
      if (data.success && data.data) registrations = data.data;
      else if (Array.isArray(data)) registrations = data;

      const found = registrations.find(r => {
        const lic = r.prc_license ? r.prc_license.toString().trim() : '';
        return lic === prcId && (r.status === 'approved' || r.status === 'pending');
      });

      if (found) {
        setProfessionalVerified(true);
        setProfessionalData(found);
        const fullName = [found.first_name, found.middle_initial, found.last_name, found.suffix].filter(Boolean).join(' ');
        setFormData(prev => ({
          ...prev,
          professional_name: fullName || prev.professional_name,
          professional_role: found.role_in_project || found.profession || prev.professional_role,
          ptr_number: found.ptr_number || prev.ptr_number,
          prc_expiry: found.prc_expiry ? found.prc_expiry.split('T')[0] : prev.prc_expiry,
        }));
        Swal.fire({ icon: 'success', title: 'Professional Verified!',
          html: `<div style="font-family:${COLORS.font};text-align:left">
            <p><strong>Name:</strong> ${fullName}</p>
            <p><strong>Profession:</strong> ${found.profession || 'N/A'}</p>
            <p><strong>Role:</strong> ${found.role_in_project || 'N/A'}</p>
            <p><strong>PRC License:</strong> ${found.prc_license}</p>
            <p><strong>PTR Number:</strong> ${found.ptr_number || 'N/A'}</p>
            <p><strong>PRC Expiry:</strong> ${found.prc_expiry || 'N/A'}</p>
            <p class="mt-2" style="color:${found.status === 'approved' ? COLORS.success : COLORS.accent}"><strong>Status:</strong> ${found.status}</p>
          </div>`, confirmButtonColor: COLORS.success });
      } else {
        Swal.fire({ icon: 'error', title: 'Not Found',
          text: 'PRC license not found in the professional registration database. Please ensure the professional is registered first.',
          confirmButtonColor: COLORS.danger });
      }
    } catch (error) {
      console.error('Error verifying professional:', error);
      Swal.fire({ icon: 'error', title: 'Verification Error', text: 'Error connecting to professional registration service.', confirmButtonColor: COLORS.danger });
    } finally { setVerifyingProfessional(false); }
  };

  const validateStep = (step) => {
    const m = [];
    if (step === 2) {
      if (!formData.barangay_clearance.trim()) m.push('Barangay Clearance ID');
      else if (!barangayVerified) m.push('Barangay Clearance must be verified (click Verify)');
      if (!formData.first_name.trim()) m.push('First Name');
      if (!formData.last_name.trim()) m.push('Last Name');
      if (!formData.contact_number.trim()) m.push('Contact Number');
      else if (formData.contact_number.length !== 11) m.push('Contact must be 11 digits (09XXXXXXXXX)');
      if (!formData.email.trim()) m.push('Email');
      else if (!/\S+@\S+\.\S+/.test(formData.email)) m.push('Valid email format');
      if (!formData.owner_address.trim()) m.push('Owner Address');
      if (!formData.property_address.trim()) m.push('Property Address');
    }
    if (step === 3) {
      if (!formData.prc_id.trim()) m.push('PRC License Number');
      else if (!professionalVerified) m.push('Professional must be verified (click Verify)');
      if (!formData.professional_name.trim()) m.push('Professional Name');
      if (!formData.ptr_number.trim()) m.push('PTR Number');
      if (!formData.prc_expiry) m.push('PRC Expiry Date');
      else if (new Date(formData.prc_expiry) < new Date()) m.push('PRC must not be expired');
    }
    if (step === 4) {
      if (!formData.project_description.trim()) m.push('Project Description');
      if (selectedPermit) selectedPermit.fields.forEach(f => {
        if (f.required && !typeData[f.name]?.toString().trim()) m.push(f.label);
      });
    }
    if (step === 5) {
      if (!formData.document_plans) m.push('Plans / Drawings');
      if (!formData.document_id) m.push('Valid ID');
      if (!formData.signature_file) m.push('Signature File');
      if (!formData.agree_declaration) m.push('You must agree to the declaration');
    }
    return m;
  };

  const nextStep = () => {
    const missing = validateStep(currentStep);
    if (missing.length > 0) {
      Swal.fire({ icon: 'warning', title: 'Missing Required Fields',
        html: `<ul style="text-align:left;font-family:${COLORS.font}">${missing.map(x => `<li>• ${x}</li>`).join('')}</ul>`,
        confirmButtonColor: COLORS.primary });
      return;
    }
    if (currentStep < STEPS.length) { setCurrentStep(prev => prev + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  };

  const prevStep = () => {
    if (currentStep > 1) { setCurrentStep(prev => prev - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  };

  const handleSubmit = async () => {
    const confirmResult = await Swal.fire({
      title: 'Submit Application?',
      html: `<p style="font-family:${COLORS.font}">Submit your <strong>${selectedPermit.title}</strong> application? This cannot be undone.</p>`,
      icon: 'question', showCancelButton: true, confirmButtonText: 'Submit',
      confirmButtonColor: COLORS.success, cancelButtonText: 'Cancel', cancelButtonColor: '#6b7280',
    });
    if (!confirmResult.isConfirmed) return;
    Swal.fire({ title: 'Submitting...', html: '<p>Please wait while we process your application.</p>',
      allowOutsideClick: false, allowEscapeKey: false, didOpen: () => Swal.showLoading() });
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('permit_type', selectedPermit.id);

      // Add user_id for tracking applications by user
      const userId = localStorage.getItem('user_id') || localStorage.getItem('goserveph_user_id') || '0';
      fd.append('user_id', userId);

      Object.entries(formData).forEach(([k, v]) => {
        if (v === null || v === undefined) return;
        if (k === 'document_plans' || k === 'document_id' || k === 'signature_file' || k === 'agree_declaration' || k === 'date_submitted') return;
        if (v instanceof File) return;
        fd.append(k, v);
      });
      fd.append('type_specific_data', JSON.stringify(typeData));
      if (formData.document_plans) fd.append('document_plans', formData.document_plans);
      if (formData.document_id) fd.append('document_id', formData.document_id);
      if (formData.signature_file) fd.append('signature_file', formData.signature_file);
      const response = await fetch(API_BASE, { method: 'POST', body: fd });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      if (result.success) {
        try { logPermitSubmission("Building Permit", result.data?.permit_id || "", { permit_type: selectedPermit?.title || "Ancillary" }); } catch(e) { console.warn('Activity log failed:', e); }
        Swal.fire({ icon: 'success', title: 'Application Submitted!',
          html: `<div style="font-family:${COLORS.font}"><p>Your <strong>${selectedPermit.title}</strong> application has been submitted.</p><p class="mt-2"><strong>Permit ID:</strong> ${result.data?.permit_id || 'N/A'}</p></div>`,
          confirmButtonColor: COLORS.success, confirmButtonText: 'Track Application' }).then(() => navigate('/user/permittracker'));
      } else { throw new Error(result.message || 'Submission failed'); }
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Submission Failed', html: `<p style="font-family:${COLORS.font}">${error.message}</p>`, confirmButtonColor: COLORS.danger });
    } finally { setIsSubmitting(false); }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: return renderPermitSelection();
      case 2: return renderApplicantInfo();
      case 3: return renderProfessionalInfo();
      case 4: return renderProjectDetails();
      case 5: return renderDocuments();
      case 6: return renderReview();
      default: return null;
    }
  };

  const renderPermitSelection = () => (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold" style={{ color: COLORS.primary, fontFamily: COLORS.font }}>Select Ancillary Permit Type</h2>
        <p className="mt-2 text-gray-500" style={{ fontFamily: COLORS.font }}>Choose the type of ancillary permit you need to apply for</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {PERMIT_TYPES.map((permit) => {
          const Icon = permit.icon;
          const isSel = selectedPermit?.id === permit.id;
          return (
            <div key={permit.id} onClick={() => handlePermitSelect(permit)}
              className={`group cursor-pointer rounded-xl border-2 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-lg ${isSel ? 'ring-2 ring-offset-2' : ''}`}
              style={{ borderColor: isSel ? permit.color : '#E5E7EB' }}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${permit.color}15` }}>
                  <Icon className="w-6 h-6" style={{ color: permit.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base flex items-center justify-between" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                    {permit.title}
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2" style={{ fontFamily: COLORS.font }}>{permit.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderApplicantInfo = () => (
    <div>
      <h2 className="text-xl font-bold mb-1" style={{ color: COLORS.primary, fontFamily: COLORS.font }}>Applicant Information</h2>
      <p className="text-sm text-gray-500 mb-6" style={{ fontFamily: COLORS.font }}>Enter your Barangay Clearance ID to auto-fill your details</p>

      {/* Barangay Clearance at Top */}
      <div className="p-4 rounded-lg border-2 mb-6" style={{ borderColor: barangayVerified ? COLORS.success : COLORS.primary, background: barangayVerified ? '#4CAF5010' : '#4A90E210' }}>
        <label className="block text-sm font-bold mb-2" style={{ color: COLORS.primary, fontFamily: COLORS.font }}>
          <Shield className="w-4 h-4 inline mr-1" /> Barangay Clearance ID <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          <input type="text" name="barangay_clearance" value={formData.barangay_clearance} onChange={handleChange}
            placeholder="Enter Barangay Clearance / Permit ID" className={`${inputCls} flex-1`} style={labelStyle} />
          <button onClick={verifyBarangayClearanceId} disabled={verifyingBarangayId}
            className="px-4 py-2 rounded-lg text-white font-semibold flex items-center gap-2 whitespace-nowrap"
            style={{ background: barangayVerified ? COLORS.success : COLORS.primary, fontFamily: COLORS.font }}>
            {verifyingBarangayId ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</> :
             barangayVerified ? <><CheckCircle className="w-4 h-4" /> Verified</> :
             <><Search className="w-4 h-4" /> Verify</>}
          </button>
        </div>
        {barangayVerified && <p className="text-xs mt-2 flex items-center gap-1" style={{ color: COLORS.success }}><CheckCircle className="w-3 h-3" /> Barangay clearance verified — applicant info auto-filled below</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { name: 'first_name', label: 'First Name', req: true, ph: 'Enter first name' },
          { name: 'last_name', label: 'Last Name', req: true, ph: 'Enter last name' },
          { name: 'middle_initial', label: 'Middle Initial', req: false, ph: 'M.I.' },
          { name: 'contact_number', label: 'Contact Number', req: true, ph: '09XXXXXXXXX', max: 11 },
          { name: 'email', label: 'Email', req: true, ph: 'email@example.com', type: 'email' },
          { name: 'tct_or_tax_dec', label: 'TCT / Tax Dec No.', req: false, ph: 'Enter TCT or Tax Dec number' },
        ].map(f => (
          <div key={f.name}>
            <label className="block text-sm font-medium mb-1" style={labelStyle}>{f.label} {f.req && <span className="text-red-500">*</span>}</label>
            <input type={f.type || 'text'} name={f.name} value={formData[f.name]} onChange={handleChange}
              placeholder={f.ph} maxLength={f.max} className={inputCls}
              style={{ ...labelStyle, background: barangayVerified && ['first_name','last_name','middle_initial','contact_number','email'].includes(f.name) ? '#f0fdf4' : '#fff' }} />
          </div>
        ))}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1" style={labelStyle}>Owner Address <span className="text-red-500">*</span></label>
          <input type="text" name="owner_address" value={formData.owner_address} onChange={handleChange}
            placeholder="Enter complete owner address" className={inputCls}
            style={{ ...labelStyle, background: barangayVerified ? '#f0fdf4' : '#fff' }} />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1" style={labelStyle}>Property / Project Address <span className="text-red-500">*</span></label>
          <input type="text" name="property_address" value={formData.property_address} onChange={handleChange}
            placeholder="Enter complete property address" className={inputCls} style={labelStyle} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={labelStyle}>Building Permit Number</label>
          <input type="text" name="building_permit_number" value={formData.building_permit_number} onChange={handleChange}
            placeholder="Enter building permit number" className={inputCls} style={labelStyle} />
        </div>
      </div>
    </div>
  );

  const renderProfessionalInfo = () => (
    <div>
      <h2 className="text-xl font-bold mb-1" style={{ color: COLORS.primary, fontFamily: COLORS.font }}>Professional Information</h2>
      <p className="text-sm text-gray-500 mb-6" style={{ fontFamily: COLORS.font }}>Enter the PRC License number to verify and auto-fill professional details</p>

      {/* PRC License Verification */}
      <div className="p-4 rounded-lg border-2 mb-6" style={{ borderColor: professionalVerified ? COLORS.success : COLORS.primary, background: professionalVerified ? '#4CAF5010' : '#4A90E210' }}>
        <label className="block text-sm font-bold mb-2" style={{ color: COLORS.primary, fontFamily: COLORS.font }}>
          <Shield className="w-4 h-4 inline mr-1" /> PRC License Number <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          <input type="text" name="prc_id" value={formData.prc_id} onChange={handleChange}
            placeholder="Enter PRC License Number (e.g. PRC-987654)" className={`${inputCls} flex-1`} style={labelStyle} />
          <button onClick={verifyProfessional} disabled={verifyingProfessional}
            className="px-4 py-2 rounded-lg text-white font-semibold flex items-center gap-2 whitespace-nowrap"
            style={{ background: professionalVerified ? COLORS.success : COLORS.primary, fontFamily: COLORS.font }}>
            {verifyingProfessional ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</> :
             professionalVerified ? <><CheckCircle className="w-4 h-4" /> Verified</> :
             <><Search className="w-4 h-4" /> Verify</>}
          </button>
        </div>
        {professionalVerified && <p className="text-xs mt-2 flex items-center gap-1" style={{ color: COLORS.success }}><CheckCircle className="w-3 h-3" /> Professional verified from registration database — details auto-filled below</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1" style={labelStyle}>Professional Name <span className="text-red-500">*</span></label>
          <input type="text" name="professional_name" value={formData.professional_name} onChange={handleChange}
            placeholder="Full name of supervising professional" className={inputCls}
            style={{ ...labelStyle, background: professionalVerified ? '#f0fdf4' : '#fff' }} readOnly={professionalVerified} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={labelStyle}>Professional Role</label>
          <input type="text" name="professional_role" value={formData.professional_role} onChange={handleChange}
            placeholder="e.g. Professional Engineer" className={inputCls}
            style={{ ...labelStyle, background: professionalVerified ? '#f0fdf4' : '#fff' }} readOnly={professionalVerified} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={labelStyle}>PTR Number <span className="text-red-500">*</span></label>
          <input type="text" name="ptr_number" value={formData.ptr_number} onChange={handleChange}
            placeholder="Enter PTR number" className={inputCls}
            style={{ ...labelStyle, background: professionalVerified ? '#f0fdf4' : '#fff' }} readOnly={professionalVerified} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={labelStyle}>PRC Expiry Date <span className="text-red-500">*</span></label>
          <input type="date" name="prc_expiry" value={formData.prc_expiry} onChange={handleChange}
            min={new Date().toISOString().split('T')[0]} className={inputCls}
            style={{ ...labelStyle, background: professionalVerified ? '#f0fdf4' : '#fff' }} readOnly={professionalVerified} />
        </div>
      </div>
    </div>
  );

  const renderProjectDetails = () => {
    if (!selectedPermit) return null;
    const Icon = selectedPermit.icon;
    return (
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${selectedPermit.color}15` }}>
            <Icon className="w-5 h-5" style={{ color: selectedPermit.color }} />
          </div>
          <h2 className="text-xl font-bold" style={{ color: COLORS.primary, fontFamily: COLORS.font }}>
            {selectedPermit.title} - Project Details
          </h2>
        </div>
        <p className="text-sm text-gray-500 mb-6 ml-11" style={{ fontFamily: COLORS.font }}>
          Provide specific details for your {selectedPermit.title.toLowerCase()} application
        </p>
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1" style={labelStyle}>Project Description <span className="text-red-500">*</span></label>
          <textarea name="project_description" value={formData.project_description} onChange={handleChange}
            placeholder="Describe the overall scope of work, location details, and any special considerations..."
            rows={4} className={inputCls} style={labelStyle} />
        </div>
        <div className="p-4 rounded-lg border mb-6" style={{ borderColor: selectedPermit.color, background: `${selectedPermit.color}08` }}>
          <h3 className="font-bold text-base mb-4" style={{ color: selectedPermit.color, fontFamily: COLORS.font }}>
            {selectedPermit.title} Specific Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedPermit.fields.map((field) => (
              <div key={field.name} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                <label className="block text-sm font-medium mb-1" style={labelStyle}>
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                {field.type === 'select' ? (
                  <select name={field.name} value={typeData[field.name] || ''} onChange={handleTypeDataChange}
                    className={`${inputCls} bg-white`} style={labelStyle}>
                    <option value="">Select {field.label}</option>
                    {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea name={field.name} value={typeData[field.name] || ''} onChange={handleTypeDataChange}
                    placeholder={field.placeholder || ''} rows={3} className={inputCls} style={labelStyle} />
                ) : (
                  <input type={field.type || 'text'} name={field.name} value={typeData[field.name] || ''}
                    onChange={handleTypeDataChange} placeholder={field.placeholder || ''} className={inputCls} style={labelStyle} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderDocuments = () => (
    <div>
      <h2 className="text-xl font-bold mb-1" style={{ color: COLORS.primary, fontFamily: COLORS.font }}>Documents & Declaration</h2>
      <p className="text-sm text-gray-500 mb-6" style={{ fontFamily: COLORS.font }}>Upload required documents and sign the declaration</p>
      <div className="space-y-5">
        {[
          { name: 'document_plans', label: 'Plans / Drawings', hint: 'Upload signed and sealed plans (PDF, JPG, PNG — max 5MB)' },
          { name: 'document_id', label: 'Valid ID', hint: 'Upload a valid government-issued ID (PDF, JPG, PNG — max 5MB)' },
          { name: 'signature_file', label: 'Professional Signature', hint: 'Upload professional signature (PNG, JPG — max 5MB)' },
        ].map(f => (
          <div key={f.name}>
            <label className="block text-sm font-medium mb-1" style={labelStyle}>{f.label} <span className="text-red-500">*</span></label>
            <p className="text-xs text-gray-400 mb-2" style={{ fontFamily: COLORS.font }}>{f.hint}</p>
            <input type="file" name={f.name} onChange={handleChange} accept=".pdf,.jpg,.jpeg,.png"
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-black rounded-lg p-2"
              style={{ fontFamily: COLORS.font }} />
            {formData[f.name] && <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> {formData[f.name].name}</p>}
          </div>
        ))}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 mt-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" name="agree_declaration" checked={formData.agree_declaration} onChange={handleChange}
              className="mt-1 w-5 h-5 accent-green-600" />
            <span className="text-sm" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
              I hereby declare that all information provided in this application is true and correct to the best of my knowledge.
              I understand that any misrepresentation may result in the denial or revocation of this permit.
            </span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderReview = () => {
    if (!selectedPermit) return null;
    const Icon = selectedPermit.icon;
    const Section = ({ title, children }) => (
      <div className="mb-5">
        <h3 className="font-bold text-base mb-3 pb-2 border-b" style={{ color: COLORS.primary, fontFamily: COLORS.font }}>{title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">{children}</div>
      </div>
    );
    const Field = ({ label, value }) => (
      <div className="py-1">
        <span className="text-xs text-gray-500 block" style={{ fontFamily: COLORS.font }}>{label}</span>
        <span className="text-sm font-medium" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>{value || '—'}</span>
      </div>
    );
    return (
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${selectedPermit.color}15` }}>
            <Icon className="w-5 h-5" style={{ color: selectedPermit.color }} />
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: COLORS.primary, fontFamily: COLORS.font }}>Review Application</h2>
            <p className="text-sm text-gray-500" style={{ fontFamily: COLORS.font }}>{selectedPermit.title} — Please review all details before submitting</p>
          </div>
        </div>

        <Section title="Applicant Information">
          <Field label="Barangay Clearance ID" value={formData.barangay_clearance} />
          <Field label="Full Name" value={`${formData.first_name} ${formData.middle_initial} ${formData.last_name}`.trim()} />
          <Field label="Contact Number" value={formData.contact_number} />
          <Field label="Email" value={formData.email} />
          <Field label="Owner Address" value={formData.owner_address} />
          <Field label="Property Address" value={formData.property_address} />
          <Field label="Building Permit No." value={formData.building_permit_number} />
          <Field label="TCT / Tax Dec No." value={formData.tct_or_tax_dec} />
        </Section>

        <Section title="Professional Information">
          <Field label="PRC License No." value={formData.prc_id} />
          <Field label="Professional Name" value={formData.professional_name} />
          <Field label="Role" value={formData.professional_role} />
          <Field label="PTR Number" value={formData.ptr_number} />
          <Field label="PRC Expiry" value={formData.prc_expiry} />
          <Field label="Verified" value={professionalVerified ? 'Yes' : 'No'} />
        </Section>

        <Section title="Project Details">
          <div className="md:col-span-2"><Field label="Project Description" value={formData.project_description} /></div>
          {selectedPermit.fields.map(f => (
            <Field key={f.name} label={f.label} value={typeData[f.name]} />
          ))}
        </Section>

        <Section title="Documents">
          <Field label="Plans / Drawings" value={formData.document_plans?.name} />
          <Field label="Valid ID" value={formData.document_id?.name} />
          <Field label="Professional Signature" value={formData.signature_file?.name} />
          <Field label="Declaration Agreed" value={formData.agree_declaration ? 'Yes' : 'No'} />
        </Section>

        <div className="p-3 rounded-lg mt-2" style={{ background: '#4A90E210', border: `1px solid ${COLORS.primary}` }}>
          <Field label="Submission Date" value={formData.date_submitted} />
        </div>
      </div>
    );
  };

  // =================== MAIN RETURN ===================
  return (
    <div className="mx-1 mt-1 p-6 rounded-lg min-h-screen" style={{ background: COLORS.background, color: COLORS.secondary, fontFamily: COLORS.font }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: COLORS.primary, fontFamily: COLORS.font }}>
            Ancillary Permit Application
          </h1>
          <p className="mt-1 text-sm text-gray-500" style={{ fontFamily: COLORS.font }}>
            {selectedPermit ? `Applying for: ${selectedPermit.title}` : 'Select a permit type to begin'}
          </p>
        </div>
        <button
          onClick={() => {
            Swal.fire({ title: 'Go Back?', text: 'Are you sure you want to go back? Unsaved changes will be lost.',
              icon: 'warning', showCancelButton: true, confirmButtonText: 'Yes, Go Back',
              confirmButtonColor: COLORS.success, cancelButtonText: 'Cancel', cancelButtonColor: '#6b7280',
            }).then((r) => { if (r.isConfirmed) navigate('/user/building/type'); });
          }}
          className="px-4 py-2 rounded-lg text-white font-semibold transition-colors"
          style={{ background: COLORS.success, fontFamily: COLORS.font }}
          onMouseEnter={e => e.currentTarget.style.background = COLORS.accent}
          onMouseLeave={e => e.currentTarget.style.background = COLORS.success}
        >
          <span className="flex items-center gap-2"><ArrowLeft size={16} /> Change Type</span>
        </button>
      </div>

      {/* Step Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 font-bold text-sm"
                style={{
                  background: currentStep >= step.id ? COLORS.success : 'transparent',
                  borderColor: currentStep >= step.id ? COLORS.success : '#9CA3AF',
                  color: currentStep >= step.id ? '#fff' : '#9CA3AF',
                  fontFamily: COLORS.font,
                }}>
                {currentStep > step.id ? <CheckCircle className="w-5 h-5" /> : step.id}
              </div>
              <div className="ml-2 hidden md:block">
                <p className="text-sm font-semibold" style={{ color: currentStep >= step.id ? COLORS.success : '#9CA3AF', fontFamily: COLORS.font }}>{step.title}</p>
                <p className="text-xs" style={{ color: '#9CA3AF', fontFamily: COLORS.font }}>{step.description}</p>
              </div>
              {index < STEPS.length - 1 && (
                <div className="hidden md:block w-12 h-0.5 mx-3" style={{ background: currentStep > step.id ? COLORS.success : '#D1D5DB' }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        {renderStepContent()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        {currentStep > 1 ? (
          <button onClick={prevStep}
            className="px-6 py-3 rounded-lg font-semibold text-white transition-colors flex items-center gap-2"
            style={{ background: '#9CA3AF', fontFamily: COLORS.font }}
            onMouseEnter={e => e.currentTarget.style.background = '#6B7280'}
            onMouseLeave={e => e.currentTarget.style.background = '#9CA3AF'}>
            <ArrowLeft size={16} /> Previous
          </button>
        ) : <div />}
        {currentStep < STEPS.length ? (
          currentStep > 1 && (
            <button onClick={nextStep}
              className="px-6 py-3 rounded-lg font-semibold text-white transition-colors flex items-center gap-2"
              style={{ background: COLORS.success, fontFamily: COLORS.font }}
              onMouseEnter={e => e.currentTarget.style.background = COLORS.accent}
              onMouseLeave={e => e.currentTarget.style.background = COLORS.success}>
              {currentStep === 5 ? 'Review Application' : 'Next'} <ArrowRight size={16} />
            </button>
          )
        ) : (
          <button onClick={handleSubmit} disabled={isSubmitting}
            className="px-6 py-3 rounded-lg font-semibold text-white transition-colors"
            style={{ background: isSubmitting ? '#9CA3AF' : COLORS.success, cursor: isSubmitting ? 'not-allowed' : 'pointer', fontFamily: COLORS.font }}
            onMouseEnter={e => { if (!isSubmitting) e.currentTarget.style.background = COLORS.accent; }}
            onMouseLeave={e => { if (!isSubmitting) e.currentTarget.style.background = COLORS.success; }}>
            {isSubmitting ? 'Submitting...' : 'Submit Application'}
          </button>
        )}
      </div>
    </div>
  );
}
