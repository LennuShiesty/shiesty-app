import { useEffect, useMemo, useState } from "react";
import "./Jenga.css";
import jengaLogo from "./jenga/jengaLogo2.png";
import shiestyLogo from "./jenga/logo2.png";

const JENGA_DATA = {
  HC: [
    "Shotti", "Shotti", "Mysteerishotti", "Mysteerishotti", "Kasari :D", "Ota uusi palikka",
    "Ota uusi palikka", "Ota uusi palikka", "Uusi palikka heikolla kädellä", "Uusi palikka heikolla kädellä",
    "Sääntö", "Sääntö", "Sääntö", "Suunnanmuutos", "Suunnanmuutos", "Kategoria", "Kategoria",
    "Kategoria", "1,2,3,...", "1,2,3,...", "1,2,3,...", "Skål! Kaikki juo 1", "Kunkkumuki 1/3",
    "Kunkkumuki 2/3", "Kunkkumuki 3/3", "Vesiputous", "Vesiputous", "Vesiputous", "<-- juo 3",
    "<-- juo 3", "juo 3 -->", "juo 3 -->", "Anna 3", "Anna 3", "Anna 3", "Ota 3",
    "Ota 3", "Jaa 10", "Jaa 10", "Jaa 10", "K.P.S - Häviäjä juo 3", "K.P.S - Häviäjä juo 3",
    "K.P.S - Häviäjä juo 3", "Kippis! Kaikki juo 3", "Pelin lyhin juo", "Pelin pisin juo",
    "Suppilo :D", "Suppilo :D", "Suppilo :D", "Pelin vanhin jakaa 5", "Pelin nuorin jakaa 5"
  ],
  Sosiaalinen: [
    "Ota uusi palikka", "Ota uusi palikka", "Ota uusi palikka", "Paikkojen vaihto!",
    "Paikkojen vaihto!", "Paikkojen vaihto!", "Kategoria", "Kategoria", "Kategoria",
    "Kategoria", "Sääntö", "Sääntö", "Sääntö", "Väärä käsi (3 kierrosta)", "Väärä käsi (3 kierrosta)",
    "Väärä käsi (3 kierrosta)", "Mykkä (3 kierrosta)", "Mykkä (3 kierrosta)", "Mykkä (3 kierrosta)",
    "K.P.S - Häviäjä juo 3", "K.P.S - Häviäjä juo 3", "K.P.S - Häviäjä juo 3", "Jätkät juo",
    "Mimmit juo", "Sinkut juo", "Varatut juo", "Vaihda biisi", "Vaihda biisi", "Vaihda biisi",
    "Mielipide split", "Mielipide split", "Mielipide split", "Kuka viimeksi...",
    "Kuka viimeksi...", "Kuka viimeksi...", "Äänestys (Esim. Kuka todennäköisemmin)",
    "Äänestys (Esim. Kuka todennäköisemmin)", "Äänestys (Esim. Kuka todennäköisemmin)",
    "Nuorin jakaa 5", "Vanhin jakaa 5", "Pisin jakaa 5", "Lyhin jakaa 5", "Suunnanmuutos",
    "Suunnanmuutos", "Suunnanmuutos", "Toast!", "Toast!", "Hyräile: voittaja jakaa 10",
    "Hyräile: voittaja jakaa 10", "Skål!", "Mysteerishotti"
  ],
  Mixed: [
    "Ota uusi palikka", "Paikkojen vaihto", "Kategoria", "Sääntö",
    "Jätkät juo 3", "Mimmit juo 3", "Sinkut juo 3", "Varatut juo 3",
    "Selvin juo 3", "Humalaisin skippaa", "Mielipide split", "Kuka viimeksi..?",
    "Kuka todennäköisemmin?", "Vesiputous", "Nuorin jakaa 5", "Vanhin jakaa 5",
    "Lyhin jakaa 5", "Pisin jakaa 5", "Toast!", "Skål!",
    "Jaa 10", "Shotti", "Mysteerishotti", "Suunnanmuutos",
    "1,2,3,...", "Suppilo :DD", "Vaihda biisi", "Ota uusi heikommalla kädellä",
    "Ota ryhmäkuva", "Anna 3", "Ota 5",
    "Sääntö", "Opiskelijat juo", "Työlliset juo",
    "Työttömät juo", "En ole koskaan..", "Eetsi-papan myrkky ;)",
    "Orja / Huora", "K.P.S - Voittaja jakaa 5",
    "Juo 10, jos etunimi alkaa S ja sukunimi R", "Röökaajat juo 5",
    "Imitoi jotain!", "Alle 26v juo 3", "Yli 26v juo 3",
    "Lomota tyhjäks", "Lemmikin omistajat juo 3",
    "Kuva perheryhmään tms.!", "Soita kaverille!",
    "Pohjoisimmasta kotoisin juo 4", "Eteläisimmästä kotoisin juo 4",
    "Kaada torni"
  ]
};

const allNumbers = Array.from({ length: 51 }, (_, index) => index + 1);
const categories = ["HC", "Sosiaalinen", "Mixed"];

function Jenga({ onBack, theme }) {
  const [mode, setMode] = useState("HC");
  const [selectedNumbers, setSelectedNumbers] = useState(new Set());
  const [activeTask, setActiveTask] = useState(null);

  useEffect(() => {
    resetGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const resetGame = () => {
    setSelectedNumbers(new Set());
    setActiveTask(null);
  };

  const showTask = (number) => {
    if (selectedNumbers.has(number)) {
      return;
    }

    const nextSet = new Set(selectedNumbers);
    nextSet.add(number);
    setSelectedNumbers(nextSet);

    setActiveTask({
      number,
      text: JENGA_DATA[mode][number - 1] || "Ei tehtävää"
    });
  };

  const chooseRandom = () => {
    const remaining = allNumbers.filter((num) => !selectedNumbers.has(num));
    if (remaining.length === 0) {
      window.alert("Kaikki tehtävät on jo valittu!");
      return;
    }

    const randomNumber = remaining[Math.floor(Math.random() * remaining.length)];
    showTask(randomNumber);
  };

  const themeClass = theme === "cigar" ? "theme-cigar" : "theme-y2k";

  return (
    <div className={`jenga-screen ${themeClass}`}>
      <img className="jenga-top-logo" src={shiestyLogo} alt="Shiesty Games logo" />
      <img className="jenga-logo" src={jengaLogo} alt="Jenga logo" />

      <div className="jenga-controls">
        <div className="jenga-mode">
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            aria-label="Valitse Jenga-kategoria"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <div className="jenga-action-buttons">
            <button onClick={resetGame}>Nollaa peli</button>
            <button onClick={chooseRandom}>Satunnainen</button>
          </div>
        </div>
      </div>

      <div className="jenga-number-grid" role="grid" aria-label="Jenga numeronapit">
        {allNumbers.map((number) => (
          <button
            key={number}
            className={`jenga-number ${selectedNumbers.has(number) ? "selected" : ""}`}
            onClick={() => showTask(number)}
            disabled={selectedNumbers.has(number)}
          >
            {number}
          </button>
        ))}
      </div>

      <div className="jenga-task-area">
        {activeTask ? (
          <div className="jenga-task-card">
            <div className="jenga-task-number">{activeTask.number}</div>
            <div className="jenga-task-text">{activeTask.text}</div>
          </div>
        ) : (
          <div className="jenga-task-placeholder">
            Valitse numero nähdäksesi Jenga-tehtävän.
          </div>
        )}
      </div>

      <button className="jenga-back" onClick={onBack}>
        Takaisin
      </button>
    </div>
  );
}

export default Jenga;
