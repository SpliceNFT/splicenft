import { Flex, LinkBox } from '@chakra-ui/react';
import React from 'react';

export const SpliceCard = ({
  children,
  direction = 'column'
}: {
  children: React.ReactNode;
  direction: string;
}) => (
  <LinkBox
    as={Flex}
    rounded="lg"
    overflow="hidden"
    direction={direction}
    _hover={{
      transform: 'translate(0, -3px)',
      boxShadow: 'rgba(0, 0, 0, 0.1) 0px 10px 20px 10px'
    }}
    style={{ transition: 'all ease .3s' }}
    boxShadow="rgba(0, 0, 0, 0.05) 0px 10px 20px 0px"
    justify="space-between"
  >
    {children}
  </LinkBox>
);
