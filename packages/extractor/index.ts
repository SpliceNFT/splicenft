import { config as dotenvConfig } from "dotenv-flow";
import { Command } from "commander";
import { fetchNFTMetaData } from "./lib/fetchNFTData";
dotenvConfig();

const program = new Command();
program.version("0.0.1").name("nft");

program
  .command("fetch <nftAddress> <tokenId>")
  .description("fetches nft meta data")
  .action(async (nftAddress: string, tokenId: string) => {
    fetchNFTMetaData(nftAddress, tokenId);
  });

program.parse(process.argv);
