import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, FileText, AlertCircle } from 'lucide-react';

const COLORS = {
  primary: '#4A90E2',
  secondary: '#000000',
  accent: '#FDA811',
  success: '#4CAF50',
  danger: '#E53935',
  background: '#FBFBFB',
  font: 'Montserrat, Arial, sans-serif'
};

const API_ENDPOINT = "/backend/business_permit/submit_special.php";

export default function BusinessSpecial() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const [formData, setFormData] = useState({
    // Applicant Information
    business_name: '',
    owner_first_name: '',
    owner_last_name: '',
    owner_middle_name: '',
    contact_number: '',
    email_address: '',

    // Special Permit Details
    special_permit_type: '',
    event_description: '',
    event_date_start: '',
    event_date_end: '',
    event_location: '',
    estimated_attendees: '',
    
    // Documents
    event_permit: null,
    barangay_clearance: null,
    valid_id: null
  });

  const specialPermitTypes = [
    'Temporary Event Permit',
    'Seasonal Business Permit',
    'Pop-up Store Permit',
    'Trade Fair / Bazaar Permit',
    'Festival / Concert Permit',
    'Food Cart / Mobile Vendor Permit',
    'Construction Site Permit',
    'Promotional Event Permit',
    'Other Special Permit'
  ];

  const steps = [
    { id: 1, title: 'Applicant Information', description: 'Business owner details' },
    { id: 2, title: 'Event/Special Permit Details', description: 'Specific permit information' },
    { id: 3, title: 'Documents', description: 'Upload required documents' },
  ];

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      setFormData(prev => ({ ...prev, [name]: files[0] || null }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const validateStep = (step) => {
    if (step === 1) {
      return formData.business_name && formData.owner_first_name && 
             formData.owner_last_name && formData.contact_number && formData.email_address;
    }
    if (step === 2) {
      return formData.special_permit_type && formData.event_date_start && 
             formData.event_date_end && formData.event_location;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep) && currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
      setSubmitStatus(null);
    } else {
      setSubmitStatus({ type: 'error', message: 'Please fill in all required fields' });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const formDataToSend = new FormData();
      
      // Append all text fields
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && typeof formData[key] !== 'object') {
          formDataToSend.append(key, formData[key]);
        }
      });
      
      // Append files
      ['event_permit', 'barangay_clearance', 'valid_id'].forEach(fileField => {
        if (formData[fileField] instanceof File) {
          formDataToSend.append(fileField, formData[fileField]);
        }
      });

      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setSubmitStatus({ type: 'success', message: data.message || 'Special permit application submitted successfully!' });
        setTimeout(() => navigate('/user/permittracker'), 2000);
      } else {
        setSubmitStatus({ type: 'error', message: data.message || 'Failed to submit application' });
      }
    } catch (error) {
      console.error('Submission error:', error);
      setSubmitStatus({ type: 'error', message: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-4" style={{ color: COLORS.secondary }}>Applicant Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                  Business Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="business_name"
                  value={formData.business_name}
                  onChange={handleChange}
                  className="w-full p-3 border border-black rounded-lg"
                  placeholder="Enter business name"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                  Owner First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="owner_first_name"
                  value={formData.owner_first_name}
                  onChange={handleChange}
                  className="w-full p-3 border border-black rounded-lg"
                  placeholder="First name"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                  Owner Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="owner_last_name"
                  value={formData.owner_last_name}
                  onChange={handleChange}
                  className="w-full p-3 border border-black rounded-lg"
                  placeholder="Last name"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                  Owner Middle Name
                </label>
                <input
                  type="text"
                  name="owner_middle_name"
                  value={formData.owner_middle_name}
                  onChange={handleChange}
                  className="w-full p-3 border border-black rounded-lg"
                  placeholder="Middle name (optional)"
                />
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="contact_number"
                  value={formData.contact_number}
                  onChange={handleChange}
                  className="w-full p-3 border border-black rounded-lg"
                  placeholder="09XXXXXXXXX"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email_address"
                  value={formData.email_address}
                  onChange={handleChange}
                  className="w-full p-3 border border-black rounded-lg"
                  placeholder="email@example.com"
                  required
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-4" style={{ color: COLORS.secondary }}>Special Permit Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                  Special Permit Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="special_permit_type"
                  value={formData.special_permit_type}
                  onChange={handleChange}
                  className="w-full p-3 border border-black rounded-lg"
                  required
                >
                  <option value="">Select permit type</option>
                  {specialPermitTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                  Event/Activity Description
                </label>
                <textarea
                  name="event_description"
                  value={formData.event_description}
                  onChange={handleChange}
                  className="w-full p-3 border border-black rounded-lg"
                  rows="4"
                  placeholder="Describe the event or activity"
                ></textarea>
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                  Event Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="event_date_start"
                  value={formData.event_date_start}
                  onChange={handleChange}
                  className="w-full p-3 border border-black rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                  Event End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="event_date_end"
                  value={formData.event_date_end}
                  onChange={handleChange}
                  className="w-full p-3 border border-black rounded-lg"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                  Event Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="event_location"
                  value={formData.event_location}
                  onChange={handleChange}
                  className="w-full p-3 border border-black rounded-lg"
                  placeholder="Complete address of event location"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                  Estimated Attendees
                </label>
                <input
                  type="number"
                  name="estimated_attendees"
                  value={formData.estimated_attendees}
                  onChange={handleChange}
                  className="w-full p-3 border border-black rounded-lg"
                  placeholder="Expected number of attendees"
                  min="0"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-4" style={{ color: COLORS.secondary }}>Upload Documents</h3>
            <div className="space-y-4">
              <div className="p-4 border border-gray-300 rounded-lg">
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                  Event Permit (if available)
                </label>
                <input
                  type="file"
                  name="event_permit"
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                {formData.event_permit && (
                  <p className="text-sm text-green-600 mt-2">✓ {formData.event_permit.name}</p>
                )}
              </div>
              <div className="p-4 border border-gray-300 rounded-lg">
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                  Barangay Clearance (if available)
                </label>
                <input
                  type="file"
                  name="barangay_clearance"
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                {formData.barangay_clearance && (
                  <p className="text-sm text-green-600 mt-2">✓ {formData.barangay_clearance.name}</p>
                )}
              </div>
              <div className="p-4 border border-gray-300 rounded-lg">
                <label className="block mb-2 font-medium" style={{ color: COLORS.secondary }}>
                  Valid ID
                </label>
                <input
                  type="file"
                  name="valid_id"
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                {formData.valid_id && (
                  <p className="text-sm text-green-600 mt-2">✓ {formData.valid_id.name}</p>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="mx-1 mt-1 p-6 rounded-lg min-h-screen" style={{ background: COLORS.background, fontFamily: COLORS.font }}>
      <h1 className="text-2xl md:text-4xl font-bold mb-6" style={{ color: COLORS.primary }}>
        Special Business Permit Application
      </h1>

      {submitStatus && (
        <div className={`p-4 mb-6 rounded ${submitStatus.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {submitStatus.message}
        </div>
      )}

      {/* Progress Steps */}
      <div className="mb-8 flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
              currentStep >= step.id ? 'bg-orange-600 border-orange-600 text-white' : 'border-gray-300 text-gray-500'
            }`}>{step.id}</div>
            <div className="ml-3 hidden md:block">
              <p className={`text-sm font-medium ${currentStep >= step.id ? 'text-orange-600' : 'text-gray-500'}`}>
                {step.title}
              </p>
              <p className="text-xs text-gray-500">{step.description}</p>
            </div>
            {index < steps.length - 1 && (
              <div className={`hidden md:block w-16 h-0.5 mx-4 ${currentStep > step.id ? 'bg-orange-600' : 'bg-gray-300'}`} />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {renderStepContent()}

        <div className="flex justify-between pt-6">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={prevStep}
              className="px-6 py-3 rounded-lg font-semibold bg-gray-500 hover:bg-gray-600 text-white"
            >
              Previous
            </button>
          )}

          {currentStep < steps.length ? (
            <button 
              type="button" 
              onClick={nextStep} 
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-semibold ml-auto"
            >
              Next
            </button>
          ) : (
            <button 
              type="submit" 
              disabled={isSubmitting} 
              className={`px-6 py-3 rounded-lg font-semibold ml-auto ${
                isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700 text-white'
              }`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
