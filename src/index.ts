/*
  SMARTy Pay Client Metamask
  @author Evgeny Dolganov <evgenij.dolganov@gmail.com>
*/

import {Web3Api, Web3ApiEvent, RawProvider, Web3ApiProvider} from 'smartypay-client-web3-common';
import {util} from 'smartypay-client-model';

const Name = 'SmartyPayMetamask';


export const SmartyPayMetamaskProvider: Web3ApiProvider = {
  name(): string {
    return Name;
  },
  makeWeb3Api(): Web3Api {
    return new SmartyPayMetamask();
  }
}

class SmartyPayMetamask implements Web3Api {

  private connectedFlag = false;
  private useWalletEvents = false;
  private listeners = new util.ListenersMap<Web3ApiEvent>();

  addListener(event: Web3ApiEvent, listener: (...args: any[]) => void) {
    this.listeners.addListener(event, listener);
  }

  removeListener(listener: (...args: any[]) => void) {
    this.listeners.removeListener(listener);
  }

  name(): string {
    return Name;
  }

  static apiName = Name;

  hasWallet(): boolean {
    // @ts-ignore
    return !!window.ethereum;
  }

  async connect() {
    if (this.isConnected()) {
      return;
    }

    if (!this.hasWallet()) {
      throw util.makeError(Name, 'no Metamask');
    }

    // show Metamask Connect Screen
    // @ts-ignore
    await window.ethereum.request({method: "eth_requestAccounts"});

    this.connectedFlag = true;
    this.listeners.fireEvent('wallet-connected');

    // add listeners only once
    if(this.useWalletEvents){
      return;
    }
    this.useWalletEvents = true;

    // @ts-ignore
    window.ethereum.on('accountsChanged', (accounts) => {

      // skip events on disconnected state
      if( ! this.connectedFlag){
        return;
      }

      const newAddress = accounts && accounts.length > 0 ? accounts[0] : undefined;
      if (!newAddress) {
        this.disconnect();
      } else {
        this.listeners.fireEvent('wallet-account-changed', newAddress);
      }
    });

    // @ts-ignore
    window.ethereum.on('chainChanged', (chainIdHex: string) => {

      // skip events on disconnected state
      if( ! this.connectedFlag){
        return;
      }

      const chainId = Number(chainIdHex);
      this.listeners.fireEvent('wallet-network-changed', chainId);
    });
  }

  async getAddress() {
    this.checkConnection();
    // @ts-ignore
    const accounts = await window.ethereum.request({method: 'eth_requestAccounts'});
    return accounts[0];
  }

  async getChainId() {
    this.checkConnection();
    // @ts-ignore
    const chainId: string = await rawProvider.request({method: 'eth_chainId'});
    return Number(chainId);
  }

  async disconnect() {
    this.connectedFlag = false;
    this.listeners.fireEvent('wallet-disconnected');
  }


  isConnected(): boolean {
    return this.connectedFlag;
  }

  getRawProvider(): RawProvider {
    this.checkConnection();
    // @ts-ignore
    return window.ethereum as RawProvider;
  }

  checkConnection() {
    if (!this.connectedFlag) {
      throw util.makeError(Name,'Metamask not connected');
    }
  }
}