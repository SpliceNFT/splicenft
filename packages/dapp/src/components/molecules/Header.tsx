import { ChevronDownIcon } from '@chakra-ui/icons';
import {
  Button,
  Flex,
  Link,
  Text,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Spacer
} from '@chakra-ui/react';
import { AbstractConnector } from '@web3-react/abstract-connector/dist';
import { useWeb3React } from '@web3-react/core';
import React, { useEffect } from 'react';
import { NavLink as ReactLink } from 'react-router-dom';
import { injected, walletconnect } from '../../modules/connectors';
import Account from '../atoms/Account';
import Logo from '../atoms/Logo';

const Header = () => {
  const { active, activate, account } = useWeb3React();

  const connectors = [
    { name: 'MetaMask', connector: injected },
    { name: 'Wallet Connect', connector: walletconnect }
  ];

  const connect = (connector: AbstractConnector) => {
    activate(connector, console.error);
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
            <Link as={ReactLink} to="/create" activeStyle={{ fontWeight: 800 }}>
              Create
            </Link>
          </Flex>
        )}
        {!active && (
          <Menu>
            <MenuButton
              as={Button}
              variant="black"
              boxShadow="md"
              rightIcon={<ChevronDownIcon />}
            >
              Connect Wallet
            </MenuButton>
            <MenuList>
              {connectors.map(({ name, connector }) => (
                <MenuItem
                  key={`connector-${name}`}
                  onClick={() => connect(connector)}
                >
                  {name}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
        )}
        {account && <Account account={account} />}
      </Flex>
    </Flex>
  );
};

export default Header;
