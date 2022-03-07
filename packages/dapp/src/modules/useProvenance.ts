import { useApolloClient } from '@apollo/client';
import { Splice, TokenProvenance } from '@splicenft/common';
import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import { ApolloClientType, useSplice } from '../context/SpliceContext';
import { ORIGIN_IDS, SPLICES_FOR_ORIGINS } from './Queries';

const getProvenancesFromSubgraph = async (
  client: ApolloClientType,
  collection: string,
  tokenId: string
): Promise<TokenProvenance[]> => {
  const originRes = await client.query({
    query: ORIGIN_IDS,
    variables: {
      collection,
      token_id: tokenId
    }
  });

  if (!originRes) {
    return [];
  }

  console.log('getProvenancesFromSubgraph');
  const originIds = originRes.data.origins.map((o: any) => o.id);
  if (originIds.length == 0) {
    return [];
  }

  const spliceForOriginRes = await client.query({
    query: SPLICES_FOR_ORIGINS,
    variables: {
      origin_ids: originIds
    }
  });

  const promises = spliceForOriginRes.data.spliceice.map(
    (spliceice: any): Promise<TokenProvenance> => {
      const { style_token_id, token_id: style_token_token_id } =
        Splice.tokenIdToStyleAndToken(ethers.BigNumber.from(spliceice.id));

      return (async () => ({
        origins: [
          {
            collection,
            token_id: tokenId
          }
        ],
        owner: spliceice.owner,
        metadata: await Splice.fetchMetadata(spliceice.metadata_url),
        splice_token_id: spliceice.id,
        style_token_id,
        style_token_token_id
      }))();
    }
  );

  return Promise.all(promises);
};

const getProvenancesFromChain = async (
  splice: Splice,
  collection: string,
  tokenId: string
): Promise<TokenProvenance[]> => {
  console.log('getProvenancesFromSplice');
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
  const { splice } = useSplice();

  useEffect(() => {
    (async () => {
      if (client) {
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
  }, [client, splice]);

  return provenances;
};

export default useProvenance;
