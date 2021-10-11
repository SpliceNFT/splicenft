import { Flex, Text } from '@chakra-ui/react';
import { useWeb3React } from '@web3-react/core';
import React, { useEffect, useState } from 'react';
import { providers } from 'ethers';
import { Splice, SPLICE_ADDRESSES } from '@splicenft/common';

export const Footer = () => {
  const { library, chainId } = useWeb3React<providers.Web3Provider>();
  const [splice, setSplice] = useState<Splice>();
  useEffect(() => {
    if (!library || !chainId) return;
    const splAddress =
      chainId === 31337
        ? (process.env.REACT_APP_SPLICE_CONTRACT_ADDRESS as string)
        : SPLICE_ADDRESSES[chainId];

    const spl = Splice.from(splAddress, library.getSigner());

    setSplice(spl);
  }, [library]);
  return (
    <Flex bg="gray.800" p={12} color="white" direction="column">
      <Text>Chain: {chainId}</Text>
      {splice && <Text>Splice contract: {splice.address} </Text>}
    </Flex>
  );
};
