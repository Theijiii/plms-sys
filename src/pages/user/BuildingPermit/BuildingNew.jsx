import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload } from "lucide-react";
import Swal from "sweetalert2";

const NATIONALITIES = [
  "Afghan", "Albanian", "Algerian", "American", "Andorran", "Angolan", "Antiguans", "Argentinean", "Armenian", "Australian", "Austrian", "Azerbaijani", "Bahamian", "Bahraini", "Bangladeshi", "Barbadian", "Barbudans", "Batswana", "Belarusian", "Belgian", "Belizean", "Beninese", "Bhutanese", "Bolivian", "Bosnian", "Brazilian", "British", "Bruneian", "Bulgarian", "Burkinabe", "Burmese", "Burundian", "Cambodian", "Cameroonian", "Canadian", "Cape Verdean", "Central African", "Chadian", "Chilean", "Chinese", "Colombian", "Comoran", "Congolese", "Costa Rican", "Croatian", "Cuban", "Cypriot", "Czech", "Danish", "Djibouti", "Dominican", "Dutch", "East Timorese", "Ecuadorean", "Egyptian", "Emirian", "Equatorial Guinean", "Eritrean", "Estonian", "Ethiopian", "Fijian", "Filipino", "Finnish", "French", "Gabonese", "Gambian", "Georgian", "German", "Ghanaian", "Greek", "Grenadian", "Guatemalan", "Guinea-Bissauan", "Guinean", "Guyanese", "Haitian", "Herzegovinian", "Honduran", "Hungarian", "I-Kiribati", "Icelander", "Indian", "Indonesian", "Iranian", "Iraqi", "Irish", "Israeli", "Italian", "Ivorian", "Jamaican", "Japanese", "Jordanian", "Kazakhstani", "Kenyan", "Kittian and Nevisian", "Kuwaiti", "Kyrgyz", "Laotian", "Latvian", "Lebanese", "Liberian", "Libyan", "Liechtensteiner", "Lithuanian", "Luxembourger", "Macedonian", "Malagasy", "Malawian", "Malaysian", "Maldivan", "Malian", "Maltese", "Marshallese", "Mauritanian", "Mauritian", "Mexican", "Micronesian", "Moldovan", "Monacan", "Mongolian", "Moroccan", "Mosotho", "Motswana", "Mozambican", "Namibian", "Nauruan", "Nepalese", "New Zealander", "Nicaraguan", "Nigerian", "Nigerien", "North Korean", "Northern Irish", "Norwegian", "Omani", "Pakistani", "Palauan", "Palestinian", "Panamanian", "Papua New Guinean", "Paraguayan", "Peruvian", "Polish", "Portuguese", "Qatari", "Romanian", "Russian", "Rwandan", "Saint Lucian", "Salvadoran", "Samoan", "San Marinese", "Sao Tomean", "Saudi", "Scottish", "Senegalese", "Serbian", "Seychellois", "Sierra Leonean", "Singaporean", "Slovakian", "Slovenian", "Solomon Islander", "Somali", "South African", "South Korean", "Spanish", "Sri Lankan", "Sudanese", "Surinamer", "Swazi", "Swedish", "Swiss", "Syrian", "Taiwanese", "Tajik", "Tanzanian", "Thai", "Togolese", "Tongan", "Trinidadian or Tobagonian", "Tunisian", "Turkish", "Tuvaluan", "Ugandan", "Ukrainian", "Uruguayan", "Uzbekistani", "Venezuelan", "Vietnamese", "Welsh", "Yemenite", "Zambian", "Zimbabwean"
];

const COLORS = {
  primary: '#4A90E2',
  secondary: '#000000',
  accent: '#FDA811',
  success: '#4CAF50',
  danger: '#E53935',
  background: '#FBFBFB',
  font: 'Montserrat, Arial, sans-serif'
};

