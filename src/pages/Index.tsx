import { useEffect, useRef } from "react";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import Onboarding from "@/components/onboarding/Onboarding";
import LockScreen from "@/components/onboarding/LockScreen";
import HomeScreen from "@/components/screens/HomeScreen";
import BuyScreen from "@/components/screens/BuyScreen";
import MarketScreen from "@/components/screens/MarketScreen";
import SendScreen from "@/components/screens/SendScreen";
import ProfileScreen from "@/components/screens/ProfileScreen";
import WalletScreen from "@/components/screens/WalletScreen";
import SellScreen from "@/components/screens/SellScreen";
import SwapScreen from "@/components/screens/SwapScreen";
import HistoryScreen from "@/components/screens/HistoryScreen";
import ReceiveModal from "@/components/screens/ReceiveModal";
import SecurityScreen from "@/components/screens/profile/SecurityScreen";
import KycScreen from "@/components/screens/profile/KycScreen";
import NotificationsScreen from "@/components/screens/profile/NotificationsScreen";
import LanguageScreen from "@/components/screens/profile/LanguageScreen";
import LimitsScreen from "@/components/screens/profile/LimitsScreen";
import SupportScreen from "@/components/screens/profile/SupportScreen";
import LegalScreen from "@/components/screens/profile/LegalScreen";
import PayAccountsScreen from "@/components/screens/profile/PayAccountsScreen";
import AirtimeScreen from "@/components/screens/services/AirtimeScreen";
import RecurringScreen from "@/components/screens/services/RecurringScreen";
import ReferralScreen from "@/components/screens/services/ReferralScreen";
import LearnScreen from "@/components/screens/services/LearnScreen";
import TransparencyScreen from "@/components/screens/services/TransparencyScreen";
import StatusScreen from "@/components/screens/services/StatusScreen";
import { NavProvider, useNav } from "@/store/nav";
import { useApp } from "@/store/AppStore";
import { usePrices } from "@/hooks/usePrices";
import { formatMoney } from "@/lib/format";

/** Surveille les alertes de prix et notifie quand un seuil est franchi. */
function PriceAlertWatcher() {
  const { state, update } = useApp();
  const { prices, source } = usePrices();
  const notified = useRef(new Set<string>());
  useEffect(() => {
    if (source !== "live" || !state.notifications.market) return;
    const hit = state.alerts.filter((a) => {
      const p = prices[a.asset].fcfa;
      return a.direction === "above" ? p >= a.priceFCFA : p <= a.priceFCFA;
    });
    if (hit.length === 0) return;
    hit.forEach((a) => {
      if (notified.current.has(a.id)) return;
      notified.current.add(a.id);
      toast(`🔔 ${a.asset} ${a.direction === "above" ? "au-dessus de" : "en dessous de"} ${formatMoney(a.priceFCFA)}`, {
        description: `Cours actuel : ${formatMoney(prices[a.asset].fcfa)}`,
      });
    });
    update((s) => ({ ...s, alerts: s.alerts.filter((a) => !hit.some((h) => h.id === a.id)) }));
  }, [prices, source, state.alerts, state.notifications.market, update]);
  return null;
}

function Screens() {
  const { route, receive, closeReceive } = useNav();
  const screen = (() => {
    switch (route.name) {
      case "home": return <HomeScreen />;
      case "market": return <MarketScreen />;
      case "wallet": return <WalletScreen />;
      case "profile": return <ProfileScreen />;
      case "buy": return <BuyScreen initialAsset={route.asset} initialAmount={route.amount} />;
      case "send": return <SendScreen initialAsset={route.asset} />;
      case "sell": return <SellScreen initialAsset={route.asset} />;
      case "swap": return <SwapScreen initialAsset={route.asset} />;
      case "history": return <HistoryScreen />;
      case "security": return <SecurityScreen />;
      case "kyc": return <KycScreen />;
      case "notifications": return <NotificationsScreen />;
      case "language": return <LanguageScreen />;
      case "limits": return <LimitsScreen />;
      case "support": return <SupportScreen />;
      case "legal": return <LegalScreen />;
      case "accounts": return <PayAccountsScreen />;
      case "airtime": return <AirtimeScreen />;
      case "recurring": return <RecurringScreen />;
      case "referral": return <ReferralScreen />;
      case "learn": return <LearnScreen />;
      case "transparency": return <TransparencyScreen />;
      case "status": return <StatusScreen />;
    }
  })();
  return (
    <div className="dot-grid min-h-screen flex justify-center">
      <div className="relative w-full max-w-[390px] min-h-screen">
        <main key={JSON.stringify(route)}>{screen}</main>
        <BottomNav />
        {receive !== false && <ReceiveModal initialAsset={receive ?? undefined} onClose={closeReceive} />}
        <PriceAlertWatcher />
      </div>
    </div>
  );
}

const Index = () => {
  const { state, locked } = useApp();
  if (!state.user) return <Onboarding />;
  if (locked) return <LockScreen />;
  return (
    <NavProvider>
      <Screens />
    </NavProvider>
  );
};

export default Index;
