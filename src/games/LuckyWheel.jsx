import { useEffect, useRef, useState } from "react";
import "./LuckyWheel.css";

const defaultTasks = [
  "Juo 3",
  "Vesiputous",
  "Kategoria",
  "Jätkät juo",
  "Mimmit juo",
  "En ole koskaan",
  "Sääntö",
  "Shotti",
  "Kippistä 3",
  "Vaatekappale pois",
  "Lomota",
  "Freezone",
];

const spinDuration = 4200;

function LuckyWheel({ onBack }) {
  const [tasks, setTasks] = useState(defaultTasks);
  const [rotation, setRotation] = useState(0);
  const [selectedTask, setSelectedTask] = useState("");
  const [winningIndex, setWinningIndex] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editText, setEditText] = useState("");
  const [showTasks, setShowTasks] = useState(false);

  const clickIntervalRef = useRef(null);

  useEffect(() => {
    const savedTasks = localStorage.getItem("luckywheel-tasks");

    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("luckywheel-tasks", JSON.stringify(tasks));
  }, [tasks]);

  function playClickSound() {
    const click = new Audio("/sounds/click.mp3");
    click.volume = 0.35;
    click.currentTime = 0;
    click.play().catch(() => {});
  }

  function startClickClack() {
    let speed = 70;

    clickIntervalRef.current = setInterval(() => {
      playClickSound();
    }, speed);

    setTimeout(() => {
      if (clickIntervalRef.current) {
        clearInterval(clickIntervalRef.current);
      }

      clickIntervalRef.current = setInterval(() => {
        playClickSound();
      }, 140);
    }, spinDuration - 1500);
  }

  function stopClickClack() {
    if (clickIntervalRef.current) {
      clearInterval(clickIntervalRef.current);
      clickIntervalRef.current = null;
    }
  }

  function spinWheel() {
    if (isSpinning) return;

    const spinMusic = new Audio("/sounds/spin-music.mp3");
    spinMusic.currentTime = 0;
    spinMusic.volume = 0.7;
    spinMusic.play().catch(() => {});

    setIsSpinning(true);
    setSelectedTask("");
    setWinningIndex(null);

    startClickClack();

    const sectorCount = tasks.length;
    const sectorAngle = 360 / sectorCount;

    const randomIndex = Math.floor(Math.random() * sectorCount);
    const extraSpins = (6 + Math.floor(Math.random() * 5)) * 360;

    const finalRotation =
      extraSpins + (360 - randomIndex * sectorAngle) - sectorAngle / 2;

    setRotation((prevRotation) => prevRotation + finalRotation);

    setTimeout(() => {
      spinMusic.pause();
      spinMusic.currentTime = 0;
      stopClickClack();

      setWinningIndex(randomIndex);
      setSelectedTask(tasks[randomIndex]);
      setIsSpinning(false);
    }, spinDuration);
  }

  function startEditing(index) {
    setEditingIndex(index);
    setEditText(tasks[index]);
  }

  function saveEdit() {
    if (editingIndex === null) return;

    const updatedTasks = [...tasks];
    updatedTasks[editingIndex] = editText || "Tyhjä tehtävä";

    setTasks(updatedTasks);
    setEditingIndex(null);
    setEditText("");
  }

  const sectorAngle = 360 / tasks.length;

  return (
    <div className="luckywheel-page">
      <button className="back-button" onClick={onBack}>
        Takaisin
      </button>

      <h1>Luckywheel</h1>
      <p>Pyöräytä ja anna kohtalon päättää.</p>

      <div className={`wheel-area ${winningIndex !== null ? "winner-mode" : ""}`}>
        <div className="pointer">▼</div>

        <div
          className="wheel"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: `transform ${
              spinDuration / 1000
            }s cubic-bezier(0.12, 0.75, 0.16, 1)`,
          }}
        >
          {winningIndex !== null && (
            <div
              className="winner-sector"
              style={{
                background: `conic-gradient(
                  transparent 0deg ${winningIndex * sectorAngle}deg,
                  rgba(255, 255, 255, 0.55) ${winningIndex * sectorAngle}deg ${
                  (winningIndex + 1) * sectorAngle
                }deg,
                  transparent ${(winningIndex + 1) * sectorAngle}deg 360deg
                )`,
              }}
            />
          )}

          {tasks.map((task, index) => {
            const angle = sectorAngle * index + sectorAngle / 2;

            return (
              <div
                key={index}
                className={`sector-label ${
                  winningIndex === index ? "winning-label" : ""
                }`}
                style={{
                  transform: `rotate(${angle}deg) translateY(-125px)`,
                }}
              >
                {index + 1}
              </div>
            );
          })}
        </div>
      </div>

      <button className="spin-button" onClick={spinWheel} disabled={isSpinning}>
        {isSpinning ? "Pyörii..." : "Pyöräytä"}
      </button>

      {selectedTask && (
        <div className="task-popover">
          <div className="confetti">
            {Array.from({ length: 18 }).map((_, index) => (
              <span key={index} style={{ "--i": index }} />
            ))}
          </div>

          <div className="task-card">
            <p className="task-label">Tehtävä</p>
            <h2>{selectedTask}</h2>

            <button onClick={() => setSelectedTask("")}>Sulje</button>
          </div>
        </div>
      )}

      <div className="task-list">
        <button
          className="task-toggle-button"
          onClick={() => setShowTasks(!showTasks)}
        >
          {showTasks ? "Piilota tehtävät" : "Muokkaa tehtäviä"}
        </button>

        {showTasks && (
          <div className="task-list-content">
            {tasks.map((task, index) => (
              <button
                key={index}
                className="task-button"
                onClick={() => startEditing(index)}
              >
                {index + 1}. {task}
              </button>
            ))}
          </div>
        )}
      </div>

      {editingIndex !== null && (
        <div className="edit-modal">
          <div className="edit-box">
            <h2>Muokkaa sektoria {editingIndex + 1}</h2>

            <textarea
              value={editText}
              onChange={(event) => setEditText(event.target.value)}
              rows="4"
            />

            <div className="edit-buttons">
              <button onClick={saveEdit}>Tallenna</button>

              <button
                className="cancel-button"
                onClick={() => setEditingIndex(null)}
              >
                Peruuta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LuckyWheel;