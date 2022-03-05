import { Button, useToast } from '@chakra-ui/react';
import { ReplaceablePaymentSplitter } from '@splicenft/common';
import { useWeb3React } from '@web3-react/core';
import { providers } from 'ethers';
import React from 'react';

export const ClaimButton = (props: {
  splitter: ReplaceablePaymentSplitter;
  onClaimed: () => unknown;
}) => {
  const { library: web3, account } = useWeb3React<providers.Web3Provider>();
  const { splitter, onClaimed } = props;
  const toast = useToast();

  const claim = async () => {
    if (!web3 || !account) return;
    try {
      const _splitter = splitter.connect(await web3.getSigner());
      const tx = await _splitter['release(address)'](account);
      await tx.wait();
      onClaimed();
    } catch (e: any) {
      toast({ status: 'error', title: 'claim failed', description: e.message });
    }
  };

  return (
    <Button variant="black" size="sm" px={12} my={2} onClick={claim}>
      Claim
    </Button>
  );
};
