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

export function useContracts() {
  return useQuery<Contract[]>({
    queryKey: ["contracts"],
    queryFn: () => request("/api/contracts"),
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
