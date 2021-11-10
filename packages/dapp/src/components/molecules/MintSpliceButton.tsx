import { useToast, Flex, Text, Button } from '@chakra-ui/react';
import { Style } from '@splicenft/common';
import { useWeb3React } from '@web3-react/core';
import { ethers } from 'ethers';
import React, { useEffect, useState } from 'react';
import { useSplice } from '../../context/SpliceContext';
import { FaBirthdayCake } from 'react-icons/fa';

export const MintSpliceButton = ({
  collection,
  originTokenId,
  selectedStyle,
  onMinted,
  buzy,
  setBuzy
}: {
  collection: string;
  originTokenId: string;
  selectedStyle: Style;
  onMinted: (spliceTokenId: number) => unknown;
  buzy: boolean;
  setBuzy: (buzy: boolean) => void;
}) => {
  const { account } = useWeb3React();
  const { splice } = useSplice();

  const [quote, setQuote] = useState<ethers.BigNumber>();
  const toast = useToast();

  useEffect(() => {
    if (!splice) return;
    (async () => {
      const _quoteWei = await splice.quote(collection, selectedStyle.tokenId);
      setQuote(_quoteWei);
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
        recipient: account,
        mintingFee: quote
      });
      onMinted(mintingResult.spliceTokenId);
    } catch (e: any) {
      console.error(e);
      toast({
        title: `Mint Transaction failed ${e.message}`,
        status: 'error',
        isClosable: true
      });
    }
    setBuzy(false);
  };

  return (
    <Flex direction="column" align="center">
      <Button
        disabled={!quote || !splice || buzy}
        onClick={mint}
        leftIcon={<FaBirthdayCake />}
        variant="white"
        size="lg"
        boxShadow="md"
        isLoading={buzy}
        loadingText="Minting"
      >
        <Flex direction="column">
          <Text fontWeight="strong" fontSize="xl">Mint this Splice</Text>
          {quote && (
            <Text fontWeight="normal" fontSize="md">
              for {ethers.utils.formatUnits(quote, 'ether')}Eth
            </Text>
          )}
        </Flex>
      </Button>
      {/*
    <Text color="red.500">
      minting NFTs of this collection is not allowed right now
    </Text>
  */}
    </Flex>
  );
};
