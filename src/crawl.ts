import { JSDOM } from "jsdom";
import pLimit from "p-limit";

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

export async function getHTML(url: string): Promise<string | undefined> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "BootCrawler/1.0",
      },
    });

    if (response.status >= 400) {
      console.error(`Error: HTTP status ${response.status} for ${url}`);
      return;
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("text/html")) {
      console.error(
        `Error: Content-Type is not text/html (${contentType}) for ${url}`
      );
      return;
    }

    return await response.text();
  } catch (err) {
    console.error(`Error fetching ${url}: ${(err as Error).message}`);
    return;
  }
}

export class ConcurrentCrawler {
  private baseURL: string;
  private pages: Record<string, number>;
  private limit: ReturnType<typeof pLimit>;
  private maxPages: number;
  private shouldStop: boolean;
  private allTasks: Set<Promise<void>>;
  private visited: Set<string>;

  constructor(
    baseURL: string,
    maxConcurrency: number = 3,
    maxPages: number = 25
  ) {
    this.baseURL = baseURL;
    this.pages = {};
    this.limit = pLimit(maxConcurrency);
    this.maxPages = maxPages;
    this.shouldStop = false;
    this.allTasks = new Set();
    this.visited = new Set();
  }

  private addPageVisit(normalizedURL: string): boolean {
    if (this.shouldStop) {
      return false;
    }

    if (this.pages[normalizedURL] !== undefined) {
      this.pages[normalizedURL]++;
    } else {
      this.pages[normalizedURL] = 1;
    }

    if (this.visited.has(normalizedURL)) {
      return false;
    }

    if (this.visited.size >= this.maxPages) {
      this.shouldStop = true;
      console.log("Reached maximum number of pages to crawl.");
      return false;
    }

    this.visited.add(normalizedURL);
    return true;
  }

  private async getHTML(currentURL: string): Promise<string> {
    return await this.limit(async () => {
      try {
        const response = await fetch(currentURL, {
          headers: {
            "User-Agent": "BootCrawler/1.0",
          },
        });

        if (response.status >= 400) {
          console.error(
            `Error: HTTP status ${response.status} for ${currentURL}`
          );
          return "";
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("text/html")) {
          console.error(
            `Error: Content-Type is not text/html (${contentType}) for ${currentURL}`
          );
          return "";
        }

        return await response.text();
      } catch (err) {
        console.error(`Error fetching ${currentURL}: ${(err as Error).message}`);
        return "";
      }
    });
  }

  private async crawlPage(currentURL: string): Promise<void> {
    if (this.shouldStop) {
      return;
    }

    try {
      const baseURLObj = new URL(this.baseURL);
      const currentURLObj = new URL(currentURL);

      if (baseURLObj.hostname !== currentURLObj.hostname) {
        return;
      }
    } catch {
      return;
    }

    const normalizedURL = normalizeURL(currentURL);
    const isFirstVisit = this.addPageVisit(normalizedURL);
    if (!isFirstVisit) {
      return;
    }

    console.log(`crawling ${currentURL}`);
    const html = await this.getHTML(currentURL);
    if (!html || this.shouldStop) {
      return;
    }

    const nextURLs = getURLsFromHTML(html, this.baseURL);
    const crawlPromises = nextURLs.map((nextURL) => {
      const task = this.crawlPage(nextURL);
      this.allTasks.add(task);
      task.finally(() => {
        this.allTasks.delete(task);
      });
      return task;
    });
    await Promise.all(crawlPromises);
  }

  public async crawl(): Promise<Record<string, number>> {
    const initialTask = this.crawlPage(this.baseURL);
    this.allTasks.add(initialTask);
    initialTask.finally(() => {
      this.allTasks.delete(initialTask);
    });
    await initialTask;
    return this.pages;
  }
}

export async function crawlSiteAsync(
  baseURL: string,
  maxConcurrency: number = 3,
  maxPages: number = 25
): Promise<Record<string, number>> {
  const crawler = new ConcurrentCrawler(baseURL, maxConcurrency, maxPages);
  return await crawler.crawl();
}

export async function crawlPage(
  baseURL: string,
  currentURL: string = baseURL,
  pages: Record<string, number> = {}
): Promise<Record<string, number>> {
  try {
    const baseURLObj = new URL(baseURL);
    const currentURLObj = new URL(currentURL);

    if (baseURLObj.hostname !== currentURLObj.hostname) {
      return pages;
    }
  } catch (err) {
    return pages;
  }

  const normalizedCurrentURL = normalizeURL(currentURL);

  if (pages[normalizedCurrentURL] !== undefined) {
    pages[normalizedCurrentURL]++;
    return pages;
  }

  pages[normalizedCurrentURL] = 1;

  console.log(`crawling ${currentURL}`);
  const html = await getHTML(currentURL);
  if (!html) {
    return pages;
  }

  const nextURLs = getURLsFromHTML(html, baseURL);
  for (const nextURL of nextURLs) {
    pages = await crawlPage(baseURL, nextURL, pages);
  }

  return pages;
}
