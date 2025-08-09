export class WalletService {
  constructor() {
  }

  helloWorld() {
    console.log('hello world');
  }

  eth_requestAccounts() {
    console.log('eth_requestAccounts called');
    return new Promise((resolve) => {
      // 模拟异步操作
      setTimeout(() => {
        resolve(['0x1234567890abcdef1234567890abcdef12345678']);
      }, 1000);
    });
  }
}

export default new WalletService()
