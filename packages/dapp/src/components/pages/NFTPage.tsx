import { Button, Container, Flex, HStack, useToast } from '@chakra-ui/react';
import {
  MintingState,
  MintJob,
  NFTItem,
  NFTMetaData,
  resolveImage,
  Splice
} from '@splicenft/common';
import { useWeb3React } from '@web3-react/core';
import axios from 'axios';
import { providers } from 'ethers';
import { RGB } from 'get-rgba-palette';
import { NFTStorage } from 'nft.storage';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSplice } from '../../context/SpliceContext';
import { SpliceToken } from '../../types/SpliceToken';
import { NFTDescription } from '../atoms/NFTDescription';
import { ArtworkStyleChooser } from '../molecules/ArtworkStyleChooser';
import { DominantColors } from '../molecules/DominantColors';
import { MintJobState } from '../molecules/MintJobState';
import { CreativePanel } from '../organisms/CreativePanel';
import { MetaDataDisplay } from '../organisms/MetaDataDisplay';

export const NFTPage = () => {
  const { collection, token_id: tokenId } =
    useParams<{ collection: string; token_id: string }>();

  const toast = useToast();

  const { account, chainId } = useWeb3React<providers.Web3Provider>();
  const { splice, indexer } = useSplice();

  const [isCollectionAllowed, setIsCollectionAllowed] =
    useState<boolean>(false);
  const [nft, setNFT] = useState<NFTItem>();
  const [nftImageUrl, setNFTImageUrl] = useState<string>();

  const [dominantColors, setDominantColors] = useState<RGB[]>([]);
  const [selectedRenderer, setSelectedRenderer] = useState<string>();

  const [spliceToken, setSpliceToken] = useState<SpliceToken>();
  const [spliceMetadata, setSpliceMetadata] = useState<NFTMetaData>();

  const [creativePng, setCreativePng] = useState<Blob>();
  const [sketch, setSketch] = useState<{ dataUrl: string; blob?: Blob }>();

  const [randomness, setRandomness] = useState<number>(0);

  const [mintJob, setMintJob] = useState<{ jobId: number; job: MintJob }>();
  const [mintingState, setMintingState] = useState<MintingState>(
    MintingState.UNKNOWN
  );
  const [buzy, setBuzy] = useState<boolean>(false);

  const nftStorageClient = new NFTStorage({
    token: process.env.REACT_APP_NFTSTORAGE_APIKEY as string
  });

  //find an existing job
  useEffect(() => {
    if (!collection || !tokenId || !splice) return;
    setRandomness(Splice.computeRandomnessLocally(collection, tokenId));

    splice.isCollectionAllowed(collection).then(setIsCollectionAllowed);

    (async () => {
      const res = await splice.findJobFor(collection, tokenId);
      if (res === null) return;

      setMintJob(res);
      setRandomness(res.job.randomness);
      setMintingState(Splice.translateJobStatus(res.job));

      const metadata = await splice.fetchMetadata(res.job);
      setSpliceMetadata(metadata);

      setSketch({
        dataUrl: resolveImage(metadata)
      });

      console.log('job status', res.job.status);
    })();
  }, [collection, tokenId, splice]);

  useEffect(() => {
    if (!indexer) return;
    (async () => {
      const _nft = await indexer.getAssetMetadata(collection, tokenId);
      setNFT(_nft);
      if (_nft.metadata) setNFTImageUrl(resolveImage(_nft.metadata));
    })();
  }, [indexer]);

  const onSketched = (sketch: { dataUrl: string; blob?: Blob }) => {
    setSketch(sketch);
    //setMintingState(MintingState.GENERATED);
  };

  const persistArtwork = async (blob: Blob) => {
    setBuzy(true);
    try {
      const spliceToken = await nftStorageClient.store({
        name: `Splice from ${collection}/${tokenId}`,
        description: `This Splice has been generated from ${collection}/${tokenId}`,
        image: blob,
        properties: {
          origin_collection: collection,
          origin_token_id: tokenId,
          randomness: randomness,
          colors: dominantColors,
          style: selectedRenderer
        }
      });
      setSpliceToken(spliceToken);
      setMintingState(MintingState.SAVED_IPFS);
    } catch (e) {
      toast({
        status: 'error',
        title: 'storing on nft.storage failed. Try again'
      });
    }
    setBuzy(false);
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
    setBuzy(true);
    try {
      const jobId = await splice.requestMinting(
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
        setMintJob({ jobId, job: mintJob });
      }
      setMintingState(MintingState.MINTING_REQUESTED);
    } catch (e) {
      console.log(e);
      toast({
        title: 'Transaction failed',
        status: 'error',
        isClosable: true
      });
    }
    setBuzy(false);
  };

  const executeValidator = async (splice: Splice, jobId: number) => {
    setBuzy(true);
    splice.listenForJobResults(jobId);

    try {
      const validatorBaseUrl = process.env
        .REACT_APP_VALIDATOR_BASEURL as string;
      const url = `${validatorBaseUrl}/${chainId}/${jobId}`;
      const res: { valid: boolean } = await axios.get(url, {
        responseType: 'json'
      });
      console.log(res);
      if (res.valid === true) {
        const mintJob = await splice.getMintJob(jobId);
        if (mintJob) {
          console.log(mintJob);
          setMintJob({ jobId, job: mintJob });
          if (mintJob.status == 1) {
            setMintingState(MintingState.MINTING_ALLOWED);
          }
        }
      }
    } catch (e) {
      console.log(e);
      toast({
        title: 'validation process failed',
        status: 'error',
        isClosable: true
      });
    }

    setBuzy(false);
  };

  const startMinting = async (jobId: number) => {
    const spliceNftId = await splice?.mint(jobId);
    toast({
      status: 'success',
      title: `Hooray, Splice #${spliceNftId} is yours now!`
    });
    setMintingState(MintingState.MINTED);
  };

  return (
    <Container maxW="container.xl">
      {nftImageUrl && (
        <Flex position="relative" justify="center">
          <CreativePanel
            nftImageUrl={nftImageUrl}
            rendererName={selectedRenderer}
            nftExtractedProps={{
              randomness,
              dominantColors
            }}
            onSketched={onSketched}
            spliceDataUrl={sketch?.dataUrl}
          />
          {mintingState < MintingState.GENERATED && dominantColors && (
            <Flex position="absolute" right="1.5em" bottom="-1.5em">
              <ArtworkStyleChooser
                disabled={dominantColors.length == 0}
                selectedRenderer={selectedRenderer}
                onRendererChanged={(name) => {
                  setSelectedRenderer(name);
                  setSketch(undefined);
                  setMintingState(MintingState.GENERATING);
                }}
              />
            </Flex>
          )}
        </Flex>
      )}

      <HStack
        background="white"
        minH="100vh"
        p={5}
        pt={10}
        justify="space-between"
        align="flex-start"
        gridGap={10}
      >
        <NFTDescription nft={nft} />

        <Flex boxShadow="xl" direction="column" w="50%" p={5} gridGap={5}>
          {mintJob && <MintJobState mintJob={mintJob} />}

          <DominantColors
            imageUrl={nftImageUrl}
            dominantColors={dominantColors}
            setDominantColors={setDominantColors}
          />

          {nft && (
            <MetaDataDisplay
              nft={nft}
              tokenId={tokenId}
              collection={collection}
              isCollectionAllowed={isCollectionAllowed}
              randomness={randomness}
              spliceToken={spliceToken}
              spliceMetadata={spliceMetadata}
            />
          )}

          {/*mintingState == MintingState.GENERATED && isCollectionAllowed && (
            <Button onClick={save} variant="black">
              save
            </Button>
          )*/}

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

          {mintingState == MintingState.SAVED_IPFS && spliceToken && (
            <Button
              onClick={() =>
                requestMint({
                  collection,
                  tokenId,
                  cid: spliceToken.ipnft
                })
              }
              variant="black"
              isLoading={buzy}
              loadingText="creating mint job"
            >
              request to mint
            </Button>
          )}

          {/*splice &&
              mintJob &&
              mintingState === MintingState.MINTING_REQUESTED && (
              <Button
                onClick={() => executeValidator(splice, mintJob.jobId)}
                isLoading={buzy}
                disabled={buzy}
                variant="black"
                loadingText="waiting for validation"
              >
                  request validation
              </Button>
              )*/}
          {mintJob && mintingState == MintingState.MINTING_ALLOWED && (
            <Button
              onClick={() => startMinting(mintJob.jobId)}
              variant="black"
              isLoading={buzy}
              loadingText="minting your splice"
            >
              mint your splice!
            </Button>
          )}
        </Flex>
      </HStack>
    </Container>
  );
};
