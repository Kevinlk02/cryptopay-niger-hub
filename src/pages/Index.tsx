import { useState } from "react";
import BottomNav from "@/components/BottomNav";
import HomeScreen from "@/components/screens/HomeScreen";
import BuyScreen from "@/components/screens/BuyScreen";
import MarketScreen from "@/components/screens/MarketScreen";
import SendScreen from "@/components/screens/SendScreen";
import ProfileScreen from "@/components/screens/ProfileScreen";
import WalletScreen from "@/components/screens/WalletScreen";
import ReceiveModal from "@/components/screens/ReceiveModal";
import logo from "@/assets/logo.png";


type Screen = "home" | "market" | "wallet" | "profile" | "buy" | "send";

const Index = () => {
  const [screen, setScreen] = useState<Screen>("home");
  const [showReceive, setShowReceive] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // Splash screen
  if (showSplash) {
    return (
      <div className="dot-grid min-h-screen flex items-center justify-center">
        <div className="max-w-[390px] w-full flex flex-col items-center justify-center min-h-screen">
          <img src={logo} alt="CryptoPay Niger" className="h-20 w-20 rounded-[18px] object-cover mb-6 shadow-lg" />
          <h1 className="font-urbanist font-black text-card-dark text-3xl mb-2">CryptoPay</h1>
          <p className="font-urbanist font-medium text-text-gray text-sm mb-8">Niger</p>
          <button
            onClick={() => setShowSplash(false)}
            className="press-scale w-60 h-[52px] rounded-full bg-yellow font-urbanist font-extrabold text-card-dark text-base"
          >
            Commencer
          </button>
        </div>
      </div>
    );
  }

  const handleNavigate = (target: string) => {
    if (target === "receive") {
      setShowReceive(true);
    } else {
      setScreen(target as Screen);
    }
  };

  const tabFromScreen = (): "home" | "market" | "fab" | "wallet" | "profile" => {
    if (screen === "home" || screen === "buy" || screen === "send") return "home";
    return screen as any;
  };

  const renderScreen = () => {
    switch (screen) {
      case "home": return <HomeScreen onNavigate={handleNavigate} />;
      case "buy": return <BuyScreen onBack={() => setScreen("home")} />;
      case "market": return <MarketScreen />;
      case "send": return <SendScreen onBack={() => setScreen("home")} />;
      case "wallet": return <WalletScreen />;
      case "profile": return <ProfileScreen onBack={() => setScreen("home")} />;
      default: return <HomeScreen onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="dot-grid min-h-screen flex justify-center">
      <div className="relative w-full max-w-[390px] min-h-screen">
        <div className="overflow-y-auto min-h-screen">
          {renderScreen()}
        </div>
        <BottomNav
          active={tabFromScreen()}
          onNavigate={(tab) => {
            if (tab !== "fab") setScreen(tab as Screen);
          }}
          onFab={() => setScreen("buy")}
        />
        {showReceive && <ReceiveModal onClose={() => setShowReceive(false)} />}
      </div>
    </div>
  );
};

export default Index;
