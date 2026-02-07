import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./App.css"; // Ensure Tailwind is imported
import "@fontsource/montserrat";
import "@fontsource/poppins";


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
