import React from 'react';

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    
    <div className="fixed inset-0  bg-opacity-50 flex justify-center items-center z-50 backdrop-blur-sm">
      
     
      <div className="relative">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 font-bold z-10"
        >
          ✕
        </button>
        
        
        {children}
      </div>
    </div>
  );
};

export default Modal;