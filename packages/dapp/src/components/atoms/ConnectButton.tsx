import { ChevronDownIcon } from '@chakra-ui/icons';
import {
  Button,
  ButtonProps,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  useToast
} from '@chakra-ui/react';
import { AbstractConnector } from '@web3-react/abstract-connector/dist';
import { useWeb3React } from '@web3-react/core';
import React, { useEffect } from 'react';
import { injected, walletconnect } from '../../modules/connectors';

export default function ConnectButton(props: ButtonProps) {
  const { children } = props;
  const { activate } = useWeb3React();
  const toast = useToast();

  const connectors = [
    { name: 'MetaMask', connector: injected },
    { name: 'Wallet Connect', connector: walletconnect }
  ];

  const connect = (connectorName: string, connector: AbstractConnector) => {
    activate(connector, console.error);
    localStorage.setItem('prvConnectedWith', connectorName);
  };

  useEffect(() => {
    const previousConnection = localStorage.getItem('prvConnectedWith');
    if (previousConnection) {
      const connector = connectors.find((c) => c.name === previousConnection);
      if (!connector) {
        localStorage.removeItem('prvConnectedWith');
      } else {
        activate(connector.connector, (err) => {
          toast({
            status: 'error',
            title: 'activation error',
            description: err.message
          });
        });
      }
    }
  }, []);

  return (
    <Menu>
      <MenuButton as={Button} rightIcon={<ChevronDownIcon />} {...props}>
        {children}
      </MenuButton>
      <MenuList>
        {connectors.map(({ name, connector }) => (
          <MenuItem
            key={`connector-${name}`}
            onClick={() => connect(name, connector)}
          >
            {name}
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
}
