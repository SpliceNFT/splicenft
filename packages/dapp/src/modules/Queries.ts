import { gql } from '@apollo/client';
import { Transfer } from '@splicenft/common';
export const ALL_SPLICES = gql`
  query GetAllSplices {
    #where: {origin_collection: "0xd56c266c640f406db3b02c7054d2848252bee664"}
    spliceice {
      id
      owner
      origins {
        collection
        token_id
      }
      style_token_id
      input_params
    }
  }
`;

export interface UserSplicesVars {
  owner: string;
}

export interface UserSplicesData {
  spliceice: Transfer.UserSplice[];
}

export const USER_SPLICES = gql`
  query SplicesOfOwner($owner: String) {
    spliceice(where: { owner: $owner }) {
      id
      metadata_url
      style {
        id
        metadata_url
      }
      origins {
        collection
        token_id
        metadata_url
      }
    }
  }
`;

export const SPLICES_OF_ORIGIN = gql`
  query SplicesOfOrigin($origin_hash: String) {
    spliceice(where: { origin_hash: $origin_hash }) {
      metadata_url
      style {
        id
        metadata_url
      }
      origins {
        collection
        token_id
        metadata_url
      }
    }
  }
`;

export const PAYMENT_MEMBER = gql`
  query PaymentMemberOf($address: [String]) {
    paymentSplits(where: { payees_contains: $address }) {
      payees
      style {
        id
      }
    }
  }
`;

export interface StyleStatsData {
  id: string;
  owner: string;
  priceStrategy: string;
  minted: number;
  cap: number;
  split: {
    payments: [{ from: string; time: string; id: string }];
  };
}

export const ALL_STYLE_STATS = gql`
  query StyleStats {
    styles {
      id
      owner
      priceStrategy
      minted
      cap
      split {
        payments(first: 3) {
          id
          from
          time
        }
      }
    }
  }
`;

export const STYLE_STATS = gql`
  query StyleStats($style_id: String) {
    style(id: $style_id) {
      id
      owner
      priceStrategy
      minted
      cap
      split {
        payments(first: 3) {
          id
          from
          time
        }
      }
    }
  }
`;

// export const SPLICES_OF_COLLECTIONS = gql`
//   query SplicesOfCollections($collections: String[]) {
//     spliceice(where: {origin_collection_in: $collections }) {
//       id
//       metadata_url
//       owner
//       origin_metadata_url
//       input_params
//       style {
//         id
//       }
//     }
//   }
// `;
