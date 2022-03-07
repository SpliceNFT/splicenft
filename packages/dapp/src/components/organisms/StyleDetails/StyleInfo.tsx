import { Flex, Heading, Text } from '@chakra-ui/react';
import { ActiveStyle, Style, StyleStatsData } from '@splicenft/common';
import { useWeb3React } from '@web3-react/core';
import React from 'react';
import { NumBox } from '../../atoms/NumBox';
import StyleActions from './StyleActions';

export const StyleInfo = (props: {
  style: Style;
  activeStyle?: ActiveStyle;
  stats: StyleStatsData;
}) => {
  const { style, stats, activeStyle } = props;
  const { account } = useWeb3React();

  return (
    <Flex direction="column" p={3} h="100%">
      <Flex direction="column">
        <Heading size="lg" color="white">
          {style.getMetadata().name}
        </Heading>

        <Text color="white" fontSize="sm">
          Owner: {stats.style.owner}{' '}
          {stats.style.owner === account?.toLowerCase() && <b> (You)</b>}
        </Text>
        <Text color="white" fontSize="sm">
          Style ID: {style.tokenId}
        </Text>
      </Flex>
      <NumBox
        head="Minted"
        val={`${stats.style.minted} /  ${stats.style.cap}`}
        my={5}
        bg="transparent"
        color="white"
      ></NumBox>
      {activeStyle && <StyleActions style={activeStyle} stats={stats} />}
    </Flex>
  );
};
