import {
  Button,
  Container,
  Heading,
  Flex,
  Text,
  HStack,
  Image,
  useToast
} from '@chakra-ui/react';
import { useWeb3React } from '@web3-react/core';
import { ethers, providers } from 'ethers';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getNFT } from '../../modules/chain';
import { resolveImage } from '../../modules/img';
import Splice, { ISplice, MintingState } from '../../modules/splice';
import { NFTItem } from '../../types/NFTPort';

import palette from 'get-rgba-palette';
import ImageToColors, { Color } from 'image-to-colors';
import rgbHex from 'rgb-hex';

const DominantColors = ({ imgUrl }: { imgUrl: string }) => {
  const [dominantColors, setDominantColors] = useState<Color[]>([]);

  const extractColors = async () => {
    const _pixels = await ImageToColors.getFromExternalSource(imgUrl, {
      setImageCrossOriginToAnonymous: true
    });
    const flatPixels = _pixels.flatMap((p) => [...p, 255]);
    const colors = palette(flatPixels, 10);
    setDominantColors(colors);
  };

  useEffect(() => {
    (async () => {
      await extractColors();
    })();
  }, []);
  return dominantColors.length > 0 ? (
    <Flex direction="row" w="100%" justify="space-between" height="40px">
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
  );
};

export const NFTPage = () => {
  const { account, library } = useWeb3React<providers.Web3Provider>();
  const { collection, token_id } =
    useParams<{ collection: string; token_id: string }>();

  const [nft, setNFT] = useState<NFTItem>();

  const [splice, setSplice] = useState<ISplice>();
  const toast = useToast();

  useEffect(() => {
    if (!library) return;
    setSplice(Splice(library.getSigner()));
  }, [library]);

  const [mintingState, setMintingState] = useState<MintingState>(
    MintingState.UNKNOWN
  );

  useEffect(() => {
    if (!library) return;
    (async () => {
      const _nft = await getNFT({
        collection,
        tokenId: token_id,
        provider: library
      });
      setNFT(_nft);
    })();
  }, [library]);

  const startMinting = async () => {
    setMintingState(MintingState.MINTING);
    if (!splice || !account) return;
    try {
      const receipt = await splice.startMinting(collection, account);
      console.log(receipt);
    } catch (e) {
      toast({
        title: 'Transaction failed',
        status: 'error',
        isClosable: true
      });
    }
    setMintingState(MintingState.MINTING_REQUESTED);
  };

  // {mintingState != MintingState.MINTING_REQUESTED && (
  //   <Button
  //     variant="solid"
  //     onClick={
  //       mintingState === MintingState.GOT_COLORS
  //         ? startMinting
  //         : extractColors
  //     }
  //     disabled={buzy}
  //   >
  //     {mintingState === MintingState.NOT_MINTED
  //       ? 'Get Colors'
  //       : 'Start Minting'}
  //   </Button>
  // )}
  const imgUrl =
    resolveImage(nft?.metadata) || 'https://via.placeholder.com/800';

  return nft && splice ? (
    <Flex direction="column">
      <Container width="lg">
        <Flex rounded="lg" minH="80">
          <Image
            py={20}
            src={imgUrl}
            title={imgUrl}
            boxSize="fit-content"
            objectFit="cover"
            alt={imgUrl}
            fallbackSrc="https://via.placeholder.com/800"
            /*opacity={buzy ? 0.2 : 1}*/
          />
        </Flex>
      </Container>

      <HStack
        background="white"
        minH="100vh"
        p={5}
        justify="space-between"
        align="flex-start"
        gridGap={10}
      >
        <Flex direction="column" maxW="50%">
          <Heading size="xl" mb={7}>
            {nft.name}
          </Heading>
          <Text>{nft.metadata?.description}</Text>
        </Flex>

        <Flex boxShadow="xl" direction="column" w="50%" p={5} gridGap={5}>
          {imgUrl && <DominantColors imgUrl={imgUrl} />}
          <Button onClick={startMinting} variant="black">
            start minting
          </Button>
        </Flex>
      </HStack>
    </Flex>
  ) : (
    <div>loading</div>
  );
};
