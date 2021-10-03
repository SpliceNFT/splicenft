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
import { MetaDataDisplay } from '../organisms/MetaDataDisplay';
import { NFTStorage, File } from 'nft.storage';
import { DominantColors } from '../molecules/DominantColors';
import { RGB } from 'get-rgba-palette';
import p5Types from 'p5';

export const NFTPage = () => {
  const { account, library } = useWeb3React<providers.Web3Provider>();
  const toast = useToast();

  const { collection, token_id } =
    useParams<{ collection: string; token_id: string }>();

  const [nft, setNFT] = useState<NFTItem>();
  const [splice, setSplice] = useState<ISplice>();

  const [dominantColors, setDominantColors] = useState<RGB[]>([]);
  const [p5Canvas, setP5Canvas] = useState<p5Types>();
  const [creativePng, setCreativePng] = useState<Blob>();
  const [cid, setCid] = useState<string>();
  const [dataUrl, setDataUrl] = useState<string>();

  const [mintingState, setMintingState] = useState<MintingState>(
    MintingState.UNKNOWN
  );

  const nftStorageClient = new NFTStorage({
    token: process.env.REACT_APP_NFTSTORAGE_APIKEY as string
  });

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

  const save = async () => {
    //todo this is very likely not the best idea, but... it sort of works
    const canvas = (p5Canvas as any).canvas as HTMLCanvasElement;
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setCreativePng(blob);
      },
      'image/png',
      100
    );
    setDataUrl(canvas.toDataURL('image/png'));
    setMintingState(MintingState.SAVED);
  };

  const requestMint = async ({
    collection,
    tokenId,
    cid
  }: {
    collection: string;
    tokenId: string;
    cid: string;
  }) => {
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
    const _cid = await nftStorageClient.storeBlob(blob);
    setCid(_cid);
    setMintingState(MintingState.SAVED_IPFS);
  };

  const imgUrl =
    resolveImage(nft?.metadata) || 'https://via.placeholder.com/800';

  return nft && splice ? (
    <Flex direction="column">
      <CreativePanel
        imgUrl={imgUrl}
        dominantColors={dominantColors}
        setP5Canvas={(canvas: p5Types) => {
          setP5Canvas(canvas);
          setMintingState(MintingState.GENERATED);
        }}
        dataUrl={dataUrl}
        mintingState={mintingState}
      />

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
          {imgUrl && (
            <DominantColors
              imgUrl={imgUrl}
              dominantColors={dominantColors}
              setDominantColors={setDominantColors}
            />
          )}
          {nft && (
            <MetaDataDisplay
              nft={nft}
              tokenId={token_id}
              collection={collection}
            />
          )}

          {mintingState < MintingState.GENERATING && (
            <Button
              onClick={() => setMintingState(MintingState.GENERATING)}
              variant="black"
              disabled={!dominantColors}
            >
              generate
            </Button>
          )}

          {mintingState == MintingState.GENERATED && (
            <Button onClick={save} variant="black">
              save
            </Button>
          )}

          {mintingState == MintingState.SAVED && creativePng && (
            <Button onClick={() => persistArtwork(creativePng)} variant="black">
              persist on IPFS
            </Button>
          )}

          {mintingState == MintingState.SAVED_IPFS && cid && (
            <Button
              onClick={() =>
                requestMint({
                  collection,
                  tokenId: token_id,
                  cid
                })
              }
              variant="black"
            >
              request mint
            </Button>
          )}
        </Flex>
      </HStack>
    </Flex>
  ) : (
    <div>loading</div>
  );
};
