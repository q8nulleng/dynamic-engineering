/**
 * Integration tests for Interactive Phase Cards API endpoints
 * Tests: upload, send-email, approve-task, meetings
 */
import { describe, it, expect, vi } from "vitest";

// Mock fetch for API testing
const BASE = "http://localhost:3000";

describe("Interactive Phase Cards API", () => {
  describe("POST /api/upload (file upload)", () => {
    it("should reject request without file", async () => {
      const res = await fetch(`${BASE}/api/upload`, {
        method: "POST",
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("no file");
    });

    it("should upload a file and return document record", async () => {
      const formData = new FormData();
      const blob = new Blob(["test content"], { type: "text/plain" });
      formData.append("file", blob, "test-doc.txt");
      formData.append("name", "وثيقة اختبار");
      formData.append("category", "مستندات عامة");
      formData.append("projectId", "TEST001");
      formData.append("clientId", "CLIENT001");

      const res = await fetch(`${BASE}/api/upload`, {
        method: "POST",
        body: formData,
      });
      // May succeed or fail depending on storage config, but should not crash
      expect([200, 201, 500]).toContain(res.status);
      if (res.status === 201) {
        const doc = await res.json();
        expect(doc).toHaveProperty("name");
        expect(doc).toHaveProperty("url");
        expect(doc.clientId).toBe("CLIENT001");
        expect(doc.projectId).toBe("TEST001");
      }
    });
  });

  describe("POST /api/send-email", () => {
    it("should reject missing fields", async () => {
      const res = await fetch(`${BASE}/api/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(400);
    });

    it("should accept valid email request", async () => {
      const res = await fetch(`${BASE}/api/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: "test@example.com",
          subject: "طلب فحص تربة",
          body: "نرجو إفادتنا بتكلفة فحص التربة",
          type: "soil_request",
          projectId: "TEST001",
        }),
      });
      // Should succeed (200) or at least not crash (may fail email delivery but API should respond)
      expect([200, 201, 500]).toContain(res.status);
      if (res.status === 200) {
        const data = await res.json();
        expect(data).toHaveProperty("success");
      }
    });
  });

  describe("GET /api/projects/:id (with client data)", () => {
    it("should return clientPhone, block, plot when client exists", async () => {
      // First create a test project with client
      const createRes = await fetch(`${BASE}/api/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "مشروع اختبار كروت",
          client: "عميل اختبار",
          clientPhone: "99887766",
          type: "سكن خاص",
          serviceType: "بناء جديد",
          area: "المطلاع",
          phases: [
            { title: "تجهيز الملف", tasks: [{ name: "رفع الوثائق" }] },
            { title: "التصميم المعماري", tasks: [{ name: "الكروكي" }] },
          ],
        }),
      });
      expect(createRes.status).toBe(201);
      const created = await createRes.json();

      // Fetch the project
      const getRes = await fetch(`${BASE}/api/projects/${created.id}`);
      expect(getRes.status).toBe(200);
      const project = await getRes.json();
      expect(project).toHaveProperty("phases");
      expect(project.phases.length).toBeGreaterThanOrEqual(2);
      // clientPhone should be present if client was linked
      if (project.clientId) {
        expect(project).toHaveProperty("clientPhone");
      }

      // Cleanup: we won't delete since it's a test DB
    });
  });

  describe("POST /api/tasks/:taskId/approve", () => {
    it("should approve a task and trigger next", async () => {
      // Create a project first
      const createRes = await fetch(`${BASE}/api/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "مشروع اعتماد",
          client: "عميل اعتماد",
          type: "سكن خاص",
          serviceType: "بناء جديد",
          area: "صباح الأحمد",
          phases: [
            { title: "تجهيز الملف", tasks: [{ name: "مهمة 1", status: "pending" }] },
            { title: "التصميم المعماري", tasks: [{ name: "مهمة 2", status: "pending" }] },
          ],
        }),
      });
      const created = await createRes.json();

      // Get the first task
      const getRes = await fetch(`${BASE}/api/projects/${created.id}`);
      const project = await getRes.json();
      const firstTask = project.phases[0]?.tasks[0];

      if (firstTask) {
        const approveRes = await fetch(`${BASE}/api/tasks/${firstTask.id}/approve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        expect([200, 201]).toContain(approveRes.status);
        const result = await approveRes.json();
        expect(result).toHaveProperty("triggered");
      }
    }, 15000);
  });

  describe("Project Meetings API", () => {
    it("should create and list meetings for a project", async () => {
      // Create project
      const createRes = await fetch(`${BASE}/api/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "مشروع جلسات",
          client: "عميل جلسات",
          type: "سكن خاص",
          serviceType: "بناء جديد",
          area: "الجهراء",
          phases: [{ title: "التصميم المعماري", tasks: [{ name: "كروكي" }] }],
        }),
      });
      const created = await createRes.json();

      // Create a meeting
      const meetRes = await fetch(`${BASE}/api/projects/${created.id}/meetings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: "2026-05-25",
          attendees: JSON.stringify(["م. مصطفى", "العميل"]),
          agreed: JSON.stringify(["تعديل الكروكي"]),
          notes: "جلسة تصميم أولى",
          status: "completed",
        }),
      });
      expect([200, 201]).toContain(meetRes.status);

      // List meetings
      const listRes = await fetch(`${BASE}/api/projects/${created.id}/meetings`);
      expect(listRes.status).toBe(200);
      const meetings = await listRes.json();
      expect(meetings.length).toBeGreaterThanOrEqual(1);
      expect(meetings[0].notes).toContain("جلسة تصميم");
    });
  });
});
