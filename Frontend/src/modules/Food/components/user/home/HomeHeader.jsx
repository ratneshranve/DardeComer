import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ChevronDown, Search, Mic, Bell, CheckCircle2, Tag, Gift, AlertCircle, Clock, BellOff, X, User } from 'lucide-react';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@food/components/ui/popover";
import { Badge } from "@food/components/ui/badge";
import { Avatar, AvatarFallback } from "@food/components/ui/avatar";
import useNotificationInbox from "@food/hooks/useNotificationInbox";

const ICON_MAP = {
  CheckCircle2,
  Tag,
  Gift,
  AlertCircle
};

export default function HomeHeader({ 
  location, 
  savedAddressText, 
  defaultAddress,
  handleLocationClick, 
  handleSearchFocus, 
  placeholderIndex, 
  placeholders 
}) {
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('food_user_notifications');
    return saved ? JSON.parse(saved) : [];
  });
  const {
    items: broadcastNotifications,
    unreadCount: broadcastUnreadCount,
    dismiss: dismissBroadcastNotification,
  } = useNotificationInbox("user", { limit: 20 });

  useEffect(() => {
    const syncNotifications = () => {
      const saved = localStorage.getItem('food_user_notifications');
      setNotifications(saved ? JSON.parse(saved) : []);
    };

    window.addEventListener('notificationsUpdated', syncNotifications);
    
    return () => window.removeEventListener('notificationsUpdated', syncNotifications);
  }, []);

  const mergedNotifications = useMemo(() => {
    const localItems = Array.isArray(notifications)
      ? notifications.map((item) => ({ ...item, source: "local" }))
      : [];
    const broadcastItems = (broadcastNotifications || []).map((item) => ({
      ...item,
      source: "broadcast",
      time: item.createdAt
        ? new Date(item.createdAt).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
        : "Just now",
      type: "broadcast",
      icon: "Bell",
      iconColor: "text-blue-600",
    }));

    return [...broadcastItems, ...localItems].sort(
      (a, b) =>
        new Date(b.createdAt || b.timestamp || 0).getTime() -
        new Date(a.createdAt || a.timestamp || 0).getTime()
    );
  }, [broadcastNotifications, notifications]);

  const unreadCount = notifications.filter(n => !n.read).length + broadcastUnreadCount;

  const handleDeleteNotification = (id, source = "local") => {
    if (source === "broadcast") {
      dismissBroadcastNotification(id);
      return;
    }
    setNotifications((prev) => {
      const next = prev.filter((notification) => notification.id !== id);
      localStorage.setItem('food_user_notifications', JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('notificationsUpdated', { detail: { count: next.filter((n) => !n.read).length } }));
      return next;
    });
  };

  return (
    <header className="relative bg-[#001A94] pt-1 pb-2 px-0 space-y-0 shadow-xl overflow-hidden dark:bg-[#05051a] dark:shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
      {/* Decorative Glows */}
      <div className="absolute top-0 left-1/4 w-32 h-32 bg-white/10 blur-[60px] rounded-full pointer-events-none dark:bg-white/10" />
      <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-blue-400/10 blur-[80px] rounded-full pointer-events-none dark:bg-[#001A94]/10" />

      <div className="relative px-4 pt-4 pb-2">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div className="group/loc flex flex-col min-w-0" onClick={handleLocationClick}>
            <div className="flex items-center gap-1 text-white/70 mb-0.5">
              <MapPin className="h-3 w-3 text-white/50" />
              <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Your Location</span>
              <ChevronDown className="h-3 w-3 text-white/40 group-hover/loc:text-white transition-colors" />
            </div>
            <h1 className="text-base font-bold text-white truncate leading-tight group-hover/loc:text-blue-100 transition-colors">
              {(() => {
                const mode = localStorage.getItem("deliveryAddressMode") || "current";
                const addr = mode === "saved" && defaultAddress ? defaultAddress : location;

                if (!addr || (!addr.area && !addr.address && !addr.city && !addr.street)) {
                  return 'Set your location';
                }

                const rawParts = [
                  addr.area,
                  addr.street,
                  addr.address,
                  addr.city
                ].filter(Boolean).map(s => String(s).trim());

                // Filter out components that are entirely contained within other components
                // or are identical case-insensitively.
                const finalComponents = rawParts.filter((comp, index) => {
                  return !rawParts.some((other, otherIndex) => {
                    if (index === otherIndex) return false;
                    // If 'other' includes 'comp', and 'other' is longer, 'comp' is redundant
                    return other.toLowerCase().includes(comp.toLowerCase()) && other.length > comp.length;
                  });
                });
                
                // Deduplicate identical ones (case-insensitive)
                const unique = [];
                const seen = new Set();
                finalComponents.forEach(c => {
                  const low = c.toLowerCase();
                  if (!seen.has(low)) {
                    seen.add(low);
                    unique.push(c);
                  }
                });

                return unique.length > 0 ? unique.join(', ') : 'Set your location';
              })()}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
             <Popover>
              <PopoverTrigger asChild>
                <div className="h-10 w-10 relative flex items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg cursor-pointer active:scale-95 transition-all">
                  <Bell className="h-5 w-5 text-white" />
                  {unreadCount > 0 && (
                    <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-blue-300 rounded-full border-2 border-[#001A94] animate-pulse" />
                  )}
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 overflow-hidden border-none shadow-2xl rounded-2xl mt-2" align="end">
                <div className="bg-white dark:bg-gray-900 text-left">
                  <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      Notifications
                      {unreadCount > 0 && (
                        <Badge variant="secondary" className="bg-[#001A94] text-white border-none text-[10px] h-4">
                          {unreadCount} New
                        </Badge>
                      )}
                    </h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto font-sans">
                    {mergedNotifications.length > 0 ? (
                      mergedNotifications.slice(0, 5).map((notif) => {
                        const Icon = ICON_MAP[notif.icon] || Bell;
                        return (
                          <div 
                            key={notif.id}
                            className={`p-4 flex items-start gap-3 border-b border-gray-50 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer ${!notif.read ? 'bg-blue-50/20' : ''}`}
                          >
                            <div className={`mt-1 p-2 rounded-full ${notif.type === "order" ? "bg-green-100/50 text-green-600" : "bg-blue-100/50 text-[#001A94]"}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-0.5">
                                <span className="text-sm font-bold text-gray-900 dark:text-white truncate">{notif.title}</span>
                                <div className="flex items-center gap-1 text-right">
                                  <span className="text-[10px] text-gray-400 whitespace-nowrap">{notif.time}</span>
                                  <button
                                    type="button"
                                    aria-label="Delete notification"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleDeleteNotification(notif.id, notif.source);
                                    }}
                                    className="rounded-full p-1 text-gray-400 hover:text-[#001A94] hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                                {notif.message}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-8 text-center flex flex-col items-center gap-2">
                        <BellOff className="h-10 w-10 text-gray-200" />
                        <p className="text-xs text-gray-400 font-medium">All caught up!</p>
                      </div>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Link to="/user/profile" className="relative group/user">
              <div className="h-10 w-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center transition-all group-hover/user:bg-white/20">
                <User className="h-5 w-5 text-white" />
              </div>
            </Link>
          </div>
        </div>

        <div className="relative mb-2" onClick={handleSearchFocus}>
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-[#001A94]" />
          </div>
          <div className="w-full h-12 bg-white rounded-2xl flex items-center pl-11 pr-4 shadow-xl shadow-[#001A94]/20 overflow-hidden">
            <span className="text-[#001A94]/60 font-bold text-sm truncate">
              {placeholders?.[placeholderIndex] || 'Search "pizza"'}
            </span>
          </div>
          <div className="absolute inset-y-0 right-4 flex items-center pr-1 border-l border-gray-100 ml-3">
             <Mic className="h-4 w-4 text-[#001A94] ml-3" />
          </div>
        </div>


      </div>
    </header>
  );
}
