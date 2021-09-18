import { ethers } from "ethers";
import fs from "fs";
import spinner from "./cli/spinner.js";
//@ts-ignore
import erc721abi from "./erc721abi.js";
import { fetchUrlOrIpfs } from "./fetchImage.js";
import { mkdir } from "./cli/mkdir.js";
import { getProvider } from "./provider.js";

export default async function fetchNFTMetaDataFromChain(
  contractAddress: string,
  tokenId: string
): Promise<void> {
  const directory = mkdir(contractAddress, tokenId);
  spinner.succeed(`created ${directory}`);

  const provider = getProvider();
  const contract = new ethers.Contract(contractAddress, erc721abi, provider);

  try {
    spinner.start("getting tokenURI from contract");
    const tokenURI: string = await contract.tokenURI(tokenId);
    spinner.succeed(`TokenURI: ${tokenURI}`);

    spinner.start("fetching meta data");
    const metaData = await fetchUrlOrIpfs(tokenURI);
    spinner.succeed();

    fs.writeFileSync(
      `${directory}/metadata.json`,
      JSON.stringify(metaData, null, 2)
    );

    const imageUrl = metaData.image;
    spinner.start(`fetching image from ${imageUrl}`);
    const imageBuffer = await fetchUrlOrIpfs(imageUrl, "arraybuffer");
    fs.writeFileSync(`${directory}/image.png`, imageBuffer);
    spinner.succeed();
  } catch (e: any) {
    spinner.fail(e.toString());
    return;
  }
}
