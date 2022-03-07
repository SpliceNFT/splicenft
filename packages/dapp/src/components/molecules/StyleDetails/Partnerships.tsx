import { Flex, Heading, Text } from '@chakra-ui/react';
import { ActiveStyle, Partnership } from '@splicenft/common';
import React, { useEffect, useState } from 'react';

export const Partnerships = (props: { style: ActiveStyle }) => {
  const { style } = props;

  const [partnership, setPartnership] = useState<Partnership | undefined>();

  useEffect(() => {
    (async () => {
      try {
        setPartnership(await style.partnership());
      } catch (e: any) {
        console.debug(style);
        console.warn('style: ', e.message || e);
      }
    })();
  }, []);

  if (!partnership) return <></>;

  return (
    <Flex direction="column">
      <Heading size="md">Partnership</Heading>
      <Text>Collections: {partnership.collections.join(',')}</Text>
      <Text>Exclusive: {partnership.exclusive ? 'Yes' : 'No'}</Text>
      <Text>Runs until: {partnership.until.toISOString()}</Text>
    </Flex>
  );
};
