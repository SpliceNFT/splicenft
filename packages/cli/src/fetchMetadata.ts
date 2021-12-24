import fs from 'fs';
import spinner from './spinner';

import axios from 'axios';
import { OnChain, resolveImage, getProvider } from '@splicenft/common';

export async function fetchNFTMetaData(
  contractAddress: string,
  tokenId: string
): Promise<string | null> {
  const path = `.cache/${contractAddress}/${tokenId}`;
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, {
      recursive: true
    });
  }

  spinner.succeed(`created ${path}`);

  try {
    spinner.start('getting tokenURI from contract');
    const { provider } = getProvider(process.env.ETH_NETWORK as string, {
      infuraKey: process.env.INFURA_KEY
    });

    const indexer = new OnChain(provider, [contractAddress]);

    spinner.start('fetching meta data');
    const nftItem = await indexer.getAsset(contractAddress, tokenId);
    if (!nftItem) {
      spinner.fail('fetching metadata failed');
      return null;
    }
    spinner.succeed();

    fs.writeFileSync(`${path}/metadata.json`, JSON.stringify(nftItem, null, 2));

    const imageUrl = resolveImage(nftItem.metadata);
    spinner.start(`fetching image from ${imageUrl}`);

    const imageBuffer = (
      await axios.get(imageUrl, {
        responseType: 'arraybuffer'
      })
    ).data;
    fs.writeFileSync(`${path}/image.png`, imageBuffer);
    spinner.succeed();
    return path;
  } catch (e: any) {
    spinner.fail(e.toString());
    return null;
  }
}
