import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Share2, Users, Wallet, CircleCheck, Clock3, CircleX } from "lucide-react";
import AnimatedPage from "@food/components/user/AnimatedPage";
import { Button } from "@food/components/ui/button";
import { Card, CardContent } from "@food/components/ui/card";
import { useCompanyName } from "@food/hooks/useCompanyName";
import { useProfile } from "@food/context/ProfileContext";
import { toast } from "sonner";
import { userAPI } from "@food/api";

const statusMeta = {
  credited: {
    label: "Credited",
    icon: CircleCheck,
    className: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300",
  },
  pending: {
    label: "Pending",
    icon: Clock3,
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300",
  },
  rejected: {
    label: "Rejected",
    icon: CircleX,
    className: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300",
  },
};

export default function ReferEarn() {
  const { userProfile } = useProfile();
  const companyName = useCompanyName();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    referralCount: 0,
    totalReferralEarnings: 0,
    rewardAmount: 0,
    totalInvited: 0,
    creditedCount: 0,
    pendingCount: 0,
    rejectedCount: 0,
  });
  const [invitedFriends, setInvitedFriends] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const res = await userAPI.getReferralDetails();
        const nextStats = res?.data?.data?.stats || {};
        const nextInvited = res?.data?.data?.invitedFriends || [];
        if (!cancelled) {
          setStats({
            referralCount: Number(nextStats.referralCount) || 0,
            totalReferralEarnings: Number(nextStats.totalReferralEarnings) || 0,
            rewardAmount: Number(nextStats.rewardAmount) || 0,
            totalInvited: Number(nextStats.totalInvited) || 0,
            creditedCount: Number(nextStats.creditedCount) || 0,
            pendingCount: Number(nextStats.pendingCount) || 0,
            rejectedCount: Number(nextStats.rejectedCount) || 0,
          });
          setInvitedFriends(Array.isArray(nextInvited) ? nextInvited : []);
        }
      } catch (error) {
        if (!cancelled) {
          setStats((prev) => ({ ...prev }));
          setInvitedFriends([]);
          toast.error("Failed to load referral details");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const refId = userProfile?._id || userProfile?.id || userProfile?.referralCode || "";
  const referralLink = refId
    ? `${window.location.origin}/food/user/auth/login?ref=${encodeURIComponent(String(refId))}`
    : "";

  const shareText = useMemo(() => {
    const rewardText = stats.rewardAmount > 0 ? `\u20B9${stats.rewardAmount}` : "rewards";
    return `Join ${companyName} and earn ${rewardText}.`;
  }, [companyName, stats.rewardAmount]);

  const handleShare = async () => {
    if (!referralLink) {
      toast.error("Referral link unavailable");
      return;
    }
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${companyName} referral`,
          text: shareText,
          url: referralLink,
        });
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(`${shareText} ${referralLink}`);
        toast.success("Referral link copied");
      }

      const fallbackUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${referralLink}`)}`;
      window.open(fallbackUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      if (error?.name !== "AbortError") {
        toast.error("Unable to share right now");
      }
    }
  };

  return (
    <AnimatedPage className="min-h-screen bg-[#f5f5f5] dark:bg-[#0a0a0a]">
      <div className="max-w-md mx-auto px-4 py-4 pb-24">
        <div className="flex items-center gap-3 mb-5">
          <Link to="/user/profile">
            <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
              <ArrowLeft className="h-5 w-5 text-black dark:text-white" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-black dark:text-white">Refer & Earn</h1>
        </div>

        <Card className="bg-white dark:bg-[#1a1a1a] rounded-2xl border-0 shadow-sm mb-4">
          <CardContent className="p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center shrink-0">
                <Share2 className="h-6 w-6 text-[#001A94] dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Invite & Earn</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                  Refer your friends to join {companyName}. You'll earn rewards directly in your wallet once they sign up.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800/40 p-4 border border-gray-100 dark:border-gray-800">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Per Invite</p>
                <p className="text-xl font-bold text-[#001A94] dark:text-blue-400">₹{stats.rewardAmount}</p>
              </div>
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800/40 p-4 border border-gray-100 dark:border-gray-800">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Total Earned</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">₹{stats.totalReferralEarnings}</p>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleShare}
              disabled={!referralLink}
              className="w-full mt-6 h-12 rounded-xl bg-[#001A94] hover:bg-blue-800 text-white font-bold shadow-lg shadow-blue-900/10 transition-transform active:scale-95"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Link
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Invited", val: stats.totalInvited, icon: Users },
            { label: "Success", val: stats.creditedCount, icon: CircleCheck },
            { label: "Pending", val: stats.pendingCount, icon: Clock3 },
          ].map((item, idx) => (
            <Card key={idx} className="border-0 shadow-sm bg-white dark:bg-[#1a1a1a] rounded-xl overflow-hidden">
              <CardContent className="p-4 text-center">
                <item.icon className="h-4 w-4 mx-auto mb-2 text-gray-400" />
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">{item.label}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{item.val}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <div className="w-1 h-4 bg-[#001A94] rounded-full" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Referrals</h3>
          </div>

          <Card className="bg-white dark:bg-[#1a1a1a] rounded-2xl border-0 shadow-sm overflow-hidden">
            <CardContent className="p-2">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="w-8 h-8 border-2 border-[#001A94] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm text-gray-500 font-medium">Syncing your network...</p>
                </div>
              ) : invitedFriends.length === 0 ? (
                <div className="p-10 text-center">
                  <Users className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 font-medium leading-relaxed px-4">
                    Your referral list is empty. Start sharing to earn rewards!
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50 dark:divide-gray-800">
                  {invitedFriends.map((item) => {
                    const meta = statusMeta[item?.status] || statusMeta.pending;
                    const StatusIcon = meta.icon;
                    const invitedDate = item?.invitedAt ? new Date(item.invitedAt) : null;
                    const dateText = invitedDate && !Number.isNaN(invitedDate.getTime()) ? invitedDate.toLocaleDateString() : "-";

                    return (
                      <div key={item?.id || item?.refereeId} className="p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center font-bold text-[#001A94] dark:text-blue-400">
                            {item?.name?.charAt(0).toUpperCase() || "F"}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                              {item?.name || "Friend"}
                            </p>
                            <p className="text-[10px] text-gray-400 font-medium uppercase mt-0.5">{dateText}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg ${meta.className}`}>
                            <StatusIcon className="h-3 w-3" />
                            {meta.label}
                          </span>
                          <p className="text-xs font-bold text-gray-900 dark:text-white mt-2">
                            +₹{Number(item?.earnedAmount) || 0}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </AnimatedPage>
  );
}

