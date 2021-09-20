import { Button, Container, Heading, Text } from '@chakra-ui/react';

import React from 'react';
import Header from './components/molecules/Header';

export default function Main() {
  return (
    <Container maxW="container.xl">
      <Header />
    </Container>
  );
}
