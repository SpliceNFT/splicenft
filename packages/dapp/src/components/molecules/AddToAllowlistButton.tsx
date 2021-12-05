import {
  Button,
  Flex,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useToast,
  useDisclosure,
  UseDisclosureProps
} from '@chakra-ui/react';
import { Style, AllowList } from '@splicenft/common';
import { useWeb3React } from '@web3-react/core';
import { ethers, providers } from 'ethers';
import React, { useEffect, useState } from 'react';
import { FaKey, FaScroll } from 'react-icons/fa';

interface ModalProps {
  isOpen: boolean;
  onClose(): void;
  selectedStyle: Style;
}

const SignupModal = (props: ModalProps) => {
  const { isOpen, onClose, selectedStyle } = props;
  const {
    account,
    chainId,
    library: web3
  } = useWeb3React<providers.Web3Provider>();
  const toast = useToast();

  const signAllowlistRequest = async () => {
    if (!web3) return;
    try {
      const signer = web3.getSigner();
      const signature = await signer._signTypedData(
        {
          chainId: chainId,
          name: 'Splice Allowlist',
          version: '1'
        },
        AllowList.AllowlistTypes,
        {
          styleId: selectedStyle.tokenId.toString(),
          from: account
        }
      );
      // const signed = await signer.signMessage(
      //   `Put me on the SPLICE allowlist for ${selectedStyle.getMetadata().name}`
      // );
      const verifiedAddress = ethers.utils.verifyTypedData(
        {
          chainId: chainId,
          name: 'Splice Allowlist',
          version: '1'
        },
        AllowList.AllowlistTypes,
        {
          styleId: selectedStyle.tokenId.toString(),
          from: account
        },
        signature
      );
    } catch (e: any) {
      console.error(e);
      const message = e.data?.message || e.message;
      toast({
        title: `Mint Transaction failed ${message}`,
        status: 'error',
        isClosable: true
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Modal Title</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text>
            To reserve a slot for your account on our allow list, hit the "Sign"
            button{' '}
          </Text>
        </ModalBody>

        <ModalFooter>
          <Button
            disabled={!web3}
            onClick={signAllowlistRequest}
            variant="black"
            leftIcon={<FaKey />}
          >
            Sign
          </Button>
          <Button mr={3} onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
export const AddToAllowlistButton = ({
  collection,
  originTokenId,
  selectedStyle,
  ownsOrigin
}: {
  collection: string;
  originTokenId: string;
  selectedStyle: Style;
  ownsOrigin: boolean;
}) => {
  const [buzy, setBuzy] = useState<boolean>(false);
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Flex direction="column" align="center">
      <Button
        disabled={!selectedStyle || !ownsOrigin}
        onClick={onOpen}
        leftIcon={<FaScroll />}
        variant="white"
        size="lg"
        boxShadow="md"
        isLoading={buzy}
        loadingText="Signing you up"
      >
        <Flex direction="column">
          <Text fontWeight="strong" fontSize="lg">
            Request Allowlist slot
          </Text>

          <Text fontWeight="normal" fontSize="md">
            to save yourself a mint
          </Text>
        </Flex>
      </Button>
      {selectedStyle && ownsOrigin && (
        <SignupModal
          onClose={onClose}
          isOpen={isOpen}
          selectedStyle={selectedStyle}
        />
      )}
    </Flex>
  );
};
