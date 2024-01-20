export type Coins = 'sUSD' | 'DAI' | 'USDCe' | 'USDC' | 'USDT' | 'OP' | 'WETH' | 'ETH' | 'ARB';

export type Token = {
    address: string;
    decimals: number;
    symbol: string;
    name: string;
    chainId: number;
    logoURI: string;
};

export type OvertimeVoucher = {
    address: string;
    id: number;
    remainingAmount: number;
    image: string;
};

export type OvertimeVouchers = OvertimeVoucher[];
