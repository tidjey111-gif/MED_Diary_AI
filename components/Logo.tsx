import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z"
      stroke="currentColor"
      className="text-slate-300"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path 
        d="M14 2V8H20" 
        stroke="currentColor" 
        className="text-slate-300"
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
    />
    <path 
        d="M12 11V17" 
        stroke="currentColor" 
        className="text-blue-500"
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
    />
    <path 
        d="M9 14H15" 
        stroke="currentColor" 
        className="text-blue-500"
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
    />
  </svg>
);

export default Logo;
