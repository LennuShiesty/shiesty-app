import { useRef, useState, useEffect } from "react";
import "./WhosNext.css";

const minFingers = 2;
const maxFingers = 5;
const joinCountdownStart = 7;
const pickCountdownStart = 3;

const taskCategories = {
  general: {
    label: "General",
    tasks: [
      "Sinä juot!",
      "Sinä selvisit! Muut juovat",
      "Vaihda paikkaa vastapäätä olevan kanssa",
      "Kerro pahin humalatilasi muisto",
      "Kerro muisto jonkun pelaajan kanssa",
      "Ota shotti",
    ],
  },

  awkward: {
    label: "Awkward",
    tasks: [
      "Kerro viimeisin viestisi",
      "Näytä viimeisin kuvasi galleriasta",
      "Kehu vasemmalla olevaa pelaajaa oudolla tavalla",
      "Kerro kenellä pelaajista on paras tyyli",
      "Lähetä viesti jollekin pelin ulkopuoliselle ja kerro, että ikävöt häntä",
      "Kerro unpopular opinion",
    ],
  },

  hcDrinking: {
    label: "HC Drinking",
    tasks: [
      "Juo 5",
      "Ota shotti",
      "Vesiputous häviäjästä vasemmalle",
      "Juo kunnes oikealla oleva sanoo stop",
      "Valitse kaksi muuta juomaan",
      "Kaikki muut laskevat kolmeen, juot sen ajan",
    ],
  },
};

