import _ from "lodash";
import cacheManager from "cache-manager";
import fsStore from "cache-manager-fs";
import fs from "fs";
import path from "path";
import { Cache } from "cache-manager";

export type ExtractOptions = {
  urls?: string[];
  query?: string;
  output: string;
  cacheExpiry: number;
  cachePath: string;
};

type ExportOptions = {
  content: string;
  filePath: string;
};

export type ExtractUrlOptions = { cache: Cache; url: string };

export type UrlInfo = { url: string; textContent: string };

export const exportData = ({ content, filePath }: ExportOptions) => {
  const parsedPath = path.parse(filePath);

  if (parsedPath.dir) {
    fs.mkdir(parsedPath.dir, { recursive: true }, (err) => {
      if (err) throw err;
    });
  }

  fs.writeFileSync(filePath, content);
};

export const getCSVHeaders = () => {
  return ["url", "content"].join(",");
};

export const toCSVContent = ({ urlInfos }: { urlInfos: UrlInfo[] }) => {
  return urlInfos
    .map((u) => [u.url, `"${u.textContent.replace(/"/g, '""')}"`].join(","))
    .join(`\n`);
};

export const setupCache = async ({
  days,
  path,
}: {
  days: number;
  path: string;
}): Promise<Cache> => {
  return new Promise((resolve) => {
    const cache = cacheManager.caching({
      store: fsStore,
      ttl: days * 24 * 60 * 60 /* days in seconds */,
      maxsize: 1000 * 1000 * 1000 /* 1GB max size in bytes on disk */,
      path,
      zip: false,
      fillcallback: () => {
        resolve(cache);
      },
    });
  });
};

export const printExtractSummary = ({
  filePath,
  urlInfos,
}: {
  filePath: string;
  urlInfos: UrlInfo[];
}) => {
  console.log(`${urlInfos.length} results exported at ${filePath}!`);
};
