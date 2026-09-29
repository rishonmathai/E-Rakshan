import React from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppProvider, useApp } from "./context/AppContext";
import Layout from "./components/common/Layout";
import Toast from "./components/common/Toast";
import Splash from "./pages/Splash/Splash";
import Onboarding from "./pages/Onboarding/Onboarding";
import Login from "./pages/Auth/Login";
import Home from "./pages/Home/Home";
import MapPage from "./pages/Map/MapPage";
import NavigationPage from "./pages/Navigation/Navigation";
import Alerts from "./pages/Alerts/Alerts";
import Shelters from "./pages/Shelters/Shelters";
import SOS from "./pages/Emergency/SOS";
import Offline from "./pages/Offline/Offline";
import Guidelines from "./pages/Guidelines/Guidelines";
import Profile from "./pages/Profile/Profile";
import Voice from "./pages/Voice/Voice";
import Weather from "./pages/Weather/Weather";
import Family from "./pages/Family/Family";
import FamilyShare from "./pages/Family/FamilyShare";

function Protected({ children }) {
  const { store } = useApp();
  return store.authenticated ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const location = useLocation();
  const bare = ["/", "/onboarding", "/login", "/family-share"].includes(location.pathname);
  return <>{bare ? <Routes>
    <Route path="/" element={<Splash/>}/>
    <Route path="/onboarding" element={<Onboarding/>}/>
    <Route path="/login" element={<Login/>}/>
    <Route path="/family-share" element={<FamilyShare/>}/>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes> : <Layout><Routes>
    <Route path="/weather" element={<Protected><Weather/></Protected>}/>
    <Route path="/home" element={<Protected><Home/></Protected>}/>
    <Route path="/map" element={<Protected><MapPage/></Protected>}/>
    <Route path="/navigation" element={<Protected><NavigationPage/></Protected>}/>
    <Route path="/voice" element={<Protected><Voice/></Protected>}/>
    <Route path="/alerts" element={<Protected><Alerts/></Protected>}/>
    <Route path="/shelters" element={<Protected><Shelters/></Protected>}/>
    <Route path="/sos" element={<Protected><SOS/></Protected>}/>
    <Route path="/offline" element={<Protected><Offline/></Protected>}/>
    <Route path="/guidelines" element={<Protected><Guidelines/></Protected>}/>
    <Route path="/profile" element={<Protected><Profile/></Protected>}/>
    <Route path="/family" element={<Protected><Family/></Protected>}/>
    <Route path="*" element={<Navigate to="/home" replace/>}/>
  </Routes></Layout>}<Toast/></>;
}

export default function App() { return <AppProvider><AppRoutes/></AppProvider>; }
