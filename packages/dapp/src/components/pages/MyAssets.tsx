import { useWeb3React } from '@web3-react/core';
import React, { useState } from 'react';
import { providers } from 'ethers';
import {
  Box,
  Button,
  Image,
  SimpleGrid,
  Flex,
  Heading,
  Spacer,
  Text
} from '@chakra-ui/react';
import axios from 'axios';
import { getNFTs } from '../../modules/nftport';
import { getNFTs as readNFTsFromChain } from '../../modules/chain';
import { NFTItem } from '../../types/NFTPort';
import { truncateAddress } from '../../modules/strings';
import ImageToColors, { Color } from 'image-to-colors';
import palette from 'get-rgba-palette';
import rgbHex from 'rgb-hex';

enum MintingState {
  NOT_MINTED,
  GETTING_COLORS,
  GOT_COLORS,
  MINTING,
  MINTED
}

export const NFTCard = ({ nft }: { nft: NFTItem }) => {
  if (!nft.metadata) return <></>;
  const [dominantColors, setDominantColors] = useState<Color[]>([]);
  const [mintingState, setMintingState] = useState<MintingState>(
    MintingState.NOT_MINTED
  );
  const { image, image_url } = nft.metadata;

  let imgSrc = image ? image : image_url;

  if (imgSrc?.startsWith('ipfs://')) {
    imgSrc = imgSrc.replace('ipfs://', 'http://ipfs.io/');
  }

  const extractColors = async () => {
    setMintingState(MintingState.GETTING_COLORS);
    const _pixels = await ImageToColors.getFromExternalSource(imgSrc!, {
      setImageCrossOriginToAnonymous: true
    });
    const flatPixels = _pixels.flatMap((p) => [...p, 255]);
    const colors = palette(flatPixels, 10);
    setDominantColors(colors);
    setMintingState(MintingState.GOT_COLORS);
  };

  const doMint = async () => {
    setMintingState(MintingState.MINTING);

    setMintingState(MintingState.MINTED);
  };

  const buzy = [MintingState.GETTING_COLORS, MintingState.MINTING].includes(
    mintingState
  );
  return (
    <Flex
      rounded="2xl"
      minH="80"
      direction="column"
      overflow="hidden"
      _hover={{
        transform: 'translate(0, -3px)',
        boxShadow: 'rgba(0, 0, 0, 0.05) 0px 10px 20px 10px'
      }}
      style={{ transition: 'all ease .3s' }}
      boxShadow="rgba(0, 0, 0, 0.05) 0px 10px 20px 0px"
      justify="space-between"
    >
      <Flex direction="row">
        {dominantColors.length > 0 ? (
          <Flex direction="column" h="100%" justify="space-between" minW={15}>
            {dominantColors.map((color) => (
              <Flex
                flex="1 1 0px"
                background={`#${rgbHex(color[0], color[1], color[2])}`}
              >
                &nbsp;
              </Flex>
            ))}
          </Flex>
        ) : (
          <></>
        )}
        <Image
          src={imgSrc}
          title={imgSrc}
          boxSize="fit-content"
          objectFit="cover"
          alt={imgSrc}
          fallbackSrc="https://via.placeholder.com/800"
          opacity={buzy ? 0.2 : 1}
        />
      </Flex>
      <Box p={4}>
        <Heading size="lg">{nft.metadata?.name}</Heading>
      </Box>
      <Flex background="black" direction="row" p={6}>
        <Flex direction="column">
          <Text color="gray.200" fontWeight="bold">
            contract
          </Text>
          <Text color="white">{truncateAddress(nft.contract_address)}</Text>
        </Flex>
        <Spacer />
        {mintingState != MintingState.MINTED && (
          <Button
            variant="solid"
            onClick={
              mintingState === MintingState.GOT_COLORS ? doMint : extractColors
            }
            disabled={buzy}
          >
            {mintingState === MintingState.NOT_MINTED ? 'Get Colors' : 'Mint'}
          </Button>
        )}
      </Flex>
    </Flex>
  );
};

export const NFTList = ({ nfts }: { nfts: NFTItem[] }) => {
  return (
    <SimpleGrid columns={[2, null, 3]} spacingX="40px" spacingY="20px">
      {nfts.map((nft) => (
        <NFTCard key={`${nft.contract_address}/${nft.token_id}`} nft={nft} />
      ))}
    </SimpleGrid>
  );
};

const MyAssets = () => {
  const { account, library, chainId } = useWeb3React<providers.Web3Provider>();
  const [nfts, setNFTs] = useState<NFTItem[]>();

  const fetchAssets = async () => {
    if (!account || !library) return;
    let _nfts: NFTItem[];
    if (chainId === 4) {
      _nfts = await readNFTsFromChain({
        address: account,
        provider: library,
        chain: 'rinkeby'
      });
    } else {
      _nfts = await getNFTs({ address: account, chain: 'ethereum' });
    }
    setNFTs(_nfts.filter((n) => n.metadata !== null));
  };

  return (
    <>
      {nfts ? (
        <NFTList nfts={nfts} />
      ) : (
        <Button onClick={fetchAssets}>get my assets</Button>
      )}
    </>
  );
};

export default MyAssets;
