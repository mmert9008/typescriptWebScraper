import { JSDOM } from "jsdom";

export interface ExtractedPageData {
  url: string;
  heading: string;
  first_paragraph: string;
  outgoing_links: string[];
  image_urls: string[];
}

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

export function getURLsFromHTML(html: string, baseURL: string): string[] {
  const urls: string[] = [];
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const linkElements = doc.querySelectorAll("a");

  for (const linkElement of linkElements) {
    const href = linkElement.getAttribute("href");
    if (!href) {
      continue;
    }
    try {
      const urlObj = new URL(href, baseURL);
      urls.push(urlObj.href);
    } catch (err) {
      // Ignore invalid URLs
    }
  }

  return urls;
}

export function getImagesFromHTML(html: string, baseURL: string): string[] {
  const images: string[] = [];
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const imgElements = doc.querySelectorAll("img");

  for (const imgElement of imgElements) {
    const src = imgElement.getAttribute("src");
    if (!src) {
      continue;
    }
    try {
      const urlObj = new URL(src, baseURL);
      images.push(urlObj.href);
    } catch (err) {
      // Ignore invalid URLs
    }
  }

  return images;
}

export function extractPageData(
  html: string,
  pageURL: string
): ExtractedPageData {
  return {
    url: pageURL,
    heading: getHeadingFromHTML(html),
    first_paragraph: getFirstParagraphFromHTML(html),
    outgoing_links: getURLsFromHTML(html, pageURL),
    image_urls: getImagesFromHTML(html, pageURL),
  };
}
