import { Button, Container, Heading, Text } from '@chakra-ui/react';
import { useWeb3React } from '@web3-react/core';

import React from 'react';
import Header from './components/molecules/Header';
import MyAssets from './components/pages/MyAssets';

export default function Main() {
  const { account } = useWeb3React();

  return (
    <Container maxW="container.xl">
      <Header />
      {account && <MyAssets />}
    </Container>
  );
}
