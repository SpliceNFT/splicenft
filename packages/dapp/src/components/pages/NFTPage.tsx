import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Button,
  Container,
  Flex,
  Heading,
  IconButton,
  SimpleGrid,
  Spacer,
  Spinner,
  Tooltip,
  useToast
} from '@chakra-ui/react';
import { Histogram } from '@splicenft/colors';
import {
  NFTItem,
  NFTTrait,
  OnChain,
  Splice,
  SpliceNFT,
  SPLICE_ADDRESSES,
  Style,
  TokenProvenance
} from '@splicenft/common';
import { useWeb3React } from '@web3-react/core';
import axios from 'axios';
import React, {
  SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState
} from 'react';
import { FaCloudDownloadAlt } from 'react-icons/fa';
import { IoReload } from 'react-icons/io5';
import { NavLink, useParams } from 'react-router-dom';
import { useAssets } from '../../context/AssetContext';
import { useSplice } from '../../context/SpliceContext';
import { useStyles } from '../../context/StyleContext';
import { default as getDominantColors, loadColors } from '../../modules/colors';
import useProvenance from '../../modules/useProvenance';
import { ArtworkStyleChooser } from '../atoms/ArtworkStyleChooser';
import ConnectButton from '../atoms/ConnectButton';
import { FallbackImage } from '../atoms/FallbackImage';
import { NFTDescription } from '../atoms/NFTDescription';
import { DominantColorsDisplay } from '../molecules/DominantColors';
import { MintSpliceButton } from '../molecules/MintSpliceButton';
import { CreativePanel } from '../organisms/CreativePanel';
import {
  MetaDataDisplay,
  MetaDataItem,
  SpliceMetadataDisplay
} from '../organisms/MetaDataDisplay';

type StateAction = {
  type: string;
  payload: any;
};

type State = {
  origin: {
    collection: string;
    tokenId: string;
    nftItem?: NFTItem;
  };
  features: {
    randomness: number;
    colors: Histogram;
  };
  allProvenances: TokenProvenance[];
  provenance?: TokenProvenance;
  splice?: SpliceNFT;
  selectedStyle?: Style;
  sketch?: string;
  traits: NFTTrait[];
  ownership?: {
    splice: string | undefined;
    origin: string | undefined;
  };
  originImage?: HTMLImageElement;
};

type ContractError = {
  title: string;
  description: string;
};

function reducer(state: State, action: StateAction): State {
  const { payload } = action;
  switch (action.type) {
    case 'sketched':
      return { ...state, sketch: payload.sketch, traits: payload.traits };
    case 'setAsset': {
      return {
        ...state,
        origin: { ...state.origin, nftItem: payload.nftItem }
      };
    }
    case 'setOwnership':
      return {
        ...state,
        ownership: {
          origin: payload.originOwner,
          splice: state.ownership?.splice
        }
      };
    case 'setProvenances':
      // eslint-disable-next-line no-case-declarations
      const initialProvenance: TokenProvenance =
        payload.provenances.length > 0 ? payload.provenances[0] : undefined;

      return {
        ...state,
        allProvenances: payload.provenances,
        provenance: initialProvenance,
        splice: initialProvenance?.metadata,
        features: {
          randomness:
            initialProvenance?.metadata?.splice.randomness ||
            state.features.randomness,
          colors:
            initialProvenance?.metadata?.splice.colors || state.features.colors
        },
        ownership: {
          origin: state.ownership?.origin,
          splice: initialProvenance?.owner
        },
        selectedStyle: payload.style
      };
    case 'setOrigin':
      return {
        ...state,
        origin: {
          ...state.origin,
          nftItem: payload.nftItem
        },
        features: {
          ...state.features,
          colors: payload.colors
        }
      };
    case 'styleSelected':
      return {
        ...state,
        selectedStyle: payload.style,
        sketch: undefined,
        splice: undefined,
        provenance: state.allProvenances.find((p) => {
          const origin = p.origins[0];
          if (!origin) return false;
          return (
            origin.collection == state.origin.collection &&
            origin.token_id.toString() == state.origin.tokenId &&
            p.style_token_id == payload.style.tokenId
          );
        })
      };
    case 'minted':
      return {
        ...state,
        ownership: { origin: state.ownership?.origin, splice: payload.account },
        provenance: payload.provenance,
        allProvenances: [payload.provenance, ...state.allProvenances]
      };
    case 'saveOriginImage':
      return {
        ...state,
        originImage: payload.image
      };
    case 'setColors':
      return {
        ...state,
        features: {
          randomness: state.features.randomness,
          colors: payload.colors
        }
      };
    default:
      throw new Error();
  }
}

