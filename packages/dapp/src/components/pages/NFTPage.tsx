import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Button,
  Container,
  Flex,
  Heading,
  IconButton,
  Link,
  SimpleGrid,
  Spacer,
  useToast
} from '@chakra-ui/react';
import {
  erc721,
  NFTItem,
  OnChain,
  resolveImage,
  Splice,
  SpliceNFT,
  Style,
  TokenProvenance
} from '@splicenft/common';
import { Histogram } from '@splicenft/colors';
import { useWeb3React } from '@web3-react/core';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FaCloudDownloadAlt } from 'react-icons/fa';
import { IoReload } from 'react-icons/io5';
import { NavLink, useParams } from 'react-router-dom';
import { useSplice } from '../../context/SpliceContext';
import { ArtworkStyleChooser } from '../atoms/ArtworkStyleChooser';
import { NFTDescription } from '../atoms/NFTDescription';
import { AddToAllowlistButton } from '../molecules/AddToAllowlistButton';
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
  const { library: web3, account, chainId } = useWeb3React();

  const [nftItem, setNFTItem] = useState<NFTItem>();

  const [dominantColors, setDominantColors] = useState<Histogram>([]);

  const [selectedStyle, setSelectedStyle] = useState<Style>();

  const [allProvenances, setAllProvenances] = useState<TokenProvenance[]>();
  const [provenance, setProvenance] = useState<TokenProvenance>();
  const [spliceOwner, setSpliceOwner] = useState<string>();
  const [spliceMetadata, setSpliceMetadata] = useState<SpliceNFT>();
  const [ownsOrigin, setOwnsOrigin] = useState<boolean>(false);

  const [sketch, setSketch] = useState<string>();
  const [buzy, setBuzy] = useState<boolean>(false);

  useEffect(() => {
    if (!web3 || !account) {
      setOwnsOrigin(false);
      return;
    }

    (async () => {
      try {
        const owner = await erc721(web3, collection).ownerOf(tokenId);
        setOwnsOrigin(owner === account);
      } catch (e: any) {
        console.error(
          "couldn't load origin collection information (likely not an erc721 contract)"
        );
        setOwnsOrigin(false);
      }
    })();
  }, [web3, account]);

  useEffect(() => {
    if (!splice) return;

    splice.findProvenances(collection, tokenId).then(setAllProvenances);
  }, [splice]);

  useEffect(() => {
    if (!allProvenances || allProvenances.length === 0 || !spliceStyles) return;

    if (selectedStyle) {
      setProvenance(
        allProvenances.find((prov) => {
          const origin = prov.origins[0];
          if (!origin) return false;
          return (
            origin.collection == collection &&
            origin.token_id.toString() == tokenId &&
            prov.style_token_id == selectedStyle.tokenId
          );
        })
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
      if (!splice || !provenance) {
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
      const _nftItem = await indexer.getAsset(collection, tokenId);
      if (!_nftItem) return;

      setNFTItem(_nftItem);
    })();
  }, [indexer]);

  const onSketched = useCallback((dataUrl: string) => {
    setSketch(dataUrl);
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

  const useOriginalMetadata = useCallback(async () => {
    const indexer = new OnChain(web3, []);
    setBuzy(true);
    setDominantColors([]);
    const nftItem = await indexer.getAsset(collection, tokenId);
    if (nftItem) {
      setNFTItem(nftItem);
    }
    setBuzy(false);
  }, [web3]);

  return (
    <Container maxW="container.xl">
      <Breadcrumb>
        <BreadcrumbItem fontSize="lg">
          <BreadcrumbLink as={NavLink} to="/my-assets">
            Your NFTs
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage fontSize="lg" fontWeight="bold">
          <BreadcrumbLink>
            {provenance ? '' : 'Choose a style and mint a'} Splice for{' '}
            {nftItem?.metadata?.name}
          </BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      {nftItem?.metadata && (
        <Flex position="relative" justify="center" mt={6} direction="column">
          <CreativePanel
            spliceDataUrl={sketch}
            nftItem={nftItem}
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
              disabled={dominantColors?.length == 0 || buzy}
              selectedStyle={selectedStyle}
              onStyleChanged={(style: Style) => {
                setSelectedStyle(style);
                setSketch(undefined);
              }}
            />
            {chainId === 1 && selectedStyle && (
              <AddToAllowlistButton
                selectedStyle={selectedStyle}
                ownsOrigin={ownsOrigin}
              />
            )}
            {provenance === undefined && splice && selectedStyle && sketch && (
              <MintSpliceButton
                buzy={buzy}
                setBuzy={setBuzy}
                collection={collection}
                originTokenId={tokenId}
                selectedStyle={selectedStyle}
                ownsOrigin={ownsOrigin}
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
          nftMetadata={nftItem?.metadata}
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
                provenance={provenance}
                spliceMetadata={spliceMetadata}
                owner={spliceOwner}
              />
            </Flex>
          )}
          {nftItem && (
            <Flex
              boxShadow="xl"
              direction="column"
              p={6}
              gridGap={3}
              background="white"
            >
              <Flex direction="row">
                <Heading size="md"> Origin attributes</Heading>
                <Spacer />
                <IconButton
                  size="sm"
                  icon={<IoReload />}
                  title="reload metadata"
                  aria-label="reload"
                  onClick={() => useOriginalMetadata()}
                />
              </Flex>
              {!provenance && (
                <MetaDataItem
                  label="colors"
                  value={<DominantColorsDisplay colors={dominantColors} />}
                />
              )}
              <MetaDataDisplay
                contractAddress={collection}
                tokenId={tokenId}
                nftMetadata={nftItem.metadata}
                randomness={randomness}
              />
            </Flex>
          )}
        </Flex>
      </SimpleGrid>
    </Container>
  );
};
