import {
  Button,
  Container,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr
} from '@chakra-ui/react';
import { Partnership, Style, StyleStats } from '@splicenft/common';
import { useWeb3React } from '@web3-react/core';
import React, { useEffect, useState } from 'react';
import { useSplice } from '../../context/SpliceContext';

const ActivateButton = (props: { style: Style; stats: StyleStats }) => {
  const { style, stats } = props;
  const [active, setActive] = useState<boolean>(stats.active);

  const toggle = async () => {
    const newVal = !stats.active;
    await style.toggleActive(newVal);
    setActive(newVal);
  };
  return (
    <Button onClick={toggle}>{active ? 'Stop sales' : 'Start Sales'}</Button>
  );
};

const StyleLine = (props: { style: Style; isStyleMinter: boolean }) => {
  const { account } = useWeb3React();
  const { style, isStyleMinter } = props;
  const [stats, setStats] = useState<StyleStats>();
  const [partnership, setPartnership] = useState<Partnership | null>();

  useEffect(() => {
    (async () => {
      setStats(await style.stats());
      setPartnership(await style.partnership());
    })();
  }, [style]);

  return (
    <Tr>
      <Td>{style.getMetadata().name}</Td>
      <Td>{stats?.owner}</Td>
      <Td>
        {stats?.settings.mintedOfStyle} / {stats?.settings.cap}
      </Td>
      <Td isNumeric>0</Td>
      <Td title={partnership?.collections.join('|')} isNumeric>
        {partnership && partnership.collections.length}
      </Td>
      <Td>
        {stats && (isStyleMinter || stats?.owner === account) ? (
          <ActivateButton style={style} stats={stats} />
        ) : (
          <Text>{stats?.active ? 'Yes' : 'No'}</Text>
        )}

        {stats?.owner === account ? 'Transfer' : 'void'}
      </Td>
    </Tr>
  );
};

export const CreatorsPage = () => {
  const { account } = useWeb3React();
  const { splice, spliceStyles } = useSplice();
  const [isStyleMinter, setIsStyleMinter] = useState<boolean>(false);
  useEffect(() => {
    if (!splice || !account) return;
    (async () => {
      const styleNft = await splice.getStyleNFT();
      const _isStyleMinter = await styleNft.isStyleMinter(account);
      setIsStyleMinter(_isStyleMinter);
    })();
  }, [splice, account]);
  return (
    <Container maxW="container.lg">
      <Table variant="striped" colorScheme="purple" size="sm">
        <Thead>
          <Tr>
            <Th>Style Name</Th>
            <Th>Owner</Th>
            <Th>Minted / Cap</Th>
            <Th>Price</Th>
            <Th>Partner</Th>
            <Th>Active</Th>
          </Tr>
        </Thead>
        <Tbody>
          {spliceStyles.map((style) => (
            <StyleLine
              style={style}
              isStyleMinter={isStyleMinter}
              key={`style-${style.tokenId}`}
            />
          ))}
        </Tbody>
      </Table>
    </Container>
  );
};
