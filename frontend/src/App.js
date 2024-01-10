import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "./Components/Home";
import UserFeed from "./Components/UserFeed";

import "./App.css";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/user-feed" element={<UserFeed />} />
        <Route path="*" element={<Navigate to={"/"} />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
