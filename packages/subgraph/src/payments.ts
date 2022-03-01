import { Bytes, dataSource, log } from '@graphprotocol/graph-ts';
import { Payment, PaymentSplit } from '../generated/schema';
import {
  PayeeReplaced,
  PaymentReceived,
  PaymentReleased
} from '../generated/templates/ReplaceablePaymentSplitter/ReplaceablePaymentSplitter';

export function handlePaymentReceived(event: PaymentReceived): void {
  const context = dataSource.context();
  const address = context.getBytes('address').toHexString();

  const split = PaymentSplit.load(address);
  if (!split) {
    log.warning('splitter {} doesnt exist ?!', [address]);
    return;
  }
  split.balance = split.balance.plus(event.params.amount);
  split.save();

  const payment = new Payment(event.transaction.hash.toHexString());
  payment.splitter = address;
  payment.tx = event.transaction.hash;
  payment.from = event.transaction.from;
  payment.time = event.block.timestamp;
  payment.amount = event.params.amount;

  payment.save();
}

export function handlePaymentReleased(event: PaymentReleased): void {
  const context = dataSource.context();
  const address = context.getBytes('address').toHexString();

  const split = PaymentSplit.load(address);
  if (!split) {
    log.warning('splitter {} doesnt exist ?!', [address]);
    return;
  }
  split.balance = split.balance.minus(event.params.amount);
  split.save();
}

export function handlePayeeReplaced(event: PayeeReplaced): void {
  const context = dataSource.context();
  const address = context.getBytes('address').toHexString();

  const split = PaymentSplit.load(address);
  if (!split) {
    log.warning('splitter {} doesnt exist ?!', [address]);
    return;
  }

  const without: string[] = [];
  for (let i = 0; i < split.payees.length; i++) {
    if (split.payees[i] !== event.params.old.toHexString()) {
      without.push(split.payees[i]);
    }
  }

  log.warning('payee replaced: {} -> {} | {}', [
    event.params.old.toHexString(),
    event.params.new_.toHexString(),
    split.style
  ]);

  without.push(event.params.new_.toHexString());
  split.payees = without;
  split.save();
}
