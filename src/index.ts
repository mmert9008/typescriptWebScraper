import { getHTML } from "./crawl";

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error("error: no website provided");
    process.exit(1);
  }

  if (args.length > 1) {
    console.error("error: too many arguments provided");
    process.exit(1);
  }

  const baseURL = args[0];
  console.log(`Starting crawl of ${baseURL}`);

  const html = await getHTML(baseURL);
  if (html) {
    console.log(html);
  }
}

main();
