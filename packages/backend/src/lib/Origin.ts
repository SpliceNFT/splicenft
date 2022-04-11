import { extractColors, Histogram, LoadImageNode } from '@splicenft/colors';
import {
  ERC721,
  getIpfsPath,
  ipfsGW,
  isIpfsLocation,
  NFTMetaData,
  ProvenanceOrigin,
  resolveImage,
  Splice,
  Transfer
} from '@splicenft/common';
import axios from 'axios';
import { BigNumberish } from 'ethers';

const IPFSIO_GATEWAY = 'https://ipfs.io/ipfs/';
const IPFSDWEB_GATEWAY = 'https://dweb.link/ipfs/';
const B64_DATA_PREFIX = 'data:application/json;base64,';

function usePublicGateway(ipfsPath: string) {
  [IPFSIO_GATEWAY].map((gw) => {
    console.debug('prefetch timeout reached, getting %s from %s', ipfsPath, gw);
    axios.get(`${gw}${ipfsPath}`);
  });
}

export async function getOriginMetadata(
  erc721: ERC721,
  originTokenId: BigNumberish
): Promise<NFTMetaData | null> {
  const originMetadataUrl: string = ipfsGW(
    await erc721.tokenURI(originTokenId)
  );

  if (originMetadataUrl.startsWith(B64_DATA_PREFIX)) {
    const b64s = originMetadataUrl.replace(B64_DATA_PREFIX, '');
    const buff = Buffer.from(b64s, 'base64');
    const text = buff.toString('utf-8');
    return JSON.parse(text);
  }

  let prefetchTimeout;
  if (isIpfsLocation(originMetadataUrl)) {
    prefetchTimeout = setTimeout(() => {
      usePublicGateway(getIpfsPath(originMetadataUrl));
    }, 10000);
  }

  const metadata = (
    await axios.get<NFTMetaData>(originMetadataUrl, {
      responseType: 'json',
      timeout: 60 * 1000
    })
  ).data;

  if (prefetchTimeout) {
    clearTimeout(prefetchTimeout);
  }
  return metadata;
}

export async function extractOriginFeatures(
  provenanceOrigin: ProvenanceOrigin,
  originMetadata: NFTMetaData
): Promise<Transfer.OriginFeatures> {
  const originImageUrl =
    resolveImage(originMetadata) || originMetadata.image_data;
  let colors: Histogram = [];
  if (originImageUrl) {
    let prefetchTimeout;
    if (isIpfsLocation(originImageUrl)) {
      prefetchTimeout = setTimeout(() => {
        usePublicGateway(getIpfsPath(originImageUrl));
      }, 10000);
    }

    colors = await extractColors(originImageUrl, LoadImageNode, {});
    if (prefetchTimeout) {
      clearTimeout(prefetchTimeout);
    }
  }

  const randomness = Splice.computeRandomness(
    provenanceOrigin.collection,
    provenanceOrigin.token_id.toString()
  );
  const ret: Transfer.OriginFeatures = {
    colors,
    randomness
  };

  return ret;
}
