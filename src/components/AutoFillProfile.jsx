import React, { useState, useEffect } from "react";
import { Check, X } from "lucide-react";

export default function AutofillProfile({ onClose, onAutofill }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Auto-fetch on component mount
  useEffect(() => {
    handleAutofill();
  }, []);

  const handleAutofill = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch('http://localhost/eplms-main/backend/login/get_profile.php?action=get', {
        method: 'GET',
        credentials: 'include',
      });

      const data = await response.json();
      
      if (data.success && data.data) {
        onAutofill(data.data); // Pass the data to parent
        setSuccess(true);
        
        // Auto-close after 3 seconds
        setTimeout(() => {
          onClose();
        }, 3000);
      } else {
        setError(data.message || 'Failed to fetch profile');
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
      console.error('Error fetching profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm z-50 p-4">
      <div 
        className="p-6 rounded-lg shadow-lg w-full max-w-md border border-gray-200"
        style={{ 
          background: 'white',
          fontFamily: 'Montserrat, Arial, sans-serif',
        }}
      >
        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              Profile Data Loaded Successfully!
            </h3>
            <p className="text-gray-600">
              Your form has been auto-filled with your profile information.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              This modal will close automatically...
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Unable to Auto-fill
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Continue Manually
            </button>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Loading Your Profile...
            </h3>
            <p className="text-gray-600">
              Fetching your information to auto-fill the form.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}