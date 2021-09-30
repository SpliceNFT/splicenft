import {
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Image,
  Text,
  useToast
} from '@chakra-ui/react';
import { useWeb3React } from '@web3-react/core';
import { providers } from 'ethers';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getNFT } from '../../modules/chain';
import { resolveImage } from '../../modules/img';
import Splice, { ISplice, MintingState } from '../../modules/splice';
import { NFTItem } from '../../types/NFTPort';
import { CreativePanel } from '../organisms/CreativePanel';
import { NFTStorage, File } from 'nft.storage';

export const NFTPage = () => {
  const { account, library } = useWeb3React<providers.Web3Provider>();
  const toast = useToast();

  const { collection, token_id } =
    useParams<{ collection: string; token_id: string }>();

  const [nft, setNFT] = useState<NFTItem>();
  const [splice, setSplice] = useState<ISplice>();

  const [creativePng, setCreativePng] = useState<Blob>();

  const [mintingState, setMintingState] = useState<MintingState>(
    MintingState.UNKNOWN
  );

  useEffect(() => {
    if (!library) return;
    setSplice(Splice(library.getSigner()));
  }, [library]);

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

  const nftStorageClient = new NFTStorage({
    token: process.env.REACT_APP_NFTSTORAGE_APIKEY as string
  });

  const startMinting = async () => {
    setMintingState(MintingState.MINTING);
    if (!splice || !account) return;
    try {
      //const receipt = await splice.startMinting(collection, account);
    } catch (e) {
      toast({
        title: 'Transaction failed',
        status: 'error',
        isClosable: true
      });
    }
    setMintingState(MintingState.MINTING_REQUESTED);
  };

  const persistArtwork = async (blob: Blob) => {
    setCreativePng(blob);
    const cid = await nftStorageClient.storeBlob(blob);
    console.log(cid);
  };

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
          <CreativePanel imgUrl={imgUrl} onCreated={persistArtwork} />
          {creativePng && (
            <Button onClick={startMinting} variant="black">
              start minting
            </Button>
          )}
        </Flex>
      </HStack>
    </Flex>
  ) : (
    <div>loading</div>
  );
};
