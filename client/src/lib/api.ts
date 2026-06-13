// Central API client + React Query hooks

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

// ── Types (mirrored from server schema) ───────────────────────────────────

export interface Client {
  id: string;
  name: string;
  phone: string;
  phone2: string;
  civilId: string;
  email: string;
  type: "individual" | "company" | "heirs";
  governorate: string;
  area: string;
  block: string;
  plot: string;
  parcelArea: number;
  parcelShape: string;
  parcelFacing: string;
  ownershipDoc: string;
  ownershipDate: string;
  spouseName: string;
  spouseCivilId: string;
  status: "active" | "completed" | "pending";
  rating: number;
  notes: string;
  createdAt: string;
  projectType: string;
  serviceType: string;
  leadId: string;
  totalContractsValue: number;
  totalPaid: number;
  totalRemaining: number;
  projectSummary?: string;
}

export interface TaskData {
  id: number;
  phaseId: number;
  name: string;
  status: "done" | "in_progress" | "blocked" | "pending" | "waiting_client" | "cancelled";
  assignee: string;
  description: string;
  priority: number;
  deadline: string;
  order: number;
  dependsOn?: number;
  estimatedDays?: number;
  autoCreated?: number;
}

export interface PhaseData {
  id: number;
  projectId: string;
  order: number;
  title: string;
  subtitle: string;
  tasks: TaskData[];
}

export interface Project {
  id: string;
  name: string;
  clientId: string | null;
  client: string;
  type: string;
  serviceType: string;
  area: string;
  quotation: string;
  progress: number;
  currentPhase: number;
  createdAt: string;
  contractId: string;
  leadId: string;
  status: string;
  phases?: PhaseData[];
}

export interface Quotation {
  id: string;
  clientId: string | null;
  client: string;
  type: string;
  service: string;
  package: string;
  amount: string;
  status: string;
  date: string;
  civilId: string;
  governorate: string;
  area: string;
  landArea: string;
  block: string;
  suburb: string;
  plot: string;
  surveyPlan: string;
  projectId: string | null;
  leadId: string;
  validityDays: number;
  expiryDate: string;
}

export interface Contract {
  id: string;
  quotationId: string | null;
  projectId: string | null;
  clientId: string | null;
  client: string;
  template: string;
  type: string;
  service: string;
  package: string;
  status: string;
  date: string;
  amount: string;
  civilId: string;
  area: string;
  block: string;
  plot: string;
  leadId: string;
  templateType: string;
  termsText: string;
  signingDate: string;
  signedFileUrl: string;
}

export interface InvoiceLine {
  id: number;
  invoiceId: string;
  product: string;
  description: string;
  quantity: number;
  price: number;
  taxPercent: number;
  total: number;
}

export interface Invoice {
  id: string;
  projectId: string | null;
  clientId: string | null;
  client: string;
  project: string;
  status: string;
  date: string;
  dueDate: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes: string;
  contractId: string;
  paymentType: string;
  paymentMethod: string;
  invoiceNumber: string;
  lines: InvoiceLine[];
}

// ── Clients ───────────────────────────────────────────────────────────────

export function useClients() {
  return useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: () => request("/api/clients"),
  });
}

export function useClient(id: string) {
  return useQuery<Client>({
    queryKey: ["clients", id],
    queryFn: () => request(`/api/clients/${id}`),
    enabled: !!id,
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Client>) => request<Client>("/api/clients", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Client> & { id: string }) =>
      request<Client>(`/api/clients/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["clients", vars.id] });
    },
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => request(`/api/clients/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
}

// ── Projects ──────────────────────────────────────────────────────────────

export function useProjects() {
  return useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: () => request("/api/projects"),
  });
}

