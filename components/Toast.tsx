
import React from 'react';

interface ToastProps {
  message: string;
  onClose?: () => void;
}

const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  // Determine styling based on message content keywords
  const lowerMsg = message.toLowerCase();
  const isError = lowerMsg.includes('error') || lowerMsg.includes('failed') || lowerMsg.includes('missing');
  const isLoading = lowerMsg.includes('saving') || lowerMsg.includes('loading') || lowerMsg.includes('syncing') || lowerMsg.includes('processing');
  
  let bgColor = 'bg-green-50';
  let borderColor = 'border-green-200';
  let textColor = 'text-green-800';
  let icon = <span className="text-xl">✅</span>;

  if (isError) {
    bgColor = 'bg-red-50';
    borderColor = 'border-red-200';
    textColor = 'text-red-800';
    icon = <span className="text-xl">⚠️</span>;
  } else if (isLoading) {
    bgColor = 'bg-blue-50';
    borderColor = 'border-blue-200';
    textColor = 'text-blue-800';
    icon = <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>;
  }

  return (
    <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[9999] pointer-events-none animate-fade-in">
      <div className={`flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl border ${bgColor} ${borderColor} ${textColor} backdrop-blur-sm bg-opacity-95`}>
        {icon}
        <span className="font-bold text-sm whitespace-nowrap">{message}</span>
      </div>
    </div>
  );
};

export default Toast;
