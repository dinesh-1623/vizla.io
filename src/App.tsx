import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import TowDriver from "./pages/TowDriver";
import DriverProgress from "./pages/DriverProgress";
import Markets from "./pages/Markets";
import Owner from "./pages/Owner";
import OrderConfirmation from "./pages/OrderConfirmation";
import ToDispatch from "./pages/ToDispatch";
import Dispatched from "./pages/Dispatched";
import Stashed from "./pages/Stashed";
import Spotters from "./pages/Spotters";
import TowTrucks from "./pages/TowTrucks";
import Fleet from "./pages/admin/Fleet";
import Users from "./pages/admin/Users";
import Shifts from "./pages/admin/Shifts";
import ClientPrefs from "./pages/admin/ClientPrefs";
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
          <Route path="/owner" element={<Owner />} />
          <Route path="/order-confirmation" element={<OrderConfirmation />} />
          <Route path="/to-dispatch" element={<ToDispatch />} />
          <Route path="/dispatched" element={<Dispatched />} />
          <Route path="/stashed" element={<Stashed />} />
          <Route path="/spotters" element={<Spotters />} />
          <Route path="/tow-trucks" element={<TowTrucks />} />
          <Route path="/admin/fleet" element={<Fleet />} />
          <Route path="/admin/users" element={<Users />} />
          <Route path="/admin/shifts" element={<Shifts />} />
          <Route path="/admin/client-prefs" element={<ClientPrefs />} />
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
);

export default App;
