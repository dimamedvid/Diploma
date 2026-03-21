import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary";

import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store/store";

/**
 * Кореневий React root для клієнтського застосунку.
 *
 * Застосунок обгортається в:
 * - Provider для доступу до Redux store;
 * - BrowserRouter для маршрутизації;
 * - ErrorBoundary для перехоплення runtime-помилок UI.
 */
const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <Provider store={store}>
    <BrowserRouter>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </BrowserRouter>
  </Provider>,
);