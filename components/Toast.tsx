
import React, { useState, useEffect } from 'react';

interface ToastProps {
  message: string;
  onClose?: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [message]);

  if (!isVisible || !message) return null;

  // Determine styling based on message content keywords
  const lowerMsg = message.toLowerCase();
  const isError = lowerMsg.includes('error') || lowerMsg.includes('failed') || lowerMsg.includes('missing');
  const isLoading = lowerMsg.includes('saving') || lowerMsg.includes('loading') || lowerMsg.includes('syncing') || lowerMsg.includes('processing');
  
  let styles = {
    bg: 'bg-green-50',
    border: 'border-l-4 border-green-500',
    titleColor: 'text-green-800',
    iconColor: 'text-green-500',
    title: 'Success',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
    )
  };

  if (isError) {
    styles = {
      bg: 'bg-red-50',
      border: 'border-l-4 border-red-500',
      titleColor: 'text-red-800',
      iconColor: 'text-red-500',
      title: 'Error',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      )
    };
  } else if (isLoading) {
    styles = {
      bg: 'bg-blue-50',
      border: 'border-l-4 border-blue-500',
      titleColor: 'text-blue-800',
      iconColor: 'text-blue-500',
      title: 'Processing',
      icon: <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
    };
  }

  const handleClose = () => {
      setIsVisible(false);
      if (onClose) onClose();
  };

  return (
    <div className={`fixed top-20 right-4 z-[9999] flex w-full max-w-sm overflow-hidden bg-white rounded-md shadow-xl animate-fade-in ${styles.border}`}>
      <div className={`flex items-center justify-center w-12 ${styles.bg} ${styles.iconColor}`}>
        {styles.icon}
      </div>
      
      <div className="px-4 py-3 -mx-3 w-full">
        <div className="mx-3">
          <span className={`font-semibold ${styles.titleColor}`}>{styles.title}</span>
          <p className="text-sm text-gray-600">{message}</p>
        </div>
      </div>

      <div className="flex items-start p-2">
         <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 focus:outline-none">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
         </button>
      </div>
    </div>
  );
};

export default Toast;
