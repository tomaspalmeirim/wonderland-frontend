import React, { useState, ReactElement, useContext, useEffect, useMemo, useCallback } from "react";
import Web3Modal from "web3modal";
import { StaticJsonRpcProvider, JsonRpcProvider, Web3Provider } from "@ethersproject/providers";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { getTestnetURI, getMainnetURI } from "./helpers";
import { DEFAULD_NETWORK } from "../../constants";
import { Networks } from "../../constants";

type onChainProvider = {
  connect: () => void;
  disconnect: () => void;
  provider: JsonRpcProvider;
  address: string;
  connected: Boolean;
  web3Modal: Web3Modal;
  chainID: number;
  web3?: any;
};

export type Web3ContextData = {
  onChainProvider: onChainProvider;
} | null;

const Web3Context = React.createContext<Web3ContextData>(null);

export const useWeb3Context = () => {
  const web3Context = useContext(Web3Context);
  if (!web3Context) {
    throw new Error(
      "useWeb3Context() can only be used inside of <Web3ContextProvider />, " + "please declare it at a higher level.",
    );
  }
  const { onChainProvider } = web3Context;
  return useMemo(() => {
    return { ...onChainProvider };
  }, [web3Context]);
};

export const useAddress = () => {
  const { address } = useWeb3Context();
  return address;
};

export const Web3ContextProvider: React.FC<{ children: ReactElement }> = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [chainID, setChainID] = useState(DEFAULD_NETWORK);
  const [address, setAddress] = useState("");

  const [uri, setUri] = useState(chainID === Networks.AWAX ? getMainnetURI() : getTestnetURI());
  const [provider, setProvider] = useState<JsonRpcProvider>(new StaticJsonRpcProvider(uri));

  const [web3Modal] = useState<Web3Modal>(
    new Web3Modal({
      cacheProvider: true,
      providerOptions: {
        walletconnect: {
          package: WalletConnectProvider,
          options: {
            rpc: {
              [Networks.AWAX]: getMainnetURI(),
              [Networks.RINKEBY]: getTestnetURI(),
            },
          },
        },
      },
    }),
  );

  const _hasCachedProvider = (): Boolean => {
    if (!web3Modal) return false;
    if (!web3Modal.cachedProvider) return false;
    return true;
  };

  const _initListeners = useCallback(() => {
    if (!provider || provider instanceof Web3Provider !== true) return;
    provider.on("accountsChanged", () => {
      if (_hasCachedProvider()) return;
      setTimeout(() => window.location.reload(), 1);
    });

    provider.on("chainChanged", (chain: number) => {
      if (_hasCachedProvider()) return;
      _checkNetwork(chain);
      setTimeout(() => window.location.reload(), 1);
    });

    provider.on("network", (_newNetwork, oldNetwork) => {
      if (!oldNetwork) return;
      window.location.reload();
    });
  }, [provider]);

  const _checkNetwork = (otherChainID: number): Boolean => {
    if (chainID !== otherChainID) {
      console.warn("You are switching networks: ", otherChainID);
      if (otherChainID === Networks.AWAX || otherChainID === Networks.RINKEBY) {
        setChainID(otherChainID);
        otherChainID === Networks.AWAX ? setUri(getMainnetURI()) : setUri(getTestnetURI());
        return true;
      }
      return false;
    }
    return true;
  };

  const connect = useCallback(async () => {
    const rawProvider = await web3Modal.connect();
    const connectedProvider = new Web3Provider(rawProvider, "any");

    const chainId = await connectedProvider.getNetwork().then(network => network.chainId);
    const connectedAddress = await connectedProvider.getSigner().getAddress();

    const validNetwork = _checkNetwork(chainId);
    if (!validNetwork) {
      console.error("Wrong network, please switch to mainnet");
      return;
    }
    setAddress(connectedAddress);
    setProvider(connectedProvider);

    setConnected(true);

    return connectedProvider;
  }, [provider, web3Modal, connected]);

  const disconnect = useCallback(async () => {
    console.log("disconnecting");
    web3Modal.clearCachedProvider();
    setConnected(false);

    setTimeout(() => {
      window.location.reload();
    }, 1);
  }, [provider, web3Modal, connected]);

  const onChainProvider = useMemo(
    () => ({ connect, disconnect, provider, connected, address, chainID, web3Modal }),
    [connect, disconnect, provider, connected, address, chainID, web3Modal],
  );

  useEffect(() => {
    if (_hasCachedProvider()) {
      connect();
    }
  }, []);

  useEffect(() => {
    _initListeners();
  }, [connected]);

  return <Web3Context.Provider value={{ onChainProvider }}>{children}</Web3Context.Provider>;
};
