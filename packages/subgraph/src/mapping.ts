import {
  Address,
  BigInt,
  ByteArray,
  Bytes,
  crypto,
  DataSourceContext,
  ethereum,
  log as glog
} from '@graphprotocol/graph-ts';
import {
  Origin,
  PaymentSplit,
  Seed,
  SeedOrigin,
  Splice,
  Style
} from '../generated/schema';
import { ERC721 as ERC721Contract } from '../generated/Splice/ERC721';
import {
  Minted,
  Splice as SpliceContract,
  Transfer
} from '../generated/Splice/Splice';
import { ReplaceablePaymentSplitter as PaymentSplitterContract } from '../generated/SpliceStyleNFT/ReplaceablePaymentSplitter';
import { ReplaceablePaymentSplitter } from '../generated/templates';

import {
  PermanentURI,
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

    const originHashBytes = new ByteArray(64 * originAddresses.length);
    for (let i = 0; i < originAddresses.length; i++) {
      originHashBytes.set(originAddresses[i], i * 64);
      originHashBytes.set(originTokenIds[i], i * 64 + 32);
    }
    const originId = crypto.keccak256(originHashBytes).toHexString();

    let origin = Origin.load(originId);
    if (!origin) {
      origin = new Origin(originId);
    }
    splice.origin = originId;

    for (let i = 0; i < originAddresses.length; i++) {
      const seedBytes = new ByteArray(64);
      seedBytes.set(originAddresses[i], 0);
      seedBytes.set(originTokenIds[i], 32);
      const seedId = crypto.keccak256(seedBytes).toHexString();
      let seed = Seed.load(seedId);
      if (!seed) {
        seed = new Seed(seedId);
        seed.collection = originAddresses[i];
        seed.token_id = originTokenIds[i];
        const seedContract = ERC721Contract.bind(originAddresses[i]);
        seed.metadata_url = seedContract.tokenURI(originTokenIds[i]);
      }
      seed.save();
      const so = new SeedOrigin(`${seed.id}-${origin.id}`);
      so.origin = origin.id;
      so.seed = seed.id;
      so.save();
    }

    origin.save();
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

  const settings = styleContract.getSettings(event.params.styleTokenId);
  style.priceStrategy = settings.priceStrategy;

  const splitContract = PaymentSplitterContract.bind(settings.paymentSplitter);

  const payees: string[] = [
    splitContract.payee(BigInt.fromU32(0)).toHexString(),
    splitContract.payee(BigInt.fromU32(1)).toHexString()
  ];
  const p3 = splitContract.try_payee(BigInt.fromU32(2));
  if (!p3.reverted && p3.value != Address.zero()) {
    payees.push(p3.value.toHexString());
  }

  const split = new PaymentSplit(settings.paymentSplitter.toHexString());
  split.payees = payees;
  split.balance = BigInt.zero();
  split.style = style.id;
  split.save();

  style.split = split.id;
  style.save();

  const context = new DataSourceContext();
  context.setBytes('address', settings.paymentSplitter);
  ReplaceablePaymentSplitter.createWithContext(
    settings.paymentSplitter,
    context
  );
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

export function handleStyleFrozen(event: PermanentURI): void {
  const style_id = event.params._id.toString();

  const style = Style.load(style_id);
  if (!style) {
    glog.warning('style not found: {}', [style_id]);
    return;
  }

  style.frozen = true;
  style.save();
}
