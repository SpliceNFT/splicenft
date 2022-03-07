import {
  Button,
  Input,
  InputGroup,
  InputRightElement,
  useToast
} from '@chakra-ui/react';
import { useWeb3React } from '@web3-react/core';
import React, { useState } from 'react';
import { useSplice } from '../../../context/SpliceContext';

export const TransferForm = (props: {
  onRecipient: (r: string) => unknown;
}) => {
  const { onRecipient } = props;
  const [recipient, setRecipient] = useState<string>('');

  const validate = () => {
    //console.log(recipient);
    onRecipient(recipient);
  };

  return (
    <InputGroup size="md" width="50%">
      <Input
        pr="4.5rem"
        type="text"
        placeholder="0xrecipient"
        value={recipient}
        bg="white"
        onChange={(e) => {
          e.preventDefault();
          setRecipient(e.target.value);
        }}
      />
      <InputRightElement width="5rem">
        <Button
          size="xs"
          px={10}
          mr={2}
          variant="black"
          onClick={() => {
            validate();
          }}
        >
          Transfer
        </Button>
      </InputRightElement>
    </InputGroup>
  );
};
export const TransferButton = (props: { tokenId: number }) => {
  const { splice } = useSplice();
  const { tokenId } = props;
  const toast = useToast();
  const { account } = useWeb3React();
  const [inTransfer, setInTransfer] = useState<boolean>(false);
  const [buzy, setBuzy] = useState<boolean>(false);

  const doTransfer = async (from: string, to: string) => {
    if (!splice) return;
    setInTransfer(false);
    setBuzy(true);
    try {
      const styleNFT = await splice.getStyleNFT();
      const tx = await styleNFT.transferFrom(from, to, tokenId);
      await tx.wait();

      toast({
        status: 'success',
        title: 'style transferred',
        description: 'reload the page'
      });
    } catch (e: any) {
      toast({ status: 'error', title: 'claim failed', description: e.message });
    } finally {
      setBuzy(false);
    }
  };

  return account && inTransfer ? (
    <TransferForm onRecipient={(recipient) => doTransfer(account, recipient)} />
  ) : (
    <Button
      isLoading={buzy}
      variant="white"
      size="sm"
      px={12}
      my={2}
      onClick={() => setInTransfer(true)}
    >
      Transfer
    </Button>
  );
};
