import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
export default function OccupancyPermit() {
  const navigate = useNavigate();
  const steps = [
    { id: 1, title: 'Project & Owner Info', description: 'Basic occupancy details' },
    { id: 2, title: 'Professional & Completion', description: 'Supervising professionals and completion certificates' },
    { id: 3, title: 'Ancillary Clearances', description: 'Certificates from specialty engineers' },
    { id: 4, title: 'Supporting Documents', description: 'Uploads and payment info' }
  ];

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    owner_name: '',
    owner_contact: '',
    property_address: '',
    building_permit_number: '',
    architect_name: '',
    civil_engineer_name: '',
    as_built_plans: null,
    logbook: null,
    coc: null,
    electrical_cert: null,
    sanitary_cert: null,
    mechanical_cert: null,
    electronics_cert: null,
    fencing_cert: null,
    excavation_cert: null,
    demolition_cert: null,
    fire_safety_cert: null,
    photographs: null,
    tax_declaration: '',
    real_property_tax: '',
    barangay_clearance: '',
    payment_receipt: '',
    attachments: []
  });
  const [submitStatus, setSubmitStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      setFormData((prev) => ({ ...prev, [name]: files }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const nextStep = () => {
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
      setSubmitStatus({ type: 'success', message: 'Occupancy permit application submitted!' });
      setIsSubmitting(false);
    }, 1500);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-4">Project & Owner Info</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-medium">Owner Name *</label>
                <input type="text" name="owner_name" value={formData.owner_name} onChange={handleChange} className="w-full p-3 border rounded-lg" required />
              </div>
              <div>
                <label className="block mb-2 font-medium">Owner Contact *</label>
                <input type="text" name="owner_contact" value={formData.owner_contact} onChange={handleChange} className="w-full p-3 border rounded-lg" required />
              </div>
              <div>
                <label className="block mb-2 font-medium">Property Address *</label>
                <input type="text" name="property_address" value={formData.property_address} onChange={handleChange} className="w-full p-3 border rounded-lg" required />
              </div>
              <div>
                <label className="block mb-2 font-medium">Building Permit Reference Number *</label>
                <input type="text" name="building_permit_number" value={formData.building_permit_number} onChange={handleChange} className="w-full p-3 border rounded-lg" required />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-4">Professional & Completion</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-medium">Architect Name *</label>
                <input type="text" name="architect_name" value={formData.architect_name} onChange={handleChange} className="w-full p-3 border rounded-lg" required />
              </div>
              <div>
                <label className="block mb-2 font-medium">Civil Engineer Name *</label>
                <input type="text" name="civil_engineer_name" value={formData.civil_engineer_name} onChange={handleChange} className="w-full p-3 border rounded-lg" required />
              </div>
              <div>
                <label className="block mb-2 font-medium">As-built Plans & Specs (PDF) *</label>
                <input type="file" name="as_built_plans" onChange={handleChange} className="w-full p-3 border rounded-lg" accept="application/pdf" required />
              </div>
              <div>
                <label className="block mb-2 font-medium">Logbook of Construction *</label>
                <input type="file" name="logbook" onChange={handleChange} className="w-full p-3 border rounded-lg" required />
              </div>
              <div>
                <label className="block mb-2 font-medium">Certificate of Completion (COC) *</label>
                <input type="file" name="coc" onChange={handleChange} className="w-full p-3 border rounded-lg" required />
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-4">Ancillary Clearances</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-medium">Electrical Completion Certificate *</label>
                <input type="file" name="electrical_cert" onChange={handleChange} className="w-full p-3 border rounded-lg" required />
              </div>
              <div>
                <label className="block mb-2 font-medium">Sanitary / Plumbing Completion Certificate *</label>
                <input type="file" name="sanitary_cert" onChange={handleChange} className="w-full p-3 border rounded-lg" required />
              </div>
              <div>
                <label className="block mb-2 font-medium">Mechanical Completion Certificate *</label>
                <input type="file" name="mechanical_cert" onChange={handleChange} className="w-full p-3 border rounded-lg" required />
              </div>
              <div>
                <label className="block mb-2 font-medium">Electronics Completion Certificate</label>
                <input type="file" name="electronics_cert" onChange={handleChange} className="w-full p-3 border rounded-lg" />
              </div>
              <div>
                <label className="block mb-2 font-medium">Fencing / Excavation / Demolition Compliance</label>
                <input type="file" name="fencing_cert" onChange={handleChange} className="w-full p-3 border rounded-lg" />
                <input type="file" name="excavation_cert" onChange={handleChange} className="w-full p-3 border rounded-lg mt-2" />
                <input type="file" name="demolition_cert" onChange={handleChange} className="w-full p-3 border rounded-lg mt-2" />
              </div>
              <div>
                <label className="block mb-2 font-medium">Fire Safety Inspection Certificate (FSIC) *</label>
                <input type="file" name="fire_safety_cert" onChange={handleChange} className="w-full p-3 border rounded-lg" required />
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-4">Supporting Documents</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-medium">Photographs of Completed Project *</label>
                <input type="file" name="photographs" onChange={handleChange} className="w-full p-3 border rounded-lg" multiple required />
              </div>
              <div>
                <label className="block mb-2 font-medium">Tax Declaration *</label>
                <input type="text" name="tax_declaration" value={formData.tax_declaration} onChange={handleChange} className="w-full p-3 border rounded-lg" required />
              </div>
              <div>
                <label className="block mb-2 font-medium">Real Property Tax Receipt *</label>
                <input type="text" name="real_property_tax" value={formData.real_property_tax} onChange={handleChange} className="w-full p-3 border rounded-lg" required />
              </div>
              <div>
                <label className="block mb-2 font-medium">Barangay Clearance *</label>
                <input type="text" name="barangay_clearance" value={formData.barangay_clearance} onChange={handleChange} className="w-full p-3 border rounded-lg" required />
              </div>
              <div>
                <label className="block mb-2 font-medium">Payment Receipt *</label>
                <input type="text" name="payment_receipt" value={formData.payment_receipt} onChange={handleChange} className="w-full p-3 border rounded-lg" required />
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
          <h1 className="text-2xl md:text-4xl font-bold" style={{ color: '#4a90e2' }}>Occupancy Permit Application</h1>
          <p className="mt-2" style={{ color: '#9aa5b1' }}>
            Grants authorization from the Office of the Building Official (OBO) to use and occupy a completed building or structure. Ensures construction was done in accordance with approved plans, permits, and the National Building Code (PD 1096). Certifies that the building is safe and compliant with all building, fire, sanitation, and zoning regulations.
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
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
