// src/components/ui/PhoneInputField.jsx
import React from 'react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { GlobeAltIcon } from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/24/solid';

const PhoneInputField = ({
  value,
  onChange,
  label = "Téléphone",
  error,
  disabled = false,
  defaultCountry = "CI", // Côte d'Ivoire
  placeholder = "Entrez le numéro de téléphone",
}) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300 flex items-center gap-2">
        <GlobeAltIcon className="w-5 h-5 text-gray-400" />
        {label}
      </label>

      <div className="relative">
        <PhoneInput
          international
          countryCallingCodeEditable={false}
          defaultCountry={defaultCountry}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          className={`phone-input-custom ${error ? 'error' : ''} ${disabled ? 'disabled' : ''}`}
          // Style personnalisé pour coller à ton design sombre
          style={{
            '--PhoneInput-color--focus': '#10b981', // emerald-500
          }}
        />

        {/* Style CSS personnalisé pour matcher ton thème sombre */}
        <style jsx>{`
          .phone-input-custom {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid ${error ? '#ef4444' : 'rgba(255,255,255,0.2)'};
            transition: all 0.2s;
          }
          .phone-input-custom:hover {
            border-color: ${error ? '#ef4444' : 'rgba(16, 185, 129, 0.5)'};
          }
          .phone-input-custom:focus-within {
            border-color: #10b981;
            box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
          }
          .PhoneInputInput {
            background: transparent;
            color: #e5e7eb;
            border: none;
            outline: none;
            padding: 12px 8px;
            font-size: 1rem;
          }
          .PhoneInputCountry {
            background: rgba(255, 255, 255, 0.15);
            border-radius: 8px;
            margin: 4px;
          }
          .PhoneInputCountrySelectArrow {
            border-color: #9ca3af transparent transparent;
          }
          .disabled {
            opacity: 0.6;
            pointer-events: none;
          }
          .error {
            animation: shake 0.3s;
          }
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
          }
        `}</style>
      </div>

      {error && (
        <p className="mt-1 text-xs text-red-300 flex items-center gap-1">
          <XMarkIcon className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  );
};

export default PhoneInputField;