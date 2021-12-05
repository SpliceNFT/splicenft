import { Button, Flex, Text, useToast } from '@chakra-ui/react';
import { Style, TokenProvenance } from '@splicenft/common';
import { useWeb3React } from '@web3-react/core';
import { ethers } from 'ethers';
import React, { useEffect, useState } from 'react';
import { FaBirthdayCake } from 'react-icons/fa';
import { useSplice } from '../../context/SpliceContext';

export const MintSpliceButton = ({
  collection,
  originTokenId,
  selectedStyle,
  onMinted,
  ownsOrigin,
  buzy,
  setBuzy
}: {
  collection: string;
  originTokenId: string;
  selectedStyle: Style;
  onMinted: (provenance: TokenProvenance) => unknown;
  ownsOrigin: boolean;
  buzy: boolean;
  setBuzy: (buzy: boolean) => void;
}) => {
  const { account } = useWeb3React();
  const { splice } = useSplice();

  const [quote, setQuote] = useState<ethers.BigNumber>();
  const toast = useToast();

  useEffect(() => {
    (async () => {
      const _active = await selectedStyle.isActive();
      if (_active) {
        const _quoteWei = await selectedStyle.quote(collection);
        setQuote(_quoteWei);
      } else {
        setQuote(undefined);
      }
    })();
  }, [selectedStyle]);

  const mint = async () => {
    if (!splice || !account || !quote) return;
    setBuzy(true);
    try {
      const mintingResult = await splice.mint({
        origin_collection: collection,
        origin_token_id: originTokenId,
        style_token_id: selectedStyle.tokenId,
        additionalData: Uint8Array.from([]),
        mintingFee: quote
      });

      onMinted(mintingResult.provenance);
    } catch (e: any) {
      console.error(e);
      const message = e.data?.message || e.message;
      toast({
        title: `Mint Transaction failed ${message}`,
        status: 'error',
        isClosable: true
      });
    }
    setBuzy(false);
  };

  return (
    <Flex direction="column" align="center">
      <Button
        disabled={!quote || !splice || !ownsOrigin || buzy}
        onClick={mint}
        leftIcon={<FaBirthdayCake />}
        variant="white"
        size="lg"
        boxShadow="md"
        isLoading={buzy}
        loadingText="Minting"
      >
        <Flex direction="column">
          <Text fontWeight="strong" fontSize="lg">
            Mint this Splice
          </Text>
          {quote && (
            <Text fontWeight="normal" fontSize="md">
              for {ethers.utils.formatUnits(quote, 'ether')}Eth
            </Text>
          )}
        </Flex>
      </Button>
    </Flex>
  );
};
