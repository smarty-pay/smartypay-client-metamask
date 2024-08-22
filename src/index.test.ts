/*
  SMARTy Pay Client Metamask
  @author Evgeny Dolganov <evgenij.dolganov@gmail.com>
*/

import { getEthereum } from './ethereum-api';

import { SmartyPayMetamaskProvider } from './index';

describe('SmartyPayMetamaskProvider', () => {
  const validAddress = '0x14186C8215985f33845722730c6382443Bf9EC65';
  const invalidAddress = validAddress.toLowerCase();

  beforeEach(() => {
    // stub
    (window as any).ethereum = {
      request: jest.fn(),
      on: jest.fn(),
    };
  });

  describe('Web3Api', () => {
    describe('getAddress', () => {
      test('should convert to case-sensitive address format', async () => {
        const api = SmartyPayMetamaskProvider.makeWeb3Api();
        await api.connect();

        // check with invalid address
        getEthereum().request = () => [invalidAddress];
        expect(await api.getAddress()).toBe(validAddress);

        // check with valid address
        getEthereum().request = () => [validAddress];
        expect(await api.getAddress()).toBe(validAddress);
      });
    });
  });

  describe('hasWallet', () => {
    test('should check window.ethereum', () => {
      expect(SmartyPayMetamaskProvider.hasWallet()).toBe(true);

      (window as any).ethereum = undefined;

      expect(SmartyPayMetamaskProvider.hasWallet()).toBe(false);
    });
  });
});
