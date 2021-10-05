import {
  Button,
  Flex,
  Heading,
  HStack,
  Text,
  useToast
} from '@chakra-ui/react';
import { useWeb3React } from '@web3-react/core';
import { ethers, providers } from 'ethers';
import { RGB } from 'get-rgba-palette';
import { NFTStorage } from 'nft.storage';
import p5Types from 'p5';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getNFT } from '../../modules/chain';
import { resolveImage } from '../../modules/img';

import { MintingState, MintJob, Splice } from '@splicenft/common';

import { NFTItem } from '../../types/NFTPort';
import { DominantColors } from '../molecules/DominantColors';
import { CreativePanel } from '../organisms/CreativePanel';
import { MetaDataDisplay } from '../organisms/MetaDataDisplay';
import { SpliceToken } from '../../types/SpliceToken';

export const NFTPage = () => {
  const { library, account } = useWeb3React<providers.Web3Provider>();
  const toast = useToast();

  const { collection, token_id } =
    useParams<{ collection: string; token_id: string }>();

  const [nft, setNFT] = useState<NFTItem>();
  const [splice, setSplice] = useState<Splice>();

  const [dominantColors, setDominantColors] = useState<RGB[]>([]);
  const [p5Canvas, setP5Canvas] = useState<p5Types>();
  const [creativePng, setCreativePng] = useState<Blob>();

  const [spliceMetadata, setSpliceMetadata] = useState<SpliceToken>();

  const [dataUrl, setDataUrl] = useState<string>();
  const [randomness, setRandomness] = useState<number>(0);

  const [mintJob, setMintJob] = useState<MintJob>();
  const [mintingState, setMintingState] = useState<MintingState>(
    MintingState.UNKNOWN
  );
  const [buzy, setBuzy] = useState<boolean>(false);

  const nftStorageClient = new NFTStorage({
    token: process.env.REACT_APP_NFTSTORAGE_APIKEY as string
  });

  useEffect(() => {
    if (!library) return;
    const spl = Splice.from(
      process.env.REACT_APP_SPLICE_CONTRACT_ADDRESS as string,
      library.getSigner()
    );

    setSplice(spl);
  }, [library]);

  useEffect(() => {
    if (!collection || !token_id) return;
    setRandomness(Splice.computeRandomnessLocally(collection, token_id));
    if (!splice) return;
    (async () => {
      const job = await splice.findJobFor(collection, token_id);
      if (job != null) setMintJob(job);
    })();
  }, [collection, token_id, splice]);

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

  const persistArtwork = async (blob: Blob) => {
    setBuzy(true);
    const metadata = await nftStorageClient.store({
      name: `Splice from ${collection}/${token_id}`,
      description: `Splice from ${collection}/${token_id}`,
      image: blob,
      properties: {
        colors: dominantColors
      }
    });

    setBuzy(false);
    setSpliceMetadata(metadata);
    setMintingState(MintingState.SAVED_IPFS);
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
    if (!splice || !account) return;
    try {
      const jobId = await splice.startMinting(
        collection,
        tokenId,
        cid,
        account
      );
      console.log('job created', jobId);
      //setMintJobId(jobId);
      const mintJob = await splice.getMintJob(jobId);
      if (!mintJob) {
        console.error('this job should exist', jobId);
      } else {
        setMintJob(mintJob);
      }
    } catch (e) {
      console.log(e);
      toast({
        title: 'Transaction failed',
        status: 'error',
        isClosable: true
      });
    }
    //setMintingState(MintingState.MINTING_REQUESTED);
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
        randomness={randomness}
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
          {mintJob && (
            <Text color="red.600">
              We're minting a splice for this token. Job requested by:{' '}
              {mintJob.requestor}
            </Text>
          )}
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
              randomness={randomness}
              spliceMetadata={spliceMetadata}
            />
          )}

          {mintingState < MintingState.GENERATING && (
            <Button
              onClick={() => setMintingState(MintingState.GENERATING)}
              variant="black"
              disabled={!dominantColors}
            >
              generate artwork
            </Button>
          )}

          {mintingState == MintingState.GENERATED && (
            <Button onClick={save} variant="black">
              save
            </Button>
          )}

          {mintingState == MintingState.SAVED && creativePng && (
            <Button
              onClick={() => persistArtwork(creativePng)}
              variant="black"
              isLoading={buzy}
              loadingText="persisting on IPFS"
            >
              persist on IPFS
            </Button>
          )}

          {mintingState == MintingState.SAVED_IPFS && spliceMetadata && (
            <Button
              onClick={() =>
                requestMint({
                  collection,
                  tokenId: token_id,
                  cid: spliceMetadata.ipnft
                })
              }
              variant="black"
              isLoading={buzy}
              loadingText="creating mint job"
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