export function useProject(id: string) {
  return useQuery<Project>({
    queryKey: ["projects", id],
    queryFn: () => request(`/api/projects/${id}`),
    enabled: !!id,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Partial<Project>, "phases"> & { phases?: unknown[] }) =>
      request<Project>("/api/projects", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Project> & { id: string }) =>
      request<Project>(`/api/projects/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["projects", vars.id] });
    },
  });
}

// ── Tasks ─────────────────────────────────────────────────────────────────

export function useUpdateTask(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<TaskData> & { id: number }) =>
      request<TaskData>(`/api/tasks/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects", projectId] });
      qc.invalidateQueries({ queryKey: ["tasks", "all"] });
    },
  });
}

export function useUpdateTaskStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      request<TaskData>(`/api/tasks/${id}`, { method: "PUT", body: JSON.stringify({ status }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks", "all"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useAutoCreateTasks(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => request<{ created: number; taskIds: number[] }>(`/api/projects/${projectId}/auto-tasks`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects", projectId] });
      qc.invalidateQueries({ queryKey: ["tasks", "all"] });
    },
  });
}

// ── Quotations ────────────────────────────────────────────────────────────

export function useQuotations() {
  return useQuery<Quotation[]>({
    queryKey: ["quotations"],
    queryFn: () => request("/api/quotations"),
  });
}

export function useCreateQuotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Quotation>) =>
      request<Quotation>("/api/quotations", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["quotations"] }),
  });
}

export function useUpdateQuotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Quotation> & { id: string }) =>
      request<Quotation>(`/api/quotations/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => {
      // إبطال جميع queries المرتبطة بالعروض (بما فيها sub-queries بـ leadId)
      qc.invalidateQueries({ queryKey: ["quotations"], exact: false });
    },
  });
}

export function useDeleteQuotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => request<{ success: boolean }>(`/api/quotations/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["quotations"] }),
  });
}
export function useQuotationsByLead(leadId: string | undefined) {
  return useQuery<Quotation[]>({
    queryKey: ["quotations", { leadId }],
    queryFn: () => request(`/api/quotations?leadId=${leadId}`),
    enabled: !!leadId,
  });
}

// ── Contracts ─────────────────────────────────────────────────────────────

export function useContractsByLead(leadId: string | undefined) {
  return useQuery<Contract[]>({
    queryKey: ["contracts", { leadId }],
    queryFn: () => request(`/api/contracts?leadId=${leadId}`),
    enabled: !!leadId,
  });
}

export function useContracts() {
  return useQuery<Contract[]>({
    queryKey: ["contracts"],
    queryFn: () => request("/api/contracts"),
  });
}

export function useContractsByProject(projectId: string | undefined) {
  return useQuery<Contract[]>({
    queryKey: ["contracts", { projectId }],
    queryFn: () => request(`/api/contracts?projectId=${projectId}`),
    enabled: !!projectId,
  });
}

export function useCreateContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Contract>) =>
      request<Contract>("/api/contracts", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contracts"] }),
  });
}

export function useUpdateContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Contract> & { id: string }) =>
      request<Contract>(`/api/contracts/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contracts"] }),
  });
}

// ── Invoices ──────────────────────────────────────────────────────────────

export function useInvoices() {
  return useQuery<Invoice[]>({
    queryKey: ["invoices"],
    queryFn: () => request("/api/invoices"),
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Invoice> & { lines?: Partial<InvoiceLine>[] }) =>
      request<Invoice>("/api/invoices", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
  });
}

export function useUpdateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Invoice> & { id: string }) =>
      request<Invoice>(`/api/invoices/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
  });
}

// ── All Tasks (cross-project view) ────────────────────────────────────────

export interface TaskSummary {
  id: number;
  name: string;
  status: string;
  assignee: string;
  deadline: string;
  priority: number;
  phaseId: number;
  dependsOn?: number;
  estimatedDays?: number;
  autoCreated?: number;
  projectId: string;
  projectName: string;
  projectArea: string;
  phaseTitle: string;
}

export function useAllTasks() {
  return useQuery<TaskSummary[]>({
    queryKey: ["tasks", "all"],
    queryFn: () => request("/api/tasks"),
  });
}

// ── Documents ─────────────────────────────────────────────────────────────

