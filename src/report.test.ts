import { test, expect, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { writeJSONReport } from "./report";
import { ExtractedPageData } from "./crawl";

const testFilename = "test_report.json";

afterEach(() => {
  const filePath = path.resolve(process.cwd(), testFilename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
});

test("writeJSONReport writes sorted pages to disk", () => {
  const pageData: Record<string, ExtractedPageData> = {
    "https://example.com/b": {
      url: "https://example.com/b",
      heading: "Heading B",
      first_paragraph: "Paragraph B",
      outgoing_links: [],
      image_urls: [],
    },
    "https://example.com/a": {
      url: "https://example.com/a",
      heading: "Heading A",
      first_paragraph: "Paragraph A",
      outgoing_links: [],
      image_urls: [],
    },
  };

  writeJSONReport(pageData, testFilename);

  const filePath = path.resolve(process.cwd(), testFilename);
  expect(fs.existsSync(filePath)).toBe(true);

  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed = JSON.parse(raw);

  expect(Array.isArray(parsed)).toBe(true);
  expect(parsed.length).toBe(2);
  expect(parsed[0].url).toBe("https://example.com/a");
  expect(parsed[1].url).toBe("https://example.com/b");
});
