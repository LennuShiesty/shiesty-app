import { useState } from "react";
import "./Hevosravit.css";

const SUITS = ["♠", "♥", "♦", "♣"];
const HORSE_NAMES = {
  "♠": "Pata",
  "♥": "Hertta",
  "♦": "Ruutu",
  "♣": "Risti",
};

const PLACEMENT_EMOJIS = ["🥇", "🥈", "🥉", "🏅"];

function displayRank(value) {
  if (!value) return "";
  if (value === 11) return "J";
  if (value === 12) return "Q";
  if (value === 13) return "K";
  return String(value);
}

function suitClass(suit) {
  switch (suit) {
    case "♠":
      return "spade";
    case "♥":
      return "heart";
    case "♦":
      return "diamond";
    case "♣":
      return "club";
    default:
      return "";
  }
}

function shuffle(array) {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function createDeckWithoutAces() {
  const suits = ["♠", "♥", "♦", "♣"];
  const deck = [];
  for (const s of suits) {
    for (let v = 2; v <= 13; v++) {
      deck.push({ suit: s, value: v });
    }
  }
  return shuffle(deck);
}

function Hevosravit({ onBack }) {
  const [gamePhase, setGamePhase] = useState("setup");

  const [playerCount, setPlayerCount] = useState(2);
  const [playerNames, setPlayerNames] = useState(["", ""]);
  const [players, setPlayers] = useState([]);

  const [deck, setDeck] = useState([]);
  const [checkpointCards, setCheckpointCards] = useState([]); // suits only
  const [revealedCheckpoints, setRevealedCheckpoints] = useState([]);

  const [horsePositions, setHorsePositions] = useState({});
  const [horsePlacements, setHorsePlacements] = useState({});
  const [activeHorses, setActiveHorses] = useState([]);

  const [currentCard, setCurrentCard] = useState(null);
  const [statusMessage, setStatusMessage] = useState("Aloita vedonlyönti ja valitse hevonen.");

  const [results, setResults] = useState(null);
  const [actionPopup, setActionPopup] = useState(null);
  const [pendingFinish, setPendingFinish] = useState(null);

  function ensurePlayerArray(count) {
    setPlayerNames((prev) => {
      const arr = prev.slice(0, count);
      while (arr.length < count) arr.push("");
      return arr;
    });
  }

  function startBetting() {
    const names = playerNames.slice(0, playerCount).map((n, i) => n.trim() || `Pelaaja ${i + 1}`);
    const pls = names.map((n) => ({ name: n, selectedHorse: null, bet: "" }));
    setPlayers(pls);
    setGamePhase("betting");
  }

  function updatePlayer(idx, patch) {
    setPlayers((prev) => {
      const copy = prev.slice();
      copy[idx] = { ...copy[idx], ...patch };
      return copy;
    });
  }

  function allBetsEntered() {
    return players.every((p) => p.selectedHorse && p.bet && Number(p.bet) > 0);
  }

  function startRace() {
    if (!allBetsEntered()) return;
    const newDeck = createDeckWithoutAces();
    const checkpoints = newDeck.slice(0, 8);
    const remaining = newDeck.slice(8);

    const initialPositions = {};
    SUITS.forEach((s) => (initialPositions[s] = 0));

    setDeck(remaining);
    setCheckpointCards(checkpoints);
    setRevealedCheckpoints(Array(checkpoints.length).fill(false));
    setHorsePositions(initialPositions);
    setHorsePlacements({});
    setActiveHorses(SUITS.slice());
    setCurrentCard(null);
    setStatusMessage("Kilpailu käynnissä — nosta kortteja.");
    setGamePhase("race");
  }

  function activateCheckpointIfNeeded(positions, active, revealed, checkpoints) {
    const newRevealed = revealed.slice();
    const popped = [];
    for (let i = 0; i < checkpoints.length; i++) {
      if (newRevealed[i]) continue;
      const allPassed = active.every((h) => (positions[h] || 0) > i);
      if (allPassed) {
        newRevealed[i] = true;
        const suit = checkpoints[i].suit;
        popped.push({ index: i, suit });
        if (active.includes(suit)) {
          positions[suit] = Math.max(0, (positions[suit] || 0) - 1);
        }
      }
    }
    return { positions, newRevealed, popped };
  }

  function drawNextCard() {
    if (actionPopup) return;
    if (gamePhase !== "race") return;
    if (deck.length === 0) {
      setStatusMessage("Kilpailupakka on tyhjä.");
      return;
    }
    const next = deck[0];
    const remaining = deck.slice(1);
    setDeck(remaining);
    setCurrentCard(next);
    setStatusMessage(`Nostettiin ${displayRank(next.value)}${next.suit}.`);

    setHorsePositions((prevPos) => {
      const positions = { ...prevPos };
      const suit = next.suit;
      if (activeHorses.includes(suit)) {
        positions[suit] = (positions[suit] || 0) + 1;
      }

      const finishIndex = checkpointCards.length;
      const placements = { ...horsePlacements };
      let placementCount = Object.keys(placements).length;
      const active = activeHorses.slice();
      const newlyPlaced = [];

      for (const h of SUITS) {
        if (active.includes(h) && positions[h] > finishIndex) {
          placementCount += 1;
          placements[h] = placementCount;
          newlyPlaced.push(h);
          const idx = active.indexOf(h);
          if (idx !== -1) active.splice(idx, 1);
        }
      }

      const { positions: afterPositions, newRevealed, popped } = activateCheckpointIfNeeded(positions, active, revealedCheckpoints, checkpointCards);
      setRevealedCheckpoints(newRevealed);

      if (newlyPlaced.length > 0) {
        const finishedSuit = newlyPlaced[0];
        const place = placements[finishedSuit];
        const affectedPlayers = players
          .filter((p) => p.selectedHorse === finishedSuit)
          .map((p) => {
            const bet = Number(p.bet) || 0;
            let text = "";
            if (place === 1) text = `Jaa ${bet * 2} huikkaa`;
            else if (place === 2) text = `Jaa ${bet * 1} huikkaa`;
            else if (place === 3) text = `Selvisit kuivin jaloin.`;
            else if (place === 4) text = `Juo ${Math.floor(bet / 2)} huikkaa`;
            return { name: p.name, bet, text };
          });
        setActionPopup({
          type: "placement",
          suit: finishedSuit,
          place,
          players: affectedPlayers,
          card: next,
        });
        if (Object.keys(placements).length === SUITS.length) {
          setPendingFinish(Object.entries(placements).sort((a, b) => a[1] - b[1]));
        }
      } else if (popped.length > 0) {
        setActionPopup({
          type: "checkpoint",
          index: popped[0].index,
          suit: popped[0].suit,
          card: next,
        });
      }

      setHorsePlacements(placements);
      setActiveHorses(active);

      if (!actionPopup && Object.keys(placements).length === SUITS.length && !newlyPlaced.length) {
        const placementList = Object.entries(placements).sort((a, b) => a[1] - b[1]);
        finishRace(placementList);
      }

      return afterPositions;
    });
  }

  function finishRace(placementList) {
    // placementList: [[suit, place], ...]
    const ordered = placementList.map(([suit]) => suit);
    const res = { placements: ordered };
    // calculate per-player outcomes
    const playerResults = players.map((p) => {
      const pick = p.selectedHorse;
      const bet = Number(p.bet) || 0;
      const place = Object.fromEntries(ordered.map((s, i) => [s, i + 1]))[pick];
      let text = "";
      if (place === 1) text = `Jaa ${bet * 2} huikkaa`;
      else if (place === 2) text = `Jaa ${bet * 1} huikkaa`;
      else if (place === 3) text = `Selvisit kuivin jaloin.`;
      else if (place === 4) text = `Juo ${Math.floor(bet / 2)} huikkaa`;
      return { name: p.name, pick, bet, place, text };
    });
    res.playerResults = playerResults;
    setResults(res);
    setGamePhase("results");
    setStatusMessage("Kilpailu päättyi — tulokset laskettu.");
  }

  function closePopup() {
    setActionPopup(null);
    if (pendingFinish) {
      finishRace(pendingFinish);
      setPendingFinish(null);
    }
  }

  // UI helpers
  const trackLength = Math.max(6, checkpointCards.length + 1);

  return (
    <div className="hevosravit-page">
      <button className="back-button" onClick={onBack}>Takaisin</button>
      <div className="hevosravit-card">
        <h1>Ravit</h1>

        {gamePhase === "setup" && (
          <div className="setup">
            <label>
              Pelaajien lukumäärä
              <input type="number" min="2" max="8" value={playerCount} onChange={(e) => { const v = Math.max(2, Math.min(8, Number(e.target.value || 2))); setPlayerCount(v); ensurePlayerArray(v); }} />
            </label>
            <div className="player-names">
              {Array.from({ length: playerCount }).map((_, i) => (
                <label key={i}>
                  Nimi #{i + 1}
                  <input value={playerNames[i] || ""} onChange={(e) => setPlayerNames((prev) => { const copy = prev.slice(); copy[i] = e.target.value; return copy; })} />
                </label>
              ))}
            </div>
            <div className="actions">
              <button onClick={startBetting}>Aloita vedonlyönti</button>
            </div>
          </div>
        )}

        {gamePhase === "betting" && (
          <div className="betting">
            <h2>Vedonlyönti</h2>
            <div className="horses-row">
              {SUITS.map((s) => (
                <div key={s} className="horse-card">
                  <div className={`suit ${s === "♥" || s === "♦" ? "red" : "dark"}`}>{s}</div>
                  <div className="horse-name">{HORSE_NAMES[s]}</div>
                </div>
              ))}
            </div>

            <div className="players-bets">
              {players.map((p, i) => (
                <div key={i} className="player-bet">
                  <div className="player-name">{p.name}</div>
                  <select value={p.selectedHorse || ""} onChange={(e) => updatePlayer(i, { selectedHorse: e.target.value })}>
                    <option value="">Valitse hevonen</option>
                    {SUITS.map((s) => <option key={s} value={s}>{HORSE_NAMES[s]} {s}</option>)}
                  </select>
                  <input type="number" min="1" placeholder="Panos" value={p.bet} onChange={(e) => updatePlayer(i, { bet: e.target.value })} />
                </div>
              ))}
            </div>

            <div className="bet-summary">
              <button disabled={!allBetsEntered()} onClick={startRace}>Aloita kilpailu</button>
              <p className="reminder">Kaikki juovat nyt puolet omasta panoksestaan.</p>
            </div>
          </div>
        )}

        {gamePhase === "race" && (
          <div className="race-view">
            <div className="race-top">
              <div className="last-card">
                <div className="label">Viimeksi nostettu kortti</div>
                <div className={`card-visual ${currentCard ? suitClass(currentCard.suit) : ""}`} role="img" aria-label={currentCard ? `${displayRank(currentCard.value)} ${currentCard.suit}` : "Ei korttia"}>
                  <div className="corner corner-top-left">
                    <span className="corner-rank">{currentCard ? displayRank(currentCard.value) : ""}</span>
                    <span className="corner-suit">{currentCard ? currentCard.suit : ""}</span>
                  </div>
                  <img className="card-logo" src={`${import.meta.env.BASE_URL}korttiShiesty.png`} alt="logo" />
                  <div className="corner corner-bottom-right">
                    <span className="corner-rank">{currentCard ? displayRank(currentCard.value) : ""}</span>
                    <span className="corner-suit">{currentCard ? currentCard.suit : ""}</span>
                  </div>
                </div>
                <div className="remaining">Jäljellä: {deck.length}</div>
                <div className="status-message">{statusMessage}</div>
              </div>
              <div className="controls">
                <button onClick={drawNextCard} disabled={!!actionPopup}>Seuraava kortti</button>
              </div>
            </div>

            <div className="race-track">
              {SUITS.map((s) => {
                const pos = horsePositions[s] || 0;
                const placed = horsePlacements[s];
                return (
                  <div className={`lane ${placed === 1 ? "gold" : placed === 2 ? "silver" : placed === 3 ? "bronze" : ""} ${actionPopup?.type === "checkpoint" && actionPopup?.suit === s ? "back-push" : ""}`} key={s}>
                    <div className="lane-header">{placed ? PLACEMENT_EMOJIS[placed - 1] : ""}</div>
                    <div className="maali">MAALI</div>
                    {Array.from({ length: trackLength }).map((_, rowIndex) => {
                      const displayRow = trackLength - rowIndex - 1;
                      const hasHorse = displayRow === pos;
                      return (
                        <div key={rowIndex} className={`cell ${hasHorse ? "horse" : ""}`}>
                          {hasHorse ? <span className="horse-emoji">🏇</span> : null}
                        </div>
                      );
                    })}
                    <div className={`lane-footer ${s === "♥" || s === "♦" ? "red" : "dark"}`}>{s} {HORSE_NAMES[s]}</div>
                  </div>
                );
              })}
            </div>

            <div className="side-panel">
              <div className="checkpoints">
                <h3>Checkpointit</h3>
                {checkpointCards.map((c, i) => (
                  <div
                    key={i}
                    className={`checkpoint ${revealedCheckpoints[i] ? "revealed" : "hidden"} ${c.suit === "♥" || c.suit === "♦" ? "red" : "dark"} ${actionPopup?.type === "checkpoint" && actionPopup?.index === i ? "popped" : ""}`}
                  >
                    {revealedCheckpoints[i] ? `${displayRank(c.value)}${c.suit}` : "Piilotettu"}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {gamePhase === "results" && results && (
          <div className="results">
            <h2>Tulokset</h2>
            <div className="placements">
              {results.placements.map((s, i) => (
                <div key={s} className="placement">{["🥇","🥈","🥉","🏅"][i]} {HORSE_NAMES[s]} {s}</div>
              ))}
            </div>

            <div className="player-results">
              {results.playerResults.map((r) => (
                <div key={r.name} className="player-result">
                  <div className="pr-name">{r.name} ({HORSE_NAMES[r.pick]}):</div>
                  <div className="pr-text">{r.text}</div>
                </div>
              ))}
            </div>

            <div className="actions">
              <button onClick={() => window.location.reload()}>Aloita uusi peli</button>
            </div>
          </div>
        )}
      </div>
      {actionPopup && (
        <div className="popup-overlay" onClick={closePopup}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">{actionPopup.type === "checkpoint" ? "Checkpoint!" : "Maaliin tulleen hevosen tulos"}</div>
            <div className="popup-body">
              <div className="popup-card-block">
                <div className={`card-visual small ${suitClass(actionPopup.card.suit)}`}>
                  <div className="corner corner-top-left">
                    <span className="corner-rank">{displayRank(actionPopup.card.value)}</span>
                    <span className="corner-suit">{actionPopup.card.suit}</span>
                  </div>
                  <img className="card-logo" src={`${import.meta.env.BASE_URL}korttiShiesty.png`} alt="logo" />
                  <div className="corner corner-bottom-right">
                    <span className="corner-rank">{displayRank(actionPopup.card.value)}</span>
                    <span className="corner-suit">{actionPopup.card.suit}</span>
                  </div>
                </div>
              </div>
              <div className="popup-text-block">
                {actionPopup.type === "checkpoint" ? (
                  <>
                    <div>Nousi checkpointiin: {displayRank(actionPopup.card.value)}{actionPopup.card.suit}</div>
                    <div className="popup-warning">{HORSE_NAMES[actionPopup.suit]} {actionPopup.suit} joutui taaksepäin.</div>
                  </>
                ) : (
                  <>
                    <div>{HORSE_NAMES[actionPopup.suit]} {actionPopup.suit} sijoittui sijalle {actionPopup.place}.</div>
                    {actionPopup.players.length > 0 ? (
                      <div className="popup-player-list">
                        {actionPopup.players.map((p) => (
                          <div key={p.name} className="popup-player-line">
                            <strong>{p.name}</strong>: {p.text}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div>Kenelläkään ei ollut valittuna tätä hevosta.</div>
                    )}
                  </>
                )}
              </div>
            </div>
            <button className="popup-close" onClick={closePopup}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Hevosravit;
