import {
  BigInt,
  Bytes,
  ethereum,
  Address,
  log as glog
} from '@graphprotocol/graph-ts';
import { Splice, Style } from '../generated/schema';
import { ERC721 as ERC721Contract } from '../generated/Splice/ERC721';
import {
  Minted,
  Splice as SpliceContract,
  Transfer,
  Withdrawn
} from '../generated/Splice/Splice';

import {
  Minted as StyleMinted,
  Transfer as StyleTransferred,
  SpliceStyleNFT as StyleNFTContract,
  SpliceStyleNFT
} from '../generated/SpliceStyleNFT/SpliceStyleNFT';

export function handleMinted(event: Minted): void {
  const tokenId = event.params.token_id.toString();
  const splice = new Splice(tokenId);

  const spliceContract = SpliceContract.bind(event.address);
  splice.metadata_url = spliceContract.tokenURI(event.params.token_id);

  splice.owner = event.transaction.from;
  splice.origin_hash = event.params.origin_hash;

  //1st 4 byte = method keccak hash fragment
  //3*bytes32 (96 bytes) = values / function args
  const txInput = event.transaction.input.subarray(4, 100);
  const reducedInput = Bytes.fromUint8Array(txInput);
  splice.minting_fee = event.transaction.value;

  glog.debug('tx input: {}', [reducedInput.toHexString()]);

  const decoded = ethereum.decode('(address,uint256,uint32)', reducedInput);
  if (!decoded) {
    glog.warning('couldnt decode {}', [reducedInput.toHexString()]);
  }

  if (decoded) {
    const t = decoded.toTuple();
    const originAddress = t[0].toAddress();
    splice.origin_collection = originAddress;
    splice.origin_token_id = t[1].toBigInt();
    if (originAddress && splice.origin_token_id) {
      const originContract = ERC721Contract.bind(originAddress);
      splice.origin_metadata_url = originContract.tokenURI(
        splice.origin_token_id as BigInt
      );
    }
  }
  const style_id = event.params.style_token_id.toString();
  splice.style = style_id;
  const style = Style.load(style_id);
  if (style) {
    style.minted = style.minted + 1;
    style.save();
  }

  splice.save();
}

export function handleTransfer(event: Transfer): void {
  const splice = Splice.load(event.params.tokenId.toString());
  if (!splice) return;

  const spliceContract = SpliceContract.bind(event.address);
  splice.metadata_url = spliceContract.tokenURI(BigInt.fromString(splice.id));

  splice.owner = event.params.to;
  splice.save();
}

export function handleWithdrawn(event: Withdrawn): void {}

export function handleStyleMinted(event: StyleMinted): void {
  const style_id = event.params.style_token_id.toString();
  let style = Style.load(style_id);
  if (!style) {
    style = new Style(style_id);
  }

  style.cap = event.params.cap.toU32();
  style.minted = 0;
  const styleContract = StyleNFTContract.bind(event.address);
  style.metadata_url = styleContract.tokenURI(event.params.style_token_id);
  //const settings = styleContract.getSettings(event.params.style_token_id);
  style.save();
}

export function handleStyleTransferred(event: StyleTransferred): void {
  const style_id = event.params.tokenId.toString();
  let style = Style.load(style_id);
  if (!style) {
    style = new Style(style_id);
  }

  style.owner = event.params.to;
  style.save();
}
