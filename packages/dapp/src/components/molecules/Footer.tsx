import { Flex, Text } from '@chakra-ui/react';
import { useWeb3React } from '@web3-react/core';
import { providers } from 'ethers';
import React from 'react';
import { useSplice } from '../../context/SpliceContext';

export const Footer = () => {
  const { chainId } = useWeb3React<providers.Web3Provider>();
  const { splice } = useSplice();

  return (
    <Flex bg="gray.800" p={12} color="white" direction="column">
      <Text>Chain: {chainId}</Text>
      {splice?.address && <Text>Splice contract: {splice?.address} </Text>}
    </Flex>
  );
};
