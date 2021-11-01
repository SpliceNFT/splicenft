import {
  Button,
  Container,
  Divider,
  Flex,
  HStack,
  Link,
  Heading,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Text,
  useToast
} from '@chakra-ui/react';
import {
  MintingState,
  TokenHeritage,
  NFTMetaData,
  resolveImage,
  Splice,
  SpliceNFT,
  StyleNFTResponse
} from '@splicenft/common';
import { useWeb3React } from '@web3-react/core';
import axios from 'axios';
import { ethers, providers } from 'ethers';
import { RGB } from 'get-rgba-palette';
import React, { useEffect, useState } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { useSplice } from '../../context/SpliceContext';
import { ArtworkStyleChooser } from '../atoms/ArtworkStyleChooser';
import { NFTDescription } from '../atoms/NFTDescription';
import { DominantColors } from '../molecules/DominantColors';
import { MintSpliceButton } from '../molecules/MintSpliceButton';
import { CreativePanel } from '../organisms/CreativePanel';
import {
  MetaDataDisplay,
  SpliceMetadataDisplay
} from '../organisms/MetaDataDisplay';

export const NFTPage = () => {
  const { collection, token_id: tokenId } =
    useParams<{ collection: string; token_id: string }>();

  const toast = useToast();

  const { account, chainId } = useWeb3React<providers.Web3Provider>();
  const { splice, indexer } = useSplice();

  const [nftMetadata, setNFTMetadata] = useState<NFTMetaData>();
  const [nftImageUrl, setNFTImageUrl] = useState<string>();

  const [dominantColors, setDominantColors] = useState<RGB[]>([]);
  const [randomness, setRandomness] = useState<number>(0);

  const [selectedStyle, setSelectedStyle] = useState<StyleNFTResponse>();

  const [heritage, setHeritage] = useState<TokenHeritage>();
  const [spliceMetadata, setSpliceMetadata] = useState<SpliceNFT>();
  const [mintingState, setMintingState] = useState<MintingState>(
    MintingState.UNKNOWN
  );

  const [sketch, setSketch] = useState<{ dataUrl: string; blob?: Blob }>();
  const [buzy, setBuzy] = useState<boolean>(false);

  //find an existing splice
  useEffect(() => {
    if (!collection || !tokenId || !splice) return;
    setRandomness(Splice.computeRandomness(collection, tokenId));

    (async () => {
      const _heritage = await splice.findHeritage(collection, tokenId);
      if (_heritage === null) return;

      setHeritage(_heritage);
      setMintingState(MintingState.MINTED);

      const metadata = await splice.fetchMetadata(_heritage);
      setSpliceMetadata(metadata);

      setSketch({
        dataUrl: resolveImage(metadata)
      });

      console.log('md', metadata);
    })();
  }, [collection, tokenId, splice]);

  useEffect(() => {
    if (!indexer) return;
    (async () => {
      const _nftMetadata = await indexer.getAssetMetadata(collection, tokenId);
      if (_nftMetadata) {
        setNFTMetadata(_nftMetadata);
        setNFTImageUrl(resolveImage(_nftMetadata));
      }
    })();
  }, [indexer]);

  const onSketched = (sketch: { dataUrl: string; blob?: Blob }) => {
    setSketch(sketch);
    setMintingState(MintingState.GENERATED);
  };

  const onMinted = async (spliceTokenId: number) => {
    toast({
      status: 'success',
      title: `Hooray, Splice #${spliceTokenId} is yours now!`
    });
    setMintingState(MintingState.MINTED);
    if (splice) {
      const _heritage = await splice.getHeritage(spliceTokenId);
      if (_heritage) {
        setHeritage(_heritage);
      }
    }
  };

  const persistArtwork = async (blob: Blob) => {
    // setBuzy(true);
    // try {
    //   const spliceMetadata = {
    //     name: `Splice from ${collection}/${tokenId}`,
    //     description: `This Splice has been generated from ${collection}/${tokenId}`,
    //     properties: {
    //       origin_collection: collection,
    //       origin_token_id: tokenId,
    //       randomness: randomness,
    //       colors: dominantColors,
    //       style: selectedRenderer
    //     }
    //   };
    //   const spliceToken = await nftStorageClient.store({
    //     ...spliceMetadata,
    //     image: blob
    //   });
    //   setSpliceMetadata({
    //     ...spliceMetadata,
    //     external_url: spliceToken.url.toString(),
    //     image: spliceToken.url.toString()
    //   });
    //   setMintingState(MintingState.PERSISTED);
    // } catch (e) {
    //   toast({
    //     status: 'error',
    //     title: 'storing on nft.storage failed. Try again'
    //   });
    // }
    // setBuzy(false);
  };

  const executeValidator = async () => {
    setBuzy(true);

    try {
      if (!splice) throw 'no splice instance';

      const validatorBaseUrl = process.env
        .REACT_APP_VALIDATOR_BASEURL as string;
      const url = `${validatorBaseUrl}/validate/${chainId}`;
      const res: { valid: boolean; signature: string } = (
        await axios.post(
          url,
          {
            style_token_id: 1,
            origin_collection: collection,
            origin_token_id: tokenId
          },
          { responseType: 'json' }
        )
      ).data;

      if (res.valid === true) {
        setMintingState(MintingState.VALIDATED);
      }
    } catch (e: any) {
      console.error(e);
      toast({
        title: `validation process failed, ${e.message}`,
        status: 'error',
        isClosable: true
      });
    }

    setBuzy(false);
  };

  return (
    <Container maxW="container.xl">
      <Breadcrumb>
        <BreadcrumbItem>
          <BreadcrumbLink as={NavLink} to="/my-assets">
            Your Assets
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink isLastChild>
            Mint Splice for {nftMetadata?.name}
          </BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      {nftImageUrl && (
        <Flex position="relative" justify="center" mt={6}>
          <CreativePanel
            nftImageUrl={nftImageUrl}
            style={selectedStyle}
            nftExtractedProps={{
              randomness,
              dominantColors
            }}
            onSketched={onSketched}
            spliceDataUrl={sketch?.dataUrl}
          />

          <Flex position="absolute" right="1.5em" bottom="-1.5em" gridGap={6}>
            {mintingState < MintingState.MINTED && dominantColors && (
              <ArtworkStyleChooser
                disabled={dominantColors.length == 0 || buzy}
                selectedStyle={selectedStyle}
                onStyleChanged={(style: StyleNFTResponse) => {
                  setSelectedStyle(style);
                  setSketch(undefined);
                }}
              />
            )}

            {mintingState === MintingState.GENERATED && selectedStyle && (
              <MintSpliceButton
                collection={collection}
                originTokenId={tokenId}
                selectedStyle={selectedStyle}
                onMinted={onMinted}
              />
            )}

            {mintingState === MintingState.MINTED && (
              <Button
                as={Link}
                href={sketch?.dataUrl}
                isExternal
                variant="white"
              >
                download
              </Button>
            )}
          </Flex>
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
        <NFTDescription
          nftMetadata={nftMetadata}
          styleNFT={selectedStyle?.metadata}
        />

        <Flex boxShadow="xl" direction="column" w="50%" p={5} gridGap={5}>
          <DominantColors
            imageUrl={nftImageUrl}
            dominantColors={dominantColors}
            setDominantColors={setDominantColors}
          />

          {nftMetadata && (
            <MetaDataDisplay
              contractAddress={collection}
              tokenId={tokenId}
              nftMetadata={nftMetadata}
              randomness={randomness}
            />
          )}

          {spliceMetadata && (
            <>
              <Divider />
              <SpliceMetadataDisplay spliceMetadata={spliceMetadata} />
            </>
          )}

          {/*mintingState == MintingState.PERSISTED (
            <Flex align="center" direction="column">
              <Button
                width="full"
                onClick={() =>
                  requestMint({
                    collection,
                    tokenId,
                    cid: spliceMetadataCID
                  })
                }
                variant="black"
                disabled={!isCollectionAllowed}
                isLoading={buzy}
                loadingText="creating mint job"
              >
                request to mint
              </Button>
              {!isCollectionAllowed && (
                <Text color="red.500">
                  minting NFTs of this collection is not allowed right now
                </Text>
              )}
            </Flex>
              )*/}

          {/*mintingState === MintingState.MINTING_REQUESTED && (
            <Button
              onClick={executeValidator}
              isLoading={buzy}
              disabled={buzy}
              variant="black"
              loadingText="waiting for validation"
            >
              request validation
            </Button>
          )*/}

          {/*mintJob && mintingState == MintingState.MINTING_ALLOWED && (
            <Button
              onClick={() => startMinting(mintJob.jobId)}
              variant="black"
              isLoading={buzy}
              loadingText="minting your splice"
            >
              mint your splice!
            </Button>
          )*/}
        </Flex>
      </HStack>
    </Container>
  );
};
