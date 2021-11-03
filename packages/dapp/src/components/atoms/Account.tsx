import { Flex, Text, Circle } from '@chakra-ui/react';
import { useWeb3React } from '@web3-react/core';
import { CHAINS } from '@splicenft/common';
import React, { useEffect, useState } from 'react';
import { providers, utils } from 'ethers';
import { truncateAddress } from '../../modules/strings';
import Blockies from 'react-blockies';

export default ({ account }: { account: string }) => {
  const { library, chainId } = useWeb3React<providers.Web3Provider>();
  const [balance, setBalance] = useState<string>();

  useEffect(() => {
    if (!library || !account) return;
    (async () => {
      const bal = await library.getBalance(account);
      const eth = utils.formatUnits(bal, 'ether');
      const ethFloat = parseFloat(eth);
      setBalance(ethFloat.toFixed(4));
    })();
  }, [library, account]);

  return (
    <Flex
      borderRadius="full"
      bg="white"
      boxShadow="lg"
      align="center"
      pr={[0, 2]}
    >
      <Flex
        direction="column"
        align="flex-end"
        justify="center"
        display={['none', 'flex']}
        py={1}
        pr={3}
        pl={5}
      >
        <Flex direction="row" fontWeight="bold" fontSize={'lg'} gridGap={1}>
          <Text>{balance}</Text>
          <Text display={['none', 'inline']}>ETH</Text>
          <Text display={['inline', 'none']}>E</Text>
        </Flex>
        <Text isTruncated fontSize={['xx-small', 'xs']} fontFamily="mono">
          {truncateAddress(account)}
        </Text>
        {chainId !== 1 && (
          <Text fontSize="x-small">{chainId && CHAINS[chainId]}</Text>
        )}
      </Flex>

      <Circle size="2.75em" overflow="hidden">
        <Blockies seed={account} size={10} scale={5} />
      </Circle>
    </Flex>
  );
};
