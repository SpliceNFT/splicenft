import {
  Box,
  Button,
  Flex,
  Heading,
  Image,
  SimpleGrid,
  Spacer,
  Text
} from '@chakra-ui/react';
import { useWeb3React } from '@web3-react/core';
import { ethers, providers } from 'ethers';
import palette from 'get-rgba-palette';
import ImageToColors, { Color } from 'image-to-colors';
import React, { useEffect, useState } from 'react';
import rgbHex from 'rgb-hex';
import { CHAINS, getNFTs as readNFTsFromChain } from '../../modules/chain';
import { getNFTs } from '../../modules/nftport';
import { truncateAddress } from '../../modules/strings';
import { NFTItem } from '../../types/NFTPort';
import * as Derivatif from '../../modules/derivatif';

enum MintingState {
  NOT_MINTED,
  GETTING_COLORS,
  GOT_COLORS,
  MINTING,
  MINTING_REQUESTED
}

export const NFTCard = ({
  nft,
  derivatif
}: {
  nft: NFTItem;
  derivatif: ethers.Contract;
}) => {
  if (!nft.metadata) return <></>;

  const [dominantColors, setDominantColors] = useState<Color[]>([]);
  const [mintingState, setMintingState] = useState<MintingState>(
    MintingState.NOT_MINTED
  );

  const { account, library, chainId } = useWeb3React<providers.Web3Provider>();

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

  const startMinting = async () => {
    setMintingState(MintingState.MINTING);
    if (!derivatif || !account) return;
    console.log('start minting', nft);
    const receipt = await Derivatif.startMinting(
      derivatif,
      nft.contract_address,
      account
    );
    console.log(receipt);
    setMintingState(MintingState.MINTING_REQUESTED);
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
        {mintingState != MintingState.MINTING_REQUESTED && (
          <Button
            variant="solid"
            onClick={
              mintingState === MintingState.GOT_COLORS
                ? startMinting
                : extractColors
            }
            disabled={buzy}
          >
            {mintingState === MintingState.NOT_MINTED
              ? 'Get Colors'
              : 'Start Minting'}
          </Button>
        )}
      </Flex>
    </Flex>
  );
};

const MyAssets = () => {
  const { account, library, chainId } = useWeb3React<providers.Web3Provider>();

  const [derivatif, setDerivatif] = useState<ethers.Contract>();
  const [nfts, setNFTs] = useState<NFTItem[]>();

  useEffect(() => {
    if (!library) return;
    setDerivatif(Derivatif.getInstance(library.getSigner()));
  }, [library]);

  const fetchAssets = async () => {
    if (!account || !library || !chainId) return;
    let _nfts: NFTItem[];
    if (chainId !== 1) {
      _nfts = await readNFTsFromChain({
        address: account,
        provider: library,
        chain: CHAINS[chainId]
      });
    } else {
      _nfts = await getNFTs({ address: account, chain: 'ethereum' });
    }
    setNFTs(_nfts.filter((n) => n.metadata !== null));
  };

  return (
    <>
      {derivatif && nfts ? (
        <SimpleGrid columns={[2, null, 3]} spacingX="40px" spacingY="20px">
          {nfts.map((nft) => (
            <NFTCard
              key={`${nft.contract_address}/${nft.token_id}`}
              nft={nft}
              derivatif={derivatif}
            />
          ))}
        </SimpleGrid>
      ) : (
        <Button onClick={fetchAssets}>get my assets</Button>
      )}
    </>
  );
};

export default MyAssets;
