import { verifyAllowlistEntry } from '@splicenft/common';
import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import { AllowlistEntry } from '../entity/AllowlistEntry';

interface AllowlistRequest extends Request {
  body: {
    address: string;
    style_token_id: string;
    signature: string;
    chainId: number;
  };
}

export function allowlist() {
  return async (req: AllowlistRequest, res: Response) => {
    const allowListRepo = getRepository(AllowlistEntry);
    const entry = allowListRepo.create(req.body);
    try {
      const verifiedAddress = verifyAllowlistEntry(
        entry.chain_id,
        entry.style_token_id,
        entry.address,
        entry.signature
      );
      if (!verifiedAddress) {
        throw new Error("signature couldn't be verified");
      }
      await allowListRepo.save(entry);
      res.status(201).json({
        result: 'ok'
      });
    } catch (e: any) {
      res.status(500).send({
        error: e.message
      });
    }
  };
}
