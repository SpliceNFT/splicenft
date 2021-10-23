import { Button, Flex, Spacer, Link } from '@chakra-ui/react';
import { useWeb3React } from '@web3-react/core';
import React, { useEffect } from 'react';
import { NavLink as ReactLink } from 'react-router-dom';
import { injected } from '../../modules/connectors';
import Account from '../atoms/Account';
import Logo from '../atoms/Logo';

const Header = () => {
  const { active, activate, account } = useWeb3React();

  const connect = () => {
    activate(injected, console.error);
    localStorage.setItem('seenBefore', 'true');
  };

  useEffect(() => {
    const sb = localStorage.getItem('seenBefore');
    if (sb === 'true') activate(injected, console.error);
  }, []);

  return (
    <Flex p={5} my={3} align="center" gridGap={2}>
      <Logo />
      <Spacer />
      <Flex direction="row" align="center" gridGap={8}>
        {active && (
          <Flex direction="row" gridGap={10}>
            <Link
              as={ReactLink}
              to="/my-assets"
              exact
              activeStyle={{ fontWeight: 800 }}
            >
              My NFTs
            </Link>
            <Link
              as={ReactLink}
              to="/my-splices"
              activeStyle={{ fontWeight: 800 }}
            >
              My splices
            </Link>
          </Flex>
        )}
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
