import { JSDOM } from "jsdom";

export function normalizeURL(urlString: string): string {
  const url = new URL(urlString);
  const fullPath = `${url.hostname}${url.pathname}`;
  if (fullPath.endsWith("/")) {
    return fullPath.slice(0, -1);
  }
  return fullPath;
}

export function getHeadingFromHTML(html: string): string {
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const h1 = doc.querySelector("h1");
  if (h1) {
    return h1.textContent?.trim() || "";
  }
  const h2 = doc.querySelector("h2");
  if (h2) {
    return h2.textContent?.trim() || "";
  }
  return "";
}

export function getFirstParagraphFromHTML(html: string): string {
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const main = doc.querySelector("main");
  const pInMain = main?.querySelector("p");
  if (pInMain) {
    return pInMain.textContent?.trim() || "";
  }
  const p = doc.querySelector("p");
  if (p) {
    return p.textContent?.trim() || "";
  }
  return "";
}
