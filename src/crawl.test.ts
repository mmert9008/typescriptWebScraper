import { test, expect } from "vitest";
import {
  normalizeURL,
  getHeadingFromHTML,
  getFirstParagraphFromHTML,
} from "./crawl";

// normalizeURL tests
test("normalizeURL protocol strip https", () => {
  const input = "https://blog.boot.dev/path";
  const actual = normalizeURL(input);
  const expected = "blog.boot.dev/path";
  expect(actual).toEqual(expected);
});

test("normalizeURL trim trailing slash", () => {
  const input = "https://blog.boot.dev/path/";
  const actual = normalizeURL(input);
  const expected = "blog.boot.dev/path";
  expect(actual).toEqual(expected);
});

test("normalizeURL protocol strip http", () => {
  const input = "http://blog.boot.dev/path";
  const actual = normalizeURL(input);
  const expected = "blog.boot.dev/path";
  expect(actual).toEqual(expected);
});

test("normalizeURL strip http and trailing slash", () => {
  const input = "http://blog.boot.dev/path/";
  const actual = normalizeURL(input);
  const expected = "blog.boot.dev/path";
  expect(actual).toEqual(expected);
});

test("normalizeURL case insensitive hostname", () => {
  const input = "https://BLOG.boot.dev/path";
  const actual = normalizeURL(input);
  const expected = "blog.boot.dev/path";
  expect(actual).toEqual(expected);
});

test("normalizeURL root path trailing slash", () => {
  const input = "https://blog.boot.dev/";
  const actual = normalizeURL(input);
  const expected = "blog.boot.dev";
  expect(actual).toEqual(expected);
});

// getHeadingFromHTML tests
test("getHeadingFromHTML basic h1", () => {
  const inputBody = `<html><body><h1>Test Title</h1></body></html>`;
  const actual = getHeadingFromHTML(inputBody);
  const expected = "Test Title";
  expect(actual).toEqual(expected);
});

test("getHeadingFromHTML fallback to h2", () => {
  const inputBody = `<html><body><h2>Fallback Subtitle</h2></body></html>`;
  const actual = getHeadingFromHTML(inputBody);
  const expected = "Fallback Subtitle";
  expect(actual).toEqual(expected);
});

test("getHeadingFromHTML priority h1 over h2", () => {
  const inputBody = `<html><body><h1>Main Heading</h1><h2>Sub Heading</h2></body></html>`;
  const actual = getHeadingFromHTML(inputBody);
  const expected = "Main Heading";
  expect(actual).toEqual(expected);
});

test("getHeadingFromHTML no heading returns empty string", () => {
  const inputBody = `<html><body><p>No headings here</p></body></html>`;
  const actual = getHeadingFromHTML(inputBody);
  const expected = "";
  expect(actual).toEqual(expected);
});

// getFirstParagraphFromHTML tests
test("getFirstParagraphFromHTML main priority", () => {
  const inputBody = `
    <html><body>
      <p>Outside paragraph.</p>
      <main>
        <p>Main paragraph.</p>
      </main>
    </body></html>
  `;
  const actual = getFirstParagraphFromHTML(inputBody);
  const expected = "Main paragraph.";
  expect(actual).toEqual(expected);
});

test("getFirstParagraphFromHTML fallback without main", () => {
  const inputBody = `
    <html><body>
      <p>First paragraph without main.</p>
      <p>Second paragraph.</p>
    </body></html>
  `;
  const actual = getFirstParagraphFromHTML(inputBody);
  const expected = "First paragraph without main.";
  expect(actual).toEqual(expected);
});

test("getFirstParagraphFromHTML no paragraph returns empty string", () => {
  const inputBody = `<html><body><h1>Only Title</h1></body></html>`;
  const actual = getFirstParagraphFromHTML(inputBody);
  const expected = "";
  expect(actual).toEqual(expected);
});

test("getFirstParagraphFromHTML main without p falls back to outside p", () => {
  const inputBody = `
    <html><body>
      <main>
        <div>No p here</div>
      </main>
      <p>Outside fallback paragraph.</p>
    </body></html>
  `;
  const actual = getFirstParagraphFromHTML(inputBody);
  const expected = "Outside fallback paragraph.";
  expect(actual).toEqual(expected);
});
