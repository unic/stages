import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import initialConfig from "./configTemplates/initialConfig";
import SidePanel from "./SidePanel";
import useStagesStore from "./store";

const initialState = useStagesStore.getState();

describe("legacy config export", () => {
  beforeEach(() => {
    useStagesStore.setState({
      ...initialState,
      currentConfig: initialConfig,
      editorTabIndex: 0,
      selectedElement: "",
    }, true);
  });

  it("downloads only the current config in the POC JSON format", async () => {
    const blobs = [];
    class CapturedBlob {
      constructor(parts, options) {
        this.parts = parts;
        this.type = options.type;
        blobs.push(this);
      }
    }
    vi.stubGlobal("Blob", CapturedBlob);
    const createObjectURL = vi.fn(() => "blob:legacy-config");
    Object.defineProperty(window.URL, "createObjectURL", {
      configurable: true,
      value: createObjectURL,
    });
    let downloadedAnchor;
    vi.spyOn(HTMLAnchorElement.prototype, "dispatchEvent")
      .mockImplementation(function captureDownload() {
        downloadedAnchor = this;
        return true;
      });

    render(<SidePanel />);
    await userEvent.click(screen.getByRole("button", { name: "Export Config" }));

    expect(blobs).toHaveLength(1);
    expect(blobs[0]).toMatchObject({
      parts: [JSON.stringify(initialConfig, null, 2)],
      type: "text/json",
    });
    expect(createObjectURL).toHaveBeenCalledWith(blobs[0]);
    expect(downloadedAnchor).toMatchObject({
      download: "stages-config.json",
      href: "blob:legacy-config",
    });
  });
});
