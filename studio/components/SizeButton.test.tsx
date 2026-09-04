import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, expectTypeOf, it, vi } from "vitest";
import SizeButton, { type BlockWidthSize } from "./SizeButton";

it("reports the selected typed block width", async () => {
  const onChange = vi.fn<(size: BlockWidthSize) => void>();
  render(
    <SizeButton
      size="M"
      isActive
      type="field"
      onChangeBlockWidth={onChange}
    />,
  );

  await userEvent.click(screen.getByRole("button", { name: "M" }));

  expect(onChange).toHaveBeenCalledWith("M");
  expectTypeOf(onChange).parameter(0).toEqualTypeOf<BlockWidthSize>();
});
