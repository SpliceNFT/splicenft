import { Flex, LinkOverlay } from '@chakra-ui/react';
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

  const addNFT = (origin: CreativeOrigin) => {
    setOrigins([origin, ...origins]);
  };

  return (
    <Flex direction="column">
      <ImportNFT onNFT={addNFT} />
      <Flex direction="row" gridGap={3} my={6}>
        {origins.map((o) => (
          <SpliceCard
            flexDirection="column"
            key={`${o.nft.contract_address}_${o.nft.token_id}`}
          >
            <LinkOverlay onClick={() => nftChosen(o)}>
              <FallbackImage metadata={o.nft.metadata} height="15rem" />
            </LinkOverlay>
          </SpliceCard>
        ))}
      </Flex>
    </Flex>
  );
};
