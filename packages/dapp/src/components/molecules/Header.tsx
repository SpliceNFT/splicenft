import { Button, Flex, Spacer } from '@chakra-ui/react';
import { useWeb3React } from '@web3-react/core';
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
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
    <Flex p={5} my={3} align="center">
      <Logo />
      <Spacer />
      <Flex direction="row" align="center" gridGap={8}>
        {active && <Link to="/my-splices">My splices</Link>}
        {!active && (
          <Button variant="black" onClick={connect}>
            Connect Wallet
          </Button>
        )}
        {account && <Account account={account} />}
      </Flex>
    </Flex>
  );
};

export default Header;
