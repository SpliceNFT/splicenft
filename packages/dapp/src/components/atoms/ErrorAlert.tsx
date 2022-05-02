import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Flex
} from '@chakra-ui/react';
import React from 'react';
import { ErrorDescription } from '../../types/ErrorDescription';

export const ErrorAlert = (props: { error: ErrorDescription }) => {
  const { error } = props;
  return (
    <Alert
      variant="black"
      status="error"
      my={6}
      flexDirection="column"
      alignItems="flex-start"
    >
      <Flex mb={2}>
        <AlertIcon />
        <AlertTitle>{error.title}</AlertTitle>
      </Flex>

      <AlertDescription>{error.description}</AlertDescription>
    </Alert>
  );
};
