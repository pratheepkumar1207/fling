import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import RequireAuth from "./components/RequireAuth";

import SplashScreen from "./pages/auth/SplashScreen";
import LoginScreen from "./pages/auth/LoginScreen";
import OtpScreen from "./pages/auth/OtpScreen";
import HomeScreen from "./pages/home/HomeScreen";
import CreateLobbyScreen from "./pages/lobby/CreateLobbyScreen";
import JoinLobbyScreen from "./pages/lobby/JoinLobbyScreen";
import WatchPartyScreen from "./pages/party/WatchPartyScreen";
import WalletScreen from "./pages/wallet/WalletScreen";
import BuyCoinsScreen from "./pages/wallet/BuyCoinsScreen";
import CashoutScreen from "./pages/wallet/CashoutScreen";
import KycScreen from "./pages/wallet/KycScreen";
import ProfileScreen from "./pages/profile/ProfileScreen";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app-shell">
          <Routes>
            <Route path="/" element={<SplashScreen />} />
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/otp" element={<OtpScreen />} />

            <Route path="/home" element={<RequireAuth><HomeScreen /></RequireAuth>} />
            <Route path="/lobby/create" element={<RequireAuth><CreateLobbyScreen /></RequireAuth>} />
            <Route path="/lobby/join" element={<RequireAuth><JoinLobbyScreen /></RequireAuth>} />
            <Route path="/party/:roomId" element={<RequireAuth><WatchPartyScreen /></RequireAuth>} />

            <Route path="/wallet" element={<RequireAuth><WalletScreen /></RequireAuth>} />
            <Route path="/wallet/buy" element={<RequireAuth><BuyCoinsScreen /></RequireAuth>} />
            <Route path="/wallet/cashout" element={<RequireAuth><CashoutScreen /></RequireAuth>} />
            <Route path="/wallet/kyc" element={<RequireAuth><KycScreen /></RequireAuth>} />

            <Route path="/profile" element={<RequireAuth><ProfileScreen /></RequireAuth>} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
