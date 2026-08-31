import { test, expect } from "vitest";
import {
  normalizeURL,
  getHeadingFromHTML,
  getFirstParagraphFromHTML,
  getURLsFromHTML,
  getImagesFromHTML,
  extractPageData,
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

// getURLsFromHTML tests
test("getURLsFromHTML absolute", () => {
  const inputURL = "https://crawler-test.com";
  const inputBody = `<html><body><a href="/path/one"><span>Boot.dev</span></a></body></html>`;

  const actual = getURLsFromHTML(inputBody, inputURL);
  const expected = ["https://crawler-test.com/path/one"];

  expect(actual).toEqual(expected);
});

test("getURLsFromHTML both relative and absolute", () => {
  const inputURL = "https://crawler-test.com";
  const inputBody = `<html><body>
    <a href="/path/one">Relative</a>
    <a href="https://other-domain.com/path/two">Absolute</a>
  </body></html>`;

  const actual = getURLsFromHTML(inputBody, inputURL);
  const expected = [
    "https://crawler-test.com/path/one",
    "https://other-domain.com/path/two",
  ];

  expect(actual).toEqual(expected);
});

test("getURLsFromHTML ignore missing or invalid href", () => {
  const inputURL = "https://crawler-test.com";
  const inputBody = `<html><body>
    <a>No href</a>
    <a href="/valid">Valid link</a>
  </body></html>`;

  const actual = getURLsFromHTML(inputBody, inputURL);
  const expected = ["https://crawler-test.com/valid"];

  expect(actual).toEqual(expected);
});

// getImagesFromHTML tests
test("getImagesFromHTML relative", () => {
  const inputURL = "https://crawler-test.com";
  const inputBody = `<html><body><img src="/logo.png" alt="Logo"></body></html>`;

  const actual = getImagesFromHTML(inputBody, inputURL);
  const expected = ["https://crawler-test.com/logo.png"];

  expect(actual).toEqual(expected);
});

test("getImagesFromHTML multiple images absolute and relative", () => {
  const inputURL = "https://crawler-test.com";
  const inputBody = `<html><body>
    <img src="/images/pic1.png" alt="Pic 1">
    <img src="https://cdn.example.com/pic2.jpg" alt="Pic 2">
  </body></html>`;

  const actual = getImagesFromHTML(inputBody, inputURL);
  const expected = [
    "https://crawler-test.com/images/pic1.png",
    "https://cdn.example.com/pic2.jpg",
  ];

  expect(actual).toEqual(expected);
});

test("getImagesFromHTML ignore missing src", () => {
  const inputURL = "https://crawler-test.com";
  const inputBody = `<html><body>
    <img>
    <img src="/banner.webp" alt="Banner">
  </body></html>`;

  const actual = getImagesFromHTML(inputBody, inputURL);
  const expected = ["https://crawler-test.com/banner.webp"];

  expect(actual).toEqual(expected);
});

// extractPageData tests
test("extractPageData basic", () => {
  const inputURL = "https://crawler-test.com";
  const inputBody = `
    <html><body>
      <h1>Test Title</h1>
      <p>This is the first paragraph.</p>
      <a href="/link1">Link 1</a>
      <img src="/image1.jpg" alt="Image 1">
    </body></html>
  `;

  const actual = extractPageData(inputBody, inputURL);
  const expected = {
    url: "https://crawler-test.com",
    heading: "Test Title",
    first_paragraph: "This is the first paragraph.",
    outgoing_links: ["https://crawler-test.com/link1"],
    image_urls: ["https://crawler-test.com/image1.jpg"],
  };

  expect(actual).toEqual(expected);
});

test("extractPageData empty or missing elements", () => {
  const inputURL = "https://crawler-test.com/empty";
  const inputBody = `<html><body><div>No elements here</div></body></html>`;

  const actual = extractPageData(inputBody, inputURL);
  const expected = {
    url: "https://crawler-test.com/empty",
    heading: "",
    first_paragraph: "",
    outgoing_links: [],
    image_urls: [],
  };

  expect(actual).toEqual(expected);
});

test("extractPageData complex page with multiple links, images, and h2 fallback", () => {
  const inputURL = "https://crawler-test.com";
  const inputBody = `
    <html><body>
      <h2>Section Heading</h2>
      <p>Outside paragraph.</p>
      <main>
        <p>Main content paragraph.</p>
      </main>
      <a href="/about">About</a>
      <a href="https://other.com/contact">Contact</a>
      <img src="/icon.svg" alt="Icon">
      <img src="https://cdn.test.com/pic.png" alt="Pic">
    </body></html>
  `;

  const actual = extractPageData(inputBody, inputURL);
  const expected = {
    url: "https://crawler-test.com",
    heading: "Section Heading",
    first_paragraph: "Main content paragraph.",
    outgoing_links: [
      "https://crawler-test.com/about",
      "https://other.com/contact",
    ],
    image_urls: [
      "https://crawler-test.com/icon.svg",
      "https://cdn.test.com/pic.png",
    ],
  };

  expect(actual).toEqual(expected);
});
