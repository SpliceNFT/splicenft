import React from 'react'
import {Container, Heading, Text, Button} from '@chakra-ui/react'
import { injected } from './modules/connectors';
import { useWeb3React } from '@web3-react/core';

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
