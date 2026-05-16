import { useEffect, useMemo, useRef, useState } from "react";
import "./Psykomaija.css";

const initialPlayers = [
  { id: 1, name: "Pelaaja 1", bestScore: null, attemptsUsed: 0, rolls: [] },
  { id: 2, name: "Pelaaja 2", bestScore: null, attemptsUsed: 0, rolls: [] },
  { id: 3, name: "Pelaaja 3", bestScore: null, attemptsUsed: 0, rolls: [] },
];

const defaultPenalty = "3 huikkaa";


const PSYKOMAJA_ORDER = [
  "66",
  "55",
  "44",
  "33",
  "22",
  "11",
  "65",
  "64",
  "63",
  "62",
  "61",
  "54",
  "53",
  "52",
  "51",
  "43",
  "42",
  "41",
  "32",
  "31",
  "21",
];

const scoreRankLookup = Object.fromEntries(
  PSYKOMAJA_ORDER.map((score, index) => [score, PSYKOMAJA_ORDER.length - index])
);

function formatScoreValue(d1, d2) {
  const [high, low] = d1 > d2 ? [d1, d2] : [d2, d1];
  return `${high}${low}`;
}

function scoreRank(score) {
  return scoreRankLookup[score] ?? 0;
}

function compareScores(a, b) {
  if (a === b) return 0;
  return scoreRank(a) > scoreRank(b) ? 1 : -1;
}

function getScoreLabel(score) {
  return score || "-";
}

const DIE_PIPS = {
  1: [0,0,0,0,1,0,0,0,0],
  2: [1,0,0,0,0,0,0,0,1],
  3: [1,0,0,0,1,0,0,0,1],
  4: [1,0,1,0,0,0,1,0,1],
  5: [1,0,1,0,1,0,1,0,1],
  6: [1,0,1,1,0,1,1,0,1],
};

function renderDie(value) {
  const pips = DIE_PIPS[value] || DIE_PIPS[1];
  return (
    <div className="dice-box" aria-label={`Noppa ${value}`}>
      {pips.map((active, index) => (
        <span key={index} className={`dice-dot ${active ? "active" : ""}`} />
      ))}
    </div>
  );
}

function rollDice() {
  const d1 = Math.floor(Math.random() * 6) + 1;
  const d2 = Math.floor(Math.random() * 6) + 1;
  const score = formatScoreValue(d1, d2);
  return {
    d1,
    d2,
    score,
    label: `${d1} + ${d2} → ${score}`,
  };
}

function findNextPlayer(players, currentIndex, starterIndex) {
  const playerCount = players.length;
  if (playerCount <= 2) {
    return null;
  }

  let nextIndex = (currentIndex + 1) % playerCount;
  if (nextIndex === starterIndex) {
    return null;
  }

  return nextIndex;
}

