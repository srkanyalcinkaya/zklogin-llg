import { SuiClient } from '@mysten/sui.js/client';

export const suiClient = new SuiClient({
  url: 'https://fullnode.devnet.sui.io', // veya kullanmak istediğiniz ağ
});