export interface Document {
  id: number;
  clientId: string | null;
  projectId: string | null;
  name: string;
  category: string;
  status: string;
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  url: string;
  mimeType?: string;
  fileExtension?: string;
}

export function useDocuments(params?: { clientId?: string; projectId?: string }) {
  const qs = params
    ? "?" + new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString()
    : "";
  return useQuery<Document[]>({
    queryKey: ["documents", params],
    queryFn: () => request(`/api/documents${qs}`),
  });
}

export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) =>
      fetch("/api/upload", { method: "POST", body: formData }).then((r) => {
        if (!r.ok) throw new Error("Upload failed");
        return r.json() as Promise<Document>;
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
  });
}

// ── Reports ───────────────────────────────────────────────────────────────

export interface ReportSummary {
  totalRevenue: number;
  completedProjects: number;
  newClients: number;
  conversionRate: number;
  totalProjects: number;
  totalClients: number;
}

export function useReportSummary() {
  return useQuery<ReportSummary>({
    queryKey: ["reports", "summary"],
    queryFn: () => request("/api/reports/summary"),
  });
}

export interface ReportCharts {
  monthlyRevenue: { month: string; revenue: number }[];
  projectsByType: { name: string; value: number; color: string }[];
  quotationConversion: { month: string; sent: number; converted: number }[];
}

export function useReportCharts() {
  return useQuery<ReportCharts>({
    queryKey: ["reports", "charts"],
    queryFn: () => request("/api/reports/charts"),
  });
}

// ── CRM Leads ─────────────────────────────────────────────────────────────

export interface CrmLead {
  id: string;
  name: string;
  phone: string;
  type: string;
  source: string;
  referralName: string;
  serviceType: string;
  governorate: string;
  area: string;
  likelyContract: string;
  expectedRevenue: string;
  probability: number;
  priority: number;
  expectedClosing: string;
  notes: string;
  stage: string;
  tags: string[];
  quotations: number;
  date: string;
  civilId: string;
  plotNumber: string;
  landArea: number;
  assignedTo: string;
  isArchived: number;
  archivedAt: string;
  archivedReason: string;
}

export function useCrmLeads() {
  return useQuery<CrmLead[]>({
    queryKey: ["crm-leads"],
    queryFn: () => request("/api/crm-leads"),
  });
}

export function useCreateCrmLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CrmLead>) =>
      request<CrmLead>("/api/crm-leads", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-leads"] }),
  });
}

export function useUpdateCrmLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<CrmLead> & { id: string }) =>
      request<CrmLead>(`/api/crm-leads/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-leads"] }),
  });
}

export function useDeleteCrmLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => request(`/api/crm-leads/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-leads"] }),
  });
}

export function useArchivedCrmLeads() {
  return useQuery<CrmLead[]>({
    queryKey: ["crm-leads-archived"],
    queryFn: () => request("/api/crm-leads-archived"),
  });
}

export function useArchiveCrmLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      request(`/api/crm-leads/${id}/archive`, { method: "POST", body: JSON.stringify({ reason: reason || "" }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-leads"] });
      qc.invalidateQueries({ queryKey: ["crm-leads-archived"] });
    },
  });
}

export function useRestoreCrmLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      request<CrmLead>(`/api/crm-leads/${id}/restore`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-leads"] });
      qc.invalidateQueries({ queryKey: ["crm-leads-archived"] });
    },
  });
}


// ── Contract Templates — Issue #16 ──────────────────────────────────────

export interface ContractTemplate {
  id: number;
  name: string;
  buildingType: string;
  serviceType: string;
  scopeOfWork: string;
  terms: string;
  party1Obligations: string;
  party2Obligations: string;
  paymentSchedule: string;
  duration: string;
  notes: string;
  content: string;
  createdAt: string;
  isDefault: number;
}

export function useContractTemplates() {
  return useQuery<ContractTemplate[]>({
    queryKey: ["contract-templates"],
    queryFn: () => request("/api/contract-templates"),
  });
}

