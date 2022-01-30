import {
  Address,
  BigInt,
  ByteArray,
  Bytes,
  crypto,
  ethereum,
  log as glog
} from '@graphprotocol/graph-ts';
import { Origin, Splice, Style } from '../generated/schema';
import { ERC721 as ERC721Contract } from '../generated/Splice/ERC721';
import {
  Minted,
  Splice as SpliceContract,
  Transfer
} from '../generated/Splice/Splice';
import {
  Minted as StyleMinted,
  SpliceStyleNFT as StyleNFTContract,
  Transfer as StyleTransferred
} from '../generated/SpliceStyleNFT/SpliceStyleNFT';

export function handleMinted(event: Minted): void {
  const tokenId = event.params.tokenId.toString();
  const splice = new Splice(tokenId);

  const spliceContract = SpliceContract.bind(event.address);
  splice.metadata_url = spliceContract.tokenURI(event.params.tokenId);

  splice.owner = event.transaction.from;
  splice.origin_hash = event.params.origin_hash;
  splice.minting_fee = event.transaction.value;

  //1st 4 byte = method keccak hash fragment
  const functionInput = event.transaction.input.subarray(4);

  //prepend a "tuple" prefix (function params are arrays, not tuples)
  const tuplePrefix = ByteArray.fromHexString(
    '0x0000000000000000000000000000000000000000000000000000000000000020'
  );

  const functionInputAsTuple = new Uint8Array(
    tuplePrefix.length + functionInput.length
  );

  functionInputAsTuple.set(tuplePrefix, 0);
  functionInputAsTuple.set(functionInput, tuplePrefix.length);

  const tupleInputBytes = Bytes.fromUint8Array(functionInputAsTuple);
  //glog.debug('tx input: {}', [tupleInputBytes.toHexString()]);

  const decoded = ethereum.decode(
    '(address[],uint[],uint,bytes32[],bytes)',
    tupleInputBytes
  );

  if (decoded === null) {
    glog.warning('couldnt decode {}', [tupleInputBytes.toHexString()]);
  } else {
    const t = decoded.toTuple();
    const originAddresses = t[0].toAddressArray();
    const originTokenIds = t[1].toBigIntArray();
    const origins: string[] = [];
    for (let i = 0; i < originAddresses.length; i++) {
      const ba = new ByteArray(96);
      ba.set(originAddresses[i], 0);
      ba.set(originTokenIds[i], 32);
      ba.set(event.params.styleTokenId, 64);
      const oHash = crypto.keccak256(ba).toHexString();
      const origin = new Origin(oHash);
      origin.collection = originAddresses[i];
      origin.token_id = originTokenIds[i];
      const originContract = ERC721Contract.bind(originAddresses[i]);
      origin.metadata_url = originContract.tokenURI(originTokenIds[i]);
      origin.save();
      origins.push(oHash);
    }
    splice.origins = origins;
  }

  const style_id = event.params.styleTokenId.toString();
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

//export function handleWithdrawn(event: Withdrawn): void {}

export function handleStyleMinted(event: StyleMinted): void {
  const style_id = event.params.styleTokenId.toString();
  let style = Style.load(style_id);
  if (!style) {
    style = new Style(style_id);
  }

  style.cap = event.params.cap.toU32();
  style.minted = 0;
  const styleContract = StyleNFTContract.bind(event.address);
  style.metadata_url = styleContract.tokenURI(event.params.styleTokenId);
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
