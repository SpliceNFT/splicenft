import { Flex, Text, Circle } from '@chakra-ui/react';
import { useWeb3React } from '@web3-react/core';
import React, { useEffect, useState } from 'react';
import { providers, utils } from 'ethers';

export default ({ account }: { account: string }) => {
  const { library } = useWeb3React<providers.Web3Provider>();

  const [balance, setBalance] = useState<string>();
  const [network, setNetwork] = useState<string>();
  const [accountDisplay, setAccountDisplay] = useState<string>();

  useEffect(() => {
    if (!library || !account) return;
    (async () => {
      const bal = await library.getBalance(account);
      const eth = utils.formatUnits(bal, 'ether');
      const ethFloat = parseFloat(eth);
      setBalance(ethFloat.toFixed(4));
    })();
  }, [library, account]);

  useEffect(() => {
    if (!account) return;
    const [first, last] = [
      account.substr(0, 6),
      account.substr(account.length - 4, 4)
    ];
    setAccountDisplay(`${first}...${last}`);
  }, [account]);

  return (
    <Flex
      borderRadius="full"
      bg="white"
      boxShadow="lg"
      py={1}
      pr={2}
      pl={5}
      align="center"
    >
      <Flex direction="column" align="flex-end" justify="center" mr="2">
        <Text fontWeight="bold" fontSize="lg">
          {balance} ETH
        </Text>
        <Text isTruncated fontSize="xs" fontFamily="mono">
          {accountDisplay}
        </Text>
      </Flex>
      <Flex>
        <Circle size="3em" bg="tomato" color="white"></Circle>
      </Flex>
    </Flex>
  );
};
