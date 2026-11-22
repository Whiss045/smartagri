import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./hooks/auth.hook";
import { applyAppearance, loadAppearance } from "./hooks/appearance";
import "./styles/tokens.css";
import "./styles/global.css";

// Applied BEFORE React renders, so the page never flashes the wrong theme
applyAppearance(loadAppearance());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
