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

const NFT_ASSET_URL = new RegExp(`(0x\\w+)[/:](\\d+)`, 'gi');

const extractNFTLink = (url: string) => {
  //https://opensea.io/assets/0x8c5029957bf42c61d19a29075dc4e00b626e5022/4949

  const matches = NFT_ASSET_URL.exec(url);
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

  const loadNft = async (url: string) => {
    if (!indexer || !url || !chainId) return;
    const collectionAndTokenId = extractNFTLink(url);
    if (!collectionAndTokenId) {
      return false;
    }
    try {
      setBuzy(true);
      const { collection, tokenId } = collectionAndTokenId;
      const nftItem = await indexer.getAsset(collection, tokenId);

      if (nftItem?.metadata) {
        const origin: CreativeOrigin = {
          nft: nftItem,
          randomness: Splice.computeRandomness(collection, tokenId),
          histogram: await getDominantColors(chainId, collection, tokenId)
        };
        setBuzy(false);
        setUrl('');
        onNFT(origin);
      }
    } catch (e: any) {
      toast({ title: e.message, status: 'warning' });
    } finally {
      setBuzy(false);
    }
  };

  const validUrl = !!url.match(NFT_ASSET_URL);

  return (
    <Flex
      as="form"
      direction="row"
      gridGap={3}
      align={chainId != 1 || (!!url && !validUrl) ? 'center' : 'flex-end'}
      onSubmit={(e) => {
        e.preventDefault();
        loadNft(url);
      }}
    >
      <FormControl flex="4" isInvalid={!!url && !validUrl}>
        <FormLabel fontSize="lg" fontWeight="bold">
          add an origin NFT URL
        </FormLabel>
        <Input
          bg="white"
          variant="filled"
          disabled={buzy || chainId !== 1}
          type="text"
          placeholder="e.g. https://opensea.io/assets/0x8c5029957bf42c61d19a29075dc4e00b626e5022/4949"
          onChange={(e) => {
            e.preventDefault();
            setUrl(e.target.value);
          }}
          value={url}
        />
        {chainId !== 1 && (
          <FormHelperText>please switch to mainnet</FormHelperText>
        )}
        {url && !validUrl && (
          <FormHelperText>cannot detect an asset url</FormHelperText>
        )}
      </FormControl>
      <Button
        isLoading={buzy}
        loadingText="loading..."
        type="submit"
        variant="black"
        size="sm"
        flex="1"
        disabled={!url || buzy || chainId != 1 || !validUrl}
        title={chainId != 1 ? 'please switch to mainnet' : ''}
      >
        Submit
      </Button>
    </Flex>
  );
};

export { ImportNFT };
