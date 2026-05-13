import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Mail, PhoneCall, HelpCircle, LifeBuoy, Sparkles } from "lucide-react";
import { supportSettingsAPI } from "@food/api";
import { useNavigate } from "react-router-dom";

const THEMES = {
  user: {
    accent: "#001A94",
    accentDark: "#001166",
    badge: "Customer Support",
  },
  restaurant: {
    accent: "#001A94",
    accentDark: "#001166",
    badge: "Restaurant Partner Support",
  },
  delivery: {
    accent: "#001A94",
    accentDark: "#001166",
    badge: "Delivery Partner Support",
  },
};

const DEFAULT_CONTENT = {
  user: {
    supportTitle: "Customer Support",
    supportDescription: "We are here to help with orders, payments, and account issues.",
    supportEmail: "dardecomer7@gmail.com",
    supportPhone: "878 728 2388",
    footerText: "Thanks for choosing Dar De Comer. We reply within 24 hours.",
    faq: [
      { question: "Where is my order?", answer: "Track your order status in the Orders section of the app." },
      { question: "How can I change my phone number?", answer: "Go to Profile > Edit Profile to update your number." },
      { question: "How do I request a refund?", answer: "Open your order details and choose Request Refund." },
    ],
  },
  restaurant: {
    supportTitle: "Restaurant Partner Support",
    supportDescription: "Get help with listings, orders, payouts, and app access.",
    supportEmail: "dardecomer7@gmail.com",
    supportPhone: "878 728 2388",
    footerText: "We respond within 24 hours. Thanks for partnering with us!",
    faq: [
      { question: "How do I update menu items?", answer: "Go to Menu > Edit Items from your restaurant dashboard." },
      { question: "When are payouts processed?", answer: "Payouts are processed weekly and visible in your Wallet." },
      { question: "How can I reach delivery support?", answer: "Call the support number listed here for urgent delivery issues." },
    ],
  },
  delivery: {
    supportTitle: "Delivery Partner Support",
    supportDescription: "Quick help for login, orders, payouts, and safety assistance.",
    supportEmail: "dardecomer7@gmail.com",
    supportPhone: "878 728 2388",
    footerText: "We are here for you. Typical response time is under 12 hours.",
    faq: [
      { question: "I cannot log in, what should I do?", answer: "Recheck your phone number and request a new OTP." },
      { question: "How do I see my earnings?", answer: "Go to Pocket > Earnings to review your payouts." },
      { question: "Can I report a safety issue?", answer: "Use the safety help option in your app or call support." },
    ],
  },
};

const SupportFaqItem = ({ item, isOpen, onToggle, accent }) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full text-left rounded-2xl border border-white/40 bg-white/70 backdrop-blur-xl shadow-sm px-4 py-3 transition-all hover:-translate-y-0.5 hover:shadow-md"
      aria-expanded={isOpen}
    >
      <div className="flex items-start gap-3">
        <span
          className="mt-1 flex h-8 w-8 items-center justify-center rounded-full"
          style={{ backgroundColor: `${accent}1A` }}
        >
          <HelpCircle className="h-4 w-4" style={{ color: accent }} />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-900">{item.question || "FAQ"}</p>
          <div
            className={`text-xs text-slate-600 leading-relaxed transition-all duration-300 ${
              isOpen ? "max-h-72 mt-2" : "max-h-0 mt-0"
            } overflow-hidden`}
          >
            {item.answer || ""}
          </div>
        </div>
      </div>
    </button>
  );
};

const ensureMetaTag = (name) => {
  if (typeof document === "undefined") return null;
  let tag = document.querySelector(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", name);
    document.head.appendChild(tag);
  }
  return tag;
};