function Psykomaija({ onBack }) {
  const [players, setPlayers] = useState(initialPlayers);
  const [nextPlayerId, setNextPlayerId] = useState(4);
  const [starterIndex, setStarterIndex] = useState(0);
  const [penalty, setPenalty] = useState(defaultPenalty);
  const [phase, setPhase] = useState("setup");
  const [starterRollCount, setStarterRollCount] = useState(0);
  const [starterFinalRoll, setStarterFinalRoll] = useState(null);
  const [playerAttemptsAllowed, setPlayerAttemptsAllowed] = useState(1);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(null);
  const [latestRoll, setLatestRoll] = useState(null);
  const [pendingRoll, setPendingRoll] = useState(null);
  const [message, setMessage] = useState("");
  const [losers, setLosers] = useState([]);
  const [isRolling, setIsRolling] = useState(false);
  const [spinningDice, setSpinningDice] = useState({ d1: 1, d2: 1 });
  const [showHelp, setShowHelp] = useState(false);
  const autoAdvanceTimeoutRef = useRef(null);
  const spinIntervalRef = useRef(null);

  const validSetup = players.length >= 2 && penalty.trim().length > 0;

  const currentPlayer = players[currentPlayerIndex] || null;
  const playerOrdered = useMemo(
    () => players.map((player, index) => ({ ...player, index })),
    [players]
  );

  function updatePlayerName(id, value) {
    setPlayers((prev) => prev.map((player) => (player.id === id ? { ...player, name: value } : player)));
  }

  function addPlayer() {
    setPlayers((prev) => [
      ...prev,
      { id: nextPlayerId, name: `Pelaaja ${prev.length + 1}`, bestScore: null, attemptsUsed: 0, rolls: [] },
    ]);
    setNextPlayerId((prev) => prev + 1);
  }

  function removePlayer(id) {
    setPlayers((prev) => {
      const updated = prev.filter((player) => player.id !== id);
      if (updated.length === 0) {
        setStarterIndex(0);
      } else if (starterIndex >= updated.length) {
        setStarterIndex(updated.length - 1);
      }
      return updated;
    });
  }

  function startGame() {
    if (!validSetup) return;
    clearAutoAdvance();

    setPlayers((prev) =>
      prev.map((player) => ({ ...player, bestScore: null, attemptsUsed: 0, rolls: [] }))
    );
    setStarterRollCount(0);
    setStarterFinalRoll(null);
    setPlayerAttemptsAllowed(1);
    setCurrentPlayerIndex(null);
    setLatestRoll(null);
    setLosers([]);
    setPhase("starterRolling");
    setMessage("Aloita heittämällä. Valitse 1–3 yritystä.");
  }

  function finishStarterRoll(finalRoll, rollCount) {
    setStarterFinalRoll(finalRoll);
    setPlayers((prev) =>
      prev.map((player, index) =>
        index === starterIndex
          ? { ...player, bestScore: finalRoll.score, attemptsUsed: rollCount, rolls: [finalRoll] }
          : { ...player, bestScore: null, attemptsUsed: 0, rolls: [] }
      )
    );
    setPlayerAttemptsAllowed(rollCount);

    const nextIndex = findNextPlayer(players, starterIndex, starterIndex);
    setCurrentPlayerIndex(nextIndex);
    setPhase("playerRolling");
    setMessage(`Aloittaja valitsi ${finalRoll.score}. Muilla on ${rollCount} yritystä.`);
    setLatestRoll(null);
  }

  function handleStarterRoll() {
    if (phase !== "starterRolling") return;
    clearAutoAdvance();

    const roll = rollDice();
    const nextCount = starterRollCount + 1;

    setPendingRoll(roll);
    setLatestRoll(null);
    setStarterRollCount(nextCount);
    setIsRolling(true);
    setMessage("Heitetään noppaa...");

    startSpinAnimation(roll.d1, roll.d2, () => {
      setLatestRoll(roll);
      setPendingRoll(null);
      const statusText = `Heitto ${nextCount}/3: ${roll.label}.`;
      if (nextCount >= 3) {
        setMessage(`${statusText} Viimeinen heitto. Siirrytään seuraaviin pelaajiin...`);
        autoAdvanceTimeoutRef.current = setTimeout(() => finishStarterRoll(roll, nextCount), 700);
      } else {
        setMessage(`${statusText} Voit pitää tai heittää uudestaan.`);
      }
    });
  }

  function handleStarterKeep() {
    if (!latestRoll || isRolling || phase !== "starterRolling") return;
    clearAutoAdvance();
    finishStarterRoll(latestRoll, starterRollCount);
  }

  function moveToNextPlayer(currentIndex) {
    const nextIndex = findNextPlayer(players, currentIndex, starterIndex);
    if (nextIndex === null) {
      concludeRound();
      return;
    }

    setCurrentPlayerIndex(nextIndex);
    setLatestRoll(null);
    setMessage(`Seuraava: ${players[nextIndex].name}.`);
  }

  function handlePlayerRoll() {
    if (phase !== "playerRolling" || !currentPlayer) return;
    clearAutoAdvance();

    const roll = rollDice();
    setPendingRoll(roll);
    setLatestRoll(null);
    setIsRolling(true);

    startSpinAnimation(roll.d1, roll.d2, () => {
      setLatestRoll(roll);
      setPendingRoll(null);
      setPlayers((prev) =>
        prev.map((player, index) => {
          if (index !== currentPlayerIndex) return player;

          const better = !player.bestScore || compareScores(roll.score, player.bestScore) > 0;
          return {
            ...player,
            bestScore: better ? roll.score : player.bestScore,
            attemptsUsed: player.attemptsUsed + 1,
            rolls: [...player.rolls, roll],
          };
        })
      );

      const nextAttempt = currentPlayer.attemptsUsed + 1;
      const remaining = playerAttemptsAllowed - nextAttempt;
      if (remaining <= 0) {
        setMessage(`Viimeinen yritys käytetty. Siirrytään seuraavaan...`);
        autoAdvanceTimeoutRef.current = setTimeout(() => moveToNextPlayer(currentPlayerIndex), 700);
      } else {
        setMessage(`Heitto ${nextAttempt}/${playerAttemptsAllowed}: ${roll.label}. Voit yrittää vielä ${remaining} kertaa.`);
      }
    });
  }

  function handlePlayerFinish() {
    if (phase !== "playerRolling" || !currentPlayer) return;
    if (currentPlayer.attemptsUsed === 0) {
      setMessage("Sinun on ensin heitettävä ainakin kerran.");
      return;
    }

    moveToNextPlayer(currentPlayerIndex);
  }

  function concludeRound() {
    setPhase("finished");
    setLatestRoll(null);
    setMessage("Peli päättynyt. Katso häviäjä alta.");

    const finishedPlayers = players.filter((player) => player.bestScore);
    const minRank = Math.min(...finishedPlayers.map((player) => scoreRank(player.bestScore)));
    setLosers(players.filter((player) => scoreRank(player.bestScore) === minRank));
  }

  function resetToSetup() {
    clearAutoAdvance();
    setPhase("setup");
    setStarterRollCount(0);
    setStarterFinalRoll(null);
    setPlayerAttemptsAllowed(1);
    setCurrentPlayerIndex(null);
    setLatestRoll(null);
    setMessage("");
    setLosers([]);
    setIsRolling(false);
    setPlayers((prev) => prev.map((player) => ({ ...player, bestScore: null, attemptsUsed: 0, rolls: [] })));
  }

  const standings = useMemo(() => {
    return players
      .map((player) => ({
        ...player,
        rank: player.bestScore ? scoreRank(player.bestScore) : 0,
      }))
      .sort((a, b) => b.rank - a.rank);
  }, [players]);

  useEffect(() => {
    if (!isRolling) return;
    const timeout = setTimeout(() => setIsRolling(false), 600);
    return () => clearTimeout(timeout);
  }, [isRolling]);

  useEffect(() => {
    return () => {
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
      }
      if (spinIntervalRef.current) {
        clearInterval(spinIntervalRef.current);
      }
    };
  }, []);

  function clearAutoAdvance() {
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = null;
    }
  }

  function startSpinAnimation(finalD1, finalD2, callback) {
    setSpinningDice({ d1: 1, d2: 1 });
    let spinCount = 0;
    const spinSpeed = 160;
    const spinDuration = 1280;
    const spinIterations = Math.floor(spinDuration / spinSpeed);

    if (spinIntervalRef.current) {
      clearInterval(spinIntervalRef.current);
    }

    spinIntervalRef.current = setInterval(() => {
      setSpinningDice({
        d1: Math.floor(Math.random() * 6) + 1,
        d2: Math.floor(Math.random() * 6) + 1,
      });
      spinCount++;

      if (spinCount >= spinIterations) {
        clearInterval(spinIntervalRef.current);
        spinIntervalRef.current = null;
        setSpinningDice({ d1: finalD1, d2: finalD2 });
        setIsRolling(false);
        if (callback) callback();
      }
    }, spinSpeed);
  }

  return (
    <div className="psykomaija-page">
      <button className="back-button" onClick={onBack}>
        Takaisin
      </button>

      <div className="psykomaija-header-row">
        <h1>Psyko-Maija</h1>
      </div>
      <p className="psykomaija-tagline">
        
      </p>
      <div className="help-row">
        <button className="help-toggle" onClick={() => setShowHelp((prev) => !prev)}>
          {showHelp ? "Sulje ohjeet" : "Ohjeet"}
        </button>
      </div>
      {showHelp && (
        <div className="psykomaija-rules">
          <p>Heitä noppaa ja taistele siitä, kuka juo vähiten. Aloittaja päättää yritykset, muut saavat saman määrän.</p>
          <p>Parhausjärjestys: 66, 55, 44, 33, 22, 11, 65, 64, 63, 62, 61, 54, 53, 52, 51, 43, 42, 41, 32, 31, 21.</p>
          <p>Muita tuloksia ei ole. Huonoin häviää.</p>
        </div>
      )}

      {phase === "setup" && (
        <section className="psykomaija-setup">
          <div className="setup-row">
            <label>
              Juomamäärä:
              <input
                value={penalty}
                onChange={(event) => setPenalty(event.target.value)}
                placeholder="Esim. 3 huikkaa tai 1 shotti"
              />
            </label>

            <div className="starter-select">
              <p>Valitse aloittaja:</p>
              {players.map((player, index) => (
                <label key={player.id} className="starter-option">
                  <input
                    type="radio"
                    name="starter"
                    checked={starterIndex === index}
                    onChange={() => setStarterIndex(index)}
                  />
                  {player.name}
                </label>
              ))}
            </div>
          </div>

          <div className="player-list">
            {players.map((player) => (
              <div key={player.id} className="player-row">
                <input
                  value={player.name}
                  onChange={(event) => updatePlayerName(player.id, event.target.value)}
                />
                {players.length > 2 && (
                  <button className="small-button" onClick={() => removePlayer(player.id)}>
                    Poista
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="setup-actions">
            <button onClick={addPlayer}>Lisää pelaaja</button>
            <button disabled={!validSetup} onClick={startGame}>
              Aloita psykomaija
            </button>
          </div>
        </section>
      )}

      {phase === "starterRolling" && (
        <section className="psykomaija-stage">
          <div className="stage-card">
            <p className="stage-label">Aloittaja</p>
            <h2>{players[starterIndex].name}</h2>
            <p>Yrityksiä käytetty: {starterRollCount}/3</p>
            <div className="dice-pair-container">
              <div className={`dice-pair ${isRolling ? "rolling" : ""}`}>
                {renderDie(spinningDice.d1)}
                {renderDie(spinningDice.d2)}
              </div>
            </div>
            <div className="dark-box">
              <p>{message}</p>
              {latestRoll && !isRolling && <p className="roll-result">Viimeisin: {latestRoll.label}</p>}
            </div>
            <div className="action-buttons">
              <button disabled={isRolling} onClick={handleStarterRoll}>
                {starterRollCount === 0 ? "Heitä noppia" : "Heitä uudestaan"}
              </button>
              <button
                disabled={!latestRoll || isRolling}
                onClick={handleStarterKeep}
              >
                Jää tähän
              </button>
            </div>
          </div>
        </section>
      )}

      {phase === "playerRolling" && currentPlayer && (
        <section className="psykomaija-stage">
          <div className="stage-card">
            <p className="stage-label">Pelaaja</p>
            <h2>{currentPlayer.name}</h2>
            <p>Yritykset: {currentPlayer.attemptsUsed}/{playerAttemptsAllowed}</p>
            <div className="dice-pair-container">
              <div className={`dice-pair ${isRolling ? "rolling" : ""}`}>
                {renderDie(spinningDice.d1)}
                {renderDie(spinningDice.d2)}
              </div>
            </div>
            <div className="dark-box">
              <p>{message}</p>
              {latestRoll && !isRolling && <p className="roll-result">Viimeisin: {latestRoll.label}</p>}
            </div>
            <div className="action-buttons">
              <button
                disabled={currentPlayer.attemptsUsed >= playerAttemptsAllowed || isRolling}
                onClick={handlePlayerRoll}
              >
                Heitä noppia
              </button>
              <button onClick={handlePlayerFinish}>Seuraava</button>
            </div>
          </div>

          <div className="scoreboard">
            <p className="stage-label">Pisteet tähän mennessä</p>
            {players.map((player) => (
              <div key={player.id} className="score-row">
                <span>{player.name}</span>
                <span>{getScoreLabel(player.bestScore)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {phase === "finished" && (
        <section className="psykomaija-stage finished">
          <div className="stage-card">
            <p className="stage-label">Tulokset</p>
            <h2>Häviäjä on:</h2>
            <p className="loser-text">
              {losers.map((loser) => loser.name).join(", ")} juo {penalty}.
            </p>
            <div className="scoreboard finished-list">
              {standings.map((player) => (
                <div key={player.id} className={`score-row ${losers.some((loser) => loser.id === player.id) ? "loser" : "winner"}`}>
                  <span>{player.name}</span>
                  <span>{player.bestScore || "-"}</span>
                </div>
              ))}
            </div>
            <div className="setup-actions">
              <button onClick={resetToSetup}>Uudelleen</button>
              <button onClick={onBack}>Valikkoon</button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default Psykomaija;
