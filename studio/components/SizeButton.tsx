import type { MouseEvent } from "react";
import { Button } from "./ui/button";

export type BlockWidthSize = "S" | "M" | "L";

export interface SizeButtonProps {
  readonly size: BlockWidthSize;
  readonly isActive: boolean;
  readonly type?: "fieldset" | "field";
  readonly onChangeBlockWidth?: (size: BlockWidthSize) => void;
}

export default function SizeButton({
  size,
  isActive,
  type,
  onChangeBlockWidth,
}: SizeButtonProps) {
  return (
    <Button
      size="icon"
      variant="outline"
      style={{
        border: "1px solid #ddd",
        borderColor:
          type === "fieldset"
            ? isActive
              ? "#c10b99"
              : "#bbb"
            : isActive
            ? "#0A94F8"
            : "#bbb",
        background: "#fff",
        borderRadius: "3px",
        cursor: "pointer",
        userSelect: "none",
        fontSize: "10px",
        color:
          type === "fieldset"
            ? isActive
              ? "#c10b99"
              : "#bbb"
            : isActive
            ? "#0A94F8"
            : "#bbb",
        margin: "0 0 1px 0",
        padding: "0 1px",
        width: "14px",
        textAlign: "center",
      }}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        onChangeBlockWidth?.(size);
      }}
    >
      {size}
    </Button>
  );
}
