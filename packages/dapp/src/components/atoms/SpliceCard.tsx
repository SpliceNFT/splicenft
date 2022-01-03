import { Flex, LinkBox, SystemProps } from '@chakra-ui/react';
import React from 'react';

export const SpliceCard = (
  props: {
    children: React.ReactNode;
  } & SystemProps
) => {
  const { children, ...rest } = props;
  return (
    <LinkBox
      as={Flex}
      rounded="lg"
      _hover={{
        transform: 'translate(0, -3px)',
        boxShadow: 'rgba(0, 0, 0, 0.1) 0px 10px 20px 10px'
      }}
      style={{ transition: 'transform ease .3s' }}
      boxShadow="rgba(0, 0, 0, 0.05) 0px 10px 20px 0px"
      {...rest}
    >
      {children}
    </LinkBox>
  );
};
