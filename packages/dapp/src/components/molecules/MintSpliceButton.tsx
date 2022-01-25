import { Button, Flex, Text, useToast } from '@chakra-ui/react';
import { Style, TokenProvenance } from '@splicenft/common';
import { useWeb3React } from '@web3-react/core';
import { ethers } from 'ethers';
import React, { useEffect, useState } from 'react';
import { FaBirthdayCake } from 'react-icons/fa';
import { useSplice } from '../../context/SpliceContext';

type MintState = {
  mintable: boolean;
  quote: ethers.BigNumber | undefined;
  message: string | undefined;
};
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
  onMinted: (provenance: TokenProvenance) => unknown;
  buzy: boolean;
  setBuzy: (buzy: boolean) => void;
}) => {
  const { account } = useWeb3React();
  const { splice } = useSplice();

  const [mintState, setMintState] = useState<MintState>({
    mintable: false,
    quote: undefined,
    message: undefined
  });

  const toast = useToast();

  useEffect(() => {
    if (!account) return;
    (async () => {
      const mintable = await selectedStyle.isMintable(
        [collection],
        [originTokenId],
        account
      );
      if (mintable === true) {
        const quote = await selectedStyle.quote(collection, originTokenId);
        setMintState({
          mintable,
          quote,
          message: undefined
        });
      } else {
        setMintState({
          mintable: false,
          quote: undefined,
          message: mintable as string
        });
      }
    })();
  }, [splice, selectedStyle, account]);

  const mint = async () => {
    if (!splice || !account || !mintState.mintable || !mintState.quote) return;
    setBuzy(true);
    try {
      const mintingResult = await splice.mint({
        origin_collection: collection,
        origin_token_id: originTokenId,
        style_token_id: selectedStyle.tokenId,
        additionalData: Uint8Array.from([]),
        mintingFee: mintState.quote
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
        disabled={!mintState.mintable || buzy}
        onClick={mint}
        leftIcon={<FaBirthdayCake />}
        variant="white"
        size="lg"
        boxShadow="md"
        isLoading={buzy}
        loadingText="Minting"
        title={mintState.message}
      >
        <Flex direction="column">
          <Text fontWeight="strong" fontSize="lg">
            Mint this Splice
          </Text>
          {mintState.quote && (
            <Text fontWeight="normal" fontSize="md">
              for {ethers.utils.formatEther(mintState.quote)}Eth
            </Text>
          )}
        </Flex>
      </Button>
    </Flex>
  );
};
