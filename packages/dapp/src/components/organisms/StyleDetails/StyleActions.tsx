import { Flex, Heading, Text } from '@chakra-ui/react';
import { Partnership, Style, StyleStats } from '@splicenft/common';
import { useWeb3React } from '@web3-react/core';
import React from 'react';
import { NumBox } from '../../atoms/NumBox';
import { TransferButton } from './Transfer';
import { ActivateButton } from '../../molecules/StyleDetails/ActivateButton';

export const StyleActions = (props: {
  style: Style;
  isStyleMinter: boolean;
  stats: StyleStats;
  partnership: Partnership | undefined;
}) => {
  const { account } = useWeb3React();
  const { style, stats, isStyleMinter, partnership } = props;

  return (
    <Flex direction="column" p={3} h="100%">
      <Flex direction="column">
        <Heading size="lg" color="white">
          {style.getMetadata().name}
        </Heading>

        <Text color="white" fontSize="sm">
          Owner: {stats.owner} {stats.owner === account && <span> (You)</span>}
        </Text>
        <Text color="white" fontSize="sm">
          Style ID: {style.tokenId}
        </Text>
      </Flex>
      <NumBox
        head="Minted"
        val={`${stats.settings.mintedOfStyle} /  ${stats.settings.cap}`}
        my={5}
        bg="transparent"
        color="white"
      ></NumBox>

      <Flex justify="flex-end" gridGap={3} align="center">
        {isStyleMinter || stats.owner === account ? (
          <ActivateButton style={style} stats={stats} />
        ) : (
          <Text>Active: {stats.active ? 'Yes' : 'No'}</Text>
        )}

        {stats.owner === account && (
          <TransferButton account={account} tokenId={style.tokenId} />
        )}
      </Flex>
    </Flex>
  );
};
