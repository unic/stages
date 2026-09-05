import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { StudioHelp } from "./StudioHelp";
import { studioHelpTopics } from "./studioHelpContent";
import { STUDIO_FIELD_DEFINITIONS, STUDIO_BLOCK_DEFINITIONS } from "../../src/registry";

describe("Studio help", () => {
  it("opens contextual help by keyboard and restores focus without changing a draft", async () => {
    const user = userEvent.setup();
    render(<><input aria-label="Draft" defaultValue="My question" /><StudioHelp topic="Responsive layout" compact /></>);
    await user.tab();
    await user.tab();
    await user.keyboard("{Enter}");
    const dialog = screen.getByRole("dialog", { name: "Studio help" });
    expect(within(dialog).getByRole("heading", { name: "Responsive layout" })).toBeVisible();
    expect(within(dialog).getByRole("searchbox")).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("button", { name: "Help: Responsive layout" })).toHaveFocus();
    expect(screen.getByRole("textbox", { name: "Draft" })).toHaveValue("My question");
  });

  it("searches field explanations, handles no results, and lets readers browse again", async () => {
    const user = userEvent.setup();
    render(<StudioHelp />);
    expect(screen.queryByText("Placeholder")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Studio help" }));
    const search = screen.getByRole("searchbox");
    await user.type(search, "PLACEHOLDER");
    expect(screen.getByText("Placeholder", { selector: "dt" })).toBeVisible();
    expect(screen.queryByText("Rows", { selector: "dt" })).toBeNull();
    await user.clear(search);
    await user.type(search, "unfindable-setting");
    expect(screen.getByRole("status")).toHaveTextContent("No matching help");
    await user.click(screen.getByRole("button", { name: "Validation" }));
    expect(search).toHaveValue("");
    expect(screen.getByRole("heading", { name: "Validation" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Close help" }));
    await user.click(screen.getByRole("button", { name: "Studio help" }));
    expect(screen.getByRole("heading", { name: "Getting started" })).toBeVisible();
  });

  it("documents every registered field and content property", () => {
    const content = studioHelpTopics.flatMap((topic) => topic.fields.flat()).join(" ").toLowerCase();
    for (const definition of [...Object.values(STUDIO_FIELD_DEFINITIONS), ...Object.values(STUDIO_BLOCK_DEFINITIONS)]) {
      expect(content, definition.displayName).toContain(definition.displayName.toLowerCase());
      for (const prop of definition.props) expect(content, prop.label).toContain(prop.label.toLowerCase());
    }
  });
});
