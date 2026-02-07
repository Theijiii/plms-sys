import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function BusinessSpecial() {
  const location = useLocation();
  const navigate = useNavigate();
  const application_type = location.state?.application_type || 'RENEWAL';

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const [formData, setFormData] = useState({
    // Step 1: Renewal Info
    application_type: application_type,
    application_date: new Date().toISOString().split('T')[0],
    permit_number: '',
    permit_expiry: '',

    // Step 2: Applicant Info
    first_name: '',
    last_name: '',
    middle_name: '',
    suffix: '',
    contact_no: '',
    email: '',

    // Step 3: Business Info
    business_name: '',
    trade_name: '',
    capital_investment: '',
    total_employees: '',
  });

  const steps = [
    { id: 1, title: 'Renewal Information', description: 'Existing permit details' },
    { id: 2, title: 'Applicant Information', description: 'Personal details' },
    { id: 3, title: 'Business Information', description: 'Updated business info' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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

    try {
      const response = await fetch('/user/renewal-form/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        setSubmitStatus({ type: 'success', message: 'Renewal submitted successfully!' });
        setTimeout(() => navigate('/user/dashboard'), 2000);
      } else {
        setSubmitStatus({ type: 'error', message: data.message });
      }
    } catch (error) {
      setSubmitStatus({ type: 'error', message: 'Failed to submit renewal' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatLabel = (field) => {
    // Convert underscores to spaces and capitalize first letter of each word
    return field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-4">Renewal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-medium">Permit Number *</label>
                <input
                  type="text"
                  name="permit_number"
                  value={formData.permit_number}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 font-medium">Permit Expiry *</label>
                <input
                  type="date"
                  name="permit_expiry"
                  value={formData.permit_expiry}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 font-medium">Application Date</label>
                <input
                  type="date"
                  name="application_date"
                  value={formData.application_date}
                  readOnly
                  className="w-full p-3 border rounded-lg bg-gray-100"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-4">Applicant Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['first_name','middle_name','last_name','suffix','contact_no','email'].map(field => (
                <div key={field}>
                  <label className="block mb-2 font-medium">{formatLabel(field)} *</label>
                  <input
                    type={field === 'email' ? 'email' : 'text'}
                    name={field}
                    value={formData[field]}
                    onChange={handleChange}
                    className="w-full p-3 border rounded-lg"
                    required
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-4">Business Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['business_name','trade_name','capital_investment','total_employees'].map(field => (
                <div key={field}>
                  <label className="block mb-2 font-medium">{formatLabel(field)}</label>
                  <input
                    type={field.includes('capital') || field.includes('employees') ? 'number' : 'text'}
                    name={field}
                    value={formData[field]}
                    onChange={handleChange}
                    className="w-full p-3 border rounded-lg"
                  />
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="mx-1 mt-1 p-6 dark:bg-slate-900 bg-white dark:text-slate-300 rounded-lg min-h-screen">
      <h1 className="text-2xl md:text-4xl font-bold mb-6">Business Renewal Application</h1>

      {submitStatus && (
        <div className={`p-4 mb-6 rounded ${submitStatus.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {submitStatus.message}
        </div>
      )}

      {/* Progress Steps */}
      <div className="mb-8 flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${currentStep >= step.id ? 'bg-orange-600 border-orange-600 text-white' : 'border-gray-300 text-gray-500'}`}>{step.id}</div>
            <div className="ml-3 hidden md:block">
              <p className={`text-sm font-medium ${currentStep >= step.id ? 'text-orange-600' : 'text-gray-500'}`}>{step.title}</p>
              <p className="text-xs text-gray-500">{step.description}</p>
            </div>
            {index < steps.length - 1 && <div className={`hidden md:block w-16 h-0.5 mx-4 ${currentStep > step.id ? 'bg-orange-600' : 'bg-gray-300'}`} />}
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
            <button type="button" onClick={nextStep} className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-semibold">Next</button>
          ) : (
            <button type="submit" disabled={isSubmitting} className={`px-6 py-3 rounded-lg font-semibold ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700 text-white'}`}>
              {isSubmitting ? 'Submitting...' : 'Submit Renewal'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
