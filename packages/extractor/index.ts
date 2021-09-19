#!/usr/bin/env node

import { config as dotenvConfig } from "dotenv-flow";
import { Command } from "commander";
import { FetchCommandOptions } from "./types/ProgramOptions";
import { extractColors } from "./lib/extractColors";
import * as Strategy from "./lib/strategies/index";
import spinner from "./lib/cli/spinner";

dotenvConfig();

const program = new Command();
program.version("0.0.1").name("nft");

program
  .command("fetch <nftAddress> <tokenId>")
  .option(
    "-s --strategy <strategy>",
    "the strategy to use (chain|covalent|nftport)",
    "chain"
  )
  .description(
    "fetches nft meta data. Make sure to set the respective authorization keys in your environment"
  )
  .action(
    async (
      nftAddress: string,
      tokenId: string,
      options: FetchCommandOptions
    ) => {
      spinner.info(
        `using *${options.strategy}* to fetch #${tokenId} from ${nftAddress}`
      );
      switch (options.strategy) {
        case "chain":
          await Strategy.Chain(nftAddress, tokenId);
          break;
        case "covalent":
          await Strategy.Covalent(nftAddress, tokenId);
          break;
        case "nftport":
          await Strategy.NftPort(nftAddress, tokenId);
          break;
      }
    }
  );

program
  .command("colors <nftAddress> <tokenId>")
  .action(
    async (
      nftAddress: string,
      tokenId: string,
      options: FetchCommandOptions
    ) => {
      const colors = await extractColors(nftAddress, tokenId);
      console.log(colors);
    }
  );

program.parseAsync(process.argv);
