import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import ProtectedApp from "./pages/ProtectedApp";
import Dashboard from "./pages/Dashboard";
import OperationsOverview from "./pages/OperationsOverview";
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
import ZoneCapacityPage from "./pages/zones/ZoneCapacityPage";
import ZoneCapacityOverview from "./pages/zones/ZoneCapacityOverview";
import ZoneCapacityDashboard from "./pages/ZoneCapacityDashboard";
import OpsZoneCapacityPage from "./pages/ops/zones/ZoneCapacityPage";
import ZoneDriverBreakdownPage from "./pages/ops/zones/ZoneDriverBreakdownPage";
import LocatedDashboard from "./pages/LocatedDashboard";
import Scheduling from "./pages/admin/Scheduling";
import OperationsMap from "./pages/OperationsMap";
import MapTest from "./pages/MapTest";
import LeafletTest from "./pages/LeafletTest";
import StaticMapTest from "./pages/StaticMapTest";
import Zones from "./pages/admin/Zones";
import ZoneZipCodes from "./pages/admin/ZoneZipCodes";
import Reports from "./pages/admin/Reports";
import ActionItems from "./pages/admin/ActionItems";
import StorageLots from "./pages/admin/StorageLots";
import AlertAutomation from "./pages/admin/AlertAutomation";
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
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />

            {/* Protected Routes */}
            <Route element={<ProtectedApp />}>
              <Route path="/app/dashboard" element={<Dashboard />} />
              <Route path="/app/located" element={<LocatedPage />} />
              <Route path="/app/poc/baltimore" element={<BaltimorePOC />} />
              <Route path="/app/tow-driver" element={<TowDriver />} />
              <Route path="/app/driver/progress" element={<DriverProgress />} />
              <Route path="/app/markets" element={<Markets />} />
              <Route path="/app/fleet" element={<Fleet />} />
              <Route path="/app/owner" element={<Owner />} />
              <Route path="/app/order-confirmation" element={<OrderConfirmation />} />
              <Route path="/app/to-dispatch" element={<ToDispatch />} />
              <Route path="/app/dispatched" element={<Dispatched />} />
              <Route path="/app/stashed" element={<Stashed />} />
              <Route path="/app/blocked" element={<Blocked />} />
              <Route path="/app/spotters" element={<Spotters />} />
              <Route path="/app/spotters/new" element={<NewSpotter />} />
              <Route path="/app/spotters/submissions" element={<SpotterSubmissions />} />
              <Route path="/app/tow-trucks" element={<TowTrucks />} />
              <Route path="/app/admin/fleet" element={<Fleet />} />
              <Route path="/app/admin/users" element={<Users />} />
              <Route path="/app/admin/shifts" element={<Shifts />} />
              <Route path="/app/admin/shift-management" element={<ShiftManagement />} />
              <Route path="/app/manager/zone-capacity" element={<ZoneCapacity />} />
              <Route path="/app/zones/capacity" element={<ZoneCapacityDashboard />} />
              <Route path="/app/zones/capacity/overview" element={<ZoneCapacityOverview />} />
              <Route path="/app/zones/capacity/detailed" element={<ZoneCapacityPage />} />
              <Route path="/app/ops/zones" element={<OpsZoneCapacityPage />} />
              <Route path="/app/ops/zones/:zoneId" element={<ZoneDriverBreakdownPage />} />
              <Route path="/app/located-dashboard" element={<LocatedDashboard />} />
              <Route path="/app/admin/clients" element={<ClientPreferences />} />
              <Route path="/app/admin/scheduling" element={<Scheduling />} />
              <Route path="/app/ops/map" element={<OperationsMap />} />
              <Route path="/app/ops/overview" element={<OperationsOverview />} />
              <Route path="/app/map-test" element={<MapTest />} />
              <Route path="/app/leaflet-test" element={<LeafletTest />} />
              <Route path="/app/static-map-test" element={<StaticMapTest />} />
              <Route path="/app/admin/zones" element={<Zones />} />
              <Route path="/app/admin/zones/zip-codes" element={<ZoneZipCodes />} />
              <Route path="/app/admin/reports" element={<Reports />} />
              <Route path="/app/admin/action-items" element={<ActionItems />} />
              <Route path="/app/admin/storage-lots" element={<StorageLots />} />
              <Route path="/app/admin/alert-automation" element={<AlertAutomation />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
