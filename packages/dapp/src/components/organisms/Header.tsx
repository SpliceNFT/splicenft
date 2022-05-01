import { Flex, Spacer } from '@chakra-ui/react';
import { useWeb3React } from '@web3-react/core';
import React from 'react';
import { useSplice } from '../../context/SpliceContext';
import Account from '../atoms/Account';
import ConnectButton from '../atoms/ConnectButton';
import Logo from '../atoms/Logo';
import { NavLink } from '../atoms/NavLink';

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
              <NavLink to="/my-assets" title="My NFTs" exact />
              {splice && <NavLink to="/my-splices" exact title="My splices" />}

              {/*<Link as={ReactLink} to="/create" activeStyle={{ fontWeight: 800 }}>
              Create
        </Link>*/}
            </>
          )}
          <NavLink
            to="https://splicenft.github.io/splicenft/"
            title="Docs"
            isExternal
          />
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
