import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";

export default function RenewalBuilding() {
    const navigate = useNavigate();
  
  const steps = [
    { id: 1, title: 'Previous Permit Details', description: 'Your existing permit information' },
    { id: 2, title: 'Applicant Information', description: 'Personal details' },
    { id: 3, title: 'Updated Building Information', description: 'Changes to building details' },
    { id: 4, title: 'Uploads', description: 'Required documents' }
  ];

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    previous_permit_number: '',
    previous_permit_expiry: '',
  first_name: '',
  middle_initial: '',
  last_name: '',
  suffix: '',
    contact_number: '',
    email: '',
    birth_date: '',
    gender: '',
    civil_status: '',
    nationality: '',
    tin: '',
    sss_no: '',
    philhealth_no: '',
    building_name: '',
    trade_name: '',
    building_structure: '',
    ownership_status: '',
    registration_number: '',
    building_activity: '',
    building_description: '',
    capital_investment: '',
    number_of_employees: '',
    attachments: []
  });
  const [errors, setErrors] = useState({});
  const [submitStatus, setSubmitStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      setFormData((prev) => ({ ...prev, attachments: files }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const nextStep = () => {
    if (currentStep === 2) {
      const e = {};
      if (!formData.first_name || formData.first_name.trim() === '') e.first_name = 'First name is required';
      if (!formData.last_name || formData.last_name.trim() === '') e.last_name = 'Last name is required';
      if (!formData.contact_number || formData.contact_number.trim() === '') e.contact_number = 'Contact number is required';
      if (!formData.birth_date) e.birth_date = 'Birth date is required';
      if (!formData.gender) e.gender = 'Gender is required';
      if (!formData.civil_status) e.civil_status = 'Civil status is required';
      if (!formData.nationality || formData.nationality.trim() === '') e.nationality = 'Nationality is required';
      if (Object.keys(e).length > 0) {
        setErrors(e);
        return;
      }
      setErrors({});
    }

    if (currentStep < steps.length) setCurrentStep(currentStep + 1);
  };
  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setSubmitStatus({ type: 'success', message: 'Renewal submitted successfully!' });
      setIsSubmitting(false);
    }, 1500);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-4">Previous Permit Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-medium">Previous Permit Number *</label>
                <input type="text" name="previous_permit_number" value={formData.previous_permit_number} onChange={handleChange} className="w-full p-3 border rounded-lg" required />
              </div>
              <div>
                <label className="block mb-2 font-medium">Previous Permit Expiry *</label>
                <input type="date" name="previous_permit_expiry" value={formData.previous_permit_expiry} onChange={handleChange} className="w-full p-3 border rounded-lg" required />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-4">Applicant Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <NameFields formData={formData} handleChange={handleChange} errors={errors} required />
              </div>
              <div>
                <label className="block mb-2 font-medium">Contact Number *</label>
                <input type="tel" name="contact_number" value={formData.contact_number} onChange={handleChange} className={`w-full p-3 border rounded-lg ${errors.contact_number ? 'border-red-500' : ''}`} required />
                {errors.contact_number && <p className="text-red-600 text-sm">{errors.contact_number}</p>}
              </div>
              <div>
                <label className="block mb-2 font-medium">Email Address *</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-3 border rounded-lg" required />
              </div>
              <div>
                <label className="block mb-2 font-medium">Birth Date *</label>
                <input type="date" name="birth_date" value={formData.birth_date} onChange={handleChange} className="w-full p-3 border rounded-lg" required />
              </div>
              <div>
                <label className="block mb-2 font-medium">Gender *</label>
                <select name="gender" value={formData.gender} onChange={handleChange} className="w-full p-3 border rounded-lg" required>
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 font-medium">Civil Status *</label>
                <select name="civil_status" value={formData.civil_status} onChange={handleChange} className="w-full p-3 border rounded-lg" required>
                  <option value="">Select Civil Status</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Divorced">Divorced</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 font-medium">Nationality *</label>
                <input type="text" name="nationality" value={formData.nationality} onChange={handleChange} className="w-full p-3 border rounded-lg" required />
              </div>
              <div>
                <label className="block mb-2 font-medium">TIN</label>
                <input type="text" name="tin" value={formData.tin} onChange={handleChange} className="w-full p-3 border rounded-lg" />
              </div>
              <div>
                <label className="block mb-2 font-medium">SSS Number</label>
                <input type="text" name="sss_no" value={formData.sss_no} onChange={handleChange} className="w-full p-3 border rounded-lg" />
              </div>
              <div>
                <label className="block mb-2 font-medium">PhilHealth Number</label>
                <input type="text" name="philhealth_no" value={formData.philhealth_no} onChange={handleChange} className="w-full p-3 border rounded-lg" />
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-4">Updated Building Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-medium">Building Name *</label>
                <input type="text" name="building_name" value={formData.building_name} onChange={handleChange} className="w-full p-3 border rounded-lg" required />
              </div>
              <div>
                <label className="block mb-2 font-medium">Trade Name</label>
                <input type="text" name="trade_name" value={formData.trade_name} onChange={handleChange} className="w-full p-3 border rounded-lg" />
              </div>
              <div>
                <label className="block mb-2 font-medium">Building Structure *</label>
                <select name="building_structure" value={formData.building_structure} onChange={handleChange} className="w-full p-3 border rounded-lg" required>
                  <option value="">Select Structure</option>
                  <option value="Sole Proprietorship">Sole Proprietorship</option>
                  <option value="Partnership">Partnership</option>
                  <option value="Corporation">Corporation</option>
                  <option value="Cooperative">Cooperative</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 font-medium">Ownership Status *</label>
                <select name="ownership_status" value={formData.ownership_status} onChange={handleChange} className="w-full p-3 border rounded-lg" required>
                  <option value="">Select Status</option>
                  <option value="Owned">Owned</option>
                  <option value="Leased">Leased</option>
                  <option value="Rented">Rented</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 font-medium">Registration Number</label>
                <input type="text" name="registration_number" value={formData.registration_number} onChange={handleChange} className="w-full p-3 border rounded-lg" />
              </div>
              <div>
                <label className="block mb-2 font-medium">Building Activity *</label>
                <input type="text" name="building_activity" value={formData.building_activity} onChange={handleChange} className="w-full p-3 border rounded-lg" required />
              </div>
              <div className="md:col-span-2">
                <label className="block mb-2 font-medium">Building Description *</label>
                <textarea name="building_description" value={formData.building_description} onChange={handleChange} rows="3" className="w-full p-3 border rounded-lg" required />
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-4">Uploads</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block mb-2 font-medium">Upload Required Documents *</label>
                <input type="file" name="attachments" onChange={handleChange} className="w-full p-3 border rounded-lg" multiple required />
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="mx-1 mt-1 p-6 rounded-lg min-h-screen" style={{ background: '#fbfbfb', color: '#222' }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold" style={{ color: '#4a90e2' }}>Renewal Building Permit</h1>
          <p className="mt-2" style={{ color: '#9aa5b1' }}>
            Renew your existing building permit here. Please provide your previous permit details and any updated information.
          </p>
        </div>
                         <button
          onClick={() => navigate('/user/building/type')}
          className="px-4 py-2 rounded-lg text-white font-semibold"
          style={{ background: '#4CAF50' }}
        >
          Change Type
        </button>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className="flex items-center justify-center w-10 h-10 rounded-full border-2"
                style={{
                  background: currentStep >= step.id ? '#4a90e2' : '#fff',
                  borderColor: currentStep >= step.id ? '#4a90e2' : '#9aa5b1',
                  color: currentStep >= step.id ? '#fff' : '#9aa5b1',
                }}
              >
                {step.id}
              </div>
              <div className="ml-3 hidden md:block">
                <p className="text-sm font-medium" style={{ color: currentStep >= step.id ? '#4a90e2' : '#9aa5b1' }}>{step.title}</p>
                <p className="text-xs" style={{ color: '#9aa5b1' }}>{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden md:block w-16 h-0.5 mx-4" style={{ background: currentStep > step.id ? '#4a90e2' : '#9aa5b1' }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {submitStatus && (
        <div className="p-4 mb-6 rounded" style={{ background: submitStatus.type === 'success' ? '#e6f9ed' : '#fdecea', color: submitStatus.type === 'success' ? '#4caf50' : '#e53935', border: `1px solid ${submitStatus.type === 'success' ? '#4caf50' : '#e53935'}` }}>
          {submitStatus.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {renderStepContent()}
        <div className="flex justify-between pt-6">
          {currentStep > 1 && (
            <button type="button" onClick={prevStep} className="px-6 py-3 rounded-lg font-semibold" style={{ background: '#9aa5b1', color: '#fff' }}>
              Previous
            </button>
          )}
          {currentStep < steps.length ? (
            <button type="button" onClick={nextStep} className="px-6 py-3 rounded-lg font-semibold" style={{ background: '#4a90e2', color: '#fff' }}>
              Next
            </button>
          ) : (
            <button type="submit" disabled={isSubmitting} className="px-6 py-3 rounded-lg font-semibold" style={{ background: isSubmitting ? '#9aa5b1' : '#4caf50', color: '#fff', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
              {isSubmitting ? 'Submitting...' : 'Submit Renewal'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
