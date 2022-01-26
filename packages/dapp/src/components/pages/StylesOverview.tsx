import { Container, Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react';
import React from 'react';
import { Link } from 'react-router-dom';
import { useSplice } from '../../context/SpliceContext';

export const StylesOverviewPage = () => {
  const { spliceStyles } = useSplice();

  return (
    <Container maxW="container.lg">
      <Table variant="striped" colorScheme="purple" size="sm">
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
