import { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import HomePage from "./Home.jsx";
import "./App.css";
import SingleplayerStartPage from "./SingleStart.jsx";
import MultiplayerStartPage from "./MultiStart.jsx";
import MultiplayerStartPageLocal from "./MultiStartLocal.jsx";
import MultiplayerStartPageOnline from "./MultiStartOnline.jsx";
import LoginPage from "./Login.jsx";
import SignUpPage from "./SignUp.jsx";
import ConfirmationPage from "./Confirmation.jsx";
import SingleGamePage from "./SinglePlayerGameScreen.jsx";

function App() {
  const [count, setCount] = useState(0);

  return (
    <Router>
      <Routes>
        <Route exact path="/" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/singleplayerstart" element={<SingleplayerStartPage />} />
        <Route path="/multiplayerstart" element={<MultiplayerStartPage />} />
        <Route path="/multiplayerstartlocal" element={<MultiplayerStartPageLocal />} />
        <Route path="/multiplayerstartonline" element={<MultiplayerStartPageOnline />} />
        <Route path="/confirmation" element={<ConfirmationPage />} />
        <Route path="/singleplayer" element={<SingleGamePage />} />
      </Routes>
    </Router>
  );
}

export default App;

