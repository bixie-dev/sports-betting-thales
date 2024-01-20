import { DEFAULT_NETWORK, SUPPORTED_NETWORKS, SUPPORTED_NETWORKS_PARAMS } from 'constants/network';
import { BigNumber } from 'ethers';
import { Network } from 'enums/network';
import { getNavItemFromRoute } from './ui';
import { LOCAL_STORAGE_KEYS } from 'constants/storage';
import { localStore } from 'thales-utils';
import { SupportedNetwork } from '../types/network';
import { getCollaterals } from './collaterals';

export const isNetworkSupported = (networkId: SupportedNetwork): boolean => {
    return !!SUPPORTED_NETWORKS[networkId];
};

export const checkAllowance = async (amount: BigNumber, token: any, walletAddress: string, spender: string) => {
    try {
        const approved = await token.allowance(walletAddress, spender);
        return approved.gte(amount);
    } catch (err: any) {
        console.log(err);
        return false;
    }
};

export const getNetworkIconClassNameByNetworkId = (networkId: Network): string => {
    const network = SUPPORTED_NETWORKS_PARAMS[networkId];
    if (network) return network.iconClassName;
    return 'Unknown';
};

export const getNetworkNameByNetworkId = (networkId: Network, shortName = false): string | undefined => {
    const network = SUPPORTED_NETWORKS_PARAMS[networkId];
    return shortName ? network?.shortChainName : network?.chainName;
};

export const getDefaultNetworkName = (shortName = false): string => {
    // find should always return Object for default network ID
    const network = SUPPORTED_NETWORKS_PARAMS[DEFAULT_NETWORK.networkId];
    return shortName ? network?.shortChainName : network?.chainName;
};

export const getNetworkKeyByNetworkId = (networkId: Network): string => {
    const network = SUPPORTED_NETWORKS_PARAMS[networkId];
    return network?.chainKey || 'optimism_mainnet';
};

export const isRouteAvailableForNetwork = (route: string, networkId: Network): boolean => {
    const navItem = getNavItemFromRoute(route);
    if (navItem && navItem?.supportedNetworks?.includes(networkId)) return true;
    return false;
};

export const getDefaultCollateralIndexForNetworkId = (networkId: SupportedNetwork): number => {
    const lsSelectedCollateralIndex = localStore.get(`${LOCAL_STORAGE_KEYS.COLLATERAL_INDEX}${networkId}`);
    return lsSelectedCollateralIndex && getCollaterals(networkId).length > Number(lsSelectedCollateralIndex)
        ? Number(lsSelectedCollateralIndex)
        : 0;
};

export const getIsMultiCollateralSupported = (networkId: SupportedNetwork): boolean =>
    getCollaterals(networkId).length > 1;
