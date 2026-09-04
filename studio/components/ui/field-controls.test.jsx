import { render, screen } from "@testing-library/react";
import { useState } from "react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./button";
import { Calendar, Checkbox, InputNumber, Message, MultiSelect } from "./field-controls";

describe("shadcn field controls", () => {
  it("keeps non-submit buttons safe by default", () => {
    render(<Button>Open inspector</Button>);
    expect(screen.getByRole("button", { name: "Open inspector" })).toHaveAttribute("type", "button");
  });

  it("emits the editor's boolean field contract", async () => {
    const onChange = vi.fn();
    render(<Checkbox aria-label="Published" checked={false} onChange={onChange} />);

    await userEvent.click(screen.getByRole("checkbox", { name: "Published" }));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ checked: true, value: true }));
  });

  it("emits numbers instead of input strings", async () => {
    const onChange = vi.fn();
    function NumberExample() {
      const [value, setValue] = useState(2);
      return <InputNumber aria-label="Maximum entries" value={value} onChange={(event) => { setValue(event.value); onChange(event); }} />;
    }
    render(<NumberExample />);

    const input = screen.getByRole("spinbutton", { name: "Maximum entries" });
    await userEvent.clear(input);
    await userEvent.type(input, "12");

    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ value: 12 }));
  });

  it("maps destructive messages to accessible alerts", () => {
    render(<Message severity="error" text="This field is required" />);
    expect(screen.getByRole("alert")).toHaveTextContent("This field is required");
  });

  it("does not forward legacy configuration props to DOM controls", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <>
        <MultiSelect
          aria-label="Locales"
          value={["EN"]}
          options={[{ value: "EN", label: "English" }]}
          showFilter
          showSelectAll={false}
          filter
          display="chip"
          inline={false}
          selectionLimit={3}
          onChange={() => {}}
        />
        <Calendar
          aria-label="Available from"
          value={new Date("2026-01-01T00:00:00")}
          showIcon
          showTime
          showButtonBar
          numberOfMonths={2}
          selectionMode="single"
          onChange={() => {}}
        />
        <InputNumber
          aria-label="Price"
          value={10}
          mode="currency"
          currency="CHF"
          currencyDisplay="symbol"
          useGrouping
          minFractionDigits={2}
          onChange={() => {}}
        />
      </>,
    );

    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
