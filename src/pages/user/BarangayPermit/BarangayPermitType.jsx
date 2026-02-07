import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft } from "lucide-react";

const COLORS = {
  primary: '#4A90E2',
  secondary: '#000000',
  accent: '#FDA811',  // hover color
  success: '#4CAF50', // default button color
  danger: '#E53935',
  background: '#FBFBFB',
  font: 'Montserrat, Arial, sans-serif'
};

export default function BarangayPermitType({ barangay_permit_id }) {
  const [selectedType, setSelectedType] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isConfirmBackOpen, setIsConfirmBackOpen] = useState(false); // Back confirmation
  const navigate = useNavigate();

  const application_type = [
    { id: 'BarangayClearance', title: 'Barangay Clearance / Business Permit', description: 'Apply for a new barangay permit' },
  ];

  // Hover handlers for buttons
  const handleMouseEnter = (e) => {
    e.currentTarget.style.backgroundColor = COLORS.accent;
  };
  const handleMouseLeave = (e) => {
    e.currentTarget.style.backgroundColor = COLORS.success;
  };

  const handleTypeSelection = (typeId) => {
    if (!barangay_permit_id && typeId !== 'BarangayClearance') {
      setIsConfirmModalOpen(true);
      return;
    }
    setSelectedType(typeId);
    setIsModalOpen(true);
  };

  const handleContinue = () => {
    setIsModalOpen(false);
    const routeMap = {
      BarangayClearance: '/user/barangay/new',
    };
    navigate(routeMap[selectedType] || '/user/barangay/new', { 
      state: { permitType: selectedType } 
    });
  };

  const handleConfirmYes = () => {
    setIsConfirmModalOpen(false);
    navigate('/user/dashboard/', { state: { permitType: 'BarangayClearance' } });
  };

  const handleConfirmNo = () => {
    setIsConfirmModalOpen(false);
  };

  return (
    <div className="mx-1 mt-1 p-6 dark:bg-slate-900 bg-white dark:text-slate-300 rounded-lg min-h-screen">
      <h1 className="text-2xl md:text-4xl font-bold mb-8 text-center">
        Barangay Permit Types
      </h1>
      <p className="mb-6 text-center">
        Apply for your Barangay Clearance with fast, secure, and direct barangay verification.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full mt-6">
        {application_type.map((type) => (
          <div
            key={type.id}
            onClick={() => handleTypeSelection(type.id)}
            className="cursor-pointer rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-blue-300 hover:bg-blue-100 shadow-lg shadow-blue-200/50 hover:shadow-blue-300/50 flex flex-col justify-between h-full"
          >
            <h2 className="mb-3 text-2xl font-semibold flex items-center justify-between">
              {type.title}
              <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1 motion-reduce:transform-none" />
            </h2>
            <p className="m-0 max-w-[30ch] text-sm opacity-70">{type.description}</p>
          </div>
        ))}
      </div>

      {/* Selection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-2">Selected Permit Type</h3>
            <p className="text-gray-600 dark:text-slate-300 mb-4">
              You have selected:{" "}
              <span className="font-bold text-blue-600">
                {application_type.find(t => t.id === selectedType)?.title}
              </span>
            </p>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
              {application_type.find(t => t.id === selectedType)?.description}
            </p>

            <div className="flex justify-end gap-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleContinue}
                style={{ backgroundColor: COLORS.success, color: '#fff' }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className="font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">No Existing Barangay Permit</h3>
            <p className="text-gray-600 dark:text-slate-300 mb-6">
              You must apply for a NEW Barangay Permit first. Do you want to apply now?
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={handleConfirmNo}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg"
              >
                No
              </button>
              <button
                onClick={handleConfirmYes}
                style={{ backgroundColor: COLORS.success, color: '#fff' }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className="font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back to Dashboard Button */}
      <div className="mt-8 text-center">
        <button
          onClick={() => setIsConfirmBackOpen(true)}
          style={{ backgroundColor: COLORS.success, color: '#fff' }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="inline-flex items-center gap-2 font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>
      </div>

      {/* Confirm Back Modal */}
      {isConfirmBackOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-lg w-full p-8 text-center">
            <h3 className="text-2xl font-semibold mb-6">Are you sure you want to go back?</h3>
            <div className="flex justify-center gap-6">
              <button
                onClick={() => setIsConfirmBackOpen(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => navigate('/user/dashboard')}
                style={{ backgroundColor: COLORS.success, color: '#fff' }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className="font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Yes, Go Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
