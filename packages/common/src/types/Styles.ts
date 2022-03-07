interface Payment {
  from: string;
  time: string;
  id: string;
}
export interface StyleStatsData {
  style: {
    id: string;
    owner: string;
    priceStrategy: string;
    minted: number;
    cap: number;
    split: {
      payments: Payment[];
    };
  };
}

export interface StyleSettings {
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
}

export type Partnership = {
  collections: string[];
  exclusive: boolean;
  until: Date;
};
