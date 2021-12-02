import { gql } from '@apollo/client';
import { Transfer } from '@splicenft/common';
export const ALL_SPLICES = gql`
  query GetAllSplices {
    #where: {origin_collection: "0xd56c266c640f406db3b02c7054d2848252bee664"}
    spliceice {
      id
      owner
      origin_collection
      origin_token_id
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
      origin_collection
      origin_token_id
      origin_metadata_url
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
      origin_collection
      origin_token_id
      origin_metadata_url
    }
  }
`;