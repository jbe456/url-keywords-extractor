#!/usr/bin/env node
import yargs from "yargs";
import { extract } from "./extract";

yargs
  .scriptName("uce")
  .usage("$0 extract --help")
  .example("$0 extract --urls urlA", "Extract content from a list of urls")
  .command(
    "extract",
    "Extract from a list of one or multiple space separated urls",
    (yargs) => {
      yargs
        .check(function (argv) {
          if (
            (argv.urls && !argv.input && !argv.columnName) ||
            (!argv.urls && argv.input && argv.columnName)
          ) {
            return true;
          } else {
            throw new Error(
              "Error: pass at least one of 'urls' or 'input' and 'columnName' options but not both."
            );
          }
        })
        .option("urls", {
          type: "array",
          description: "A list of space-separated urls to extract content from",
        })
        .option("input", {
          type: "string",
          description: "CSV source to extract urls from",
        })
        .option("columnName", {
          type: "string",
          description: "Column name from input file to extract urls",
        })
        .option("output", {
          type: "string",
          description:
            "Destination folder or file where CSV results are exported, relative or absolute path",
        })
        .option("cacheExpiry", {
          type: "number",
          default: 31,
          description: "Number of days before cache entities expire.",
        })
        .option("cachePath", {
          type: "number",
          default: "uce-cache",
          description: "Path to the cache folder.",
        });
    },
    extract
  )
  .demandCommand(1, "")
  .help().argv;
