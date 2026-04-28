import { useState } from "react";
import "./App.css";
import LuckyWheel from "./games/LuckyWheel";

function App() {
  const [currentGame, setCurrentGame] = useState("menu");

  return (
    <div className="app">
      {currentGame === "menu" && (
        <div className="menu">
          <h1>Seurapelit</h1>
          <p>Valitse peli</p>

          <button onClick={() => setCurrentGame("luckywheel")}>
            Luckywheel
          </button>

          <button disabled>Who's Next tulossa myöhemmin</button>
        </div>
      )}

      {currentGame === "luckywheel" && (
        <LuckyWheel onBack={() => setCurrentGame("menu")} />
      )}
    </div>
  );
}

export default App;