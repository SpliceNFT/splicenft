import { Container, Flex, SystemProps } from '@chakra-ui/react';
import React from 'react';

export const Hero = (props: { children: React.ReactNode } & SystemProps) => {
  const { children, ...rest } = props;
  return (
    <Flex
      width="100%"
      bg="black"
      pt={5}
      align="center"
      fontSize="large"
      direction="column"
      {...rest}
    >
      {children}
    </Flex>
  );
};

export const ContainerHero = (
  props: { children: React.ReactNode } & SystemProps
) => {
  const { children, ...rest } = props;
  return (
    <Hero py={12} {...rest}>
      <Container maxW="container.lg">{children}</Container>
    </Hero>
  );
};
