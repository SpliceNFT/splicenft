import axios from "axios";
import fs from "fs";
import { CovalentNFTResponse } from "../types/CovalentResponse.js";
import spinner from "./cli/spinner.js";
import { mkdir } from "./cli/mkdir.js";
import fetch from "node-fetch";

const BASE_URI = `https://api.covalenthq.com/v1`;

export async function fetchNFTMetaData(
  contractAddress: string,
  tokenId: string
) {
  const directory = mkdir(contractAddress, tokenId);
  spinner.succeed(`created ${directory}`);

  const covalentUrl = `${BASE_URI}/1/tokens/${contractAddress}/nft_metadata/${tokenId}/`;

  try {
    const auth = process.env.COVALENT_AUTH as string;

    spinner.start("fetching metadata from Covalent API");

    const response: CovalentNFTResponse = (await (
      await fetch(covalentUrl, {
        method: "get",
        headers: {
          Authorization: `Basic ${auth}:`,
        },
      })
    ).json()) as CovalentNFTResponse;
    // const response = await axios.get<CovalentNFTResponse>(covalentUrl, {
    //   responseType: "json",
    //   headers: {

    //   },
    // });

    if (response.error) {
      throw response.error_message;
    }
    spinner.succeed();

    const item = response.data.items[0];
    const nftData = item.nft_data[0];
    const extData = nftData.external_data;
    fs.writeFileSync(
      `${directory}/metadata.json`,
      JSON.stringify(extData, null, 2)
    );
    const imageUrl = extData.image_1024;
    spinner.start(`fetching image from ${imageUrl}`);
    const imgBuffer = (
      await axios.get(imageUrl, {
        responseType: "arraybuffer",
      })
    ).data;
    fs.writeFileSync(`${directory}/image.png`, imgBuffer);
    spinner.succeed();
  } catch (e: any) {
    spinner.fail(e.toString());
    return;
  }
}
