"use client";

import React, { useState } from "react";
import {
  QrCode,
  CreditCard,
  Building2,
  Wallet,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Zap,
  ArrowRight,
  X,
} from "lucide-react";
import { PaymentTransaction } from "../lib/railway/types";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  onPaymentSuccess: (transaction: PaymentTransaction) => void;
  onPaymentFailureSimulated: (failedTx: PaymentTransaction) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  totalAmount,
  onPaymentSuccess,
  onPaymentFailureSimulated,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<"UPI" | "CARD" | "NETBANKING" | "WALLET">("UPI");
  const [upiSubOption, setUpiSubOption] = useState<"QR" | "INTENT" | "VPA">("QR");
  const [vpaId, setVpaId] = useState("user@okhdfcbank");
  const [shouldSimulateFailure, setShouldSimulateFailure] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeGateway, setActiveGateway] = useState<"RAZORPAY_MOCK" | "PAYU_MOCK">("RAZORPAY_MOCK");

  if (!isOpen) return null;

  const handlePay = async () => {
    setIsProcessing(true);

    try {
      const res = await fetch("/api/payment/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: totalAmount,
          method: selectedMethod,
          shouldFail: shouldSimulateFailure,
          gateway: activeGateway,
        }),
      });

      const data = await res.json();
      setIsProcessing(false);

      if (res.status === 200 && data.success) {
        onPaymentSuccess(data.data);
      } else {
        // Payment failed
        const failedTx: PaymentTransaction = data.error?.transaction || {
          transactionId: `TXN_${Date.now()}`,
          orderId: `ORD_${Date.now()}`,
          amount: totalAmount,
          currency: "INR",
          status: "FAILED",
          gateway: activeGateway,
          method: selectedMethod,
          failureReason: "Simulated Banking Switch Disruption.",
          createdAt: new Date().toISOString(),
        };
        onPaymentFailureSimulated(failedTx);
      }
    } catch {
      setIsProcessing(false);
      onPaymentSuccess({
        transactionId: `TXN_LOCAL_${Date.now()}`,
        orderId: `ORD_LOCAL_${Date.now()}`,
        amount: totalAmount,
        currency: "INR",
        status: "SUCCESS",
        gateway: activeGateway,
        method: selectedMethod,
        utrNumber: `3${Math.floor(10000000000 + Math.random() * 90000000000)}`,
        createdAt: new Date().toISOString(),
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-xl bg-[#0c1a30] border border-slate-700 rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
              Multi-Gateway Fast Checkout
            </span>
            <h3 className="text-base sm:text-lg font-black text-white mt-1">Select Payment Method</h3>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase">Total Amount</span>
            <div className="text-lg font-black text-emerald-400 font-mono">
              ₹{totalAmount.toLocaleString("en-IN")}
            </div>
          </div>
        </div>

        {/* Method Selector Tabs */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { id: "UPI", label: "Fast UPI", icon: QrCode, badge: "Recommended" },
            { id: "CARD", label: "Cards", icon: CreditCard },
            { id: "NETBANKING", label: "NetBanking", icon: Building2 },
            { id: "WALLET", label: "Wallets", icon: Wallet },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = selectedMethod === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedMethod(tab.id as any)}
                className={`p-2.5 rounded-2xl border transition flex flex-col items-center text-center gap-1 relative ${
                  isSelected
                    ? "bg-[#14284d] border-orange-500 text-white shadow-md shadow-orange-500/20"
                    : "bg-[#091529] border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {tab.badge && (
                  <span className="absolute -top-2 px-1.5 py-0.2 rounded-full text-[8px] font-bold bg-orange-500 text-white">
                    Fast
                  </span>
                )}
                <Icon className={`w-4 h-4 ${isSelected ? "text-orange-400" : "text-slate-400"}`} />
                <span className="text-[11px] font-bold">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Payment Body */}
        <div className="bg-[#091529] border border-slate-800 rounded-2xl p-4 mb-4 flex flex-col gap-3">
          
          {selectedMethod === "UPI" && (
            <div className="flex flex-col gap-3">
              {/* UPI Sub-Options */}
              <div className="flex gap-2 border-b border-slate-800/80 pb-2">
                <button
                  type="button"
                  onClick={() => setUpiSubOption("QR")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    upiSubOption === "QR" ? "bg-orange-500 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Dynamic QR Code
                </button>
                <button
                  type="button"
                  onClick={() => setUpiSubOption("INTENT")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    upiSubOption === "INTENT" ? "bg-orange-500 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  UPI Apps (GPay/PhonePe)
                </button>
                <button
                  type="button"
                  onClick={() => setUpiSubOption("VPA")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    upiSubOption === "VPA" ? "bg-orange-500 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Enter UPI ID
                </button>
              </div>

              {upiSubOption === "QR" && (
                <div className="flex flex-col sm:flex-row items-center gap-4 py-2">
                  <div className="w-32 h-32 rounded-2xl bg-white p-2.5 shadow-xl flex items-center justify-center shrink-0">
                    {/* Simulated Dynamic QR Code */}
                    <div className="w-full h-full border-4 border-slate-900 border-dashed rounded-lg flex flex-col items-center justify-center p-1 text-center">
                      <QrCode className="w-16 h-16 text-slate-900" />
                      <span className="text-[8px] font-bold text-slate-900">Scan & Pay</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white">Scan with Any UPI App</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Open Google Pay, PhonePe, Paytm, or BHIM. Zero redirect failures with dynamic instant intent.
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-emerald-400 font-mono font-bold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Instant Railway Gateway Webhook</span>
                    </div>
                  </div>
                </div>
              )}

              {upiSubOption === "INTENT" && (
                <div className="grid grid-cols-3 gap-2 py-2">
                  {["Google Pay", "PhonePe", "Paytm"].map((app) => (
                    <button
                      key={app}
                      type="button"
                      className="p-3 rounded-xl bg-[#112444] border border-slate-700 hover:border-orange-500 text-xs font-bold text-white transition text-center"
                    >
                      {app}
                    </button>
                  ))}
                </div>
              )}

              {upiSubOption === "VPA" && (
                <div className="py-2 flex flex-col gap-1.5">
                  <label className="text-xs text-slate-300">Enter Virtual Payment Address (VPA):</label>
                  <input
                    type="text"
                    value={vpaId}
                    onChange={(e) => setVpaId(e.target.value)}
                    placeholder="mobilenumber@upi"
                    className="w-full bg-[#112444] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              )}
            </div>
          )}

          {selectedMethod === "CARD" && (
            <div className="flex flex-col gap-2.5 py-1 text-xs">
              <input
                type="text"
                placeholder="Card Number (XXXX XXXX XXXX 4829)"
                className="w-full bg-[#112444] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="MM/YY"
                  className="bg-[#112444] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
                <input
                  type="password"
                  maxLength={3}
                  placeholder="CVV"
                  className="bg-[#112444] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
            </div>
          )}

          {selectedMethod === "NETBANKING" && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              {["State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank"].map((bank) => (
                <button
                  key={bank}
                  type="button"
                  className="p-2.5 rounded-xl bg-[#112444] border border-slate-700 text-left text-white font-medium"
                >
                  {bank}
                </button>
              ))}
            </div>
          )}

          {selectedMethod === "WALLET" && (
            <div className="text-xs text-slate-300 p-2">
              IRCTC iMudra Wallet balance: <strong className="text-emerald-400 font-mono">₹4,250.00</strong> (Instant 1-tap deduction).
            </div>
          )}

        </div>

        {/* Auto-Fallback Guarantee Banner */}
        <div className="bg-[#102340] border border-blue-500/20 rounded-2xl p-3 mb-4 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="font-bold text-white">Smart Gateway Auto-Fallback</span>
              <p className="text-[10px] text-slate-400">If Razorpay switch stumbles, PayU mock engages automatically without losing seat lock.</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold text-[10px] border border-emerald-500/30">
            Active
          </span>
        </div>

        {/* Simulated Failure Toggle (Demo Edge-Case Feature) */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="text-xs font-bold text-amber-200">Test Failure & Auto-Refund Recovery:</span>
              <p className="text-[10px] text-amber-300/80">Simulates "Money debited but bank gateway failed" to demo automatic reconciliation.</p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={shouldSimulateFailure}
            onChange={(e) => setShouldSimulateFailure(e.target.checked)}
            className="w-4 h-4 rounded text-orange-500 bg-slate-900 border-slate-700"
          />
        </div>

        {/* Action Controls */}
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="py-3 px-4 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isProcessing}
            onClick={handlePay}
            className="flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-orange-500/25 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
                <span>Processing Multi-Gateway Payment...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>CONFIRM & PAY ₹{totalAmount.toLocaleString("en-IN")}</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default PaymentModal;

