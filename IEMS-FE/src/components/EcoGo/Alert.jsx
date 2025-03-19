import React, { useState, useEffect } from "react";

const Alert = ({ 
  message, 
  type = "success", 
  duration = 3000, 
  onClose,
  showIcon = true 
}) => {
  const [visible, setVisible] = useState(true);

  // Color schemes based on type
  const colorSchemes = {
    success: {
      bg: "bg-green-100",
      border: "border-green-500",
      text: "text-green-700",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      )
    },
    error: {
      bg: "bg-red-100",
      border: "border-red-500",
      text: "text-red-700",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      )
    },
    warning: {
      bg: "bg-yellow-100",
      border: "border-yellow-500",
      text: "text-yellow-700",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      )
    },
    info: {
      bg: "bg-blue-100",
      border: "border-blue-500",
      text: "text-blue-700",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      )
    }
  };

  const { bg, border, text, icon } = colorSchemes[type] || colorSchemes.info;

  // Auto-dismiss after duration
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!visible) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center p-4 mb-4 border-l-4 ${bg} ${border} rounded-lg`} role="alert">
      {showIcon && <div className={`flex items-center justify-center mr-2 ${text}`}>{icon}</div>}
      <div className={`ml-3 text-sm font-medium ${text}`}>{message}</div>
      <button 
        type="button" 
        className={`ml-auto -mx-1.5 -my-1.5 ${bg} ${text} rounded-lg focus:ring-2 focus:ring-gray-400 p-1.5 hover:bg-gray-200 inline-flex h-8 w-8 items-center justify-center`}
        aria-label="Close"
        onClick={() => {
          setVisible(false);
          if (onClose) onClose();
        }}
      >
        <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
        </svg>
      </button>
    </div>
  );
};

export default Alert;