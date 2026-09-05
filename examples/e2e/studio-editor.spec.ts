import { expect, test } from "@playwright/test";

test("document-v1 editor completes the first vertical authoring slice", async ({ page }) => {
  await page.goto("/demo-v1");
  const editor = page.getByTestId("studio-v1-editor");
  await expect(editor).toBeVisible();
  await expect(editor).toHaveAttribute("aria-busy", "false");

  await page.getByRole("button", { name: "Insert", exact: true }).click();
  await page.getByRole("button", { name: "Add text field" }).click();
  const label = page.getByRole("textbox", { name: "Label", exact: true });
  await label.fill("Speaker name");
  await expect(page.getByRole("textbox", { name: "Speaker name" })).toBeVisible();
  await page.getByRole("textbox", { name: "Speaker name" }).fill("Ada");
  await expect(page.getByRole("textbox", { name: "Speaker name" })).toHaveValue("Ada");

  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.getByRole("textbox", { name: "Text field" })).toBeVisible();
  await page.getByRole("button", { name: "Redo" }).click();
  await expect(page.getByRole("textbox", { name: "Speaker name" })).toBeVisible();
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page.locator(".studio-v1-toolbar").getByRole("status")).toContainText("Local draft saved");

  await page.reload();
  await expect(editor).toHaveAttribute("aria-busy", "false");
  await expect(page.getByRole("button", { name: /Speaker name/ })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Speaker name" })).toBeVisible();
});

test("local projects autosave across reload and recover confirmed deletion", async ({ page }) => {
  await page.goto("/demo-v1");
  const editor = page.getByTestId("studio-v1-editor");
  const saveStatus = page.locator(".studio-v1-toolbar").getByRole("status");
  await expect(editor).toHaveAttribute("aria-busy", "false");

  await page.getByRole("button", { name: "Insert", exact: true }).click();
  await page.getByRole("button", { name: "Add text field" }).click();
  await page.getByRole("textbox", { name: "Label", exact: true }).fill("Recovered field");
  await expect(saveStatus).toContainText("Local draft autosaved", { timeout: 3_000 });
  await page.reload();
  await expect(editor).toHaveAttribute("aria-busy", "false");
  await expect(page.getByRole("textbox", { name: "Recovered field" })).toBeVisible();

  await page.getByRole("button", { name: "Project", exact: true }).click();
  await page.getByRole("button", { name: "Delete project…" }).click();
  await page.getByRole("button", { name: "Confirm delete" }).click();
  await expect(saveStatus).toContainText("Project moved to recovery");
  const deleted = page.locator(".studio-v1-recovery-list li").filter({ hasText: "deleted" });
  await deleted.getByRole("button", { name: "Restore…" }).click();
  await deleted.getByRole("button", { name: "Confirm restore" }).click();
  await expect(saveStatus).toContainText("Recovered");
  await expect(page.getByRole("textbox", { name: "Recovered field" })).toBeVisible();

  await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("stages-studio-v1", 2);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction("projects", "readwrite");
      const store = transaction.objectStore("projects");
      const request = store.getAll();
      request.onsuccess = () => {
        const record = request.result[0];
        store.put({ ...record, source: "{" });
      };
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    database.close();
  });
  await page.reload();
  await expect(saveStatus).toContainText("quarantined");
  await page.getByRole("button", { name: "Project", exact: true }).click();
  const corrupt = page.locator(".studio-v1-recovery-list li").filter({ hasText: "corrupt" });
  await expect(corrupt).toBeVisible();
  await expect(corrupt.getByRole("button", { name: "Restore…" })).toHaveCount(0);
});
