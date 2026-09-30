import { test, expect } from "@playwright/test";

/**
 * Primary journey: create client → add deal → drag through pipeline →
 * AI flags an at-risk deal → draft + approve + send follow-up.
 *
 * Runs against the dev server with seeded demo data (port 3105).
 * It creates one client and one deal in dev.db; re-run `npm run db:seed`
 * afterwards to restore pristine demo data.
 */
test("client → deal → drag → AI draft → approve → sent", async ({ page }) => {
  const stamp = Date.now().toString(36);
  const clientName = `E2E Client ${stamp}`;
  const dealTitle = `E2E Website ${stamp}`;

  // 1. Create a client
  await page.goto("/clients");
  await page.getByRole("button", { name: "Add client" }).first().click();
  const clientDialog = page.getByRole("dialog");
  await clientDialog.getByLabel("Name").fill(clientName);
  await clientDialog.getByLabel("Email").fill(`e2e-${stamp}@example.com`);
  await clientDialog.getByRole("button", { name: "Add client" }).click();
  await expect(page.getByText(clientName)).toBeVisible();

  // 2. Add a deal for that client
  await page.goto("/deals");
  await page.getByRole("button", { name: "Add deal" }).first().click();
  const dealDialog = page.getByRole("dialog");
  await dealDialog.getByLabel("Deal title").fill(dealTitle);
  await dealDialog.getByLabel("Client").selectOption({ label: clientName });
  await dealDialog.getByLabel("Value (USD)").fill("7500");
  await dealDialog.getByRole("button", { name: "Add deal" }).click();
  const leadColumn = page.getByLabel("Lead column");
  await expect(leadColumn.getByText(dealTitle)).toBeVisible();

  // 3. Drag the deal from Lead to Proposal
  const dragHandle = page.getByRole("button", {
    name: `Drag ${dealTitle} to another stage`,
  });
  const proposalColumn = page.getByLabel("Proposal column");
  await dragHandle.dragTo(proposalColumn);
  await expect(proposalColumn.getByText(dealTitle)).toBeVisible();

  // 4. AI assistant flags a seeded at-risk deal; draft a follow-up
  await page.goto("/assistant");
  const riskSection = page.locator("section").filter({
    has: page.getByRole("heading", { name: "Deals that need attention" }),
  });
  const riskCard = riskSection
    .locator("div", { hasText: "Online ordering site" })
    .first();
  await expect(riskCard).toBeVisible();
  await riskCard.getByRole("button", { name: "Draft follow-up" }).click();

  // 5. Draft lands in the approval queue as pending
  const queueSection = page.locator("section").filter({
    has: page.getByRole("heading", { name: "Approval queue" }),
  });
  const draftCard = queueSection.locator("div", {
    hasText: "Following up: Online ordering site",
  }).first();
  await expect(draftCard).toBeVisible({ timeout: 15000 });
  await expect(draftCard.getByText("Pending review")).toBeVisible();

  // 6. Approve → appears in "ready to send" → mark as sent
  await draftCard.getByRole("button", { name: "Approve", exact: true }).click();
  const approvedSection = page.locator("section").filter({
    has: page.getByRole("heading", { name: "Approved — ready to send" }),
  });
  await expect(approvedSection).toBeVisible({ timeout: 10000 });
  await approvedSection
    .getByRole("button", { name: "Mark as sent" })
    .first()
    .click();

  // 7. History records the sent draft; nothing ever auto-sent
  const historySection = page.locator("section").filter({
    has: page.getByRole("heading", { name: "History" }),
  });
  await expect(
    historySection.getByText("Following up: Online ordering site")
  ).toBeVisible({ timeout: 10000 });
  await expect(historySection.getByText("sent", { exact: true })).toBeVisible();
});
