import React from 'react';

const Button = ({ children, onClick, className = '', type = 'button', disabled = false }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`px-4 py-2 rounded ${className} ${disabled ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;