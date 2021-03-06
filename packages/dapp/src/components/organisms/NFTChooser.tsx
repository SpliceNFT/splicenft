import { Flex, Heading, LinkOverlay } from '@chakra-ui/react';
import { useState } from 'react';
import { CreativeOrigin } from '../../types/CreativeOrigin';
import { FallbackImage } from '../atoms/FallbackImage';
import { SpliceCard } from '../atoms/SpliceCard';
import { ImportNFT } from '../molecules/Create/ImportNFT';

export const NFTChooser = ({
  nftChosen
}: {
  nftChosen: (origin: CreativeOrigin) => unknown;
}) => {
  const [origins, setOrigins] = useState<CreativeOrigin[]>([]);
  const [selected, setSelected] = useState<CreativeOrigin>();
  const addNFT = (origin: CreativeOrigin) => {
    setOrigins([origin, ...origins]);
    select(origin);
  };
  const select = (origin: CreativeOrigin) => {
    setSelected(origin);
    nftChosen(origin);
  };

  return (
    <Flex direction="column" w="full">
      <Heading size="sm">add an origin NFT URL</Heading>
      <ImportNFT onNFT={addNFT} />
      <Flex direction="row" gridGap={3} my={6}>
        {origins.map((o) => (
          <SpliceCard
            border="4px solid"
            borderColor={selected === o ? 'blue.400' : 'transparent'}
            overflow="hidden"
            flexDirection="column"
            key={`${o.nft.contract_address}_${o.nft.token_id}`}
          >
            <LinkOverlay onClick={() => select(o)} sx={{ cursor: 'pointer' }}>
              <FallbackImage metadata={o.nft.metadata} maxH={64} />
            </LinkOverlay>
          </SpliceCard>
        ))}
      </Flex>
    </Flex>
  );
};