export default function BuildingNew() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const API_BASE = "/backend/building_permit";

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1
    last_name: '', first_name: '', middle_initial: '', suffix: '', tin: '', contact_no: '', email: '', citizenship: '', home_address: '', form_of_ownership: '',
    // Step 2
    permit_group: '', use_of_permit: '', proposed_date_of_construction: '', expected_date_of_completion: '', total_estimated_cost: '',
    // Step 3
    lot_no: '', blk_no: '', tct_no: '', tax_dec_no: '', street: '', barangay: '', city_municipality: '', province: '',
    // Step 4
    number_of_units: '', number_of_storeys: '', total_floor_area: '', lot_area: '', building_cost: '', electrical_cost: '', mechanical_cost: '', electronics_cost: '', plumbing_cost: '', other_cost: '', equipment_cost: '', proposed_start: '', expected_completion: '',
    // Step 5
    attachments: [], professional_title: '', professional_name: '', prc_no: '', ptr_no: '', gov_id_no: '', date_issued: '', remarks: '', place_issued: '', signature: null,
  });

  const steps = [
    { id: 1, title: 'Applicant Information', description: 'Personal and contact details' },
    { id: 2, title: 'Application Details', description: 'Ownership and permit info' },
    { id: 3, title: 'Project Site Information', description: 'Project location details' },
    { id: 4, title: 'Occupancy & Project Cost', description: 'Units, storeys, and cost' },
    { id: 5, title: 'Other Requirements & Professionals', description: 'Attachments and professionals' },
  ];

  const handleChange = (e) => {
    const { name, type, value, files } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "file" ? (files && files[0] ? files[0] : null) : value,
    }));
  };

  const validateStep = (step, formData) => { 
    const isEmpty = (value) => value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0); 
    const stepFields = { 
      1: ['last_name','first_name','middle_initial','tin','contact_no','email','citizenship','home_address','form_of_ownership'], 
      2: ['permit_group','use_of_permit','proposed_date_of_construction','expected_date_of_completion','total_estimated_cost'], 
      3: ['lot_no','blk_no','tct_no','tax_dec_no','street','barangay','city_municipality','province'], 
      4: ['number_of_units','number_of_storeys','total_floor_area','lot_area','proposed_start','expected_completion'], 
      5: ['professional_title','professional_name','prc_no','ptr_no','gov_id_no','signature','date_issued','place_issued'], 
    }; 
    const missing = []; 
    stepFields[step].forEach(field => { 
      if (isEmpty(formData[field])) missing.push(field.replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase())); 
    }); 
    if (missing.length) return { ok: false, message: "Missing: " + missing.join(", ") }; 
    return { ok: true }; 
  };

  const nextStep = () => {
    const result = validateStep(currentStep, formData);
    if (!result.ok) {
      Swal.fire({ icon: 'warning', title: 'Missing Fields', text: result.message, confirmButtonColor: '#4a90e2' });
      return;
    }
    if (currentStep < steps.length) setCurrentStep(currentStep + 1);
  };
 
  const prevStep = () => { if (currentStep > 1) setCurrentStep(currentStep - 1); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = validateStep(currentStep, formData);
    if (!result.ok) {
      Swal.fire({ icon: 'warning', title: 'Missing Fields', text: result.message, confirmButtonColor: '#4a90e2' });
      return;
    }

    const confirm = await Swal.fire({
      title: 'Submit Application?',
      text: 'Are you sure you want to submit this building permit application?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#4CAF50',
      cancelButtonColor: '#9aa5b1',
      confirmButtonText: 'Yes, Submit',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    });

    if (!confirm.isConfirmed) return;

    setIsSubmitting(true);

    Swal.fire({
      title: 'Submitting...',
      html: 'Please wait while we process your application.',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => { Swal.showLoading(); }
    });

    try {
      const submitData = new FormData();

      Object.keys(formData).forEach(key => {
        const value = formData[key];
        if (value instanceof File || value instanceof FileList) return;
        if (Array.isArray(value)) return;
        submitData.append(key, value);
      });

      if (formData.signature) submitData.append("signature", formData.signature);
      if (formData.attachments && formData.attachments.length > 0) {
        for (let i = 0; i < formData.attachments.length; i++) {
          submitData.append("attachments", formData.attachments[i]);
        }
      }

      const response = await fetch(`${API_BASE}/building_permit.php`, {
        method: "POST",
        body: submitData,
      });

      const data = await response.json();

      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Application Submitted!',
          html: `<p>Your building permit application has been submitted successfully.</p>
                 <p style="margin-top:8px;"><strong>Application ID:</strong> ${data.data?.application_id || 'N/A'}</p>`,
          confirmButtonColor: '#4CAF50',
          confirmButtonText: 'OK'
        }).then(() => {
          navigate('/user/building/type');
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Submission Failed',
          text: data.message || 'Failed to submit application. Please try again.',
          confirmButtonColor: '#E53935'
        });
      }
    } catch (err) {
      console.error('Submit error:', err);
      Swal.fire({
        icon: 'error',
        title: 'Network Error',
        text: 'Could not connect to the server. Please check your connection and try again.',
        confirmButtonColor: '#E53935'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch(currentStep) {
      // ====== Step 1: Applicant Info ======
      case 1: return (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>{steps[0].title}</h3>
            <p className="text-sm text-gray-600 mb-4">{steps[0].description}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>First Name <span className="text-red-500">*</span></label>
              <input type="text" name="first_name" value={formData.first_name || ""} onChange={handleChange} placeholder="Enter first name" className="p-3 border border-black rounded-lg w-full" style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Last Name <span className="text-red-500">*</span></label>
              <input type="text" name="last_name" value={formData.last_name || ""} onChange={handleChange} placeholder="Enter last name" className="p-3 border border-black rounded-lg w-full" style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Middle Name <span className="text-red-500">*</span></label>
              <input type="text" name="middle_initial" value={formData.middle_initial || ""} onChange={handleChange} placeholder="Enter middle initial" className="p-3 border border-black rounded-lg w-full" style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Suffix</label>
              <input type="text" name="suffix" value={formData.suffix || ""} onChange={handleChange} placeholder="Enter suffix" className="p-3 border border-black rounded-lg w-full" style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Citizenship <span className="text-red-500">*</span></label>
              <input list="nationalities" name="citizenship" value={formData.citizenship || ""} onChange={handleChange} placeholder="Enter citizenship" className="p-3 border border-black rounded-lg w-full" style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
              <datalist id="nationalities">
                {NATIONALITIES.map((n) => (<option key={n} value={n} />))}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>TIN Number <span className="text-red-500">*</span></label>
              <input type="number" name="tin" value={formData.tin || ""} onChange={handleChange} placeholder="Enter TIN number" className="p-3 border border-black rounded-lg w-full" style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Contact Number <span className="text-red-500">*</span></label>
              <input type="number" name="contact_no" value={formData.contact_no || ""} onChange={handleChange} placeholder="Enter contact number" className="p-3 border border-black rounded-lg w-full" style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Email Address <span className="text-red-500">*</span></label>
              <input type="email" name="email" value={formData.email || ""} onChange={handleChange} placeholder="Enter email address" className="p-3 border border-black rounded-lg w-full" style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Home Address <span className="text-red-500">*</span></label>
              <input type="text" name="home_address" value={formData.home_address || ""} onChange={handleChange} placeholder="Enter home address" className="p-3 border border-black rounded-lg w-full" style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Form of Ownership <span className="text-red-500">*</span></label>
              <select name="form_of_ownership" value={formData.form_of_ownership || ""} onChange={handleChange} className="p-3 border border-black rounded-lg w-full" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>
                <option value="">Select Ownership</option>
                <option value="Individual">Individual</option>
                <option value="Enterprise">Enterprise</option>
                <option value="Others">Others</option>
              </select>
            </div>
          </div>
        </div>
      );

      // ====== Step 2: Application Details ======
      case 2: return (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>{steps[1].title}</h3>
            <p className="text-sm text-gray-600 mb-4">{steps[1].description}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Permit Group <span className="text-red-500">*</span></label>
              <select
                id="permit_group"
                name="permit_group"
                value={formData.permit_group || ""}
                onChange={handleChange}
                className="p-3 border border-black rounded-lg w-full"
                style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
              >
                <option value="">Select Permit Group</option>
                <option value="GROUP A: Single / Duplex / Residential R-1, R-2">
                  GROUP A: Single / Duplex / Residential R-1, R-2
                </option>
                <option value="GROUP B: Hotel / Motel / Dormitory / Townhouse / Boardinghouse / Residential R-3, R-4, R-5">
                  GROUP B: Hotel / Motel / Dormitory / Townhouse / Boardinghouse / Residential R-3, R-4, R-5
                </option>
                <option value="GROUP C: School Building / Civic Center / Clubhouse / School Auditorium / Gymnasium / Church, Mosque, Temple, Chapel">
                  GROUP C: School Building / Civic Center / Clubhouse / School Auditorium / Gymnasium / Church, Mosque, Temple, Chapel
                </option>
                <option value="GROUP D: Hospital / Home for the Aged / Government Office">
                  GROUP D: Hospital / Home for the Aged / Government Office
                </option>
                <option value="GROUP E: Bank / Store / Shopping Center / Mall / Dining Establishment / Shop">
                  GROUP E: Bank / Store / Shopping Center / Mall / Dining Establishment / Shop
                </option>
                <option value="GROUP F: Factory / Plant (Non-Explosive)">
                  GROUP F: Factory / Plant (Non-Explosive)
                </option>
                <option value="GROUP G: Warehouse / Factory (Hazardous / Highly Flammable)">
                  GROUP G: Warehouse / Factory (Hazardous / Highly Flammable)
                </option>
                <option value="GROUP H: Theater / Auditorium / Convention Hall / Grandstand / Bleacher">
                  GROUP H: Theater / Auditorium / Convention Hall / Grandstand / Bleacher
                </option>
                <option value="GROUP I: Coliseum / Sports Complex / Convention Center and Similar Structure">
                  GROUP I: Coliseum / Sports Complex / Convention Center and Similar Structure
                </option>
                <option value="GROUP J-1: Barn / Granary / Poultry House / Piggery / Grain Mill / Grain Silo">
                  GROUP J-1: Barn / Granary / Poultry House / Piggery / Grain Mill / Grain Silo
                </option>
                <option value="GROUP J-2: Private Carport / Garage / Tower / Swimming Pool / Fence / Steel / Concrete Tank">
                  GROUP J-2: Private Carport / Garage / Tower / Swimming Pool / Fence / Steel / Concrete Tank
                </option>
                <option value="Others">Others</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Specify Permit Use <span className="text-red-500">*</span></label>
              <input type="text" name="use_of_permit" value={formData.use_of_permit || ""} onChange={handleChange} placeholder="E.g Hotel" className="p-3 border border-black rounded-lg w-full" style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Proposed Date of Construction <span className="text-red-500">*</span></label>
              <input type="date" name="proposed_date_of_construction" value={formData.proposed_date_of_construction || ""} onChange={handleChange} className="p-3 border border-black rounded-lg w-full" style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Expected Date of Completion <span className="text-red-500">*</span></label>
              <input type="date" name="expected_date_of_completion" value={formData.expected_date_of_completion || ""} onChange={handleChange} className="p-3 border border-black rounded-lg w-full" style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Total Estimated Cost <span className="text-red-500">*</span></label>
              <input type="number" name="total_estimated_cost" value={formData.total_estimated_cost || ""} onChange={handleChange} placeholder="Enter total estimated cost" className="p-3 border border-black rounded-lg w-full" style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
            </div>
          </div>
        </div>
      );

      // ====== Step 3: Project Site ======
      case 3: return (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>{steps[2].title}</h3>
            <p className="text-sm text-gray-600 mb-4">{steps[2].description}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Lot Number <span className="text-red-500">*</span></label>
              <input type="number" name="lot_no" value={formData.lot_no || ""} onChange={handleChange} placeholder="Enter Lot Number" className="p-3 border border-black rounded-lg w-full" style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Block Number <span className="text-red-500">*</span></label>
              <input type="number" name="blk_no" value={formData.blk_no || ""} onChange={handleChange} placeholder="Enter Block Number" className="p-3 border border-black rounded-lg w-full" style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Street <span className="text-red-500">*</span></label>
              <input type="text" name="street" value={formData.street || ""} onChange={handleChange} placeholder="Enter Street" className="p-3 border border-black rounded-lg w-full" style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Barangay <span className="text-red-500">*</span></label>
              <input type="text" name="barangay" value={formData.barangay || ""} onChange={handleChange} placeholder="Enter Barangay" className="p-3 border border-black rounded-lg w-full" style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>City / Municipality <span className="text-red-500">*</span></label>
              <input type="text" name="city_municipality" value={formData.city_municipality || ""} onChange={handleChange} placeholder="Enter City or Municipality" className="p-3 border border-black rounded-lg w-full" style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Province <span className="text-red-500">*</span></label>
              <input type="text" name="province" value={formData.province || ""} onChange={handleChange} placeholder="Enter Province" className="p-3 border border-black rounded-lg w-full" style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>TCT Number <span className="text-red-500">*</span></label>
              <input type="number" name="tct_no" value={formData.tct_no || ""} onChange={handleChange} placeholder="Enter TCT Number" className="p-3 border border-black rounded-lg w-full" style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Tax Declaration Number <span className="text-red-500">*</span></label>
              <input type="number" name="tax_dec_no" value={formData.tax_dec_no || ""} onChange={handleChange} placeholder="Enter Tax Declaration Number" className="p-3 border border-black rounded-lg w-full" style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
            </div>
          </div>
        </div>
      );

      // ====== Step 4: Occupancy & Cost ======
      case 4: return (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>{steps[3].title}</h3>
            <p className="text-sm text-gray-600 mb-4">{steps[3].description}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Number of Units <span className="text-red-500">*</span></label>
              <input type="number" name="number_of_units" value={formData.number_of_units || ""} onChange={handleChange} placeholder="Enter number of units" className="p-3 border border-black rounded-lg w-full" style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Number of Storeys <span className="text-red-500">*</span></label>
              <input type="number" name="number_of_storeys" value={formData.number_of_storeys || ""} onChange={handleChange} placeholder="Enter number of storeys" className="p-3 border border-black rounded-lg w-full" style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Total Floor Area <span className="text-red-500">*</span></label>
              <input type="number" name="total_floor_area" value={formData.total_floor_area || ""} onChange={handleChange} placeholder="Enter total floor area" className="p-3 border border-black rounded-lg w-full" style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Lot Area <span className="text-red-500">*</span></label>
              <input type="number" name="lot_area" value={formData.lot_area || ""} onChange={handleChange} placeholder="Enter lot area" className="p-3 border border-black rounded-lg w-full" style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Building Cost</label>
              <input type="number" name="building_cost" value={formData.building_cost || ""} onChange={handleChange} placeholder="Enter building cost" className="p-3 border border-black rounded-lg w-full" style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Electrical Cost</label>
              <input type="number" name="electrical_cost" value={formData.electrical_cost || ""} onChange={handleChange} placeholder="Enter electrical cost" className="p-3 border border-black rounded-lg w-full" style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Mechanical Cost</label>
              <input type="number" name="mechanical_cost" value={formData.mechanical_cost || ""} onChange={handleChange} placeholder="Enter mechanical cost" className="p-3 border border-black rounded-lg w-full" style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Electronics Cost</label>
              <input type="number" name="electronics_cost" value={formData.electronics_cost || ""} onChange={handleChange} placeholder="Enter electronics cost" className="p-3 border border-black rounded-lg w-full" style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Plumbing Cost</label>
              <input type="number" name="plumbing_cost" value={formData.plumbing_cost || ""} onChange={handleChange} placeholder="Enter plumbing cost" className="p-3 border border-black rounded-lg w-full" style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Equipment Cost</label>
              <input type="number" name="equipment_cost" value={formData.equipment_cost || ""} onChange={handleChange} placeholder="Enter equipment cost" className="p-3 border border-black rounded-lg w-full" style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Proposed Start Date <span className="text-red-500">*</span></label>
              <input type="date" name="proposed_start" value={formData.proposed_start || ""} onChange={handleChange} className="p-3 border border-black rounded-lg w-full" style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Expected Completion Date <span className="text-red-500">*</span></label>
              <input type="date" name="expected_completion" value={formData.expected_completion || ""} onChange={handleChange} className="p-3 border border-black rounded-lg w-full" style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Other Cost</label>
              <input type="number" name="other_cost" value={formData.other_cost || ""} onChange={handleChange} placeholder="Enter other cost" className="p-3 border border-black rounded-lg w-full" style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
            </div>
          </div>
        </div>
      );

      // ====== Step 5: Other Requirements & Professionals ======
      case 5: return (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>{steps[4].title}</h3>
            <p className="text-sm text-gray-600 mb-4">{steps[4].description}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Professional Title <span className="text-red-500">*</span></label>
              <select
                name="professional_title"
                value={formData.professional_title || ""}
                onChange={handleChange}
                className="w-full p-3 border border-black rounded-lg"
                style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
              >
                <option value="">Select Professional Title</option>
                <option value="Architect">Architect</option>
                <option value="Civil Engineer">Civil Engineer</option>
                <option value="Electronics and Communications Engineering">Electronics and Communications Engineering</option>
                <option value="Electronics Engineer">Electronics Engineer</option>
                <option value="Geodetic Engineer">Geodetic Engineer</option>
                <option value="Interior Designer">Interior Designer</option>
                <option value="Master Electrician">Master Electrician</option>
                <option value="Master Plumber">Master Plumber</option>
                <option value="Mechanical Engineer">Mechanical Engineer</option>
                <option value="Professional Electrical Engineer">Professional Electrical Engineer</option>
                <option value="Professional Electronics Engineer">Professional Electronics Engineer</option>
                <option value="Professional Mechanical Engineer">Professional Mechanical Engineer</option>
                <option value="Registered Electrical Engineer">Registered Electrical Engineer</option>
                <option value="Sanitary Engineer">Sanitary Engineer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Professional Name <span className="text-red-500">*</span></label>
              <input type="text" name="professional_name" value={formData.professional_name || ""} onChange={handleChange} placeholder="Enter Professional Name" className="p-3 border border-black rounded-lg w-full" style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>PRC Number <span className="text-red-500">*</span></label>
              <input type="number" name="prc_no" value={formData.prc_no || ""} onChange={handleChange} placeholder="Enter PRC Number" className="p-3 border border-black rounded-lg w-full" style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>PTR Number <span className="text-red-500">*</span></label>
              <input type="number" name="ptr_no" value={formData.ptr_no || ""} onChange={handleChange} placeholder="Enter PTR Number" className="p-3 border border-black rounded-lg w-full" style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Government ID Number <span className="text-red-500">*</span></label>
              <input type="number" name="gov_id_no" value={formData.gov_id_no || ""} onChange={handleChange} placeholder="Enter Government ID Number" className="p-3 border border-black rounded-lg w-full" style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Date Issued <span className="text-red-500">*</span></label>
              <input type="date" name="date_issued" value={formData.date_issued || ""} onChange={handleChange} className="p-3 border border-black rounded-lg w-full" style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Place Issued <span className="text-red-500">*</span></label>
              <input type="text" name="place_issued" value={formData.place_issued || ""} onChange={handleChange} placeholder="Enter Place Issued" className="p-3 border border-black rounded-lg w-full" style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Remarks</label>
              <input type="text" name="remarks" value={formData.remarks || ""} onChange={handleChange} placeholder="Enter remarks" className="p-3 border border-black rounded-lg w-full" style={{ color: COLORS.secondary, fontFamily: COLORS.font }} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Signature <span className="text-red-500">*</span></label>
              <div className="flex items-center gap-3 p-3 border border-black rounded-lg w-full bg-white">
                <Upload className="w-5 h-5 text-gray-500" />
                <input
                  type="file"
                  name="signature"
                  onChange={handleChange}
                  className="w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                  style={{ color: COLORS.secondary, fontFamily: COLORS.font }}
                />
              </div>
            </div>
          </div>
        </div>
      );

      default: return null;
    }
  };

  return (
    <div className="mx-1 mt-1 p-6 rounded-lg min-h-screen" style={{ background: COLORS.background, color: COLORS.secondary, fontFamily: COLORS.font }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold" style={{ color: COLORS.primary, fontFamily: COLORS.font }}>Building Permit Application</h1>
          <p className="mt-2" style={{ color: COLORS.secondary, fontFamily: COLORS.font }}>Apply for a building permit. Fill out the required details below.</p>
        </div>
        <div className="flex justify-end">
          <button
            onClick={() => navigate('/user/building/type')}
            className="px-4 py-2 rounded-lg font-semibold text-white hover:bg-[#FDA811] transition-colors duration-300"
            style={{ background: COLORS.success, fontFamily: COLORS.font }}
            onMouseEnter={e => e.currentTarget.style.background = COLORS.accent}
            onMouseLeave={e => e.currentTarget.style.background = COLORS.success}
          >
            Change Type
          </button>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-2" style={{
                background: currentStep >= step.id ? COLORS.success : 'transparent',
                borderColor: currentStep >= step.id ? COLORS.success : '#9CA3AF',
                color: currentStep >= step.id ? '#fff' : '#9CA3AF',
                fontFamily: COLORS.font
              }}>{step.id}</div>
              <div className="ml-3 hidden md:block">
                <p className="text-sm font-medium" style={{ color: currentStep >= step.id ? COLORS.success : COLORS.secondary, fontFamily: COLORS.font }}>{step.title}</p>
                <p className="text-xs text-gray-500">{step.description}</p>
              </div>
              {index < steps.length - 1 && <div className="hidden md:block w-16 h-0.5 mx-4" style={{ background: currentStep > step.id ? COLORS.success : '#9CA3AF' }} />}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {renderStepContent()}

        <div className="flex justify-between pt-6">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={prevStep}
              className="px-6 py-3 rounded-lg font-semibold text-white hover:bg-[#FDA811] transition-colors duration-300"
              style={{ background: COLORS.success, fontFamily: COLORS.font }}
              onMouseEnter={e => e.currentTarget.style.background = COLORS.accent}
              onMouseLeave={e => e.currentTarget.style.background = COLORS.success}
            >
              Previous
            </button>
          )}
          {currentStep < steps.length ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-6 py-3 rounded-lg font-semibold text-white hover:bg-[#FDA811] transition-colors duration-300"
              style={{ background: COLORS.success, fontFamily: COLORS.font }}
              onMouseEnter={e => e.currentTarget.style.background = COLORS.accent}
              onMouseLeave={e => e.currentTarget.style.background = COLORS.success}
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-3 rounded-lg font-semibold text-white ${isSubmitting ? 'cursor-not-allowed' : 'hover:bg-[#FDA811] transition-colors duration-300'}`}
              style={{ background: isSubmitting ? '#9CA3AF' : COLORS.success, fontFamily: COLORS.font }}
              onMouseEnter={e => { if (!isSubmitting) e.currentTarget.style.background = COLORS.accent; }}
              onMouseLeave={e => { if (!isSubmitting) e.currentTarget.style.background = COLORS.success; }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}