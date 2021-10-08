import { MintJob } from '@splicenft/common';
import React from 'react';
import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription
} from '@chakra-ui/react';

export const MintJobState = ({
  mintJob
}: {
  mintJob: {
    jobId: number;
    job: MintJob;
  };
}) => {
  switch (mintJob.job.status) {
    case 0:
      return (
        <Alert status="info">
          <AlertIcon />
          <AlertTitle mr={2}>
            This Splice has been requested for minting
          </AlertTitle>
          <AlertDescription>
            Job Id: {mintJob.jobId}, requested by {mintJob.job.requestor}{' '}
          </AlertDescription>
        </Alert>
      );
    case 1:
      return (
        <Alert status="warning">
          <AlertIcon />
          <AlertTitle mr={2}>
            This Splice has been approved for minting
          </AlertTitle>
          <AlertDescription>
            An oracle successfully verified the nft metadata.{' '}
            {mintJob.job.requestor} can now finally mint the splice.
          </AlertDescription>
        </Alert>
      );
    case 2:
      return (
        <Alert status="success">
          <AlertIcon />
          <AlertTitle mr={2}>
            This Splice has been minted to {mintJob.job.recipient}
          </AlertTitle>
        </Alert>
      );
    default:
      return <></>;
  }
};
