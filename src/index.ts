/*
  SMARTy Pay Client Metamask
  @author Evgeny Dolganov <evgenij.dolganov@gmail.com>
*/

import {Web3Api, Web3ApiListener} from 'smartypay-client-web3-common';
import Web3 from 'web3';


const Name = 'SmartyPayMetamask';

export class SmartyPayMetamask implements Web3Api {

  private _listeners: Web3ApiListener[] = [];
  private _web3: Web3|undefined;

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
    await window.ethereum.request({ method: "eth_requestAccounts" });

    // @ts-ignore
    this._web3 = new Web3(window.ethereum);

    this._listeners.forEach(l => l.onConnected?.());

    // Listen Metamask events
    // @ts-ignore
    window.ethereum.on('accountsChanged', (accounts)=>{
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
    const accounts = await this._web3!.eth.getAccounts();
    return accounts[0];
  }

  async disconnect() {
    this.resetState();
  }


  isConnected(): boolean {
    return !! this._web3;
  }

  web3(): Web3 {
    this.checkConnection();
    return this._web3!;
  }

  checkConnection(){
    if( ! this._web3){
      throw new Error('Metamask not connected')
    }
  }

  resetState(){
    this._web3 = undefined;
  }

}