export const NFTPage = () => {
  const { collection, token_id: tokenId } =
    useParams<{ collection: string; token_id: string }>();

  const toast = useToast();

  const { styles: spliceStyles } = useStyles();
  const { splice } = useSplice();
  const { indexer } = useAssets();

  const { library: web3, account, chainId } = useWeb3React();
  const [buzy, setBuzy] = useState<boolean>(false);
  const [error, setError] = useState<ContractError>();
  const allProvenances = useProvenance(collection, tokenId);

  const [state, dispatch] = useReducer(reducer, {
    origin: {
      collection,
      tokenId
    },
    traits: [],
    features: {
      randomness: Splice.computeRandomness(collection, tokenId),
      colors: []
    },
    allProvenances: []
  });

  useEffect(() => {
    if (!indexer) return;
    (async () => {
      try {
        const nftItem = await indexer.getAsset(collection, tokenId);
        if (
          Object.values(SPLICE_ADDRESSES).find(
            (di) =>
              di.address.toLowerCase() ===
              nftItem.contract_address.toLowerCase()
          )
        ) {
          setError({
            title: 'you shouldnt splice a Splice',
            description:
              'please choose a PFP collection or a non-splice NFT as an origin'
          });
          return;
        }
        dispatch({
          type: 'setAsset',
          payload: {
            nftItem
          }
        });
      } catch (e: any) {
        console.error(e);
      }
    })();
  }, [indexer]);

  useEffect(() => {
    if (!allProvenances || allProvenances.length === 0) return;

    const style = spliceStyles.find(
      (s) => s.tokenId == allProvenances[0].style_token_id
    );

    dispatch({
      type: 'setProvenances',
      payload: { provenances: allProvenances || [], style }
    });
  }, [allProvenances]);

  useEffect(() => {
    if (!splice) return;
    (async () => {
      try {
        const originOwner = await splice
          .getOriginNftContract(collection)
          .ownerOf(tokenId);

        dispatch({
          type: 'setOwnership',
          payload: {
            originOwner
          }
        });
      } catch (e: any) {
        console.error(e.message);
        setError({
          title:
            "couldn't load origin collection information (maybe not an erc721 contract)",
          description: e.message
        });
      }
    })();
  }, [splice]);

  const onSketched = useCallback(
    (dataUrl: string, traits: NFTTrait[]) => {
      if (state.sketch === dataUrl) return;
      dispatch({
        type: 'sketched',
        payload: { sketch: dataUrl, traits: traits }
      });
    },
    [state.sketch]
  );

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
      dispatch({ type: 'minted', payload: { provenance, account } });
    },
    [state.allProvenances]
  );

  const _isDownloadable = useMemo<boolean>(() => {
    return (
      state.provenance !== undefined &&
      state.ownership?.splice?.toLowerCase() === account?.toLowerCase()
    );
  }, [state.provenance, state.ownership?.splice, account]);

  const _canMint = useMemo<boolean>(() => {
    return (
      chainId !== undefined &&
      state.provenance === undefined &&
      state.selectedStyle !== undefined &&
      state.sketch !== undefined
    );
  }, [chainId, state.provenance, state.selectedStyle, state.sketch]);

  const useOriginalMetadata = useCallback(async () => {
    if (!chainId) return;
    const onChain = new OnChain(web3, [], {
      proxyAddress: process.env.REACT_APP_CORS_PROXY
    });

    setBuzy(true);
    try {
      const [nftItem, colors] = await Promise.all([
        onChain.getAsset(collection, tokenId),
        getDominantColors(chainId, collection, tokenId)
      ]);
      dispatch({ type: 'setOrigin', payload: { nftItem, colors } });
    } catch (e: any) {
      toast({ title: `loading original metadata failed ${e.message}` });
    } finally {
      setBuzy(false);
    }
  }, [web3, chainId]);

  const imageLoaded = useCallback(
    async (event: SyntheticEvent<HTMLImageElement, Event>) => {
      if (
        state.origin.nftItem === undefined ||
        state.features.colors.length > 0
      ) {
        return;
      } else {
        const target: HTMLImageElement = (event.target ||
          event.currentTarget) as HTMLImageElement;

        const histogram = await loadColors(
          state.origin.nftItem,
          target,
          chainId
        );
        dispatch({ type: 'setColors', payload: { colors: histogram } });
      }
    },
    [state.origin.nftItem, state.features.colors, chainId]
  );

  const download = async () => {
    if (!state.sketch) return;
    const bin = await (
      await axios.get(state.sketch, { responseType: 'arraybuffer' })
    ).data;
    const blob = new Blob([bin]);
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `${state.provenance?.splice_token_id}.png`;
    link.click();
  };

  if (error) {
    return (
      <Container maxW="container.xl" minH="70vh">
        <Alert
          variant="black"
          status="error"
          my={6}
          flexDirection="column"
          alignItems="flex-start"
        >
          <Flex mb={2}>
            <AlertIcon />
            <AlertTitle>{error.title}</AlertTitle>
          </Flex>

          <AlertDescription>{error.description}</AlertDescription>
        </Alert>
      </Container>
    );
  }
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
            {state.provenance ? '' : 'Choose a style and mint a'} Splice for{' '}
            {state.origin.nftItem?.metadata?.name}
          </BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      {state.origin.nftItem && (
        <Flex position="relative" justify="center" mt={6} direction="column">
          <CreativePanel
            spliceDataUrl={state.sketch}
            nftFeatures={state.features}
            style={state.selectedStyle}
            onSketched={onSketched}
          >
            <FallbackImage
              boxShadow="lg"
              metadata={state.origin.nftItem.metadata}
              onNFTImageLoaded={imageLoaded}
            />
          </CreativePanel>

          <Flex
            position={['relative', 'absolute']}
            bottom="-1.5em"
            gridGap={[2, 6]}
            right={[null, 2]}
            direction={['column', 'row']}
            align="center"
          >
            <ArtworkStyleChooser
              disabled={state.features.colors.length == 0 || buzy}
              selectedStyle={state.selectedStyle}
              onStyleChanged={(style: Style) =>
                dispatch({ type: 'styleSelected', payload: { style } })
              }
            />
            {_canMint && state.selectedStyle && (
              <MintSpliceButton
                buzy={buzy}
                setBuzy={setBuzy}
                collection={collection}
                originTokenId={tokenId}
                selectedStyle={state.selectedStyle}
                onMinted={onMinted}
              />
            )}

            {_isDownloadable && (
              <Button
                onClick={download}
                disabled={!state.sketch}
                leftIcon={<FaCloudDownloadAlt />}
                boxShadow="md"
                size="lg"
                variant="white"
              >
                download
              </Button>
            )}
            {!chainId && <ConnectButton variant="black">connect</ConnectButton>}
          </Flex>
        </Flex>
      )}
      <SimpleGrid
        spacing={[2, 5]}
        columns={[1, null, 2]}
        mb={12}
        mt={[6, null, 1]}
      >
        <NFTDescription
          nftMetadata={state.origin.nftItem?.metadata}
          spliceMetadata={state.splice}
          styleNFT={state.selectedStyle?.getMetadata()}
        />
        <Flex direction="column" gridGap={6} pt={3}>
          <SpliceMetadataDisplay
            provenance={state.provenance}
            spliceMetadata={state.splice}
            traits={state.traits}
            owner={state.ownership?.splice}
            boxShadow="xl"
            p={6}
            background="white"
          />

          {state.origin.nftItem && (
            <Flex
              boxShadow="xl"
              direction="column"
              p={6}
              gridGap={3}
              background="white"
            >
              <Flex direction="row">
                <Heading size="md">Origin attributes</Heading>
                <Spacer />
                {web3 && (
                  <Tooltip label="not looking like the right image? Try reloading metadata from chain here.">
                    <IconButton
                      disabled={buzy}
                      size="sm"
                      icon={buzy ? <Spinner size="sm" /> : <IoReload />}
                      title="reload metadata"
                      aria-label="reload"
                      onClick={useOriginalMetadata}
                    />
                  </Tooltip>
                )}
              </Flex>

              {!state.provenance && (
                <MetaDataItem
                  label="colors"
                  value={
                    <DominantColorsDisplay colors={state.features.colors} />
                  }
                />
              )}
              {state.origin.nftItem.metadata && (
                <MetaDataDisplay
                  contractAddress={collection}
                  tokenId={tokenId}
                  nftMetadata={state.origin.nftItem.metadata}
                  randomness={state.features.randomness}
                />
              )}
            </Flex>
          )}
        </Flex>
      </SimpleGrid>
    </Container>
  );
};
