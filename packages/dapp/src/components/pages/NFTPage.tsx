import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Button,
  Container,
  Divider,
  Flex,
  HStack,
  Link,
  useToast
} from '@chakra-ui/react';
import {
  MintingState,
  NFTMetaData,
  resolveImage,
  Splice,
  SpliceNFT,
  Style,
  TokenHeritage
} from '@splicenft/common';
import { useWeb3React } from '@web3-react/core';
import { providers } from 'ethers';
import { RGB } from 'get-rgba-palette';
import React, { useEffect, useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
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

  // const [selectedStyle, setSelectedStyle] = useState<Style>();
  // const [sketch, setSketch] = useState<string>();

  const [styleAndSketch, setStyleAndSketch] = useState<{
    style?: Style | undefined;
    sketch?: string | undefined;
  }>({});

  const [heritage, setHeritage] = useState<TokenHeritage>();
  const [spliceMetadata, setSpliceMetadata] = useState<SpliceNFT>();
  const [mintingState, setMintingState] = useState<MintingState>(
    MintingState.UNKNOWN
  );

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

      setStyleAndSketch({ style: undefined, sketch: resolveImage(metadata) });
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

  const onSketched = (dataUrl: string) => {
    setStyleAndSketch({ style: styleAndSketch.style, sketch: dataUrl });
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
            styleAndSketch={styleAndSketch}
            nftExtractedProps={{
              randomness,
              dominantColors
            }}
            onSketched={onSketched}
          />

          <Flex position="absolute" right="1.5em" bottom="-1.5em" gridGap={6}>
            {mintingState < MintingState.MINTED && dominantColors && (
              <ArtworkStyleChooser
                disabled={dominantColors.length == 0 || buzy}
                selectedStyle={styleAndSketch.style}
                onStyleChanged={(style: Style) => {
                  setStyleAndSketch({ style, sketch: undefined });
                }}
              />
            )}

            {MintingState.GENERATED === mintingState && styleAndSketch.style ? (
              <MintSpliceButton
                collection={collection}
                originTokenId={tokenId}
                selectedStyle={styleAndSketch.style}
                onMinted={onMinted}
              />
            ) : (
              ''
            )}

            {mintingState === MintingState.MINTED && (
              <Button
                as={Link}
                href={styleAndSketch.sketch}
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
          styleNFT={styleAndSketch.style?.getMetadata()}
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
        </Flex>
      </HStack>
    </Container>
  );
};
