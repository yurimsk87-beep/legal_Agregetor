import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { AUTH_COOKIE_NAME, createSessionToken } from "../../src/lib/auth";
import { prisma } from "../../src/lib/prisma";
import { createFamilyAIDraftDocumentResult } from "../../src/lib/document-result-contract";

test("encrypted document archive enforces owner isolation, restoration and deletion", async ({ browser, baseURL }) => {
  test.skip(!process.env.DOCUMENT_STORAGE_KEY || !process.env.JWT_SECRET || !process.env.DATABASE_URL,
    "Integration requires ephemeral test-only archive key, JWT secret and PostgreSQL.");
  const origin = baseURL || "http://127.0.0.1:3703";
  const ownerId = "archive-e2e-" + randomUUID();
  const otherId = "archive-e2e-" + randomUUID();
  const ownerEmail = `archive-${randomUUID()}@example.test`;
  const otherEmail = `archive-${randomUUID()}@example.test`;
  const owner = await browser.newContext();
  const other = await browser.newContext();
  try {
    await prisma.user.create({ data: { id: ownerId, email: ownerEmail, passwordHash: "e2e-no-login", role: "USER" } });
    await prisma.user.create({ data: { id: otherId, email: otherEmail, passwordHash: "e2e-no-login", role: "USER" } });
    const ownerToken = await createSessionToken({ sub: ownerId, email: ownerEmail, role: "USER" });
    const otherToken = await createSessionToken({ sub: otherId, email: otherEmail, role: "USER" });
    await owner.addCookies([{ name: AUTH_COOKIE_NAME, value: ownerToken, url: origin, httpOnly: true, sameSite: "Lax" }]);
    await other.addCookies([{ name: AUTH_COOKIE_NAME, value: otherToken, url: origin, httpOnly: true, sameSite: "Lax" }]);
    const ownerPage = await owner.newPage();
    const otherPage = await other.newPage();
    const ownerAuthHeaders = { Origin: origin, Cookie: `${AUTH_COOKIE_NAME}=${ownerToken}` };
    const otherAuthHeaders = { Origin: origin, Cookie: `${AUTH_COOKIE_NAME}=${otherToken}` };

    const documentResult = createFamilyAIDraftDocumentResult({
      routeSlug: "roditeli-i-rebenok-posle-razvoda",
      scenarioKey: "residence",
      documentSlug: "mesto-zhitelstva-rebenka-posle-razvoda",
      documentTitle: "Тестовый проект для проверки доступа",
      documentText: "Тестовый текст без реальных персональных данных.",
      usedRuleIds: [], placeholders: [], legalReviewedAt: "2026-10-09"
    });
    const save = await ownerPage.request.post("/api/account/documents/", {
      headers: ownerAuthHeaders, data: { documentResult }
    });
    expect(save.status(), await save.text()).toBe(201);

    const duplicate = await ownerPage.request.post("/api/account/documents/", {
      headers: ownerAuthHeaders, data: { documentResult }
    });
    expect(duplicate.status()).toBe(409);

    const anonymous = await browser.newContext();
    try {
      const anonymousRequest = await anonymous.request.get(origin + "/api/account/documents/");
      expect(anonymousRequest.status()).toBe(401);
    } finally {
      await anonymous.close();
    }

    const ownerList = await ownerPage.request.get("/api/account/documents/", { headers: ownerAuthHeaders });
    expect(ownerList.status()).toBe(200);
    expect((await ownerList.json()).documents.some((d: { versionId: string }) => d.versionId === documentResult.versionId)).toBe(true);

    const unauthorizedList = await otherPage.request.get("/api/account/documents/", { headers: otherAuthHeaders });
    expect(unauthorizedList.status()).toBe(200);
    expect((await unauthorizedList.json()).documents).toEqual([]);

    const foreignRead = await otherPage.request.get(`/api/account/documents/${documentResult.versionId}/`, { headers: otherAuthHeaders });
    expect(foreignRead.status()).toBe(404);
    const foreignDelete = await otherPage.request.delete(`/api/account/documents/${documentResult.versionId}/`, { headers: otherAuthHeaders });
    expect(foreignDelete.status()).toBe(404);

    const restored = await ownerPage.request.get(`/api/account/documents/${documentResult.versionId}/`, { headers: ownerAuthHeaders });
    expect(restored.status()).toBe(200);
    expect((await restored.json()).documentResult).toEqual(documentResult);
    await ownerPage.goto("/account/documents/");
    await expect(ownerPage.getByText(documentResult.documentTitle)).toBeVisible();

    const removed = await ownerPage.request.delete(`/api/account/documents/${documentResult.versionId}/`, { headers: ownerAuthHeaders });
    expect(removed.status()).toBe(200);
    const noLongerExists = await ownerPage.request.get(`/api/account/documents/${documentResult.versionId}/`, { headers: ownerAuthHeaders });
    expect(noLongerExists.status()).toBe(404);
    const deletedAgain = await ownerPage.request.delete(`/api/account/documents/${documentResult.versionId}/`, { headers: ownerAuthHeaders });
    expect(deletedAgain.status()).toBe(404);
  } finally {
    await Promise.allSettled([owner.close(), other.close()]);
    await prisma.user.deleteMany({ where: { id: { in: [ownerId, otherId] } } });
  }
});
