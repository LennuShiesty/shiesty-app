import { useState } from "react";
import "./HerraHoo.css";

const suits = ["♠", "♥", "♦", "♣"];
const rankNames = {
  1: "Ässä",
  2: "2",
  3: "3",
  4: "4",
  5: "5",
  6: "6",
  7: "7",
  8: "8",
  9: "9",
  10: "10",
  11: "Jätkä" ,
  12: "Kuningatar",
  13: "Kuningas",
};

const ruleTexts = {
  1: "VESIPUTOUS",
  2: "Anna #",
  3: "Ota #",
  4: "HERRA HOO\nHuutakaa Herra Hoo - viimeinen huutaja juo #.",
  5: "HERRA HOO\nHuutakaa Herra Hoo - viimeinen huutaja juo #.",
  6: "123\nKortin nostaja juo 1, sitä seuraava 2 ja niin edespäin kunnes kierros on menty loppuun.",
  7: "Kategoria\nPäättäkää kategoria ja sanokaa siihen kuuluvia asioita. Kun ei enää keksi tai sanoo jo aiemmin sanotun asian, joutuu juomaan #.",
  8: "Sääntö\nKortin nostaja saa päättää säännön, joka on koko loppupelin ajan voimassa. Sääntöä rikkoessaan joutuu juomaan #.",
  9: "Kysymyspeli\nNostajasta lähtien, edetkää vuorotellen vastaten aina kysymyksellä. Se, joka ei vastaa kysymyksellä, juo #. Kysymysten täytyy liittyä toisiinsa.",
  10: "Tarina\nJokainen jatkaa tarinaa uudella sanalla, toistaen ensiksi jo kerrotun tarinan. Epäonnistuja juo #.",
  11: "Kysymysmestari\nKortin nostaja on kysymysmestari. Kysymysmestarin kysymyksiin ei saa vastata tai joutuu juomaan #. Pelissä voi olla vain yksi kysymysmestari kerrallaan.",
  12: "Huora\nKortin nostaja saa päättää itselleen henkilön, joka joutuu juomaan aina, kun hän juo.",
  13: "KUNKKUKUPPI",
};

function createDeck() {
  const deck = [];
  for (const suit of suits) {
    for (let value = 1; value <= 13; value += 1) {
      deck.push({ value, suit });
    }
  }
  return deck;
}

function getRuleText(value, penalty, kingCount = 0) {
  if (value === 13) {
    const nextKingNumber = kingCount + 1;
    if (nextKingNumber === 4) {
      return `KUNKKUKUPPI ${nextKingNumber}/4\nOlet neljäs! Sinä juot koko kupin jonka muut kolme täyttivät.`;
    } else {
      return `KUNKKUKUPPI ${nextKingNumber}/4\nKaada omaa juomaasi tyhjään kuppiin. Neljäs kuningas juo koko kupin!`;
    }
  }
  const text = ruleTexts[value] || "";
  return text.replace(/#/g, `${penalty}`);
}

function formatCardLabel(card) {
  if (!card) return "Ei korttia vielä";
  return `${rankNames[card.value] || card.value} ${card.suit}`;
}

function displayRank(value) {
  if (!value) return "";
  if (value === 1) return "A";
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

function HerraHoo({ onBack }) {
  const [deck, setDeck] = useState(createDeck);
  const [currentCard, setCurrentCard] = useState(null);
  const [rule, setRule] = useState("");
  const [penalty, setPenalty] = useState(5);
  const [kingCount, setKingCount] = useState(0);

  function drawCard() {
    const sourceDeck = deck.length === 0 ? createDeck() : deck;
    const nextIndex = Math.floor(Math.random() * sourceDeck.length);
    const card = sourceDeck[nextIndex];
    const nextDeck = sourceDeck.filter((_, index) => index !== nextIndex);

    setDeck(nextDeck);
    setCurrentCard(card);
    
    let newKingCount = kingCount;
    if (card.value === 13) {
      newKingCount = kingCount + 1;
      setKingCount(newKingCount);
    }
    setRule(getRuleText(card.value, penalty, newKingCount - 1));
  }

  function resetDeck() {
    setDeck(createDeck());
    setCurrentCard(null);
    setRule("");
    setKingCount(0);
  }

  function handlePenaltyChange(event) {
    const value = Number(event.target.value);
    if (Number.isNaN(value) || value < 1) {
      setPenalty(1);
      return;
    }
    setPenalty(Math.max(1, Math.round(value)));
  }

  return (
    <div className="herrahoo-page">
      <button className="back-button" onClick={onBack}>
        Takaisin
      </button>
      <div className="herrahoo-card">
        <h1>Hitler</h1>
        <p className="herrahoo-intro">
          Nosta kortti ja tee tehtävä sen mukaan.
        </p>

        <div className="herrahoo-controls">
          <label>
            Sakkomäärä (#):
            <input type="number" min="1" value={penalty} onChange={handlePenaltyChange} />
          </label>
          <div className="button-row">
            <button onClick={drawCard}>Nosta kortti</button>
            <button onClick={resetDeck}>Resetoi pakka</button>
          </div>
        </div>

        <div className="current-card">
          <span className="card-label">Kortti:</span>
          <div
            className={`card-visual ${currentCard ? suitClass(currentCard.suit) : ""}`}
            role="img"
            aria-label={currentCard ? `${rankNames[currentCard.value] || currentCard.value} ${currentCard.suit}` : "Ei korttia"}
          >
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
          <span className="card-count">Jäljellä: {deck.length}</span>
        </div>

        {rule && (
          <div className="rule-box">
            {rule.split("\n").map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default HerraHoo;