export default function SupportPage({ appType = "user" }) {
  const theme = THEMES[appType] || THEMES.user;
  const defaults = DEFAULT_CONTENT[appType] || DEFAULT_CONTENT.user;
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [openFaq, setOpenFaq] = useState([0]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const response = await supportSettingsAPI.getPublic(appType);
        const data = response?.data?.data || response?.data?.data?.data || response?.data || null;
        if (isMounted) {
          setSettings(data || null);
        }
      } catch (_) {
        if (isMounted) setSettings(null);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [appType]);

  const merged = useMemo(() => {
    if (!settings) return { ...defaults, isActive: true };
    return {
      ...defaults,
      ...settings,
      faq: Array.isArray(settings?.faq) && settings.faq.length ? settings.faq : defaults.faq,
    };
  }, [defaults, settings]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const title = `${merged.supportTitle || "Support"} | Dar De Comer`;
    document.title = title;
    const meta = ensureMetaTag("description");
    if (meta) {
      meta.setAttribute("content", merged.supportDescription || "Support and help center");
    }
  }, [merged.supportTitle, merged.supportDescription]);

  const handleToggleFaq = (index) => {
    setOpenFaq((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index);
      }
      return [...prev, index];
    });
  };

  return (
    <div className="min-h-screen bg-[#f7f8fc] px-4 py-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div
          className="relative overflow-hidden rounded-[2rem] border border-white/40 bg-white/70 p-6 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.18)] backdrop-blur-xl"
        >
          <div className="absolute inset-0 opacity-40" style={{ background: `radial-gradient(60% 60% at 20% 0%, ${theme.accent}33 0%, transparent 60%)` }} />
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full" style={{ background: `${theme.accent}1A` }} />
          <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </button>
              <span
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em]"
                style={{ color: theme.accent, backgroundColor: `${theme.accent}1A` }}
              >
                <Sparkles className="h-3 w-3" />
                {theme.badge}
              </span>
              <h1 className="text-2xl md:text-4xl font-semibold text-slate-900" style={{ fontFamily: "'Saira Stencil', sans-serif" }}>
                {merged.supportTitle}
              </h1>
              <p className="text-sm md:text-base text-slate-600 max-w-2xl">
                {merged.supportDescription}
              </p>
              {!merged.isActive ? (
                <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-700">
                  Support is temporarily offline. Please use the contact methods below for urgent requests.
                </div>
              ) : null}
            </div>
            <div className="flex items-center gap-3">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/60 bg-white/70 shadow-lg"
              >
                <LifeBuoy className="h-7 w-7" style={{ color: theme.accent }} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/40 bg-white/70 p-5 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.15)] backdrop-blur-xl">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Mail className="h-4 w-4" style={{ color: theme.accent }} />
              Support Email
            </div>
            <a
              href={merged.supportEmail ? `mailto:${merged.supportEmail}` : undefined}
              className="mt-2 block text-base font-semibold text-slate-900 hover:underline"
            >
              {merged.supportEmail || "Email unavailable"}
            </a>
            <p className="mt-2 text-xs text-slate-500">Click to email our support team.</p>
          </div>
          <div className="rounded-2xl border border-white/40 bg-white/70 p-5 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.15)] backdrop-blur-xl">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <PhoneCall className="h-4 w-4" style={{ color: theme.accent }} />
              Support Phone
            </div>
            <a
              href={merged.supportPhone ? `tel:${merged.supportPhone.replace(/\s+/g, "")}` : undefined}
              className="mt-2 block text-base font-semibold text-slate-900 hover:underline"
            >
              {merged.supportPhone || "Phone unavailable"}
            </a>
            <p className="mt-2 text-xs text-slate-500">Tap to call our support line.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/40 bg-white/70 p-5 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.15)] backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" style={{ color: theme.accent }} />
            <h2 className="text-sm font-semibold text-slate-900">Frequently Asked Questions</h2>
          </div>
          <div className="mt-4 space-y-3">
            {(merged.faq || []).length === 0 ? (
              <div className="text-sm text-slate-500">No FAQs available yet.</div>
            ) : (
              merged.faq.map((item, index) => (
                <SupportFaqItem
                  key={`${item.question}-${index}`}
                  item={item}
                  isOpen={openFaq.includes(index)}
                  onToggle={() => handleToggleFaq(index)}
                  accent={theme.accent}
                />
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/40 bg-white/70 px-5 py-4 text-sm text-slate-600 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.12)] backdrop-blur-xl">
          {merged.footerText}
        </div>
      </div>
    </div>
  );
}
