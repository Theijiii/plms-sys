import React from 'react';

export default function NameFields({ formData, handleChange, errors = {}, required = true }) {
  return (
    <div>
      <label className="block mb-2 font-medium">Name {required ? '*' : ''}</label>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <input
          type="text"
          name="first_name"
          value={formData.first_name || ''}
          onChange={handleChange}
          placeholder="First Name"
          className={`w-full p-3 border rounded-lg ${errors.first_name ? 'border-red-500' : ''}`}
        />
        <input
          type="text"
          name="middle_initial"
          value={formData.middle_initial || ''}
          onChange={handleChange}
          placeholder="MI"
          className="w-full p-3 border rounded-lg"
          maxLength={2}
        />
        <input
          type="text"
          name="last_name"
          value={formData.last_name || ''}
          onChange={handleChange}
          placeholder="Last Name"
          className={`w-full p-3 border rounded-lg ${errors.last_name ? 'border-red-500' : ''}`}
        />
        <input
          type="text"
          name="suffix"
          value={formData.suffix || ''}
          onChange={handleChange}
          placeholder="Suffix"
          className="w-full p-3 border rounded-lg"
        />
      </div>
      {errors.first_name && <p className="text-red-600 text-sm">{errors.first_name}</p>}
      {errors.last_name && <p className="text-red-600 text-sm">{errors.last_name}</p>}
    </div>
  );
}
