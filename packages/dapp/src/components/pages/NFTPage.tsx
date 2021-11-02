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

  const { splice, indexer } = useSplice();

  const [nftMetadata, setNFTMetadata] = useState<NFTMetaData>();
  const [nftImageUrl, setNFTImageUrl] = useState<string>();

  const [dominantColors, setDominantColors] = useState<RGB[]>([]);
  const [randomness, setRandomness] = useState<number>(0);

  const [selectedStyle, setSelectedStyle] = useState<Style>();

  const [heritage, setHeritage] = useState<TokenHeritage>();
  const [spliceMetadata, setSpliceMetadata] = useState<SpliceNFT>();
  const [mintingState, setMintingState] = useState<MintingState>(
    MintingState.UNKNOWN
  );

  const [sketch, setSketch] = useState<string>();
  const [buzy, setBuzy] = useState<boolean>(false);

  //find an existing splice
  useEffect(() => {
    if (!collection || !tokenId || !splice) return;
    setRandomness(Splice.computeRandomness(collection, tokenId));

    (async () => {
      const _heritage = await splice.findHeritage(collection, tokenId);
      setHeritage(_heritage === null ? undefined : _heritage);
    })();
  }, [collection, tokenId, splice]);

  useEffect(() => {
    if (!heritage || !splice) return;
    (async () => {
      const metadata = await splice.fetchMetadata(heritage);
      setMintingState(MintingState.MINTED);
      setSpliceMetadata(metadata);
      setSketch(resolveImage(metadata));
    })();
  }, [heritage]);

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
    //setSketch(dataUrl);
    setMintingState(MintingState.GENERATED);
  };

  const onMinted = async ({
    transactionHash,
    spliceTokenId
  }: {
    transactionHash: string;
    spliceTokenId: number | undefined;
  }) => {
    if (!spliceTokenId) {
      toast({
        status: 'info',
        title: `the minting transaction is on its way`,
        description: transactionHash
      });
    } else {
      toast({
        status: 'success',
        title: `Hooray, Splice #${spliceTokenId} is yours now!`
      });

      if (splice) {
        const _heritage = await splice.getHeritage(spliceTokenId);
        if (_heritage) {
          setHeritage(_heritage);
        }
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
            style={selectedStyle}
            nftExtractedProps={{
              randomness,
              dominantColors
            }}
            onSketched={onSketched}
            spliceDataUrl={sketch}
          />

          <Flex position="absolute" right="1.5em" bottom="-1.5em" gridGap={6}>
            {mintingState < MintingState.MINTED && dominantColors && (
              <ArtworkStyleChooser
                disabled={dominantColors.length == 0 || buzy}
                selectedStyle={selectedStyle}
                onStyleChanged={(style: Style) => {
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
              <Button as={Link} href={sketch} isExternal variant="white">
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
          styleNFT={selectedStyle?.getMetadata()}
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
