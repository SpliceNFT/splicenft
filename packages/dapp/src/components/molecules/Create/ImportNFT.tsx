import {
  Button,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  useToast
} from '@chakra-ui/react';
import { Splice } from '@splicenft/common';
import { useWeb3React } from '@web3-react/core';
import { useState } from 'react';
import { useSplice } from '../../../context/SpliceContext';
import getDominantColors from '../../../modules/colors';
import { CreativeOrigin } from '../../../types/CreativeOrigin';

const OPENSEA_ASSET_URL = new RegExp(
  `https://opensea.io/assets/(0x.+)/(.+)`,
  'gi'
);

const extractOpenseaLink = (url: string) => {
  //https://opensea.io/assets/0x8c5029957bf42c61d19a29075dc4e00b626e5022/4949

  const matches = OPENSEA_ASSET_URL.exec(url);
  if (!matches) return;

  return {
    collection: matches[1],
    tokenId: matches[2]
  };
};

const ImportNFT = ({
  onNFT
}: {
  onNFT: (origin: CreativeOrigin) => unknown;
}) => {
  const [url, setUrl] = useState<string>('');
  const toast = useToast();
  const { indexer } = useSplice();
  const { chainId } = useWeb3React();
  const [buzy, setBuzy] = useState<boolean>(false);
  const loadNft = async () => {
    if (!indexer || !url || !chainId) return;
    const x = extractOpenseaLink(url);
    if (!x) return false;
    try {
      setBuzy(true);
      const { collection, tokenId } = x;
      const nftItem = await indexer.getAsset(collection, tokenId);

      if (nftItem?.metadata) {
        const origin: CreativeOrigin = {
          nft: nftItem,
          randomness: Splice.computeRandomness(collection, tokenId),
          histogram: await getDominantColors(chainId, collection, tokenId)
        };
        onNFT(origin);
        setUrl('');
      }
    } catch (e: any) {
      toast({ title: e.message, status: 'warning' });
    } finally {
      setBuzy(false);
    }
  };

  return (
    <Flex
      as="form"
      direction="row"
      gridGap={3}
      w="full"
      align="center"
      onSubmit={(e) => {
        e.preventDefault();
        loadNft();
      }}
    >
      <FormControl flex="4">
        <FormLabel>NFT URL</FormLabel>
        <Input
          bg="white"
          variant="filled"
          type="text"
          placeholder="e.g. https://opensea.io/assets/0x8c5029957bf42c61d19a29075dc4e00b626e5022/4949"
          onChange={(e) => setUrl(e.target.value)}
          value={url}
        />
        <FormHelperText>try an OpenSea asset URL</FormHelperText>
      </FormControl>
      <Button
        isLoading={buzy}
        type="submit"
        variant="black"
        flex="1"
        disabled={!url || buzy}
      >
        Submit
      </Button>
    </Flex>
  );
};

export { ImportNFT };
