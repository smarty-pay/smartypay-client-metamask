/*
  SMARTy Pay Client Metamask
  @author Evgeny Dolganov <evgenij.dolganov@gmail.com>
*/

import {Web3Api, Web3ApiEvent, RawProvider} from 'smartypay-client-web3-common';
import {util} from 'smartypay-client-model';

const Name = 'SmartyPayMetamask';

export class SmartyPayMetamask implements Web3Api {

  private _connected = false;
  private listeners = new util.ListenersMap<Web3ApiEvent>();

  addListener(event: Web3ApiEvent, listener:(...args: any[]) => void) {
    this.listeners.addListener(event, listener);
  }

  removeListener(listener:(...args: any[]) => void) {
    this.listeners.removeListener(listener);
  }

  name(): string {
    return Name;
  }

  static apiName = Name;

  hasWallet(): boolean {
    // @ts-ignore
    return !! window.ethereum;
  }

  async connect() {
    if( this.isConnected()){
      return;
    }

    if( ! this.hasWallet()){
      throw new Error('no metamask');
    }

    // show Metamask Connect Screen
    // @ts-ignore
    await window.ethereum.request({ method: "eth_requestAccounts"});
    this._connected = true;

    this.listeners.getListeners('connected').forEach(l => l());

    // Listen Metamask events
    // @ts-ignore
    window.ethereum.on('accountsChanged', (accounts)=>{
      const newAddress = accounts && accounts.length>0? accounts[0] : undefined;
      if( ! newAddress){
        this.resetState();
        this.listeners.getListeners('disconnected').forEach(l => l());
      } else {
        this.listeners.getListeners('accountsChanged').forEach(l => l(newAddress));
      }
    });
  }

  async getAddress() {
    this.checkConnection();
    // @ts-ignore
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    return accounts[0];
  }

  async getChainId(){
    this.checkConnection();
    // @ts-ignore
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
    // @ts-ignore
    return window.ethereum as RawProvider;
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
