import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Heading } from "../../../../src/components/docs/MDXComponents/Heading";

test("renders a copyable link to the heading fragment", () => {
  const markup = renderToStaticMarkup(
    <Heading level="h2" id="verify-changes">
      Verify Changes
    </Heading>,
  );

  expect(markup).toContain('<h2 id="verify-changes">');
  expect(markup).toContain('href="#verify-changes"');
  expect(markup).toContain("Verify Changes");
});
