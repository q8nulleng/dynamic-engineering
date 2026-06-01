import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { EmployeeProvider } from "./hooks/useEmployee";
import Dashboard from "./pages/Dashboard";
import CRM from "./pages/CRM";
import Quotations from "./pages/Quotations";
import Projects from "./pages/Projects";
import Tasks from "./pages/Tasks";
import Documents from "./pages/Documents";
import Payments from "./pages/Payments";
import ClientPortal from "./pages/ClientPortal";
import Reports from "./pages/Reports";
import Contracts from "./pages/Contracts";
import ProjectDetail from "./pages/ProjectDetail";
import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import Appointments from "./pages/Appointments";
import WorkPlans from "./pages/WorkPlans";
import ClientDocuments from "./pages/ClientDocuments";
import EmployeeLogin from "./pages/EmployeeLogin";
import EmployeesAdmin from "./pages/EmployeesAdmin";
import DashboardLayout from "./components/DashboardLayout";

function Router() {
  return (
    <Switch>
      <Route path="/employee-login" component={EmployeeLogin} />
      <Route path="/" component={Dashboard} />
      <Route path="/crm" component={CRM} />
      <Route path="/quotations" component={Quotations} />
      <Route path="/projects" component={Projects} />
      <Route path="/projects/:id" component={ProjectDetail} />
      <Route path="/clients" component={Clients} />
      <Route path="/clients/:id" component={ClientDetail} />
      <Route path="/tasks" component={Tasks} />
      <Route path="/documents" component={Documents} />
      <Route path="/documents/:clientId" component={ClientDocuments} />
      <Route path="/payments" component={Payments} />
      <Route path="/client-portal" component={ClientPortal} />
      <Route path="/reports" component={Reports} />
      <Route path="/contracts" component={Contracts} />
      <Route path="/appointments" component={Appointments} />
      <Route path="/work-plans" component={WorkPlans} />
      <Route path="/employees" component={EmployeesAdmin} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  return (
    <Switch>
      {/* صفحة تسجيل دخول الموظفين بدون DashboardLayout */}
      <Route path="/employee-login" component={EmployeeLogin} />
      {/* باقي الصفحات مع DashboardLayout */}
      <Route>
        <DashboardLayout>
          <Router />
        </DashboardLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable={true}>
        <EmployeeProvider>
          <TooltipProvider>
            <Toaster position="bottom-center" richColors duration={4000} />
            <AppContent />
          </TooltipProvider>
        </EmployeeProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
export default App;
