'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { fromB64, MIST_PER_SUI } from "@mysten/sui.js/utils";
import {
  genAddressSeed,
  generateNonce,
  generateRandomness,
  getZkLoginSignature,
} from "@mysten/zklogin";
import { jwtDecode } from 'jwt-decode';
import { suiClient } from '@/lib/sui';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { useSuiClientQuery } from "@mysten/dapp-kit";
import { SerializedSignature } from '@mysten/sui.js/cryptography';
import { KEY_PAIR_SESSION_STORAGE_KEY } from '@/constant';
import { useRouter } from 'next/navigation';
interface AuthContextType {
  isAuthenticated: boolean;
  userAddress: string | null;
  login: (provider: 'google' | 'facebook' | 'twitch') => Promise<void>;
  logout: () => void;
  maxEpoch: number | null;
  nonce: string | null;
  jwt: string | null;
  salt: string | null;
  getZkProof: () => Promise<any>;
  sendTransaction: (recipientAddress: string, amount: number) => Promise<any>;
  addressBalance: any;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userAddress, setUserAddress] = useState<string>("");
  const [ephemeralKeyPair, setEphemeralKeyPair] = useState<Ed25519Keypair>();
  const [maxEpoch, setMaxEpoch] = useState<number | null>(null);
  const [nonce, setNonce] = useState<string | null>(null);
  const [jwt, setJwt] = useState<string | null>(null);
  const [salt, setSalt] = useState<string | null>(null);
  const [randomness, setRandomness] = useState<string | null>(null);
  const router = useRouter();

  const { data: addressBalance } = useSuiClientQuery(
    "getBalance",
    {
      owner: userAddress,
    },
    {
      enabled: Boolean(userAddress),
      refetchInterval: 1500,
    }
  );
  const fetchZkProof = async (requestData: any) => {
    const response = await fetch('/api/zkp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch ZKP');
    }

    return await response.json();
  };

  useEffect(() => {
    const privateKey = window.sessionStorage.getItem(
      KEY_PAIR_SESSION_STORAGE_KEY
    );
    
    if (privateKey) {
      try {
        const ephemeralKeyPair = Ed25519Keypair.fromSecretKey(
          fromB64(privateKey)
        );
        console.log('Loaded KeyPair:', ephemeralKeyPair);
        setEphemeralKeyPair(ephemeralKeyPair);
      } catch (error) {
        console.error('Error loading keypair:', error);
        window.sessionStorage.removeItem(KEY_PAIR_SESSION_STORAGE_KEY);
      }
    }
  }, []);

  const login = async (provider: 'google' | 'facebook' | 'twitch') => {
    try {
      const ephemeralKeyPair = Ed25519Keypair.generate();
      const exportedKey = ephemeralKeyPair.export();
      window.sessionStorage.setItem(
        KEY_PAIR_SESSION_STORAGE_KEY,
        exportedKey.privateKey
      );
      setEphemeralKeyPair(ephemeralKeyPair);

      const { epoch } = await suiClient.getLatestSuiSystemState();
      const epochNumber = Number(epoch);
      const newRandomness = generateRandomness();
      const newNonce = generateNonce(ephemeralKeyPair.getPublicKey(), epochNumber, newRandomness);

      setMaxEpoch(epochNumber);
      setRandomness(newRandomness);
      setNonce(newNonce);

      const redirectUrl = `${window.location.origin}/auth/callback`;
      let authUrl = '';

      switch (provider) {
        case 'google':
          authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}&response_type=id_token&redirect_uri=${redirectUrl}&scope=openid&nonce=${newNonce}`;
          break;
      }
      window.sessionStorage.setItem('zklogin-prelogin', JSON.stringify({
        ephemeralKeyPair: ephemeralKeyPair,
        maxEpoch: epochNumber,
        randomness: newRandomness,
        nonce: newNonce
      }));

      window.location.href = authUrl;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const handleJwt = async (token: string) => {
    try {
      const preloginData = sessionStorage.getItem('zklogin-prelogin');
      const { maxEpoch, randomness, nonce, ephemeralKeyPair } = preloginData
        ? JSON.parse(preloginData)
        : { maxEpoch: null, randomness: null, nonce: null, ephemeralKeyPair: null };

      const decoded = jwtDecode(token);
      
      // Kullanıcı için önceden kaydedilmiş salt'ı kontrol et
      let userSalt = sessionStorage.getItem(`user-salt-${decoded.sub}`);
      if (!userSalt) {
        // Eğer salt yoksa yeni bir tane oluştur ve kaydet
        userSalt = generateRandomness();
        sessionStorage.setItem(`user-salt-${decoded.sub}`, userSalt);
      }

      const { jwtToAddress } = await import('@mysten/sui/zklogin');
      const address = jwtToAddress(token, userSalt);

      setJwt(token);
      setSalt(userSalt);
      setUserAddress(address);
      setIsAuthenticated(true);
      setMaxEpoch(maxEpoch);
      setRandomness(randomness);
      setNonce(nonce);

      const privateKey = window.sessionStorage.getItem(KEY_PAIR_SESSION_STORAGE_KEY);
      if (privateKey) {
        const keyPair = Ed25519Keypair.fromSecretKey(fromB64(privateKey));
        setEphemeralKeyPair(keyPair);
      }

      sessionStorage.setItem('zklogin-session', JSON.stringify({
        maxEpoch,
        nonce,
        jwt: token,
        salt: userSalt,
        userAddress: address,
        randomness,
      }));

      sessionStorage.removeItem('zklogin-prelogin');
    } catch (error) {
      console.error('JWT handling error:', error);
      throw error;
    }
  };
  const logout = () => {
    setIsAuthenticated(false);
    setUserAddress("");
    setMaxEpoch(null);
    setNonce(null);
    setJwt(null);
    setSalt(null);
    setRandomness(null);
    sessionStorage.removeItem("zklogin-session")
    sessionStorage.removeItem("demo_ephemeral_key_pair")
    router.push('/')
  };

  const getZkProof = async () => {
    if (!jwt || !ephemeralKeyPair || !maxEpoch || !randomness || !salt) {
      throw new Error('Missing required authentication data');
    }

    const { getExtendedEphemeralPublicKey } = await import('@mysten/sui/zklogin');
    const extendedEphemeralPublicKey = getExtendedEphemeralPublicKey(
      ephemeralKeyPair.getPublicKey() as any
    );

    const zkpRequest = {
      jwt,
      extendedEphemeralPublicKey: extendedEphemeralPublicKey.toString(),
      maxEpoch: maxEpoch.toString(),
      jwtRandomness: randomness,
      salt,
      keyClaimName: 'sub',
    };

    return await fetchZkProof(zkpRequest);
  };

  const sendTransaction = async (recipientAddress: string, amount: number) => {
    if (!jwt || !salt || !ephemeralKeyPair || !maxEpoch) {
      throw new Error('Missing required authentication datas');
    }
    const zkProof = await getZkProof();
    const txb = new TransactionBlock();
    const big = BigInt(amount)
    const [coin] = txb.splitCoins(txb.gas, [MIST_PER_SUI * big]);
    txb.transferObjects(
      [coin],
      recipientAddress
    );
    txb.setSender(userAddress);

    const { bytes, signature: userSignature } = await txb.sign({
      client: suiClient,
      signer: ephemeralKeyPair,
    });
    const decodedJwt: any = jwtDecode(jwt);
    const addressSeed: string = genAddressSeed(
      BigInt(salt),
      "sub",
      decodedJwt.sub,
      decodedJwt.aud as string
    ).toString();

    const zkLoginSignature: SerializedSignature =
      getZkLoginSignature({
        inputs: {
          ...zkProof,
          addressSeed,
        },
        maxEpoch,
        userSignature,
      });
    const executeRes = await suiClient.executeTransactionBlock({
      transactionBlock: bytes,
      signature: zkLoginSignature,
    });

    return executeRes;
  };

  useEffect(() => {
    const sessionData = sessionStorage.getItem('zklogin-session');
    if (sessionData) {
      const {
        ephemeralPrivateKey,
        maxEpoch: storedMaxEpoch,
        nonce: storedNonce,
        jwt: storedJwt,
        salt: storedSalt,
        userAddress: storedAddress,
        randomness: storedRandomness,
      } = JSON.parse(sessionData);

      if (ephemeralPrivateKey) {
        const keyPair = Ed25519Keypair.fromSecretKey(ephemeralPrivateKey);
        setEphemeralKeyPair(keyPair);
      }

      setMaxEpoch(storedMaxEpoch);
      setNonce(storedNonce);
      setJwt(storedJwt);
      setSalt(storedSalt);
      setUserAddress(storedAddress);
      setRandomness(storedRandomness);
      setIsAuthenticated(true);
    }

    const urlParams = new URLSearchParams(window.location.search);
    // const idToken = urlParams.get('id_token');
    const hash = window.location.hash.substring(1); // # işaretini kaldır
    const params = new URLSearchParams(hash);
    const idToken = params.get('id_token');
    if (idToken && !isAuthenticated) {
      handleJwt(idToken);
    }
  }, [isAuthenticated]);
  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        userAddress,
        login,
        logout,
        maxEpoch,
        nonce,
        jwt,
        salt,
        getZkProof,
        sendTransaction,
        addressBalance,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}