export function useCreateContractTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ContractTemplate>) =>
      request<ContractTemplate>("/api/contract-templates", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contract-templates"] }),
  });
}

export function useUpdateContractTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<ContractTemplate> & { id: number }) =>
      request<ContractTemplate>(`/api/contract-templates/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contract-templates"] }),
  });
}

export function useDeleteContractTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => request(`/api/contract-templates/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contract-templates"] }),
  });
}


// ── Appointments ──────────────────────────────────────────────────────────────

export interface Appointment {
  id: number;
  leadId: string | null;
  clientId: string | null;
  clientName: string;
  clientPhone: string;
  date: string;
  time: string;
  reason: string;
  notes: string | null;
  assignedTo: string | null;
  status: string;
  createdAt: string;
}

export function useAppointments() {
  return useQuery<Appointment[]>({
    queryKey: ["appointments"],
    queryFn: () => request<Appointment[]>("/api/appointments"),
  });
}

export function useAppointmentsByLead(leadId: string) {
  return useQuery<Appointment[]>({
    queryKey: ["appointments", "lead", leadId],
    queryFn: () => request<Appointment[]>(`/api/appointments/lead/${leadId}`),
    enabled: !!leadId,
  });
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Appointment, "id" | "createdAt">) =>
      request<Appointment>("/api/appointments", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}

export function useUpdateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Appointment> & { id: number }) =>
      request<Appointment>(`/api/appointments/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
  });
}

export function useDeleteAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => request(`/api/appointments/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
  });
}

// ── Work Plans ──────────────────────────────────────────────────────────────

export interface WorkPlanTask {
  id: number;
  name: string;
  description?: string;
  estimatedDays?: number;
  assignee?: string;
  order: number;
}

export interface WorkPlanPhase {
  id: number;
  title: string;
  subtitle?: string;
  order: number;
  tasks: WorkPlanTask[];
}

export interface WorkPlan {
  id: number;
  name: string;
  description?: string;
  projectType: string;
  serviceType?: string;
  phases: WorkPlanPhase[];
}

export function useWorkPlans() {
  return useQuery<WorkPlan[]>({
    queryKey: ["work-plans"],
    queryFn: () => request("/api/work-plans"),
  });
}

export function useWorkPlan(id: number | null) {
  return useQuery<WorkPlan>({
    queryKey: ["work-plans", id],
    queryFn: () => request(`/api/work-plans/${id}`),
    enabled: !!id,
  });
}

export function useCreateWorkPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<WorkPlan>) =>
      request<WorkPlan>("/api/work-plans", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["work-plans"] }),
  });
}

export function useUpdateWorkPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<WorkPlan> & { id: number }) =>
      request<WorkPlan>(`/api/work-plans/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["work-plans"] });
      qc.invalidateQueries({ queryKey: ["work-plans", vars.id] });
    },
  });
}

export function useDeleteWorkPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => request(`/api/work-plans/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["work-plans"] }),
  });
}

export function useApplyWorkPlan(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (planId: number) =>
      request<{ created: number }>(`/api/work-plans/${planId}/apply/${projectId}`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects", projectId] });
      qc.invalidateQueries({ queryKey: ["tasks", "all"] });
    },
  });
}

export function useCreatePhaseTask(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ phaseId, ...data }: { phaseId: number; name: string; description?: string; estimatedDays?: number; assignee?: string }) =>
      request<{ id: number }>(`/api/phases/${phaseId}/tasks`, { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects", projectId] });
      qc.invalidateQueries({ queryKey: ["tasks", "all"] });
    },
  });
}


// ── Send Email ───────────────────────────────────────────────────────────────

export interface SendEmailPayload {
  to: string;
  subject: string;
  body: string;
  attachmentUrls?: string[];
  projectId?: string;
  type?: "soil" | "electricity" | "general";
}

export function useSendEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SendEmailPayload) =>
      request<{ success: boolean; message: string }>("/api/send-email", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (_d, vars) => {
      if (vars.projectId) {
        qc.invalidateQueries({ queryKey: ["projects", vars.projectId] });
      }
    },
  });
}

