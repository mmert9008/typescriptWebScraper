import { crawlSiteAsync } from "./crawl";

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1 || args.length > 3) {
    console.error("usage: npm run start <URL> [maxConcurrency] [maxPages]");
    process.exit(1);
  }

  const baseURL = args[0];
  const maxConcurrency = args[1] ? parseInt(args[1], 10) : 3;
  const maxPages = args[2] ? parseInt(args[2], 10) : 25;

  console.log(
    `Starting crawl of ${baseURL} with maxConcurrency=${maxConcurrency} and maxPages=${maxPages}`
  );

  const pages = await crawlSiteAsync(baseURL, maxConcurrency, maxPages);

  console.log("\n--- Crawl Report ---");
  for (const [page, count] of Object.entries(pages)) {
    console.log(`Found ${count} internal links to ${page}`);
  }
}

main();
