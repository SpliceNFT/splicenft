import { useApolloClient } from '@apollo/client';
import { Splice, SpliceNFT, TokenProvenance } from '@splicenft/common';
import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import { ApolloClientType, useSplice } from '../context/SpliceContext';
import { SPLICES_FOR_SEED } from './Queries';

const getProvenancesFromSubgraph = async (
  client: ApolloClientType,
  collection: string,
  tokenId: string
): Promise<TokenProvenance[]> => {
  const splicesForSeed = await client.query({
    query: SPLICES_FOR_SEED,
    variables: {
      collection,
      token_id: tokenId
    }
  });

  if (!splicesForSeed) {
    return [];
  }

  console.debug('getProvenancesFromSubgraph', splicesForSeed);
  if (splicesForSeed.data.seeds.length === 0) return [];

  const promises = splicesForSeed.data.seeds[0].origins[0].origin.splices.map(
    (splice: any): Promise<TokenProvenance> => {
      const { style_token_id, token_id: style_token_token_id } =
        Splice.tokenIdToStyleAndToken(ethers.BigNumber.from(splice.id));

      return (async () => {
        let metadata: SpliceNFT | undefined = undefined;
        try {
          metadata = await Splice.fetchMetadata(splice.metadata_url);
        } catch (e: any) {
          console.warn(e);
        }

        return {
          origins: [
            {
              collection,
              token_id: tokenId
            }
          ],
          owner: splice.owner,
          metadata,
          splice_token_id: splice.id,
          style_token_id,
          style_token_token_id
        };
      })();
    }
  );

  return Promise.all(promises);
};

const getProvenancesFromChain = async (
  splice: Splice,
  collection: string,
  tokenId: string
): Promise<TokenProvenance[]> => {
  console.debug('getProvenancesFromSplice');
  const _prov = await splice.findProvenances(collection, tokenId);

  const promises = _prov.map((p) => {
    return (async () => ({
      ...p,
      owner: await splice.ownerOf(p.splice_token_id),
      metadata: await splice.getMetadata(p)
    }))();
  });
  const __prov = await Promise.all(promises);
  return __prov;
};
const useProvenance = (collection: string, tokenId: string) => {
  const client = useApolloClient() as ApolloClientType;

  const [provenances, setProvenances] = useState<TokenProvenance[]>([]);
  const { splice, deployInfo } = useSplice();

  useEffect(() => {
    (async () => {
      if (deployInfo) {
        const _prov = await getProvenancesFromSubgraph(
          client,
          collection,
          tokenId
        );
        setProvenances(_prov);
      } else if (splice) {
        const _prov = await getProvenancesFromChain(
          splice,
          collection,
          tokenId
        );
        setProvenances(_prov);
      }
    })();
  }, [client, splice, deployInfo]);

  return provenances;
};

export default useProvenance;
