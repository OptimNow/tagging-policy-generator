import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: boolean;
}

export const Input: React.FC<InputProps> = ({ label, className = '', error, ...props }) => {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</label>}
      <input 
        className={`bg-white/5 border ${error ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-chartreuse'} text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-chartreuse transition-all placeholder-gray-500 ${className}`} 
        {...props} 
      />
    </div>
  );
};

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: boolean;
}

export const TextArea: React.FC<TextAreaProps> = ({ label, className = '', error, ...props }) => {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</label>}
      <textarea 
        className={`bg-white/5 border ${error ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-chartreuse'} text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-chartreuse transition-all placeholder-gray-500 min-h-[80px] ${className}`} 
        {...props} 
      />
    </div>
  );
};

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({ label, className = '', ...props }) => {
  return (
    <label className={`flex items-center gap-2 cursor-pointer group ${className}`}>
      <div className="relative flex items-center">
        <input type="checkbox" className="peer sr-only" {...props} />
        <div className="w-5 h-5 border-2 border-gray-500 rounded peer-checked:bg-chartreuse peer-checked:border-chartreuse transition-colors"></div>
        <svg className="absolute w-3 h-3 text-charcoal pointer-events-none opacity-0 peer-checked:opacity-100 left-1 top-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <span className="text-sm text-gray-300 group-hover:text-white transition-colors select-none">{label}</span>
    </label>
  );
};