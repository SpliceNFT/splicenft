import {
  Alert,
  AlertIcon,
  AlertStatus,
  AlertTitle,
  Container,
  Flex,
  Spacer
} from '@chakra-ui/react';
import { useWeb3React } from '@web3-react/core';
import React, { ReactNode } from 'react';
import { useSplice } from '../../context/SpliceContext';
import ConnectButton from '../atoms/ConnectButton';

const CAlert = ({
  children,
  status
}: {
  children: ReactNode;
  status: AlertStatus;
}) => {
  return (
    <Container maxW="container.lg" minHeight="70vh" py={12}>
      <Alert status={status} variant="black" overflow="visible">
        <Flex align="center" justify="space-between" w="100%">
          <Flex>
            <AlertIcon />
            <AlertTitle>{children}</AlertTitle>
          </Flex>
          <Spacer />
          <ConnectButton size="sm" variant="black">
            connect
          </ConnectButton>
        </Flex>
      </Alert>
    </Container>
  );
};

export default function ConnectAlert({
  children
}: {
  children: React.ReactNode;
}) {
  const { chainId } = useWeb3React();
  const { splice } = useSplice();

  if (!chainId) {
    return (
      <CAlert status="warning">Please connect your Ethereum wallet</CAlert>
    );
  }

  if (!splice) {
    return (
      <CAlert status="warning">
        Splice is not available on chain {chainId}. Please switch to mainnet or
        rinkeby for testing.
      </CAlert>
    );
  }

  return <>{children}</>;
}
