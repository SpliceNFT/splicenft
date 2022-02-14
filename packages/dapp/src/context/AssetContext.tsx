/* eslint-disable @typescript-eslint/no-empty-function */
import { useToast } from '@chakra-ui/react';
import {
  CHAINS,
  erc721,
  FallbackIndexer,
  NFTIndexer,
  NFTItemInTransit,
  NFTPort,
  OnChain
} from '@splicenft/common';
import { useWeb3React } from '@web3-react/core';
import { providers } from 'ethers';
import React, { useContext, useEffect, useState } from 'react';
import { knownCollections } from '../modules/chains';

interface IAssetContext {
  indexer?: NFTIndexer;
  nfts: NFTItemInTransit[];
  contracts: Record<string, string>;
  nftsLoading: boolean;
  continueLoading: () => void;
  onNFTAdded: (collection: string, tokenId: string) => Promise<void>;
  setAccountAddress: (address: string) => void;
  getContractName: (address: string) => Promise<string | undefined>;
}

const AssetContext = React.createContext<IAssetContext>({
  nfts: [],
  contracts: {},
  nftsLoading: false,
  continueLoading: () => {
    console.log('not ready yet');
  },
  onNFTAdded: async (collection: string, tokenId: string) => {},
  setAccountAddress: (address: string) => {},
  getContractName: async (address: string) => undefined
});

const useAssets = () => useContext(AssetContext);

const AssetProvider = ({ children }: { children: React.ReactNode }) => {
  const { library, chainId, account } = useWeb3React<providers.Web3Provider>();
  const [indexer, setIndexer] = useState<NFTIndexer>();
  const toast = useToast();
  const [loading, setLoading] = useState<boolean>(false);
  const [nfts, setNFTs] = useState<NFTItemInTransit[]>([]);
  const [contracts, setContracts] = useState<Record<string, string>>({});
  const [accountAddress, setAccountAddress] = useState<string | undefined>(
    account || undefined
  );

  useEffect(() => {
    if (!library || !chainId) return;

    const chain = CHAINS[chainId];
    if (!chain) {
      setIndexer(undefined);
      console.error(`chain ${chainId} unsupported`);
      return;
    }

    switch (chain) {
      case 'ethereum':
        setIndexer(
          new FallbackIndexer(
            new NFTPort(chain, process.env.REACT_APP_NFTPORT_AUTH as string),
            new OnChain(library, knownCollections['ethereum'], {
              proxyAddress: process.env.REACT_APP_CORS_PROXY,
              metadataProxy: process.env.REACT_APP_VALIDATOR_BASEURL
            })
          )
        );
        break;

      default:
        setIndexer(
          new OnChain(library, knownCollections[chain], {
            proxyAddress: process.env.REACT_APP_CORS_PROXY,
            metadataProxy: process.env.REACT_APP_VALIDATOR_BASEURL
          })
        );
    }
  }, [library, chainId]);

  useEffect(() => {
    if (!accountAddress || !indexer) return;
    if (indexer.canBeContinued()) {
      indexer.reset();
    }
    try {
      (async () => {
        setLoading(true);
        try {
          const _nfts = await indexer.getAllAssetsOfOwner(accountAddress);
          setNFTs(_nfts);
        } catch (e: any) {
          console.warn(e.message || e);
        } finally {
          setLoading(false);
        }
      })();
    } catch (e) {
      toast({
        status: 'error',
        title: `couldn't fetch assets ${e}`
      });
    }
  }, [accountAddress, indexer]);

  const continueLoading = async () => {
    if (!accountAddress || !indexer) return;
    if (!indexer.canBeContinued()) return;
    setLoading(true);
    const _moreNfts = await indexer.getAllAssetsOfOwner(accountAddress);
    setLoading(false);
    setNFTs([...nfts, ..._moreNfts]);
  };

  const onNFTAdded = async (collection: string, tokenId: string) => {
    if (!indexer) return;
    setLoading(true);
    const newNft = await indexer.getAsset(collection, tokenId);
    setLoading(false);
    setNFTs([...nfts, newNft]);
  };

  const getContractName = async (address: string) => {
    const known = contracts[address];
    if (known) return known as string;
    if (!library) return undefined;
    try {
      const contract = erc721(library, address);
      const name = await contract.name();
      setContracts((old) => ({ ...old, [address]: name }));
      return name;
    } catch (e: any) {
      console.warn(e.message || e);
      return undefined;
    }
  };

  return (
    <AssetContext.Provider
      value={{
        indexer,
        nfts,
        contracts,
        continueLoading,
        onNFTAdded,
        nftsLoading: loading,
        setAccountAddress,
        getContractName
      }}
    >
      {children}
    </AssetContext.Provider>
  );
};

export { AssetProvider, useAssets };
