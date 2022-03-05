import { Button, useToast } from '@chakra-ui/react';
import { Style, StyleStats } from '@splicenft/common';
import React, { useState } from 'react';

export const ActivateButton = (props: { style: Style; stats: StyleStats }) => {
  const { style, stats } = props;
  const [active, setActive] = useState<boolean>(stats.active);
  const toast = useToast();

  const toggle = async () => {
    const newVal = !stats.active;
    try {
      setActive(await style.toggleActive(newVal));
    } catch (e: any) {
      toast({ title: 'tx failed', description: e.message || e });
    }
  };
  return (
    <Button onClick={toggle} px={12} size="sm">
      {active ? 'Stop sales' : 'Start Sales'}
    </Button>
  );
};
