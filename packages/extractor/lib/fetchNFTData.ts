import { mkdir } from "./mkdir";
import axios from "axios";
import { CovalentNFTResponse } from "../types/CovalentResponse";
import fs from "fs";
import { ethers } from "ethers";
import erc721abi from "./erc721abi.json";
import { fetchUrlOrIpfs } from "./fetchImage";
import { getProvider } from "./provider";

/**
 * we could do this ourselves but lets use covalent, because... this is a hackathon.
 */
export async function fetchNFTMetaDataFromCovalent(
  contractAddress: string,
  tokenId: string
) {
  const directory = mkdir(contractAddress, tokenId);

  const covalentUrl = `https://api.covalenthq.com/v1/1/tokens/${contractAddress}/nft_metadata/${tokenId}/`;
  const auth = process.env.COVALENT_AUTH as string;

  const response = await axios.get<CovalentNFTResponse>(covalentUrl, {
    responseType: "json",
    headers: {
      Authorization: `Basic ${auth}:`,
    },
  });

  if (response.data.error) {
    throw response.data.error_message;
  }

  const item = response.data.data.items[0];
  const nftData = item.nft_data[0];
  const extData = nftData.external_data;
  fs.writeFileSync(
    `${directory}/metadata.json`,
    JSON.stringify(extData, null, 2)
  );

  // get images
  // note, we're using / trusting covalent here!
  const imgBuffer = (
    await axios.get(extData.image_1024, {
      responseType: "arraybuffer",
    })
  ).data;
  fs.writeFileSync(`${directory}/image.png`, imgBuffer);
}

export async function fetchNFTMetaDataFromChain(
  contractAddress: string,
  tokenId: string
) {
  const directory = mkdir(contractAddress, tokenId);

  const provider = getProvider();
  const contract = new ethers.Contract(contractAddress, erc721abi, provider);

  const tokenURI: string = await contract.tokenURI(tokenId);

  const metaData = await fetchUrlOrIpfs(tokenURI);

  fs.writeFileSync(
    `${directory}/metadata.json`,
    JSON.stringify(metaData, null, 2)
  );

  const imageUrl = metaData.image;
  const imageBuffer = await fetchUrlOrIpfs(imageUrl, "arraybuffer");
  fs.writeFileSync(`${directory}/image.png`, imageBuffer);
}
