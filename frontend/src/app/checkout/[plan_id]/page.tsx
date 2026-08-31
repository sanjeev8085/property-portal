"use client";

import React, { useEffect, useState, use } from "react";
import { useParams } from "next/navigation";
import Button from "@/components/ui/Button";
import { api } from "@/lib/api";

export default function CheckoutPage({ params }: { params: Promise<{ plan_id: string }> }) {
  const resolvedParams = use(params);
  const planId = resolvedParams.plan_id;
  
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function loadPlan() {
      const planPresets: Record<string, any> = {
        basic: { name: "Basic Bundle", price: 99, contact_limit: 5, validity_days: 30 },
        standard: { name: "Standard Package", price: 199, contact_limit: 15, validity_days: 30 },
        premium: { name: "Premium Package", price: 399, contact_limit: 50, validity_days: 60 },
      };

      try {
        const plans = await api.listPlans();
        const found = plans.find((p: any) => String(p.id) === planId || p.name.toLowerCase().includes(planId.toLowerCase()));
        setPlan(found || planPresets[planId] || planPresets.standard);
      } catch {
        setPlan(planPresets[planId] || planPresets.standard);
      } finally {
        setLoading(false);
      }
    }
    loadPlan();
  }, [planId]);

  const handlePayment = async () => {
    setPaymentLoading(true);
    setErrorMsg("");
    try {
      // 1. Resolve plan to a real DB plan UUID if possible
      let targetPlanId = plan?.id;
      if (!targetPlanId || typeof targetPlanId !== "string" || targetPlanId.length < 20) {
        const plans = await api.listPlans();
        const found = plans.find((p: any) => 
          p.name.toLowerCase().includes(planId.toLowerCase()) || 
          p.price === plan?.price
        );
        if (found) {
          targetPlanId = found.id;
        } else if (plans.length > 0) {
          targetPlanId = plans[0].id;
        }
      }

      if (!targetPlanId) {
        throw new Error("Could not resolve payment subscription plan.");
      }

      // 2. Create the payment order on backend
      const order = await api.createOrder(targetPlanId);
      const gatewayOrderId = order.gateway_order_id;

      if (order.demo_mode) {
        // ── Demo / Sandbox Bypass Flow ──
        await new Promise(r => setTimeout(r, 1200));

        // Call backend verification with mock signature
        const verifyRes = await api.verifyPayment({
          razorpay_order_id: gatewayOrderId,
          razorpay_payment_id: `pay_demo_${Math.random().toString(36).substring(7)}`,
          razorpay_signature: `sig_demo_${Math.random().toString(36).substring(7)}`
        });

        const addedCredits = verifyRes.credits_added || plan?.contact_limit || 15;
        const currentCredits = parseInt(localStorage.getItem("user_credits") || "0");
        localStorage.setItem("user_credits", String(currentCredits + addedCredits));

        window.location.href = `/payment/success?credits=${addedCredits}&plan=${encodeURIComponent(plan?.name || "Package")}`;
      } else {
        // ── Real Razorpay Checkout Flow ──
        const options = {
          key: order.key_id,
          amount: order.amount_paise,
          currency: order.currency,
          name: "AuraHomes",
          description: `Purchase ${plan?.name || "Subscription"}`,
          order_id: gatewayOrderId,
          handler: async function (response: any) {
            try {
              setPaymentLoading(true);
              const verifyRes = await api.verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              const addedCredits = verifyRes.credits_added || plan?.contact_limit || 15;
              const currentCredits = parseInt(localStorage.getItem("user_credits") || "0");
              localStorage.setItem("user_credits", String(currentCredits + addedCredits));
              
              window.location.href = `/payment/success?credits=${addedCredits}&plan=${encodeURIComponent(plan?.name || "Package")}`;
            } catch (err: any) {
              setErrorMsg(err.message || "Payment verification failed.");
              setPaymentLoading(false);
            }
          },
          prefill: {
            name: localStorage.getItem("user_name") || "",
            email: localStorage.getItem("user_email") || "",
            contact: localStorage.getItem("user_mobile") || "",
          },
          theme: {
            color: "#6c5ce7",
          },
        };

        if (!(window as any).Razorpay) {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.async = true;
          document.body.appendChild(script);
          await new Promise(r => {
            script.onload = r;
          });
        }

        const rzp = new (window as any).Razorpay(options);
        rzp.on("payment.failed", function (response: any) {
          setErrorMsg(response.error.description || "Payment failed.");
        });
        rzp.open();
        setPaymentLoading(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Payment initiation failed. Please try again.");
      setPaymentLoading(false);
    }
  };

  if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>Loading Checkout Info...</div>;

  return (
    <div className="login-page-container fade-in">
      <div className="login-box premium-card" style={{ maxWidth: "480px" }}>
        <div className="login-header">
          <span style={{ fontSize: "36px" }}>💳</span>
          <h2>Secure Checkout</h2>
          <p>Review plan features and initiate transaction.</p>
        </div>

        <div className="checkout-summary-box" style={{ background: "var(--surface-hover)", padding: "20px", borderRadius: "var(--radius-md)", marginBottom: "24px", textAlign: "left" }}>
          <h4 style={{ fontSize: "16px", marginBottom: "8px" }}>Selected Package: {plan?.name}</h4>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Credits included: <strong>{plan?.contact_limit} Unlock Credits</strong></p>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Validity: <strong>{plan?.validity_days} Days</strong></p>
          <div style={{ height: "1px", background: "var(--border)", margin: "14px 0" }}></div>
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "800", fontSize: "18px" }}>
            <span>Amount Due:</span>
            <span style={{ color: "var(--primary)" }}>₹{plan?.price}</span>
          </div>
        </div>

        <div className="payment-options" style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "14px", border: "1px solid var(--primary)", borderRadius: "var(--radius-md)", background: "var(--primary-light)", textAlign: "left" }}>
            <input type="radio" defaultChecked />
            <div>
              <span style={{ fontWeight: "700", fontSize: "13px" }}>UPI / Credit Card / NetBanking</span>
              <p style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Processed securely via Razorpay payment gateway.</p>
            </div>
          </div>
        </div>

        {errorMsg && <p style={{ color: "var(--error)", fontSize: "13px", fontWeight: "600", marginBottom: "12px" }}>{errorMsg}</p>}

        <Button type="button" variant="primary" fullWidth size="lg" disabled={paymentLoading} onClick={handlePayment}>
          {paymentLoading ? "Processing secure payment..." : `Pay ₹${plan?.price}`}
        </Button>

        <p className="register-prompt"><a href="/plans">← Change Selected Plan</a></p>
      </div>
    </div>
  );
}
