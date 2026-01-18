// web/src/main.jsx
//
// PURPOSE
// -------
// Entry point for the React app.
// This is where we mount React into the <div id="root"></div> in index.html.
//
// IMPORTANT
// ---------
// We wrap <App /> in <BrowserRouter> so react-router-dom can handle routes
// like /login and /.
//
// If BrowserRouter is missing, Routes/Route will crash and you'll often see a blank page.

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);