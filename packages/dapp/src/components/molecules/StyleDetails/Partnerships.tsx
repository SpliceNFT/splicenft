import { Flex, Heading, Text } from '@chakra-ui/react';
import { Partnership, Style, StyleStats } from '@splicenft/common';
import React from 'react';

export const Partnerships = (props: {
  style: Style;
  stats: StyleStats;
  partnership: Partnership;
}) => {
  const { partnership } = props;
  return (
    <Flex direction="column">
      <Heading size="md">Partnership</Heading>
      <Text>Collections: {partnership.collections.join(',')}</Text>
      <Text>Exclusive: {partnership.exclusive ? 'Yes' : 'No'}</Text>
      <Text>Runs until: {partnership.until.toISOString()}</Text>
    </Flex>
  );
};
