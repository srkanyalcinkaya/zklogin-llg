import { SuiClient } from "@mysten/sui/client";

// lib/suiClient.ts
export const suiClient = new SuiClient({ url: 'https://fullnode.mainnet.sui.io:443' });

