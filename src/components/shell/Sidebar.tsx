import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { useVehicleCounts } from '@/hooks/useVehicleCounts';
import { Logo } from '@/components/ui/Logo';

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

  // Get real vehicle counts from unified data source
  const { data: counts } = useVehicleCounts();
  
  // Use counts from hook, fallback to 0 if loading
  const badgeCounts = {
    orderConfirmation: counts?.orderConfirmation || 0,
    toDispatch: counts?.toDispatch || 0,
    dispatched: counts?.dispatched || 0,
    stashed: counts?.stashed || 0,
    blocked: counts?.blocked || 0,
  };

  const NAV_SECTIONS: NavSection[] = [
    {
      title: "Operations",
      items: [
        { label: "Operations Overview", href: "/app/ops/overview" },
        { label: "Dashboard", href: "/app/dashboard" },
        { label: "Map", href: "/app/ops/map" },
        { label: "Zone Capacity", href: "/app/ops/zones" },
        { label: "Located Dashboard", href: "/app/located-dashboard" },
        { label: "Order Confirmation", href: "/app/order-confirmation", badge: badgeCounts.orderConfirmation },
        { label: "To Dispatch", href: "/app/to-dispatch", badge: badgeCounts.toDispatch },
        { label: "Dispatched", href: "/app/dispatched", badge: badgeCounts.dispatched },
        { label: "Stashed", href: "/app/stashed", badge: badgeCounts.stashed },
        { label: "Blocked", href: "/app/blocked", badge: badgeCounts.blocked }
      ]
    },
    {
      title: "Management",
      items: [
        { label: "Zone Capacity Dashboard", href: "/app/zones/capacity" }
      ]
    },
    {
      title: "People",
      items: [
        { label: "Tow Trucks", href: "/app/tow-trucks" },
        { label: "Tow Driver View", href: "/app/tow-driver" },
        { label: "Driver Progress", href: "/app/driver/progress" }
      ]
    },
    {
      title: "Fleet",
      items: [
        { label: "Fleet Management", href: "/app/fleet" },
        { label: "Spotters", href: "/app/spotters/new" }
      ]
    },
    {
      title: "Admin",
      items: [
        { label: "Users", href: "/app/admin/users" },
        { label: "Markets", href: "/app/markets" },
        { label: "Shift Management", href: "/app/admin/shift-management" },
        { label: "Client Preferences", href: "/app/admin/clients" },
        { label: "Scheduling", href: "/app/admin/scheduling" },
        { label: "Zones", href: "/app/admin/zones" },
        { label: "Zone Zip Codes", href: "/app/admin/zones/zip-codes" },
        { label: "Reports", href: "/app/admin/reports" },
        { label: "Action Items", href: "/app/admin/action-items" },
        { label: "Storage Lots", href: "/app/admin/storage-lots" },
        { label: "Alert Automation", href: "/app/admin/alert-automation" }
      ]
    }
  ];

  const isActive = (href: string) => {
    if (href === '/app/dashboard') {
      return pathname === '/app/dashboard';
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
          <Logo size="default" linkToHome={true} showText={true} />
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-lg hover:bg-vizla-glassElev focus-visible:ring-2 focus-visible:ring-vizla-ring-focus transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav aria-label="Primary" className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30">
          <div className="space-y-4">
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
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
