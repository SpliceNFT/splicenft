import { Style, StyleNFTResponse } from '@splicenft/common';
import { useWeb3React } from '@web3-react/core';
import axios from 'axios';
import { providers } from 'ethers';
import React, { useContext, useEffect, useState } from 'react';

interface IStyleContext {
  styles: Style[];
}

const StyleContext = React.createContext<IStyleContext>({ styles: [] });

const useStyles = () => useContext(StyleContext);

const StyleProvider = ({ children }: { children: React.ReactNode }) => {
  const { chainId } = useWeb3React<providers.Web3Provider>();
  const [styles, setStyles] = useState<Style[]>([]);
  useEffect(() => {
    (async () => {
      const url = `${process.env.REACT_APP_VALIDATOR_BASEURL}/styles/${
        chainId || 1
      }`;

      try {
        const styleRes: StyleNFTResponse[] = await (await axios.get(url)).data;
        const _styles = styleRes.map((r) => {
          return new Style(r.style_token_id, url, r.metadata);
        });

        setStyles(_styles);
      } catch (e: any) {
        console.error("couldn't load styles", e.message);
      }
    })();
  }, [chainId]);

  return (
    <StyleContext.Provider value={{ styles }}>{children}</StyleContext.Provider>
  );
};

export { StyleProvider, useStyles };
