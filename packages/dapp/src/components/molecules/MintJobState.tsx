import { MintingState, MintJob, Splice } from '@splicenft/common';
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
  const mintingState = Splice.translateJobStatus(mintJob.job);

  switch (mintingState) {
    case MintingState.MINTING_REQUESTED:
      return (
        <Alert status="info">
          <AlertIcon />
          <AlertTitle mr={2}>
            This Splice has been requested for minting
          </AlertTitle>
          <AlertDescription isTruncated>
            Job Id: {mintJob.jobId} <br /> by {mintJob.job.requestor}{' '}
          </AlertDescription>
        </Alert>
      );
    case MintingState.MINTING_ALLOWED:
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
    case MintingState.MINTED:
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
