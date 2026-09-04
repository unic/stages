import { expect, test } from "@playwright/test";

test("document-v1 editor completes the first vertical authoring slice", async ({ page }) => {
  await page.goto("/demo-v1");
  const editor = page.getByTestId("studio-v1-editor");
  await expect(editor).toBeVisible();
  await expect(editor).toHaveAttribute("aria-busy", "false");

  await page.getByRole("button", { name: "Add text field" }).click();
  const label = page.getByRole("textbox", { name: "Label" });
  await label.fill("Speaker name");
  await expect(page.getByRole("textbox", { name: "Speaker name" })).toBeVisible();
  await page.getByRole("textbox", { name: "Speaker name" }).fill("Ada");
  await expect(page.getByRole("textbox", { name: "Speaker name" })).toHaveValue("Ada");

  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.getByRole("textbox", { name: "Text field" })).toBeVisible();
  await page.getByRole("button", { name: "Redo" }).click();
  await expect(page.getByRole("textbox", { name: "Speaker name" })).toBeVisible();
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page.getByRole("status")).toContainText("Local draft saved");

  await page.reload();
  await expect(editor).toHaveAttribute("aria-busy", "false");
  await expect(page.getByRole("button", { name: /Speaker name/ })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Speaker name" })).toBeVisible();
});
