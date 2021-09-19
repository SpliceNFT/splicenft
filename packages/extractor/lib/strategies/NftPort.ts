import axios from 'axios';
import fs from 'fs';
import { NftPortNFTResponse } from '../../types/NFTPortResponse';
import { mkdir } from '../cli/mkdir';
import spinner from '../cli/spinner';

const BASE_URI = `https://api.nftport.xyz`;

export default async function fetchNFTMetaData(
  contractAddress: string,
  tokenId: string
) {
  const directory = mkdir(contractAddress, tokenId);
  spinner.succeed(`created ${directory}`);

  const nftPortUrl = `${BASE_URI}/nfts/${contractAddress}/${tokenId}`;

  try {
    const auth = process.env.NFTPORT_AUTH as string;

    spinner.start('fetching metadata from NFTPort API');
    const _resp = await axios.get<NftPortNFTResponse>(nftPortUrl, {
      responseType: 'json',
      params: {
        chain: 'ethereum'
      },
      headers: {
        Authorization: auth
      }
    });

    const response = _resp.data;
    if (response.error) {
      throw response.error;
    }
    spinner.succeed();

    fs.writeFileSync(
      `${directory}/metadata.json`,
      JSON.stringify(response.nft.metadata, null, 2)
    );

    spinner.start(`fetching image from cache ${response.nft.cached_image_url}`);
    const imgBuffer = (
      await axios.get(response.nft.cached_image_url, {
        responseType: 'arraybuffer'
      })
    ).data;
    fs.writeFileSync(`${directory}/image.png`, imgBuffer);
    spinner.succeed();
  } catch (e: any) {
    spinner.fail(e.toString());
    return;
  }
}
