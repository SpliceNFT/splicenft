import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Button,
  Container,
  Flex,
  Heading,
  SimpleGrid,
  Spacer,
  useToast
} from '@chakra-ui/react';
import {
  Histogram,
  NFTItem,
  NFTTrait,
  Splice,
  SpliceNFT,
  SPLICE_ADDRESSES,
  Style,
  TokenProvenance,
  Transfer
} from '@splicenft/common';
import { useWeb3React } from '@web3-react/core';
import axios from 'axios';
import {
  SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState
} from 'react';
import { FaCloudDownloadAlt } from 'react-icons/fa';
import { NavLink, useParams } from 'react-router-dom';
import { useAssets } from '../../context/AssetContext';
import { useSplice } from '../../context/SpliceContext';
import { useStyles } from '../../context/StyleContext';
import { loadColors } from '../../modules/colors';
import useProvenance from '../../modules/useProvenance';
import { ErrorDescription } from '../../types/ErrorDescription';
import { ArtworkStyleChooser } from '../atoms/ArtworkStyleChooser';
import ConnectButton from '../atoms/ConnectButton';
import { ErrorAlert } from '../atoms/ErrorAlert';
import { FallbackImage } from '../atoms/FallbackImage';
import { NFTDescription } from '../atoms/NFTDescription';
import { DominantColorsDisplay } from '../molecules/DominantColors';
import { MintSpliceButton } from '../molecules/MintSpliceButton';
import { UseOriginalMetadata } from '../molecules/UseOriginalMetadata';
import { CreativePanel } from '../organisms/CreativePanel';
import {
  MetaDataItem,
  OriginMetadataDisplay,
  SpliceMetadataDisplay
} from '../organisms/MetaDataDisplay';

type StateAction =
  | {
      type: 'sketched';
      payload: {
        sketch: string;
        traits: NFTTrait[];
      };
    }
  | {
      type: 'setAsset';
      payload: {
        nftItem: NFTItem;
      };
    }
  | {
      type: 'setOwnership';
      payload: {
        originOwner: string;
      };
    }
  | {
      type: 'setInitialProvenances';
      payload: {
        provenances: TokenProvenance[];
        style?: Style;
      };
    }
  | {
      type: 'setOrigin';
      payload: {
        nftItem: NFTItem;
        colors: Histogram;
      };
    }
  | {
      type: 'styleSelected';
      payload: {
        style: Style;
      };
    }
  | {
      type: 'minted';
      payload: {
        provenance: TokenProvenance;
      };
    }
  | {
      type: 'setColors';
      payload: {
        colors: Histogram;
      };
    };

