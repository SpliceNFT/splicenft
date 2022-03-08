import { Flex, SystemProps, Text } from '@chakra-ui/react';
import React from 'react';

export const NumBox = (
  props: {
    head: string;
    val: string;
    children?: React.ReactNode;
  } & SystemProps
) => {
  const { head, val, children, ...rest } = props;
  return (
    <Flex
      align="center"
      justify="center"
      background="white"
      p={5}
      direction="column"
      flex="1"
      {...rest}
    >
      <Text>{head}</Text>
      <Text fontSize="2xl">{val}</Text>
      {children}
    </Flex>
  );
};
