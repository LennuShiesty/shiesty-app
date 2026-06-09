import { useState } from "react";
import "./App.css";
import LuckyWheel from "./games/LuckyWheel";
import WhosNext from "./games/WhosNext";
import Jenga from "./games/Jenga";
import Psykomaija from "./games/Psykomaija";
import HerraHoo from "./games/HerraHoo";
import Hevosravit from "./games/Hevosravit";

const defaultLogo = `${import.meta.env.BASE_URL}logo2.png`;
const cigarLogo = `${import.meta.env.BASE_URL}logo-cigar.png`;

function App() {
  const [currentGame, setCurrentGame] = useState("menu");
  const [theme, setTheme] = useState("y2k");
  const logoSrc = theme === "cigar" ? cigarLogo : defaultLogo;

  return (
    <div className={`app ${theme === "cigar" ? "theme-cigar" : "theme-y2k"}`}>
      <button
        className="theme-toggle"
        onClick={() => setTheme((prev) => (prev === "y2k" ? "cigar" : "y2k"))}
      >
        Teema: {theme === "cigar" ? "Sikarihuone" : "Y2K"}
      </button>
      {currentGame === "menu" && (
        <div className="menu">
          <div className="menu-logo-topleft">
            <img src={logoSrc} alt="Shiesty Games logo" />
          </div>

          <div className="menu-hero">
            <div className="menu-logo-large">
              <img src={logoSrc} alt="Shiesty Games logo" />
            </div>

            <p className="menu-presents">Presents</p>
            <h1 className="menu-title">
              <span>Shiesty's</span>
              <span>Shenanigans</span>
            </h1>
          </div>

          <button onClick={() => setCurrentGame("luckywheel")}>Luckywheel</button>

          <button onClick={() => setCurrentGame("whosnext")}>Who&apos;s Next</button>

          <button onClick={() => setCurrentGame("jenga")}>Jenga</button>

          <button onClick={() => setCurrentGame("psykomaija")}>Psykomaija</button>

          <button onClick={() => setCurrentGame("herrahoo")}>Herra Hoo</button>

          <button onClick={() => setCurrentGame("hevosravit")}>Ravit</button>

          <button
            className="copyright-link"
            onClick={() => setCurrentGame("copyright")}
          >
            © ShiestyGames
          </button>
        </div>
      )}

      {currentGame === "luckywheel" && (
        <LuckyWheel onBack={() => setCurrentGame("menu")} />
      )}

      {currentGame === "whosnext" && (
        <WhosNext onBack={() => setCurrentGame("menu")} />
      )}

      {currentGame === "jenga" && (
        <Jenga onBack={() => setCurrentGame("menu")} theme={theme} />
      )}

      {currentGame === "psykomaija" && (
        <Psykomaija onBack={() => setCurrentGame("menu")} />
      )}

      {currentGame === "herrahoo" && (
        <HerraHoo onBack={() => setCurrentGame("menu")} />
      )}

      {currentGame === "hevosravit" && (
        <Hevosravit onBack={() => setCurrentGame("menu")} />
      )}

      {currentGame === "copyright" && (
        <div className="copyright-page">
          <button className="copyright-back" onClick={() => setCurrentGame("menu")}>Takaisin</button>
          <div className="copyright-card">
            <h1>© ShiestyGames</h1>
            <p className="copyright-lead">
              Welcome to the goofy-ahh party experience
            </p>
            <p>
              This app is created by ShiestyGames, designed for fast mobile party play (and for occasional heavy drinking)
            </p>
            <p>
              All games, rules, and visual design are proprietary to ShiestyGames. Enjoy your shiestytime!
            </p>
            <p className="copyright-signature">
              — CEO LennuShiesty
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;