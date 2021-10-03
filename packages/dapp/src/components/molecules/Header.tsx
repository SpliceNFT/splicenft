import { Button, Flex, Spacer } from '@chakra-ui/react';
import { useWeb3React } from '@web3-react/core';
import React, { useEffect } from 'react';
import { injected } from '../../modules/connectors';
import Account from '../atoms/Account';
import Logo from '../atoms/Logo';

const Header = () => {
  const { active, activate, account } = useWeb3React();

  const connect = () => {
    activate(injected, console.error);
  };

  useEffect(() => {
    activate(injected, console.error);
  }, []);

  return (
    <Flex p={5} my={3}>
      <Logo />
      <Spacer />
      {!active && (
        <Button variant="black" onClick={connect}>
          Connect Wallet
        </Button>
      )}
      {account && <Account account={account} />}
    </Flex>
  );
};

export default Header;
