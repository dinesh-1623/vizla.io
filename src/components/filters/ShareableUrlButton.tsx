import React, { useState } from 'react';
import { Link2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useShareableUrl } from '@/lib/hooks/useGlobalFilters';

interface ShareableUrlButtonProps {
  className?: string;
}

export const ShareableUrlButton: React.FC<ShareableUrlButtonProps> = ({ className }) => {
  const [copied, setCopied] = useState(false);
  const shareableUrl = useShareableUrl();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareableUrl);
      setCopied(true);
      
      // Reset after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareableUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-vizla-glass backdrop-blur-md ring-1 ring-vizla-glassBorder',
        'hover:bg-vizla-glassElev focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors',
        'text-sm font-medium text-vizla-text-secondary',
        className
      )}
      aria-label="Copy shareable view URL"
      title="Copy shareable view URL"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-vizla-success" />
          <span>Copied!</span>
        </>
      ) : (
        <>
          <Link2 className="w-4 h-4" />
          <span>Copy shareable view</span>
        </>
      )}
    </button>
  );
};
