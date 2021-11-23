import { ethereum, Bytes, log as glog } from '@graphprotocol/graph-ts';
import { Splice } from '../generated/schema';
import {
  Approval,
  ApprovalForAll,
  Minted,
  OwnershipTransferred,
  Paused,
  SharesChanged,
  Transfer,
  Unpaused,
  Withdrawn
} from '../generated/Splice/Splice';

export function handleMinted(event: Minted): void {
  const tokenId = event.params.token_id.toString();
  const splice = new Splice(tokenId);

  splice.owner = event.transaction.from;
  splice.style_token_id = event.params.style_token_id.toU32();
  splice.origin_hash = event.params.origin_hash;

  //1st 4 byte = method keccak hash fragment
  //3*bytes32 (96 bytes) = values / function args
  const txInput = event.transaction.input.subarray(4, 100);
  const reducedInput = Bytes.fromUint8Array(txInput);

  glog.debug('tx input: {}', [reducedInput.toHexString()]);

  const decoded = ethereum.decode('(address,uint256,uint32)', reducedInput);
  if (!decoded) {
    glog.warning('couldnt decode {}', [reducedInput.toHexString()]);
  }

  if (decoded) {
    const t = decoded.toTuple();
    splice.origin_collection = t[0].toAddress();
    splice.origin_token_id = t[1].toBigInt();
  }
  splice.save();
}

export function handleTransfer(event: Transfer): void {
  const splice = Splice.load(event.params.tokenId.toString());
  if (!splice) return;
  splice.owner = event.params.to;
  splice.save();
}

export function handleApproval(event: Approval): void {}

export function handleWithdrawn(event: Withdrawn): void {}

// undhandled:

export function handleApprovalForAll(event: ApprovalForAll): void {}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {}

export function handlePaused(event: Paused): void {}

export function handleSharesChanged(event: SharesChanged): void {}

export function handleUnpaused(event: Unpaused): void {}