type State = {
  origin: {
    collection: string;
    tokenId: string;
    nftItem?: NFTItem;
  };
  features: Transfer.OriginFeatures;
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

const reducer = (state: State, action: StateAction): State => {
  switch (action.type) {
    case 'sketched':
      return {
        ...state,
        sketch: action.payload.sketch,
        traits: action.payload.traits
      };
    case 'setAsset': {
      return {
        ...state,
        origin: { ...state.origin, nftItem: action.payload.nftItem },
        features: {
          ...state.features,
          nftItem: action.payload.nftItem
        }
      };
    }
    case 'setOwnership':
      return {
        ...state,
        ownership: {
          origin: action.payload.originOwner,
          splice: state.ownership?.splice
        }
      };
    case 'setInitialProvenances':
      // eslint-disable-next-line no-case-declarations
      const initialProvenance =
        action.payload.provenances.length > 0
          ? action.payload.provenances[0]
          : undefined;

      return {
        ...state,
        allProvenances: action.payload.provenances,
        provenance: initialProvenance,
        splice: initialProvenance?.metadata,
        features: {
          ...state.features,
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
        selectedStyle: action.payload.style
      };
    case 'setOrigin':
      console.log('setOrigin nft item', action.payload.nftItem);
      return {
        ...state,
        origin: {
          ...state.origin,
          nftItem: action.payload.nftItem
        },
        features: {
          ...state.features,
          nftItem: action.payload.nftItem,
          colors: action.payload.colors
        }
      };
    case 'styleSelected':
      // eslint-disable-next-line no-case-declarations
      const provenance = state.allProvenances.find((p) => {
        const origin = p.origins[0];
        return origin
          ? origin.collection == state.origin.collection &&
              origin.token_id.toString() == state.origin.tokenId &&
              p.style_token_id == action.payload.style.tokenId
          : false;
      });
      return {
        ...state,
        selectedStyle: action.payload.style,
        sketch: undefined,
        splice: provenance?.metadata,
        ownership: {
          origin: state.ownership?.origin,
          splice: provenance?.owner
        },
        provenance
      };
    case 'minted':
      return {
        ...state,
        ownership: {
          origin: state.ownership?.origin,
          splice: action.payload.provenance.owner
        },
        provenance: action.payload.provenance,
        splice: action.payload.provenance.metadata,
        allProvenances: [action.payload.provenance, ...state.allProvenances]
      };
    case 'setColors':
      return {
        ...state,
        features: {
          ...state.features,
          randomness: state.features.randomness,
          colors: action.payload.colors
        }
      };
    default:
      throw new Error();
  }
};

export const NFTPage = () => {
  const { collection, token_id: tokenId } =
    useParams<{ collection: string; token_id: string }>();

  const toast = useToast();

  const { styles: spliceStyles } = useStyles();
  const { splice } = useSplice();
  const { indexer } = useAssets();

  const { library: web3, account, chainId } = useWeb3React();
  const [buzy, setBuzy] = useState<boolean>(false);
  const [error, setError] = useState<ErrorDescription>();
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
    console.log(indexer);
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
          return setError({
            title: 'you shouldnt splice a Splice',
            description:
              'please choose a PFP collection or a non-splice NFT as an origin'
          });
        }
        dispatch({
          type: 'setAsset',
          payload: {
            nftItem
          }
        });
        setError(undefined);
      } catch (e: any) {
        setError({
          title:
            "couldn't load origin collection information (maybe not an erc721 contract)",
          description: e.message
        });
        console.error('indexer failed', e);
      }
    })();
  }, [indexer]);

  useEffect(() => {
    if (!allProvenances || allProvenances.length === 0) return;

    const style = spliceStyles.find(
      (s) => s.tokenId == allProvenances[0].style_token_id
    );

    dispatch({
      type: 'setInitialProvenances',
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
      if (!splice || !account) {
        console.error('no splice?!');
        return;
      }
      provenance.metadata = await splice.getMetadata(provenance);
      provenance.owner = account;

      dispatch({ type: 'minted', payload: { provenance } });
      setBuzy(false);
      toast({
        status: 'success',
        title: `Hooray, Splice #${provenance.splice_token_id} is yours now!`
      });
    },
    [account, splice, state.allProvenances]
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
        //todo: turn pixel loading on when style requires it.
        // const pixels = await loadPixels(target);
        // console.log('PIXELS', pixels);
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
        <ErrorAlert error={error} />
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
                <Flex direction="row" align="center" gridGap={3}>
                  <FallbackImage
                    rounded="full"
                    maxH={10}
                    metadata={state.origin.nftItem.metadata}
                  />
                  <Heading size="md">Origin attributes</Heading>
                </Flex>
                <Spacer />
                {web3 && (
                  <UseOriginalMetadata
                    collection={collection}
                    tokenId={tokenId}
                    onMetadata={(nftItem: NFTItem, colors: Histogram) => {
                      dispatch({
                        type: 'setOrigin',
                        payload: { nftItem, colors }
                      });
                    }}
                  />
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
                <OriginMetadataDisplay
                  contractAddress={collection}
                  tokenId={tokenId}
                  owner={state.ownership?.origin}
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
