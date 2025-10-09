import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";
import Dashboard from "./pages/Dashboard";
import TowDriver from "./pages/TowDriver";
import DriverProgress from "./pages/DriverProgress";
import Markets from "./pages/Markets";
import Fleet from "./pages/Fleet";
import Owner from "./pages/Owner";
import OrderConfirmation from "./pages/OrderConfirmation";
import ToDispatch from "./pages/ToDispatch";
import Dispatched from "./pages/Dispatched";
import Stashed from "./pages/Stashed";
import Blocked from "./pages/Blocked";
import Spotters from "./pages/Spotters";
import NewSpotter from "./pages/spotters/NewSpotter";
import SpotterSubmissions from "./pages/spotters/Submissions";
import TowTrucks from "./pages/TowTrucks";
import Users from "./pages/admin/Users";
import Shifts from "./pages/admin/Shifts";
import ShiftManagement from "./pages/admin/ShiftManagement";
import ClientPreferences from "./pages/admin/ClientPreferences";
import ZoneCapacity from "./pages/manager/ZoneCapacity";
import Scheduling from "./pages/admin/Scheduling";
import Zones from "./pages/admin/Zones";
import Reports from "./pages/admin/Reports";
import ActionItems from "./pages/admin/ActionItems";
import StorageLots from "./pages/admin/StorageLots";
import LocatedPage from "./app/located/page";
import BaltimorePOC from "./app/poc/baltimore/page";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/located" element={<LocatedPage />} />
            <Route path="/poc/baltimore" element={<BaltimorePOC />} />
            <Route path="/tow-driver" element={<TowDriver />} />
            <Route path="/driver/progress" element={<DriverProgress />} />
            <Route path="/markets" element={<Markets />} />
            <Route path="/fleet" element={<Fleet />} />
            <Route path="/owner" element={<Owner />} />
            <Route path="/order-confirmation" element={<OrderConfirmation />} />
            <Route path="/to-dispatch" element={<ToDispatch />} />
            <Route path="/dispatched" element={<Dispatched />} />
            <Route path="/stashed" element={<Stashed />} />
            <Route path="/blocked" element={<Blocked />} />
            <Route path="/spotters" element={<Spotters />} />
            <Route path="/spotters/new" element={<NewSpotter />} />
            <Route path="/spotters/submissions" element={<SpotterSubmissions />} />
            <Route path="/tow-trucks" element={<TowTrucks />} />
            <Route path="/admin/fleet" element={<Fleet />} />
            <Route path="/admin/users" element={<Users />} />
            <Route path="/admin/shifts" element={<Shifts />} />
            <Route path="/admin/shift-management" element={<ShiftManagement />} />
            <Route path="/manager/zone-capacity" element={<ZoneCapacity />} />
            <Route path="/admin/clients" element={<ClientPreferences />} />
            <Route path="/admin/scheduling" element={<Scheduling />} />
            <Route path="/admin/zones" element={<Zones />} />
            <Route path="/admin/reports" element={<Reports />} />
            <Route path="/admin/action-items" element={<ActionItems />} />
            <Route path="/admin/storage-lots" element={<StorageLots />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
