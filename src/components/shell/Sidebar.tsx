import React, { useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { getCounts, getOrderConfirmationCount, getAssignmentVersion } from '@/lib/mockState';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavItem {
  label: string;
  href: string;
  badge?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const location = useLocation();
  const pathname = location.pathname;

  // Memoize badge counts that depend on ASSIGNMENTS
  // This ensures badges update automatically when ASSIGNMENTS is mutated via UI
  const badgeCounts = useMemo(() => {
    const counts = getCounts();
    const orderConfirmationCount = getOrderConfirmationCount();
    
    return {
      orderConfirmation: orderConfirmationCount,
      toDispatch: counts.toDispatch,
      dispatched: counts.dispatched,
      stashed: counts.stashed
    };
  }, [getAssignmentVersion()]); // Re-compute when assignments are updated

  const NAV_SECTIONS: NavSection[] = [
    {
      title: "Operations",
      items: [
        { label: "Dashboard", href: "/" },
        { label: "Order Confirmation", href: "/order-confirmation", badge: badgeCounts.orderConfirmation },
        { label: "To Dispatch", href: "/to-dispatch", badge: badgeCounts.toDispatch },
        { label: "Dispatched", href: "/dispatched", badge: badgeCounts.dispatched },
        { label: "Stashed", href: "/stashed", badge: badgeCounts.stashed }
      ]
    },
    {
      title: "People",
      items: [
        { label: "Spotters", href: "/spotters" },
        { label: "Tow Trucks", href: "/tow-trucks" },
        { label: "Driver Progress", href: "/driver/progress" }
      ]
    },
    {
      title: "Admin",
      items: [
        { label: "Fleet", href: "/admin/fleet" },
        { label: "Users", href: "/admin/users" },
        { label: "Shifts", href: "/admin/shifts" },
        { label: "Client Prefs", href: "/admin/client-prefs" },
        { label: "Scheduling", href: "/admin/scheduling" },
        { label: "Zones", href: "/admin/zones" },
        { label: "Reports", href: "/admin/reports" },
        { label: "Action Items", href: "/admin/action-items" },
        { label: "Storage Lots", href: "/admin/storage-lots" }
      ]
    }
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <aside 
      className={`
        fixed inset-y-0 left-0 z-[60] w-72 bg-vizla-elev1/95 backdrop-blur-md ring-1 ring-vizla-glassBorder text-vizla-text-secondary
        lg:static lg:z-auto lg:rounded-r-2xl lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        transition-transform duration-300 ease-in-out
      `}
      role="dialog"
      aria-modal={isOpen}
    >
      <div className="h-screen pt-16 px-4 pb-4 flex flex-col">
        {/* Brand row */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-xl font-bold text-vizla-text-primary">Vizla Console</h1>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-lg hover:bg-vizla-glassElev focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav aria-label="Primary" className="flex-1">
          {NAV_SECTIONS.map((section, sectionIndex) => (
            <div key={section.title}>
              {sectionIndex > 0 && (
                <div className="my-2 border-t border-white/10" />
              )}
              <h2 className="text-xs font-medium text-vizla-text-muted px-1 mt-3 mb-1 uppercase tracking-wider">
                {section.title}
              </h2>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`
                      flex items-center justify-between rounded-xl px-3 py-2 transition-colors
                      hover:bg-vizla-glassElev focus-visible:ring-2 focus-visible:ring-vizla-ring-focus
                      ${isActive(item.href) 
                        ? 'bg-vizla-glassElev text-vizla-text-primary ring-1 ring-vizla-glassBorder' 
                        : 'text-vizla-text-secondary'
                      }
                    `}
                  >
                    <span className="text-sm font-medium">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="min-w-[1.25rem] h-5 inline-flex items-center justify-center rounded-full bg-vizla-brand-primary/20 text-vizla-brand-primary text-[11px] px-1.5">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
