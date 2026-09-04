import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("event-launch-form")).toBeVisible();
});

test("dynamic delivery and access rules expose the same stages", async ({ page }) => {
  await expect(page.getByTestId("wizard-stage-venue")).toBeVisible();
  await expect(page.getByTestId("wizard-stage-streaming")).toBeVisible();
  await expect(page.getByTestId("wizard-stage-tickets")).toBeVisible();
  await page.getByLabel("Virtual", { exact: true }).click();
  await expect(page.getByTestId("wizard-stage-venue")).toHaveCount(0);
  await expect(page.getByTestId("wizard-stage-streaming")).toBeVisible();
  await page.getByLabel("Free", { exact: true }).click();
  await expect(page.getByTestId("wizard-stage-tickets")).toHaveCount(0);
  await page.getByLabel("Hybrid", { exact: true }).click();
  await expect(page.getByTestId("wizard-stage-venue")).toBeVisible();
});

test("scoped validation reveals errors, pending state, and then permits navigation", async ({ page }) => {
  await page.getByLabel("Event URL").fill("stages-conf");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByTestId("validation-summary").getByText("That event URL is already reserved.")).toBeVisible();
  await page.getByLabel("Event URL").fill("available-event");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByTestId("wizard-stage-venue")).toHaveAttribute("aria-current", "step");
});

test("rapid slug edits cancel stale async availability results", async ({ page }) => {
  const slug = page.getByLabel("Event URL");
  await slug.fill("stages-conf");
  await slug.fill("available-after-cancel");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByTestId("wizard-stage-venue")).toHaveAttribute("aria-current", "step");
  await expect(page.getByText("That event URL is already reserved.")).toHaveCount(0);
});

test("agenda identity controls and context reconciliation remain operational", async ({ page }) => {
  await page.getByLabel("Event URL").fill("available-event");
  await page.getByTestId("wizard-stage-agenda").click();
  await expect(page.getByRole("heading", { name: "Agenda" })).toBeVisible();
  await page.getByRole("button", { name: "Add workshop" }).click();
  await expect(page.getByTestId("agenda-row-agenda-workshop-10")).toBeVisible();
  await page.getByLabel("Require data-processing agreement").check();
  await expect(page.getByTestId("wizard-stage-compliance")).toBeVisible();
});

test("paid ticket controls enforce stable rows and free registration hides the stage", async ({ page }) => {
  await page.getByLabel("Event URL").fill("available-event");
  await page.getByTestId("wizard-stage-tickets").click();
  await expect(page.getByTestId("ticket-row-ticket-general-1")).toBeVisible();
  await page.getByRole("button", { name: "Add tier" }).click();
  const added = page.getByTestId("ticket-row-ticket-10");
  await expect(added).toBeVisible();
  await added.getByLabel("Tier name").fill("Supporter");
  await added.getByLabel("Price").fill("25");
  await added.getByLabel("Quantity").fill("10");
  await page.reload();
  await page.getByLabel("Free", { exact: true }).click();
  await expect(page.getByTestId("wizard-stage-tickets")).toHaveCount(0);
});

test("non-linear progress validates forward movement and permits backward navigation after validation", async ({ page }) => {
  await page.getByLabel("Event URL").fill("available-event");
  await page.getByTestId("wizard-stage-review").click();
  await expect(page.getByTestId("wizard-stage-review")).toHaveAttribute("aria-current", "step");
  await page.getByLabel("I accept the publishing terms").check();
  await page.getByLabel(/Type the event title exactly/).fill("Stages Community Summit");
  await page.getByRole("button", { name: "Publish event" }).click();
  await page.getByRole("button", { name: "Previous" }).click();
  await expect(page.getByTestId("wizard-stage-tickets")).toHaveAttribute("aria-current", "step");
});

test("application-owned save and resume retains serialized state", async ({ page }) => {
  await page.getByLabel("Event title").fill("Saved Event");
  await page.getByRole("button", { name: "Save draft" }).click();
  await page.getByLabel("Event title").fill("Unsaved Event");
  await page.getByRole("button", { name: "Resume draft" }).click();
  await expect(page.getByLabel("Event title")).toHaveValue("Saved Event");
  await expect(page.getByTestId("stages-inspector")).toBeVisible();
});

test("a valid workflow publishes the canonical controlled payload", async ({ page }) => {
  await page.getByLabel("Event URL").fill("available-event");
  await page.getByTestId("wizard-stage-review").click();
  await page.getByLabel("I accept the publishing terms").check();
  await page.getByLabel(/Type the event title exactly/).fill("Stages Community Summit");
  await page.getByRole("button", { name: "Publish event" }).click();
  const payload = page.getByTestId("published-payload");
  await expect(payload).toBeVisible();
  await expect(payload).toContainText("available-event");
  await expect(payload).toContainText("agenda-session-1");
});

test("labels, progress state, live status, and keyboard focus form an accessible surface", async ({ page }) => {
  await expect(page.getByLabel("Event title")).toBeVisible();
  await expect(page.getByLabel("Event URL")).toBeVisible();
  await expect(page.getByTestId("wizard-stage-basics")).toHaveAttribute("aria-current", "step");
  await expect(page.getByTestId("form-status")).toHaveAttribute("aria-live", "polite");
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toBeVisible();
});

test("reload teardown does not duplicate subscriptions or transactions", async ({ page }) => {
  await page.reload();
  await page.getByRole("button", { name: "Apply conference template" }).click();
  await expect(page.getByLabel("Event title")).toHaveValue("Product Systems Conference");
  await page.getByText("Stages inspector").click();
  await expect(page.getByTestId("stages-inspector")).toContainText('"transactionId": 1');
});
