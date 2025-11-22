import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export const AlertTriangle: React.FC<IconProps> = ({ className = "w-4 h-4", size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="currentColor"
    className={className}
  >
    <path d="M8 1L1 14h14L8 1zM8 5v4m0 2h.01" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <circle cx="8" cy="11" r="1" fill="currentColor" />
  </svg>
);

export const Courthouse: React.FC<IconProps> = ({ className = "w-4 h-4", size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="currentColor"
    className={className}
  >
    <path d="M2 2h12v12H2V2zm2 2v8h8V4H4zm1 1h6v2H5V5zm0 3h6v2H5V8zm0 3h6v2H5v-2z" />
    <path d="M6 1v2M10 1v2" stroke="currentColor" strokeWidth="1" fill="none" />
  </svg>
);

export const VerifiedPin: React.FC<IconProps> = ({ className = "w-4 h-4", size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="currentColor"
    className={className}
  >
    <path d="M8 1a4 4 0 0 0-4 4c0 3 4 7 4 7s4-4 4-7a4 4 0 0 0-4-4zM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
    <path d="M6 10l1.5 1.5L10 9" stroke="currentColor" strokeWidth="1.5" fill="none" />
  </svg>
);

export const Eye: React.FC<IconProps> = ({ className = "w-4 h-4", size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="currentColor"
    className={className}
  >
    <path d="M8 3C4.5 3 1.73 5.11 1 8c.73 2.89 3.5 5 7 5s6.27-2.11 7-5c-.73-2.89-3.5-5-7-5zM8 10a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
  </svg>
);

export const Award: React.FC<IconProps> = ({ className = "w-4 h-4", size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="currentColor"
    className={className}
  >
    <path d="M8 1l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6l2-6z" />
  </svg>
);

export const Payment: React.FC<IconProps> = ({ className = "w-4 h-4", size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="currentColor"
    className={className}
  >
    <path d="M2 3h12v2H2V3zm0 3h12v6H2V6zm1 1v4h10V7H3z" />
    <circle cx="4" cy="9" r="0.5" />
  </svg>
);

export const Camera: React.FC<IconProps> = ({ className = "w-4 h-4", size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="currentColor"
    className={className}
  >
    <path d="M3 4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4zm2 1v6h6V5H5z" />
    <circle cx="8" cy="8" r="1.5" />
    <path d="M6 3h4v2H6V3z" />
  </svg>
);

export const Target: React.FC<IconProps> = ({ className = "w-4 h-4", size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="currentColor"
    className={className}
  >
    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <circle cx="8" cy="8" r="1" fill="currentColor" />
  </svg>
);

export const Settings: React.FC<IconProps> = ({ className = "w-4 h-4", size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="currentColor"
    className={className}
  >
    <path d="M8 1l1.5 3 3.5 1.5-1.5 3 1.5 3-3.5 1.5L8 15l-1.5-3L3 10.5l1.5-3L3 4.5l3.5-1.5L8 1zm0 5a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
  </svg>
);

export const MoreVertical: React.FC<IconProps> = ({ className = "w-4 h-4", size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="currentColor"
    className={className}
  >
    <circle cx="8" cy="3" r="1" />
    <circle cx="8" cy="8" r="1" />
    <circle cx="8" cy="13" r="1" />
  </svg>
);
