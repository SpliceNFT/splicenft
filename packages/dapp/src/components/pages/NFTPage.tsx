import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Button,
  Container,
  Flex,
  Heading,
  Link,
  SimpleGrid,
  useToast
} from '@chakra-ui/react';
import {
  NFTMetaData,
  resolveImage,
  Splice,
  SpliceNFT,
  Style,
  TokenProvenance
} from '@splicenft/common';
import { useWeb3React } from '@web3-react/core';
import { RGB } from 'get-rgba-palette';
import { FaCloudDownloadAlt } from 'react-icons/fa';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { useSplice } from '../../context/SpliceContext';
import { ArtworkStyleChooser } from '../atoms/ArtworkStyleChooser';
import { NFTDescription } from '../atoms/NFTDescription';
import { DominantColorsDisplay } from '../molecules/DominantColors';
import { MintSpliceButton } from '../molecules/MintSpliceButton';
import { CreativePanel } from '../organisms/CreativePanel';
import {
  MetaDataDisplay,
  MetaDataItem,
  SpliceMetadataDisplay
} from '../organisms/MetaDataDisplay';

export const NFTPage = () => {
  const { collection, token_id: tokenId } =
    useParams<{ collection: string; token_id: string }>();

  const toast = useToast();

  const randomness = Splice.computeRandomness(collection, tokenId);

  const { splice, indexer, spliceStyles } = useSplice();
  const { account, chainId } = useWeb3React();

  const [nftMetadata, setNFTMetadata] = useState<NFTMetaData>();
  const [nftImageUrl, setNFTImageUrl] = useState<string>();

  const [dominantColors, setDominantColors] = useState<RGB[]>([]);

  const [selectedStyle, setSelectedStyle] = useState<Style>();

  const [allProvenances, setAllProvenances] = useState<TokenProvenance[]>();
  const [provenance, setProvenance] = useState<TokenProvenance>();
  const [spliceOwner, setSpliceOwner] = useState<string>();
  const [spliceMetadata, setSpliceMetadata] = useState<SpliceNFT>();

  const [sketch, setSketch] = useState<string>();
  const [buzy, setBuzy] = useState<boolean>(false);

  useEffect(() => {
    if (!splice) return;
    (async () => {
      await splice.findProvenances(collection, tokenId).then(setAllProvenances);
    })();
  }, [splice]);

  useEffect(() => {
    if (!allProvenances || allProvenances.length === 0 || !spliceStyles) return;

    if (selectedStyle) {
      setProvenance(
        allProvenances.find(
          (prov) =>
            prov.origin_collection == collection &&
            prov.origin_token_id.toString() == tokenId &&
            prov.style_token_id == selectedStyle.tokenId
        )
      );
    } else {
      const _style = spliceStyles.find(
        (s) => s.tokenId == allProvenances[0].style_token_id
      );
      setSelectedStyle(_style);
    }
  }, [allProvenances, selectedStyle, spliceStyles]);

  useEffect(() => {
    (async () => {
      if (!splice) return;
      if (!provenance) {
        setSpliceMetadata(undefined);
        setSpliceOwner(undefined);
        return;
      }
      await splice.ownerOf(provenance.splice_token_id).then(setSpliceOwner);
      const _metadata = await splice.getMetadata(provenance);
      setDominantColors(_metadata.splice.colors);
      setSpliceMetadata(_metadata);
      setSketch(resolveImage(_metadata));
    })();
  }, [splice, provenance]);

  useEffect(() => {
    if (!indexer) return;
    (async () => {
      const _nftMetadata = await indexer.getAssetMetadata(collection, tokenId);
      if (!_nftMetadata) return;

      setNFTMetadata(_nftMetadata);
      setNFTImageUrl(resolveImage(_nftMetadata));
    })();
  }, [indexer]);

  const onSketched = useCallback((dataUrl: string) => {
    setSketch(dataUrl);
    // if (mintingState < MintingState.MINTED) {
    //   setMintingState(MintingState.GENERATED);
    // }
  }, []);

  const onMinted = useCallback(
    async (provenance: TokenProvenance) => {
      if (!splice) {
        console.error('no splice?!');
        return;
      }

      toast({
        status: 'success',
        title: `Hooray, Splice #${provenance.splice_token_id} is yours now!`
      });

      setAllProvenances([...(allProvenances || []), provenance]);
    },
    [allProvenances]
  );

  const _isDownloadable = useMemo<boolean>(() => {
    return provenance !== undefined && spliceOwner === account;
  }, [spliceOwner, account]);

  return (
    <Container maxW="container.xl">
      <Breadcrumb>
        <BreadcrumbItem>
          <BreadcrumbLink as={NavLink} to="/my-assets">
            Your NFTs
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink>
            {provenance ? '' : 'Mint'} Splice for {nftMetadata?.name}
          </BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      {nftImageUrl && (
        <Flex position="relative" justify="center" mt={6} direction="column">
          <CreativePanel
            spliceDataUrl={sketch}
            nftImageUrl={nftImageUrl}
            style={selectedStyle}
            randomness={randomness}
            onSketched={onSketched}
            onDominantColors={setDominantColors}
          />

          <Flex
            position={['relative', 'absolute']}
            bottom="-1.5em"
            gridGap={[2, 6]}
            right={[null, 2]}
            direction={['column', 'row']}
            align="center"
          >
            <ArtworkStyleChooser
              disabled={chainId === 1 || dominantColors?.length == 0 || buzy}
              selectedStyle={selectedStyle}
              onStyleChanged={(style: Style) => {
                setSelectedStyle(style);
                setSketch(undefined);
              }}
            />

            {provenance === undefined && selectedStyle && sketch && (
              <MintSpliceButton
                buzy={buzy}
                setBuzy={setBuzy}
                collection={collection}
                originTokenId={tokenId}
                selectedStyle={selectedStyle}
                onMinted={onMinted}
              />
            )}

            {_isDownloadable && (
              <Button
                as={Link}
                href={sketch}
                disabled={!sketch}
                leftIcon={<FaCloudDownloadAlt />}
                boxShadow="md"
                size="lg"
                isExternal
                variant="white"
              >
                download
              </Button>
            )}
          </Flex>
        </Flex>
      )}

      <SimpleGrid
        justify="space-between"
        align="flex-start"
        spacing={[2, 5]}
        columns={[1, null, 2]}
        mb={12}
        mt={[6, null, 1]}
      >
        <NFTDescription
          nftMetadata={nftMetadata}
          spliceMetadata={spliceMetadata}
          styleNFT={selectedStyle?.getMetadata()}
        />
        <Flex direction="column" gridGap={6} pt={3}>
          {spliceMetadata && (
            <Flex
              boxShadow="xl"
              direction="column"
              p={6}
              gridGap={3}
              background="white"
            >
              <Heading size="md"> Splice attributes</Heading>
              <SpliceMetadataDisplay
                spliceMetadata={spliceMetadata}
                owner={spliceOwner}
              />
            </Flex>
          )}
          {nftMetadata && (
            <Flex
              boxShadow="xl"
              direction="column"
              p={6}
              gridGap={3}
              background="white"
            >
              <Heading size="md"> Origin attributes</Heading>
              {!provenance && (
                <MetaDataItem
                  label="colors"
                  value={<DominantColorsDisplay colors={dominantColors} />}
                />
              )}
              <MetaDataDisplay
                contractAddress={collection}
                tokenId={tokenId}
                nftMetadata={nftMetadata}
                randomness={randomness}
              />
            </Flex>
          )}
        </Flex>
      </SimpleGrid>
    </Container>
  );
};
