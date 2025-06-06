// src/components/DndContextWrapper.test.jsx

import React from "react";
import { render, screen } from "@testing-library/react";
// NOTE: import as a named export, since DndContextWrapper is exported with `export function …`
import { DndContextWrapper } from "./DndContextWrapper";

describe("DndContextWrapper component", () => {
  test("renders its children", () => {
    render(
      <DndContextWrapper items={[]} onDragEnd={() => {}}>
        <div data-testid="child">Hello DnD</div>
      </DndContextWrapper>
    );
    expect(screen.getByTestId("child")).toHaveTextContent("Hello DnD");
  });
});
