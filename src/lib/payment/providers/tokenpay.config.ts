export const TOKENPAY_CURRENCIES = [
    // { label: 'USDT (TRC20)', value: 'USDT_TRC20', network: 'TRON' },
    // { label: 'TRX', value: 'TRX', network: 'TRON' },
    { label: 'ETH (Mainnet)', value: 'EVM_ETH_ETH', network: 'ETH' },
    { label: 'USDT (ERC20)', value: 'EVM_ETH_USDT_ERC20', network: 'ETH' },
    { label: 'USDC (ERC20)', value: 'EVM_ETH_USDC_ERC20', network: 'ETH' },
    { label: 'BNB (BSC)', value: 'EVM_BSC_BNB', network: 'BSC' },
    { label: 'USDT (BEP20)', value: 'EVM_BSC_USDT_BEP20', network: 'BSC' },
    { label: 'USDC (BEP20)', value: 'EVM_BSC_USDC_BEP20', network: 'BSC' },
];

export const DEFAULT_TOKENPAY_CURRENCY = 'EVM_BSC_USDT_BEP20';
