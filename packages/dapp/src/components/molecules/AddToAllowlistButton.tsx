import { Button, Flex, Text, useToast } from '@chakra-ui/react';
import { AllowlistTypes, Style, verifyAllowlistEntry } from '@splicenft/common';
import { useWeb3React } from '@web3-react/core';
import axios from 'axios';
import { providers } from 'ethers';
import React from 'react';
import { FaScroll } from 'react-icons/fa';

export const AddToAllowlistButton = ({
  selectedStyle,
  ownsOrigin
}: {
  selectedStyle: Style;
  ownsOrigin: boolean;
}) => {
  const { account, library: web3 } = useWeb3React<providers.Web3Provider>();
  const toast = useToast();

  const signAllowlistRequest = async () => {
    if (!web3 || !account) return;
    const chainId = (await web3.getNetwork()).chainId;
    try {
      const signer = web3.getSigner();
      const signature = await signer._signTypedData(
        {
          chainId: chainId,
          name: 'Splice Allowlist',
          version: '1'
        },
        AllowlistTypes,
        {
          style_token_id: selectedStyle.tokenId.toString(),
          from: account
        }
      );
      const verifiedAddress = verifyAllowlistEntry(
        chainId,
        selectedStyle.tokenId.toString(),
        account,
        signature
      );
      if (!verifiedAddress) {
        throw new Error('Signature verification failed');
      }
      const url = `${process.env.REACT_APP_VALIDATOR_BASEURL}/allowlist`;
      await axios.post(url, {
        address: account,
        style_token_id: selectedStyle.tokenId.toString(),
        signature,
        chain_id: chainId
      });
      toast({
        title: `Congrats, we added you the allowlist of '${
          selectedStyle.getMetadata().name
        }'`,
        status: 'success',
        isClosable: true
      });
    } catch (e: any) {
      toast({
        title: e.data?.message || e.message,
        status: 'error',
        isClosable: true
      });
    }
  };

  return (
    <Flex direction="column" align="center">
      <Button
        disabled={!selectedStyle || !ownsOrigin}
        onClick={signAllowlistRequest}
        leftIcon={<FaScroll />}
        variant="white"
        size="lg"
        boxShadow="md"
        loadingText="Signing you up"
      >
        <Flex direction="column">
          <Text fontWeight="strong" fontSize="lg">
            Request Allowlist Slot
          </Text>

          <Text fontWeight="normal" fontSize="md">
            to save yourself a mint
          </Text>
        </Flex>
      </Button>
    </Flex>
  );
};
