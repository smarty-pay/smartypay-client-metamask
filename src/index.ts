/*
  Smarty Pay Client Metamask
  @author Evgeny Dolganov <evgenij.dolganov@gmail.com>
*/

import { util } from 'smartypay-client-model';
import { Web3Common } from 'smartypay-client-web3-common';

import {
  getEthereum,
  isEthereumApiFromMetamask,
  isEthereumApiFromTrustWallet,
  isMultiEthereumApis,
} from './ethereum-api';

import type { RawProvider, Web3Api, Web3ApiEvent, Web3ApiProvider } from 'smartypay-client-web3-common';

const ApiMetamask = 'Metamask';
const ApiTrustWallet = 'Trust Wallet';

function getApiName() {
  if (isEthereumApiFromMetamask()) {
    return ApiMetamask;
  }
  if (isEthereumApiFromTrustWallet()) {
    return ApiTrustWallet;
  }
  // default
  return ApiMetamask;
}

interface ProviderExt {
  isNoMetamaskError(error: any): boolean;

  isApiFromMetamask(): boolean;

  isApiFromTrustWallet(): boolean;

  isMultiApiState(): boolean;
}

export const SmartyPayMetamaskProvider: Web3ApiProvider & ProviderExt = {
  name(): string {
    return getApiName();
  },
  makeWeb3Api(): Web3Api {
    return new SmartyPayMetamask();
  },
  hasWallet(): boolean {
    return !!getEthereum();
  },
  isNoMetamaskError(error: any) {
    const msg = error?.toString() || '';
    return msg.includes('no Metamask');
  },
  isApiFromMetamask(): boolean {
    return isEthereumApiFromMetamask();
  },
  isApiFromTrustWallet(): boolean {
    return isEthereumApiFromTrustWallet();
  },
  isMultiApiState(): boolean {
    return isMultiEthereumApis();
  },
};

class SmartyPayMetamask implements Web3Api {
  private connectedFlag = false;
  private useWalletEvents = false;
  private listeners = new util.ListenersMap<Web3ApiEvent>();
  private curAddress: string | undefined;
  private curNetwork: number | undefined;

  addListener(event: Web3ApiEvent, listener: (...args: any[]) => void) {
    this.listeners.addListener(event, listener);
  }

  removeListener(listener: (...args: any[]) => void) {
    this.listeners.removeListener(listener);
  }

  name(): string {
    return getApiName();
  }

  hasWallet(): boolean {
    return SmartyPayMetamaskProvider.hasWallet();
  }

  async connect() {
    if (this.isConnected()) {
      return;
    }

    if (!this.hasWallet()) {
      throw util.makeError(this.name(), 'no Metamask');
    }

    // show Metamask Connect Screen
    const accounts: string[] | undefined = await getEthereum().request({ method: 'eth_requestAccounts' });

    this.curAddress = accounts && accounts.length > 0 ? Web3Common.getNormalAddress(accounts[0]) : undefined;

    this.connectedFlag = true;
    this.listeners.fireEvent('wallet-connected');

    // add listeners only once
    if (this.useWalletEvents) {
      return;
    }
    this.useWalletEvents = true;

    getEthereum().on('accountsChanged', (newAccounts: any) => {
      // skip events on disconnected state
      if (!this.connectedFlag) {
        return;
      }

      const newAddress =
        newAccounts && newAccounts.length > 0 ? Web3Common.getNormalAddress(newAccounts[0]) : undefined;

      if (this.curAddress === newAddress) return;

      this.curAddress = newAddress;

      if (!newAddress) {
        this.disconnect().catch(console.error);
      } else {
        this.listeners.fireEvent('wallet-account-changed', newAddress);
      }
    });

    getEthereum().on('chainChanged', (chainIdHex: string) => {
      // skip events on disconnected state
      if (!this.connectedFlag) {
        return;
      }

      this.curNetwork = Number(chainIdHex);
      this.listeners.fireEvent('wallet-network-changed', this.curNetwork);
    });
  }

  async getAddress() {
    this.checkConnection();

    if (!this.curAddress) {
      const accounts = await getEthereum().request({ method: 'eth_requestAccounts' });
      this.curAddress = Web3Common.getNormalAddress(accounts[0]);
    }

    return this.curAddress;
  }

  async getChainId() {
    this.checkConnection();

    if (!this.curNetwork) {
      const chainIdHex: string = await getEthereum().request({ method: 'eth_chainId' });
      this.curNetwork = Number(chainIdHex);
    }

    return this.curNetwork;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async disconnect() {
    this.connectedFlag = false;
    this.listeners.fireEvent('wallet-disconnected');
  }

  isConnected(): boolean {
    return this.connectedFlag;
  }

  getRawProvider(): RawProvider {
    this.checkConnection();
    return getEthereum() as RawProvider;
  }

  checkConnection() {
    if (!this.connectedFlag) {
      throw util.makeError(this.name(), 'Wallet not connected');
    }
  }
}
