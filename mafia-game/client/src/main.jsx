import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import BroadcastPage from "./pages/BroadcastPage.jsx";

const Root = window.location.pathname.startsWith("/broadcast") ? BroadcastPage : App;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
