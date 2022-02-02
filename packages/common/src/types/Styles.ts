export type StyleStats = {
  settings: {
    mintedOfStyle: number;
    cap: number;
    priceStrategy: string;
    salesIsActive: boolean;
    isFrozen: boolean;
    styleCID: string;
    maxInputs: number;
    paymentSplitter: string;
  };
  owner: string;
  active: boolean;
  reserved: number;
};

export type Partnership = {
  collections: string[];
  exclusive: boolean;
  until: Date;
};
