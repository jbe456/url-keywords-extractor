import path from "path";
import {
  setupCache,
  exportData,
  toCSVContent,
  getCSVHeaders,
  ExtractOptions,
  UrlInfo,
  ExtractUrlOptions,
  printExtractSummary,
} from "./utils";
import _ from "lodash";
import fetch from "node-fetch";
import { parse } from "node-html-parser";

const extractUrl = async ({ cache, url }: ExtractUrlOptions) =>
  await cache.wrap(`http-get-${url}`, async () => {
    console.log(`Cache miss for ${url}`);
    return await fetch(url, {
      method: "GET",
      headers: {
        "user-agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.113 Safari/537.36",
      },
      redirect: "follow",
    }).then((result) => {
      if (result.status == 200) {
        return result.text();
      } else {
        throw new Error(`Failed to fetch ${url}. Status: ${result.status}`);
      }
    });
  });

export const extract = async ({
  urls,
  output,
  cacheExpiry,
  cachePath,
}: ExtractOptions) => {
  const cache = await setupCache({
    days: cacheExpiry,
    path: cachePath,
  });

  // get urls content
  const urlInfos: UrlInfo[] = await Promise.all(
    urls.map(async (url) => {
      try {
        const html = await extractUrl({ cache, url });

        const dom = parse(html);

        // remove script, noscript, style if any
        dom.querySelectorAll("script, style, noscript").forEach((element) => {
          element.parentNode.removeChild(element);
        });

        // find body if any
        let content = dom.querySelector("body");
        if (!content) {
          // remove head if any
          const head = dom.querySelector("head");
          if (head) {
            head.parentNode.removeChild(head);
          }

          // get html if any
          const html = dom.querySelector("html");
          content = html ? html : dom;
        }

        const textContent = content.innerText
          .replace(/\r|\n|\t|&nbsp;/g, " ")
          .replace(/( )+/g, " ");
        return { url, textContent };
      } catch (e) {
        console.log(e.message);
        return { url, textContent: "" };
      }
    })
  );

  const defaultFileName = "results.csv";
  let filePath: string;
  if (output !== undefined) {
    const outputHasFileName = output && path.parse(output).ext !== "";
    filePath = outputHasFileName ? output : path.join(output, defaultFileName);
  } else {
    filePath = defaultFileName;
  }

  const csvHeaders = getCSVHeaders();
  exportData({
    content: `${csvHeaders}\n${toCSVContent({
      urlInfos,
    })}`,
    filePath,
  });

  printExtractSummary({ filePath, urlInfos });
};
