/*
  Smarty Pay Client Metamask
  @author Evgeny Dolganov <evgenij.dolganov@gmail.com>
*/

import { util } from 'smartypay-client-model';

export function getEthereum() {
  return util.isNode() ? undefined : (window as any).ethereum;
}

export function isEthereumApiFromMetamask() {
  return !!getEthereum()?.isMetaMask;
}

export function isEthereumApiFromTrustWallet() {
  const api = getEthereum();
  return !!api?.isTrustWallet || !!api?.isTrust;
}

export function isMultiEthereumApis() {
  if (util.isNode()) return false;

  const api = getEthereum();
  if (!api) {
    return false;
  }

  // Metamask is main but also has TrustWallet
  if (isEthereumApiFromMetamask() && !!(window as any).trustwallet) {
    return true;
  }

  // ethereum.providers array is a non-standard way to
  // preserve multiple injected providers. Eventually, EIP-5749 will become a living standard
  if (api?.providers?.length > 1) {
    return true;
  }

  // EIP-5749
  const map = (window as any).evmproviders || {};
  return Object.values(map).length > 1;
}
