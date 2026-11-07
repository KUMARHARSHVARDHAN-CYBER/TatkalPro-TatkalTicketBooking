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
  Lock,
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
  const [paymentError, setPaymentError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePay = async () => {
    setIsProcessing(true);
    setPaymentError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch("/api/payment/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          amount: totalAmount,
          method: selectedMethod,
          gateway: activeGateway,
          shouldFail: shouldSimulateFailure,
        }),
      });

      clearTimeout(timeoutId);
      const data = await res.json();
      setIsProcessing(false);

      if (data.success && data.data) {
        const tx: PaymentTransaction = data.data;
        if (tx.status === "SUCCESS") {
          onPaymentSuccess(tx);
        } else {
          onPaymentFailureSimulated(tx);
        }
      } else {
        // Gateway Timeout Fallback trigger
        if (activeGateway === "RAZORPAY_MOCK") {
          setActiveGateway("PAYU_MOCK");
          setPaymentError("Primary Payment Gateway timed out. Auto-switched to Backup RailPay Gateway without releasing your seat hold. Tap Pay to try again.");
        } else {
          onPaymentFailureSimulated({
            transactionId: `tx_failed_${Date.now()}`,
            orderId: `order_${Date.now()}`,
            amount: totalAmount,
            currency: "INR",
            status: "FAILED",
            gateway: activeGateway,
            method: selectedMethod,
            failureReason: "Simulated Banking Switch Timeout during 10:00 AM rush.",
            createdAt: new Date().toISOString(),
          });
        }
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      setIsProcessing(false);
      const isTimeout = err?.name === "AbortError";
      if (activeGateway === "RAZORPAY_MOCK") {
        setActiveGateway("PAYU_MOCK");
        setPaymentError("Payment gateway request timed out after 8s. Auto-switched to Backup RailPay Gateway. Tap Pay to try again.");
      } else {
        onPaymentFailureSimulated({
          transactionId: `tx_failed_${Date.now()}`,
          orderId: `order_${Date.now()}`,
          amount: totalAmount,
          currency: "INR",
          status: "FAILED",
          gateway: activeGateway,
          method: selectedMethod,
          failureReason: isTimeout
            ? "Bank OTP Timeout (Gateway did not respond within 8 seconds)."
            : "Network connectivity dropped during transaction.",
          createdAt: new Date().toISOString(),
        });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Step 4 of 5 • Encrypted Checkout
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                Select Payment Method
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-black font-mono text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
              ₹{totalAmount.toLocaleString("en-IN")}
            </span>
            <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Retry Banner on Gateway Fallback / Timeout */}
        {paymentError && (
          <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-2">
            <span>{paymentError}</span>
            <button
              type="button"
              onClick={() => handlePay()}
              className="shrink-0 px-2.5 py-1 rounded-lg bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition cursor-pointer"
            >
              Try again
            </button>
          </div>
        )}

        {/* Payment Tabs: UPI, Card, Netbanking, Wallet */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { id: "UPI", label: "UPI", icon: QrCode },
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
                className={`py-3 px-2 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition cursor-pointer text-xs font-bold ${
                  isSelected
                    ? "bg-blue-50 border-blue-600 text-blue-800 ring-2 ring-blue-600/20 shadow-2xs"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? "text-blue-600" : "text-slate-500"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: UPI Experience */}
        {selectedMethod === "UPI" && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-xs font-bold text-slate-800">Instant UPI Payment (Recommended for Tatkal)</span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                0% Gateway Fee
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "QR", label: "Scan QR Code" },
                { id: "INTENT", label: "GPay / PhonePe" },
                { id: "VPA", label: "Enter UPI ID" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setUpiSubOption(opt.id as any)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition ${
                    upiSubOption === opt.id
                      ? "bg-white border-blue-600 text-blue-800 shadow-2xs"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {upiSubOption === "QR" && (
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2">
                <div className="w-32 h-32 bg-slate-50 border border-slate-300 rounded-xl p-2 flex items-center justify-center">
                  {/* Visual QR Code Mock */}
                  <div className="w-28 h-28 border-4 border-slate-800 p-1 flex flex-col justify-between">
                    <div className="flex justify-between">
                      <div className="w-6 h-6 bg-slate-800" />
                      <div className="w-6 h-6 bg-slate-800" />
                    </div>
                    <div className="text-[9px] font-mono font-bold text-slate-500">BHIM UPI</div>
                    <div className="flex justify-between">
                      <div className="w-6 h-6 bg-slate-800" />
                      <div className="w-6 h-6 bg-slate-800" />
                    </div>
                  </div>
                </div>
                <span className="text-xs text-slate-600">Scan with any UPI App (GPay, PhonePe, Paytm, BHIM)</span>
              </div>
            )}

            {upiSubOption === "VPA" && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Your Virtual Payment Address (VPA)</label>
                <input
                  type="text"
                  placeholder="e.g. mobile@upi or name@okaxis"
                  value={vpaId}
                  onChange={(e) => setVpaId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Cards */}
        {selectedMethod === "CARD" && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Card Number</label>
              <input
                type="text"
                placeholder="4532 •••• •••• 8920"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Valid Thru</label>
                <input type="text" placeholder="MM/YY" className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-mono" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">CVV</label>
                <input type="password" placeholder="•••" maxLength={4} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-mono" />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Netbanking */}
        {selectedMethod === "NETBANKING" && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-2 text-xs">
            <span className="font-bold text-slate-700">Select Bank</span>
            <div className="grid grid-cols-3 gap-2">
              {["HDFC Bank", "SBI", "ICICI Bank", "Axis Bank", "Kotak", "PNB"].map((b) => (
                <button key={b} type="button" className="p-2 rounded-xl bg-white border border-slate-200 hover:border-blue-400 font-bold text-slate-800 text-[11px] text-center">
                  {b}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Wallets */}
        {selectedMethod === "WALLET" && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-2 text-xs">
            <span className="font-bold text-slate-700">Select Wallet</span>
            <div className="grid grid-cols-3 gap-2">
              {["IRCTC iMudra", "Amazon Pay", "Paytm Wallet", "Mobikwik", "Freecharge", "JioMoney"].map((w) => (
                <button key={w} type="button" className="p-2 rounded-xl bg-white border border-slate-200 hover:border-blue-400 font-bold text-slate-800 text-[11px] text-center">
                  {w}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Intentional Payment Failure Testing Toggle */}
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <strong>Test Payment Recovery Flow:</strong>
              <p className="text-[11px] text-amber-700">Simulate bank gateway failure to test auto-refund & auto-fallback.</p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={shouldSimulateFailure}
            onChange={(e) => setShouldSimulateFailure(e.target.checked)}
            className="w-4 h-4 accent-amber-600 cursor-pointer"
          />
        </div>

        {/* Pay Action CTA */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isProcessing}
            onClick={handlePay}
            className="flex-1 py-3.5 px-5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-sm shadow-md shadow-orange-500/25 flex items-center justify-center gap-2 cursor-pointer transition active:scale-98"
          >
            {isProcessing ? (
              <span>Authorizing with Banking Gateway...</span>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>PAY ₹{totalAmount.toLocaleString("en-IN")} SECURELY</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default PaymentModal;
