import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CodeBlock } from "./CodeBlock";

test("copies the code and shows a check", async () => {
  const user = userEvent.setup();
  render(
    <CodeBlock>
      <code> const x = 1;</code>
    </CodeBlock>,
  );

  await user.click(screen.getByRole("button", { name: "Copy code" }));

  expect(await navigator.clipboard.readText()).toBe(" const x = 1;");
  expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument();
});

test("switches back to the copy icon after 2 seconds", async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  render(
    <CodeBlock>
      <code>x</code>
    </CodeBlock>,
  );

  await user.click(screen.getByRole("button", { name: "Copy code" }));
  act(() => vi.advanceTimersByTime(2000));

  expect(screen.getByRole("button", { name: "Copy code" })).toBeInTheDocument();
  vi.useRealTimers();
});
