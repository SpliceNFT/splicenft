import {
  Button,
  Circle,
  Flex,
  forwardRef,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text
} from '@chakra-ui/react';
import { CHAINS } from '@splicenft/common';
import { useWeb3React } from '@web3-react/core';
import { providers, utils } from 'ethers';
import React, { useEffect, useState } from 'react';
import Blockies from 'react-blockies';
import { truncateAddress } from '../../modules/strings';

const Identicon = forwardRef((props, ref) => {
  const { account, ...rest } = props;
  return (
    <Button ref={ref} p={0} {...rest}>
      <Circle size="2.75em" overflow="hidden">
        <Blockies seed={account.toLowerCase()} size={8} scale={6} />
      </Circle>
    </Button>
  );
});

export default ({
  account,
  disconnect
}: {
  account: string;
  disconnect: () => void;
}) => {
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
      <Menu>
        <MenuButton as={Identicon} account={account} />
        <MenuList>
          <MenuItem onClick={disconnect}>Logout</MenuItem>
        </MenuList>
      </Menu>
    </Flex>
  );
};
