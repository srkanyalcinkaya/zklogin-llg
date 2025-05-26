import { SuiClient } from '@mysten/sui.js/client';

export const suiClient = new SuiClient({
  url: 'https://fullnode.mainnet.sui.io:443', // veya kullanmak istediğiniz ağ
});