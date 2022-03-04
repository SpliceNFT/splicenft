import { Flex, Link, Spacer } from '@chakra-ui/react';
import { useWeb3React } from '@web3-react/core';
import React from 'react';
import { NavLink as ReactLink } from 'react-router-dom';
import { useSplice } from '../../context/SpliceContext';
import Account from '../atoms/Account';
import ConnectButton from '../atoms/ConnectButton';
import Logo from '../atoms/Logo';

const Header = () => {
  const { active, deactivate, account } = useWeb3React();
  const { splice } = useSplice();

  const disconnect = () => {
    localStorage.removeItem('prvConnectedWith');
    deactivate();
  };

  return (
    <Flex p={[2, 3, 5]} gridGap={2} mb={[0, 3]}>
      <Flex flex="2">
        <Logo />
      </Flex>
      <Spacer />
      <Flex direction="row" align="center" gridGap={10}>
        <Flex direction="row" gridGap={[2, 6]}>
          {active && (
            <>
              <Link
                as={ReactLink}
                to="/my-assets"
                exact
                activeStyle={{ fontWeight: 800, borderBottom: '2px solid' }}
              >
                My NFTs
              </Link>
              {splice && (
                <Link
                  as={ReactLink}
                  to="/my-splices"
                  activeStyle={{ fontWeight: 800, borderBottom: '2px solid' }}
                >
                  My splices
                </Link>
              )}

              {/*<Link as={ReactLink} to="/create" activeStyle={{ fontWeight: 800 }}>
              Create
        </Link>*/}
            </>
          )}
          <Link href="https://splicenft.github.io/splicenft/" isExternal>
            Docs
          </Link>
        </Flex>

        {account ? (
          <Account account={account} disconnect={disconnect} />
        ) : (
          <ConnectButton variant="black" boxShadow="md">
            Connect Wallet
          </ConnectButton>
        )}
      </Flex>
    </Flex>
  );
};

export default Header;