// ── Task Approval ────────────────────────────────────────────────────────────

export function useApproveTask(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: number) =>
      request<{ approved: boolean; triggered: string[] }>(`/api/tasks/${taskId}/approve`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects", projectId] });
      qc.invalidateQueries({ queryKey: ["tasks", "all"] });
    },
  });
}

// ── Project Meetings ─────────────────────────────────────────────────────────

export interface ProjectMeeting {
  id: number;
  projectId: string;
  date: string;
  attendees: string;
  agreed: string;
  changes: string;
  notes: string;
  status: string;
  createdAt: string;
}

export function useProjectMeetings(projectId: string) {
  return useQuery<ProjectMeeting[]>({
    queryKey: ["project-meetings", projectId],
    queryFn: () => request(`/api/projects/${projectId}/meetings`),
    enabled: !!projectId,
  });
}

export function useCreateProjectMeeting(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ProjectMeeting>) =>
      request<ProjectMeeting>(`/api/projects/${projectId}/meetings`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["project-meetings", projectId] }),
  });
}

// ── Project Briefs (نموذج طلبات المشروع) ─────────────────────────────────────
export interface ProjectBrief {
  id: number;
  projectId: string;
  ownerName: string;
  ownerPhone: string;
  governorate: string;
  area: string;
  block: string;
  plot: string;
  autoNumber: string;
  plotArea: string;
  plotShape: string;
  northDirection: string;
  architecturalStyle: string;
  floorsCount: number;
  floorsDetails: string;
  sketchData: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export function useProjectBrief(projectId: string) {
  return useQuery<ProjectBrief | null>({
    queryKey: ["project-brief", projectId],
    queryFn: () => request(`/api/projects/${projectId}/brief`),
    enabled: !!projectId,
  });
}

// ── Phase Meta (حالة المراحل الفرعية) ─────────────────────────────────────────
export function usePhaseMeta(projectId: string, phaseKey: string) {
  return useQuery<{ data: Record<string, any> } | null>({
    queryKey: ["phase-meta", projectId, phaseKey],
    queryFn: () => request(`/api/projects/${projectId}/phase-meta/${phaseKey}`),
    enabled: !!projectId && !!phaseKey,
  });
}

export function useUpdatePhaseMeta(projectId: string, phaseKey: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, any>) =>
      request(`/api/projects/${projectId}/phase-meta/${phaseKey}`, {
        method: "PUT",
        body: JSON.stringify({ data }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phase-meta", projectId, phaseKey] });
    },
  });
}

// ── Municipality Submission ────────────────────────────────────────────────────
export interface MunicipalitySubmission {
  id?: number;
  projectId: string;
  phaseId: number;
  submittedAt?: string;
  submittedBy?: string;
  referenceNumber?: string;
  licenseReceivedAt?: string;
  licenseNumber?: string;
  licenseFileUrl?: string;
  approvedPlanUrl?: string;
  notes?: string;
  muniStatus?: "not_submitted" | "submitted" | "license_received";
}
export function useMunicipalitySubmission(projectId: string) {
  return useQuery<MunicipalitySubmission | null>({
    queryKey: ["municipality", projectId],
    queryFn: () => request(`/api/projects/${projectId}/municipality`),
    enabled: !!projectId,
  });
}
export function useUpdateMunicipality(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MunicipalitySubmission>) =>
      request(`/api/projects/${projectId}/municipality`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["municipality", projectId] });
    },
  });
}

