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
import { Style } from '@splicenft/common';
import { useWeb3React } from '@web3-react/core';
import { providers } from 'ethers';
import React, { useEffect, useState } from 'react';
import { FaScroll } from 'react-icons/fa';

interface ModalProps {
  isOpen: boolean;
  onClose(): void;
}

const SignupModal = (props: ModalProps) => {
  const { isOpen, onClose } = props;
  const { account, library: web3 } = useWeb3React();
  const toast = useToast();

  const signAllowlistRequest = async () => {
    try {
      console.log('foo');
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
        <ModalBody>{account}</ModalBody>

        <ModalFooter>
          <Button onClick={signAllowlistRequest}>Sign the message</Button>
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
  selectedStyle
}: {
  collection: string;
  originTokenId: string;
  selectedStyle: Style;
}) => {
  const [buzy, setBuzy] = useState<boolean>(false);
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    (async () => {
      console.log('foo');
    })();
  }, [selectedStyle]);

  return (
    <Flex direction="column" align="center">
      <Button
        disabled={!selectedStyle}
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
      <SignupModal onClose={onClose} isOpen={isOpen} />
    </Flex>
  );
};