function WhosNext({ onBack }) {
  const [categories, setCategories] = useState(taskCategories);
  const [selectedCategory, setSelectedCategory] = useState("general");

  const [touches, setTouches] = useState([]);
  const [joinCountdown, setJoinCountdown] = useState(null);
  const [pickCountdown, setPickCountdown] = useState(null);
  const [winner, setWinner] = useState(null);
  const [task, setTask] = useState("");
  const [gameState, setGameState] = useState("start");

  const [showEditor, setShowEditor] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newTasks, setNewTasks] = useState("");

  const touchesRef = useRef([]);
  const joinIntervalRef = useRef(null);
  const pickIntervalRef = useRef(null);

  // 🔥 LOAD localStorage
  useEffect(() => {
    const saved = localStorage.getItem("whosnext-categories");
    if (saved) {
      setCategories(JSON.parse(saved));
    }
  }, []);

  // 🔥 SAVE localStorage
  useEffect(() => {
    localStorage.setItem("whosnext-categories", JSON.stringify(categories));
  }, [categories]);

  function updateTouches(newTouches) {
    const limitedTouches = newTouches.slice(0, maxFingers);
    touchesRef.current = limitedTouches;
    setTouches(limitedTouches);
  }

  function startGame() {
    resetTimers();

    updateTouches([]);
    setWinner(null);
    setTask("");
    setGameState("joining");
    setJoinCountdown(joinCountdownStart);
    setPickCountdown(null);

    let timeLeft = joinCountdownStart;

    joinIntervalRef.current = setInterval(() => {
      timeLeft -= 1;
      setJoinCountdown(timeLeft);

      if (timeLeft === 0) {
        clearInterval(joinIntervalRef.current);

        if (touchesRef.current.length < minFingers) {
          resetGame();
          return;
        }

        startPickCountdown();
      }
    }, 1000);
  }

  function playAgain() {
    startGame();
  }

  function startPickCountdown() {
    setGameState("picking");
    setJoinCountdown(null);
    setPickCountdown(pickCountdownStart);

    let timeLeft = pickCountdownStart;

    pickIntervalRef.current = setInterval(() => {
      timeLeft -= 1;
      setPickCountdown(timeLeft);

      if (timeLeft === 0) {
        clearInterval(pickIntervalRef.current);
        pickWinner();
      }
    }, 1000);
  }

  function pickWinner() {
    const currentTouches = touchesRef.current;

    if (currentTouches.length < minFingers) {
      resetGame();
      return;
    }

    const currentTasks = categories[selectedCategory].tasks;
    const randomIndex = Math.floor(Math.random() * currentTouches.length);
    const selectedTouch = currentTouches[randomIndex];
    const randomTask =
      currentTasks[Math.floor(Math.random() * currentTasks.length)];

    setWinner(selectedTouch);
    setTask(randomTask);
    setGameState("finished");
    setPickCountdown(null);
  }

  function handlePointerDown(event) {
    if (gameState !== "joining" && gameState !== "picking") return;

    event.preventDefault();

    const alreadyExists = touchesRef.current.some(
      (touch) => touch.id === event.pointerId
    );

    if (alreadyExists) return;
    if (touchesRef.current.length >= maxFingers) return;

    const newTouch = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };

    updateTouches([...touchesRef.current, newTouch]);
  }

  function handlePointerMove(event) {
    if (gameState !== "joining" && gameState !== "picking") return;

    const updatedTouches = touchesRef.current.map((touch) => {
      if (touch.id === event.pointerId) {
        return {
          ...touch,
          x: event.clientX,
          y: event.clientY,
        };
      }

      return touch;
    });

    updateTouches(updatedTouches);
  }

  function handlePointerUp(event) {
    if (gameState !== "joining" && gameState !== "picking") return;

    const updatedTouches = touchesRef.current.filter(
      (touch) => touch.id !== event.pointerId
    );

    updateTouches(updatedTouches);
  }

  function resetTimers() {
    if (joinIntervalRef.current) clearInterval(joinIntervalRef.current);
    if (pickIntervalRef.current) clearInterval(pickIntervalRef.current);
  }

  function resetGame() {
    resetTimers();

    updateTouches([]);
    setJoinCountdown(null);
    setPickCountdown(null);
    setWinner(null);
    setTask("");
    setGameState("start");
  }

  // 🔥 CREATE CATEGORY
  function createCategory() {
    if (!newCategoryName) return;

    const tasks = newTasks
      .split("\n")
      .map((t) => t.trim())
      .filter((t) => t);

    const key = newCategoryName.toLowerCase().replace(/\s+/g, "");

    setCategories((prev) => ({
      ...prev,
      [key]: {
        label: newCategoryName,
        tasks,
      },
    }));

    setNewCategoryName("");
    setNewTasks("");
    setShowEditor(false);
  }

  return (
    <div
      className={`whosnext-page whosnext-${gameState}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onContextMenu={(event) => event.preventDefault()}
    >
      <button className="whosnext-back" onClick={onBack}>
        Takaisin
      </button>

      {gameState === "start" && (
        <div className="whosnext-start-card">
          <h1>Who&apos;s Next?</h1>

          <select
            className="category-select"
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
          >
            {Object.entries(categories).map(([key, category]) => (
              <option key={key} value={key}>
                {category.label}
              </option>
            ))}
          </select>

          <p className="category-note">
            Lisää oma kategoria ja tallenna se laitteellesi. Kirjoita yksi tehtävä per rivi.
          </p>

          <div className="button-group">
            <button onClick={startGame}>Aloita</button>
            <button className="secondary-button" onClick={() => setShowEditor(true)}>
              Luo oma kategoria
            </button>
          </div>
        </div>
      )}

      {(gameState === "joining" || gameState === "picking") && (
        <>
          <div className="big-countdown">
            {gameState === "joining" ? joinCountdown : pickCountdown}
          </div>

          <div className="finger-counter">
            {touches.length} / {maxFingers}
          </div>
        </>
      )}

      {touches.map((touch) => (
        <div
          key={touch.id}
          className="finger-dot"
          style={{
            left: touch.x,
            top: touch.y,
          }}
        />
      ))}

      {winner && (
        <>
          <div
            className="winner-dot"
            style={{
              left: winner.x,
              top: winner.y,
            }}
          />

          <div className="winner-card">
            <p className="winner-label">
              {categories[selectedCategory].label}
            </p>
            <h2>You&apos;re next!</h2>
            <p className="winner-task">{task}</p>

            <button onClick={playAgain}>Uusi kierros</button>
          </div>
        </>
      )}

      {/* 🔥 EDITOR */}
      {showEditor && (
        <div className="editor-modal">
          <div className="editor-box custom-category-box">
            <h2>Uusi kategoria</h2>

            <input
              placeholder="Kategorian nimi"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
            />

            <textarea
              placeholder="Yksi tehtävä per rivi"
              value={newTasks}
              onChange={(e) => setNewTasks(e.target.value)}
              rows={8}
            />

            <button onClick={createCategory}>Tallenna</button>
            <button className="cancel-button" onClick={() => setShowEditor(false)}>
              Peruuta
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default WhosNext;