import React from 'react';
import { Flex, Button, Spacer, Text } from '@chakra-ui/react';
import { useWeb3React } from '@web3-react/core';
import { injected } from '../../modules/connectors';
import Account from '../atoms/Account';
import Logo from '../atoms/Logo';

const Header = () => {
  const { activate, account } = useWeb3React();

  const connect = () => {
    activate(injected, (e) => {
      console.error(e);
    });
  };

  return (
    <Flex p={5} my={3}>
      <Logo />
      <Spacer />
      {!account && (
        <Button variant="login" onClick={connect}>
          Connect Wallet
        </Button>
      )}
      {account && <Account account={account} />}
    </Flex>
  );
};

export default Header;
