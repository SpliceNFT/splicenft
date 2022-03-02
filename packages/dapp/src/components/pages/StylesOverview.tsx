import { useQuery } from '@apollo/client';
import { Container, Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react';
import React from 'react';
import { Link } from 'react-router-dom';
import { useSplice } from '../../context/SpliceContext';
import { Style } from '@splicenft/common';

import {
  ALL_STYLE_STATS,
  PAYMENT_MEMBER,
  StyleStatsData,
  STYLE_STATS
} from '../../modules/Queries';

export interface PaymentMemberVars {
  address: string[];
}

export interface PaymentMemberData {
  paymentSplits: {
    payees: string[];
    style: {
      id: string;
    };
  };
}

export const StylesOverviewPage = () => {
  const { spliceStyles } = useSplice();

  if (!spliceStyles) {
    return <div>loading</div>;
  }
  return (
    <Container maxW="container.lg">
      <Table variant="simple" colorScheme="black" size="lg" my={5}>
        <Thead>
          <Tr>
            <Th>Style</Th>
          </Tr>
        </Thead>
        <Tbody>
          {spliceStyles.map((style) => (
            <Tr key={`style-${style.tokenId}`}>
              <Td>
                <Link to={`/style/${style.tokenId}`}>
                  {style.getMetadata().name}
                </Link>{' '}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Container>
  );
};
