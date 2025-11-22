import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  /**
   * Size variant of the logo
   * @default 'default'
   */
  size?: 'sm' | 'default' | 'lg';
  /**
   * Whether the logo should link to home page
   * @default true
   */
  linkToHome?: boolean;
  /**
   * Custom className for additional styling
   */
  className?: string;
  /**
   * Whether to show text alongside the logo
   * @default false
   */
  showText?: boolean;
}

const sizeVariants = {
  sm: {
    image: 'h-8 w-8',
    container: 'h-8',
    text: 'text-lg'
  },
  default: {
    image: 'h-10 w-10',
    container: 'h-10',
    text: 'text-xl'
  },
  lg: {
    image: 'h-12 w-12',
    container: 'h-12',
    text: 'text-2xl'
  }
};

/**
 * Professional Logo Component
 * 
 * A reusable logo component with proper accessibility, responsive sizing,
 * and theme support. Automatically handles routing and provides smooth transitions.
 */
export const Logo: React.FC<LogoProps> = ({
  size = 'default',
  linkToHome = true,
  className = '',
  showText = false
}) => {
  const variants = sizeVariants[size];
  const [imageError, setImageError] = useState(false);
  
  const logoContent = (
    <div 
      className={`
        flex items-center gap-3 transition-opacity duration-200
        ${linkToHome ? 'hover:opacity-80' : ''}
        ${className}
      `}
      role={linkToHome ? 'link' : 'img'}
      aria-label="Vizla Logo"
    >
      {!imageError ? (
        <img
          src="/images/cars/PHOTO-2025-10-21-16-47-49.jpg"
          alt="Vizla Logo"
          className={`
            ${variants.image}
            object-contain rounded-lg
            transition-transform duration-200
            ${linkToHome ? 'hover:scale-105' : ''}
            filter drop-shadow-sm
          `}
          loading="eager"
          width={size === 'sm' ? 32 : size === 'lg' ? 48 : 40}
          height={size === 'sm' ? 32 : size === 'lg' ? 48 : 40}
          onError={() => setImageError(true)}
        />
      ) : (
        <div 
          className={`
            ${variants.image}
            rounded-lg bg-vizla-glass border border-vizla-glassBorder
            flex items-center justify-center
            font-bold text-vizla-text-primary text-xs
          `}
          aria-label="Vizla Logo (fallback)"
        >
          V
        </div>
      )}
      {showText && (
        <span className={`font-bold text-vizla-text-primary ${variants.text}`}>
          Vizla
        </span>
      )}
    </div>
  );

  if (linkToHome) {
    return (
      <Link
        to="/"
        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vizla-ring-focus focus-visible:ring-offset-2 rounded-lg"
        aria-label="Navigate to home page"
      >
        {logoContent}
      </Link>
    );
  }

  return logoContent;
};

export default Logo;

