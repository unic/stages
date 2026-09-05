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
  await expect(page.locator(".studio-editor-status").getByRole("status")).toContainText("Local draft saved");

  await page.reload();
  await expect(editor).toHaveAttribute("aria-busy", "false");
  await expect(page.getByRole("button", { name: /Speaker name/ })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Speaker name" })).toBeVisible();
});

test("local projects autosave across reload and recover confirmed deletion", async ({ page }) => {
  await page.goto("/demo-v1");
  const editor = page.getByTestId("studio-v1-editor");
  const saveStatus = page.locator(".studio-editor-status").getByRole("status");
  await expect(editor).toHaveAttribute("aria-busy", "false");

  await page.getByRole("button", { name: "Insert", exact: true }).click();
  await page.getByRole("button", { name: "Add text field" }).click();
  await page.getByRole("textbox", { name: "Label", exact: true }).fill("Recovered field");
  await expect(saveStatus).toContainText("Local draft autosaved", { timeout: 3_000 });
  await page.reload();
  await expect(editor).toHaveAttribute("aria-busy", "false");
  await expect(page.getByRole("textbox", { name: "Recovered field" })).toBeVisible();

  await page.getByRole("button", { name: "Project", exact: true }).click();
  await page.getByRole("button", { name: "Project actions" }).click();
  await page.getByRole("menuitem", { name: "Delete project…" }).click();
  await page.getByRole("button", { name: "Confirm delete" }).click();
  await expect(saveStatus).toContainText("Project moved to recovery");
  await page.getByRole("button", { name: /^Recovery \(/ }).click();
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
  await page.getByRole("button", { name: /^Recovery \(/ }).click();
  const corrupt = page.locator(".studio-v1-recovery-list li").filter({ hasText: "corrupt" });
  await expect(corrupt).toBeVisible();
  await expect(corrupt.getByRole("button", { name: "Restore…" })).toHaveCount(0);
});

test('portable import, 1000-control render/edit and export stay within the browser budget', async ({ page }, testInfo) => {
  const { readFileSync } = await import('node:fs');
  const source = JSON.parse(readFileSync(new URL('../../packages/authoring/test/fixtures/contact-project-v1.json', import.meta.url), 'utf8'));
  source.forms.contact.nodes = Object.fromEntries(Array.from({ length: 1000 }, (_, index) => [`field${index}`, {
    uid: `field${index}`, kind: 'field', runtimeId: `field${index}`, definition: { key: 'text', version: 1 }, props: { label: `Scale field ${index}` },
  }]));
  source.forms.contact.rootNodeUids = Object.keys(source.forms.contact.nodes);
  source.forms.contact.scenarios = [];
  await page.goto('/demo-v1');
  await expect(page.getByTestId('studio-v1-editor')).toHaveAttribute('aria-busy', 'false');
  await page.getByRole('button', { name: 'Project', exact: true }).click();
  await page.getByText('Import & export', { exact: true }).first().click();
  await page.getByRole('textbox', { name: 'Studio project JSON', exact: true }).fill(JSON.stringify(source));
  const before = Date.now();
  await page.getByRole('button', { name: 'Import and validate', exact: true }).click();
  const last = page.getByRole('textbox', { name: 'Scale field 999', exact: true });
  await expect(last).toBeVisible();
  await last.fill('Keyboard edit');
  await expect(last).toHaveValue('Keyboard edit');
  await page.getByRole('button', { name: 'Generate export artifacts', exact: true }).click();
  await page.getByRole('combobox', { name: 'Generated artifact', exact: true }).selectOption('contact/form.stages.json');
  const artifact = JSON.parse(await page.getByRole('textbox', { name: 'Artifact source', exact: true }).inputValue());
  expect(Object.keys(artifact.form.nodes)).toHaveLength(1000);
  expect(artifact.initialValue.field999).toBe('');
  const elapsed = Date.now() - before;
  expect(elapsed).toBeLessThan(10000);
  await testInfo.attach('portable-browser-budget', { body: JSON.stringify({ controls: 1000, importRenderEditExportMilliseconds: elapsed, maximumMilliseconds: 10000 }), contentType: 'application/json' });
});
