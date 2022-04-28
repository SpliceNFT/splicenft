import { IconButton, Spinner, Tooltip, useToast } from '@chakra-ui/react';
import { NFTItem, OnChain } from '@splicenft/common';
import { Histogram } from '@splicenft/colors';
import { useWeb3React } from '@web3-react/core';
import React, { useCallback, useState } from 'react';
import { IoReload } from 'react-icons/io5';
import { default as getDominantColors } from '../../modules/colors';

export const UseOriginalMetadata = (props: {
  collection: string;
  tokenId: string;
  onMetadata: (nftItem: NFTItem, colors: Histogram) => void;
}) => {
  const { collection, tokenId, onMetadata } = props;

  const [buzy, setBuzy] = useState(false);
  const { library: web3, chainId } = useWeb3React();

  const toast = useToast();
  const useOriginalMetadata = useCallback(async () => {
    if (!chainId) return;
    setBuzy(true);
    const onChain = new OnChain(web3, [], {
      proxyAddress: process.env.REACT_APP_CORS_PROXY
    });

    try {
      const [nftItem, colors] = await Promise.all([
        onChain.getAsset(collection, tokenId),
        getDominantColors(chainId, collection, tokenId)
      ]);
      onMetadata(nftItem, colors);
    } catch (e: any) {
      toast({ title: `loading original metadata failed ${e.message}` });
    } finally {
      setBuzy(false);
    }
  }, [web3, chainId]);

  return (
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
  );
};
