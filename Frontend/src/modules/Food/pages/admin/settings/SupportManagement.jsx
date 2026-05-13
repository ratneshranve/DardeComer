import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Mail, PhoneCall, HelpCircle, Save, Loader2, Plus, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { adminAPI } from "@food/api";
import { Input } from "@food/components/ui/input";
import { Textarea } from "@food/components/ui/textarea";

const APP_TYPES = [
  { key: "user", label: "User App Support" },
  { key: "restaurant", label: "Restaurant App Support" },
  { key: "delivery", label: "Delivery App Support" },
];

const EMPTY_SETTINGS = {
  supportEmail: "",
  supportPhone: "",
  supportTitle: "",
  supportDescription: "",
  footerText: "",
  faq: [],
  isActive: true,
};

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
const isValidPhone = (value) => /^\+?[0-9\s-]{7,20}$/.test(String(value || "").trim());

const normalizeSettings = (data) => ({
  ...EMPTY_SETTINGS,
  ...data,
  faq: Array.isArray(data?.faq) ? data.faq : [],
  isActive: data?.isActive !== undefined ? Boolean(data.isActive) : true,
});

export default function SupportManagement() {
  const [activeTab, setActiveTab] = useState("user");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [settings, setSettings] = useState({
    user: { ...EMPTY_SETTINGS },
    restaurant: { ...EMPTY_SETTINGS },
    delivery: { ...EMPTY_SETTINGS },
  });
  const [errors, setErrors] = useState({});

  const activeSettings = useMemo(() => settings[activeTab] || EMPTY_SETTINGS, [settings, activeTab]);

  useEffect(() => {
    let isMounted = true;
    const loadAll = async () => {
      try {
        setLoading(true);
        const results = await Promise.all(APP_TYPES.map((t) => adminAPI.getSupportSettings(t.key)));
        if (!isMounted) return;
        const next = {};
        results.forEach((res, index) => {
          const key = APP_TYPES[index].key;
          const data = res?.data?.data || res?.data?.data?.data || res?.data || {};
          next[key] = normalizeSettings(data || {});
        });
        setSettings(next);
      } catch (error) {
        toast.error(error?.response?.data?.message || "Failed to load support settings");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadAll();
    return () => {
      isMounted = false;
    };
  }, []);

  const updateField = (key, field, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }));
  };

  const updateFaq = (key, index, field, value) => {
    setSettings((prev) => {
      const list = [...(prev[key]?.faq || [])];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, [key]: { ...prev[key], faq: list } };
    });
  };

  const addFaq = (key) => {
    setSettings((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        faq: [...(prev[key]?.faq || []), { question: "", answer: "" }],
      },
    }));
  };

  const removeFaq = (key, index) => {
    setSettings((prev) => {
      const list = [...(prev[key]?.faq || [])];
      list.splice(index, 1);
      return { ...prev, [key]: { ...prev[key], faq: list } };
    });
  };

  const validate = (key) => {
    const data = settings[key] || EMPTY_SETTINGS;
    const nextErrors = {};
    if (!data.supportTitle.trim()) nextErrors.supportTitle = "Support title is required";
    if (!data.supportDescription.trim()) nextErrors.supportDescription = "Description is required";
    if (!data.supportEmail.trim() || !isValidEmail(data.supportEmail)) nextErrors.supportEmail = "Valid email is required";
    if (!data.supportPhone.trim() || !isValidPhone(data.supportPhone)) nextErrors.supportPhone = "Valid phone is required";
    setErrors((prev) => ({ ...prev, [key]: nextErrors }));
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async (key) => {
    if (!validate(key)) return;
    try {
      setSaving((prev) => ({ ...prev, [key]: true }));
      const payload = { ...settings[key] };
      const res = await adminAPI.updateSupportSettings(key, payload);
      const data = res?.data?.data || res?.data?.data?.data || res?.data || {};
      setSettings((prev) => ({ ...prev, [key]: normalizeSettings(data || payload) }));
      toast.success("Support settings saved");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save support settings");
    } finally {
      setSaving((prev) => ({ ...prev, [key]: false }));
    }
  };

  if (loading) {
    return (
      <div className="h-full overflow-y-auto bg-slate-50 p-4 lg:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  const tabErrors = errors[activeTab] || {};

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-4 lg:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-slate-900">Support Management</h1>
          <p className="text-sm text-slate-600 mt-1">Manage support details for user, restaurant, and delivery apps.</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-2">
          <div className="flex flex-wrap gap-2">
            {APP_TYPES.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{APP_TYPES.find((t) => t.key === activeTab)?.label}</h2>
              <p className="text-xs text-slate-500 mt-1">Updates are visible instantly on the public support page.</p>
            </div>
            <button
              type="button"
              onClick={() => updateField(activeTab, "isActive", !activeSettings.isActive)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              {activeSettings.isActive ? (
                <ToggleRight className="h-4 w-4 text-emerald-600" />
              ) : (
                <ToggleLeft className="h-4 w-4 text-slate-400" />
              )}
              {activeSettings.isActive ? "Active" : "Inactive"}
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600">Support Title</label>
              <Input
                value={activeSettings.supportTitle}
                onChange={(e) => updateField(activeTab, "supportTitle", e.target.value)}
                placeholder="Enter support page title"
              />
              {tabErrors.supportTitle ? (
                <p className="text-xs text-red-600">{tabErrors.supportTitle}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600">Support Email</label>
              <div className="relative">
                <Mail className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={activeSettings.supportEmail}
                  onChange={(e) => updateField(activeTab, "supportEmail", e.target.value)}
                  placeholder="support@example.com"
                  className="pl-9"
                />
              </div>
              {tabErrors.supportEmail ? (
                <p className="text-xs text-red-600">{tabErrors.supportEmail}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600">Support Phone</label>
              <div className="relative">
                <PhoneCall className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={activeSettings.supportPhone}
                  onChange={(e) => updateField(activeTab, "supportPhone", e.target.value)}
                  placeholder="+91 90000 00000"
                  className="pl-9"
                />
              </div>
              {tabErrors.supportPhone ? (
                <p className="text-xs text-red-600">{tabErrors.supportPhone}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600">Footer Note</label>
              <Input
                value={activeSettings.footerText}
                onChange={(e) => updateField(activeTab, "footerText", e.target.value)}
                placeholder="Response time message"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600">Support Description</label>
            <Textarea
              value={activeSettings.supportDescription}
              onChange={(e) => updateField(activeTab, "supportDescription", e.target.value)}
              placeholder="Short support description"
              className="min-h-[120px]"
            />
            {tabErrors.supportDescription ? (
              <p className="text-xs text-red-600">{tabErrors.supportDescription}</p>
            ) : null}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-slate-900">FAQs</h3>
              </div>
              <button
                type="button"
                onClick={() => addFaq(activeTab)}
                className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
              >
                <Plus className="h-3.5 w-3.5" />
                Add FAQ
              </button>
            </div>

            {(activeSettings.faq || []).length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 p-4 text-xs text-slate-500">
                No FAQs added yet.
              </div>
            ) : (
              <div className="space-y-3">
                {activeSettings.faq.map((item, index) => (
                  <div key={`${index}-${activeTab}`} className="rounded-lg border border-slate-200 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-500">FAQ #{index + 1}</p>
                      <button
                        type="button"
                        onClick={() => removeFaq(activeTab, index)}
                        className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    </div>
                    <Input
                      value={item.question}
                      onChange={(e) => updateFaq(activeTab, index, "question", e.target.value)}
                      placeholder="Question"
                    />
                    <Textarea
                      value={item.answer}
                      onChange={(e) => updateFaq(activeTab, index, "answer", e.target.value)}
                      placeholder="Answer"
                      className="min-h-[80px]"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => handleSave(activeTab)}
              disabled={Boolean(saving[activeTab])}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
            >
              {saving[activeTab] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
