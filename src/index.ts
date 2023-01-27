/*
  SMARTy Pay Client Metamask
  @author Evgeny Dolganov <evgenij.dolganov@gmail.com>
*/

import {Web3Api, Web3ApiListener} from 'smartypay-client-web3-common';
import {RawProvider} from 'smartypay-client-web3-common/dist/tsc/types';


// @ts-ignore
const rawProvider: any = window.ethereum;
const Name = 'SmartyPayMetamask';

export class SmartyPayMetamask implements Web3Api {

  private _listeners: Web3ApiListener[] = [];
  private _connected = false;

  addListener(listener: Web3ApiListener) {
    this._listeners.push(listener);
  }

  removeListener(listener: Web3ApiListener) {
    this._listeners = this._listeners.filter(l => l !== listener);
  }

  name(): string {
    return Name;
  }

  static apiName = Name;

  hasWallet(): boolean {
    return !! rawProvider;
  }

  async connect() {
    if( this.isConnected()){
      return;
    }

    if( ! this.hasWallet()){
      throw new Error('no metamask');
    }

    // show Metamask Connect Screen
    await rawProvider.request({ method: "eth_requestAccounts"});
    this._connected = true;

    this._listeners.forEach(l => l.onConnected?.());

    // Listen Metamask events
    rawProvider.on('accountsChanged', (accounts)=>{
      const newAddress = accounts && accounts.length>0? accounts[0] : undefined;
      if( ! newAddress){
        this.resetState();
        this._listeners.forEach(l => l.onDisconnectedByRemote?.());
      } else {
        this._listeners.forEach(l => l.onAccountsChanged?.(newAddress));
      }
    });
  }

  async getAddress() {
    this.checkConnection();
    const accounts = await rawProvider.request({ method: 'eth_requestAccounts' });
    return accounts[0];
  }

  async getChainId(){
    this.checkConnection();
    const chainId:string = await rawProvider.request({ method: 'eth_chainId' });
    return Number(chainId);
  }

  async disconnect() {
    this.resetState();
  }


  isConnected(): boolean {
    return this._connected;
  }

  getRawProvider(): RawProvider {
    this.checkConnection();
    return rawProvider as RawProvider;
  }

  checkConnection(){
    if( ! this._connected){
      throw new Error('Metamask not connected')
    }
  }

  resetState(){
    this._connected = false;
  }

}
