import React from "react"
import { useNavigate } from "react-router-dom"

const logo = require("../assets/icon.png");
const HomePage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div style={{ minWidth: 260, margin: "40px auto", padding: 24, background: "#fff" }}>
      <img src={logo} alt="MetaMask Logo" style={{ width: 60, display: "block", margin: "0 auto 24px" }} />
      <h2 style={{ textAlign: "center", marginBottom: 16 }}>Welcome to MetaWallet</h2>
      <p style={{ textAlign: "center", color: "#888", marginBottom: 32 }}>
        Your gateway to the decentralized web. Manage your Ethereum wallet, view balances, and interact with dApps.
      </p>
      <button style={{
        width: "100%",
        padding: "12px 0",
        background: "#f6851b",
        color: "#fff",
        border: "none",
        borderRadius: 8,
        fontWeight: 600,
        fontSize: 16,
        cursor: "pointer",
        marginBottom: 12
      }} onClick={() => navigate("/create")}>
        Create a New Wallet
      </button>
      {/* <button style={{
        width: "100%",
        padding: "12px 0",
        background: "#f6851b",
        color: "#fff",
        border: "none",
        borderRadius: 8,
        fontWeight: 600,
        fontSize: 16,
        cursor: "pointer",
        marginBottom: 12
      }} onClick={() => navigate("/recover")}>
        Recover Wallet
      </button> */}
      <button style={{
        width: "100%",
        padding: "12px 0",
        background: "#fff",
        color: "#f6851b",
        border: "2px solid #f6851b",
        borderRadius: 8,
        fontWeight: 600,
        fontSize: 16,
        cursor: "pointer"
      }} onClick={() => navigate("/import")}>
        Import Existing Wallet
      </button>
    </div>
  );
};

export default HomePage;