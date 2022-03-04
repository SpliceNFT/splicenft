import { Container, Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react';
import React from 'react';
import { Link } from 'react-router-dom';
import { useSplice } from '../../context/SpliceContext';
import ConnectAlert from '../molecules/ConnectAlert';

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
    <ConnectAlert>
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
    </ConnectAlert>
  );
};
