import { Flex, Text } from '@chakra-ui/react';
import { useWeb3React } from '@web3-react/core';
import React, { useEffect, useState } from 'react';
import { providers } from 'ethers';
import { Splice, SPLICE_ADDRESSES } from '@splicenft/common';
import { useSplice } from '../../context/SpliceContext';

export const Footer = () => {
  const { library, chainId } = useWeb3React<providers.Web3Provider>();
  const { splice } = useSplice();

  return (
    <Flex bg="gray.800" p={12} color="white" direction="column">
      <Text>Chain: {chainId}</Text>
      {splice?.address && <Text>Splice contract: {splice?.address} </Text>}
    </Flex>
  );
};
