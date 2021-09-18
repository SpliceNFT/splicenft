#!/usr/bin/env node

import { config as dotenvConfig } from "dotenv-flow";
import { Command } from "commander";
import * as Covalent from "./lib/Covalent.js";
import { FetchCommandOptions } from "./types/ProgramOptions.js";
import fetchNFTMetaDataFromChain from "./lib/fetchNFTDataFromChain.js";

dotenvConfig();

const program = new Command();
program.version("0.0.1").name("nft");

program
  .command("fetch <nftAddress> <tokenId>")
  .option(
    "-s --strategy <strategy",
    "the strategy to use (chain|covalent)",
    "chain"
  )
  .description("fetches nft meta data")
  .action(
    async (
      nftAddress: string,
      tokenId: string,
      options: FetchCommandOptions
    ) => {
      switch (options.strategy) {
        case "chain":
          await fetchNFTMetaDataFromChain(nftAddress, tokenId);
          break;
        case "covalent":
          await Covalent.fetchNFTMetaData(nftAddress, tokenId);
          break;
      }
    }
  );

program.parseAsync(process.argv);
