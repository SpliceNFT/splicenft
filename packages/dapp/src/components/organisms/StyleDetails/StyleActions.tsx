import { Button, Flex, Text, useToast } from '@chakra-ui/react';
import { ActiveStyle, StyleStatsData } from '@splicenft/common';
import { useWeb3React } from '@web3-react/core';
import React, { useEffect, useState } from 'react';
import { TransferButton } from './Transfer';

const StyleActions = (props: { style: ActiveStyle; stats: StyleStatsData }) => {
  const { style, stats } = props;
  const { account } = useWeb3React();
  const [isStyleMinter, setIsStyleMinter] = useState<boolean>(false);
  const [active, setActive] = useState<boolean>(false);
  const toast = useToast();

  useEffect(() => {
    style.isStyleActive().then(setActive);
    if (account) {
      style.isStyleMinter(account).then(setIsStyleMinter);
    }
  }, [account]);

  const toggleActive = async () => {
    try {
      setActive(await style.toggleActive(!active));
    } catch (e: any) {
      toast({ title: 'tx failed', description: e.message || e });
    }
  };

  const isOwner = stats.style.owner === account?.toLowerCase();

  return (
    <Flex justify="flex-end" gridGap={3} align="center">
      {isStyleMinter || isOwner ? (
        <Button onClick={toggleActive} px={12} size="sm">
          {active ? 'Stop sales' : 'Start Sales'}
        </Button>
      ) : (
        <Text>Active: {active ? 'Yes' : 'No'}</Text>
      )}

      {isOwner && <TransferButton tokenId={style.tokenId} />}
    </Flex>
  );
};

export default StyleActions;
