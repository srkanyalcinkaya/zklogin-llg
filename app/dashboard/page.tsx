'use client';

import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import { BigNumber } from "bignumber.js";
import { MIST_PER_SUI } from '@mysten/sui.js/utils';
export default function Dashboard() {
  const { userAddress, logout, sendTransaction, addressBalance } = useAuth();
  const [loading, setLoading] = useState(false);
  const [txResult, setTxResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');

  const handleSendTransaction = async () => {
    if (!recipientAddress || !amount) {
      setError('Lütfen alıcı adresi ve miktarı giriniz');
      return;
    }

    setLoading(true);
    setError(null);
    setTxResult(null);

    try {
      const result = await sendTransaction(recipientAddress, parseFloat(amount));
      setTxResult(result);
      setRecipientAddress('');
      setAmount('');
    } catch (err) {
      console.error('Transaction failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-4">
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium flex flex-row items-center gap-2">
              <div className='h-3 w-3 rounded-full bg-green-600 animate-bounce     ' />
              Mainnet
            </div>
            <button
              onClick={logout}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md mb-6 text-black">
          <h2 className="text-xl font-semibold mb-4">Account Information</h2>
          <p className="mb-2">
            <span className="font-bold">Address:</span> {userAddress}
          </p>
          <p className="mb-2">
            <span className="font-bold">Balance:</span> Balance:{" "}
            {BigNumber(addressBalance?.totalBalance)
              .div(MIST_PER_SUI.toString())
              .toFixed(6)}{" "}
            SUI
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-black">Send Transaction</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="recipientAddress" className="block text-sm font-medium text-gray-700 mb-1">
                Recipient Address
              </label>
              <input
                type="text"
                id="recipientAddress"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                placeholder="0x..."
                className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-700"
              />
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                Amount (SUI)
              </label>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                step="0.000000001"
                min="0"
                className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-700"
              />
            </div>

            <button
              onClick={handleSendTransaction}
              disabled={loading}
              className="w-full bg-green-500 text-white px-6 py-3 rounded-lg disabled:opacity-50 hover:bg-green-600 transition-colors"
            >
              {loading ? 'Sending...' : 'Send SUI'}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
              <p className="font-medium">Error:</p>
              <p>{error}</p>
            </div>
          )}

          {txResult && (
            <div className="mt-4 p-3 bg-green-100 text-green-700 rounded">
              <p className="font-medium">Transaction Successful!</p>
              <a
                href={`https://suiscan.xyz/mainnet/tx/${txResult.digest}`}
                target="_blank"
                className='text-blue-500 underline'
              >
                {txResult.digest}
              </a>
              <p>Digest: {txResult.digest}</p>
              <pre className="mt-2 text-xs overflow-x-auto">
                {JSON.stringify(txResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}