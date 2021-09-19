import { Button, Container, Heading, Text } from '@chakra-ui/react';
import { useWeb3React } from '@web3-react/core';
import React from 'react';
import { injected } from './modules/connectors';

export default function Main() {
  const { activate, account } = useWeb3React();

  const connect = () => {
    activate(injected, (e) => {
      console.error(e);
    });
  }
  return <Container>
    
    <Heading>So it begins.</Heading>
    <Text>some text</Text>
    { !account && <Button onClick={connect} colorScheme="pink">connect!</Button> }
    { account && <Text>Hello, {account}</Text>}
  </Container>
}