// ── Detailed Drawings ─────────────────────────────────────────────────────────
export interface DetailedDrawing {
  id?: number;
  projectId: string;
  phaseId: number;
  drawingType: string;
  assignedTo?: string;
  assignedEmployeeId?: number;
  drawingStatus?: "pending" | "in_progress" | "completed" | "approved";
  fileUrl?: string;
  fileKey?: string;
  notes?: string;
}
export function useDetailedDrawings(projectId: string) {
  return useQuery<DetailedDrawing[]>({
    queryKey: ["drawings", projectId],
    queryFn: () => request(`/api/projects/${projectId}/drawings`),
    enabled: !!projectId,
    initialData: [],
  });
}
export function useCreateDrawing(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<DetailedDrawing>) =>
      request(`/api/projects/${projectId}/drawings`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drawings", projectId] });
    },
  });
}
export function useUpdateDrawing(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<DetailedDrawing> & { id: number }) =>
      request(`/api/drawings/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drawings", projectId] });
    },
  });
}

// ── Supervision Visits ────────────────────────────────────────────────────────
export interface SupervisionVisit {
  id?: number;
  projectId: string;
  phaseId?: number;
  visitDate: string;
  visitNumber?: number;
  constructionStage?: string;
  stageKey?: string;
  stageLabel?: string;
  visitNotes?: string;
  engineerName?: string;
  contractorName?: string;
  contractorPhone?: string;
  ownerName?: string;
  location?: string;
  licenseNumber?: string;
  generalNotes?: string;
  checklistData?: string;
  itemNotes?: string;
  photoUrls?: string;
  visitStatus?: "draft" | "in_progress" | "completed" | "approved";
  pdfUrl?: string;
}
export function useSupervisionVisits(projectId: string) {
  return useQuery<SupervisionVisit[]>({
    queryKey: ["supervision", projectId],
    queryFn: () => request(`/api/projects/${projectId}/supervision`),
    enabled: !!projectId,
    initialData: [],
  });
}
export function useCreateSupervisionVisit(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SupervisionVisit>) =>
      request(`/api/projects/${projectId}/supervision`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supervision", projectId] });
    },
  });
}
export function useUpdateSupervisionVisit(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<SupervisionVisit> & { id: number }) =>
      request(`/api/supervision/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supervision", projectId] });
    },
  });
}

// ── Employees ─────────────────────────────────────────────────────────────────
export interface EmployeeRecord {
  id: number;
  name: string;
  email: string;
  role: string;
  specialty?: string;
  isActive: number;
}
export function useEmployees() {
  return useQuery<EmployeeRecord[]>({
    queryKey: ["employees"],
    queryFn: () => request("/api/employees"),
    initialData: [],
  });
}

// ── Employee Notifications ─────────────────────────────────────────────────────
export interface EmployeeNotification {
  id: number;
  employeeId: number;
  type: string;
  title: string;
  body: string | null;
  relatedId: number | null;
  isRead: number;
  createdAt: string;
}

export function useEmployeeNotifications(employeeId: number | null) {
  return useQuery<EmployeeNotification[]>({
    queryKey: ["employee-notifications", employeeId],
    queryFn: () => employeeId ? request(`/api/employee-notifications?employeeId=${employeeId}`) : Promise.resolve([]),
    enabled: !!employeeId,
    refetchInterval: 30000, // تحديث كل 30 ثانية
    initialData: [],
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => request(`/api/employee-notifications/${id}/read`, { method: "PATCH" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employee-notifications"] }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (employeeId: number) => request("/api/employee-notifications/read-all", { method: "PATCH", body: JSON.stringify({ employeeId }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employee-notifications"] }),
  });
}

// ── Packages (الباقات) ─────────────────────────────────────────────────────────
export interface DbPackage {
  id: number;
  name: string;
  price: string;
  buildingType: string;
  serviceType: string;
  level: string;
  features: string[];
}
export function usePackages() {
  return useQuery<Record<string, DbPackage[]>>({
    queryKey: ["packages"],
    queryFn: () => request("/api/packages"),
    initialData: {},
    staleTime: 0,
  });
}
export function useCreatePackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<DbPackage, "id">) =>
      request("/api/packages", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["packages"] }),
  });
}
export function useUpdatePackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: DbPackage) =>
      request(`/api/packages/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["packages"] }),
  });
}
export function useDeletePackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      request(`/api/packages/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["packages"] }),
  });
}
