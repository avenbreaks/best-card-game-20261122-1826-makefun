// Ember Pact — the card pool. Four original suits, each with a colour AND a shape
// (so suits are told apart by more than text): Ember ▲ red, Tide ● blue,
// Thorn ◆ green, Stone ■ grey. Every card is an original design.
export const SUITS = {
  ember: { name: 'Ember', glyph: '▲', color: '#c33d12' },
  tide: { name: 'Tide', glyph: '●', color: '#1d6fb8' },
  thorn: { name: 'Thorn', glyph: '◆', color: '#2e7d32' },
  stone: { name: 'Stone', glyph: '■', color: '#5a5a5a' },
};

// id, name, suit, cost, kind, attack/health for creatures, text, and effect key.
export const CARDS = [
  { id: 'imp', name: 'Cinder Imp', suit: 'ember', cost: 1, kind: 'creature', atk: 2, hp: 1, text: 'Quick and reckless.' },
  { id: 'sprite', name: 'Tide Sprite', suit: 'tide', cost: 1, kind: 'creature', atk: 1, hp: 2, text: 'When played: heal 1.', effect: 'heal1' },
  { id: 'sprout', name: 'Thorn Sprout', suit: 'thorn', cost: 2, kind: 'creature', atk: 2, hp: 3, text: 'A patient little thorn.' },
  { id: 'bramble', name: 'Thorn Bramble', suit: 'thorn', cost: 2, kind: 'creature', atk: 1, hp: 4, text: 'When played: heal 2.', effect: 'heal2' },
  { id: 'serpent', name: 'Tide Serpent', suit: 'tide', cost: 3, kind: 'creature', atk: 3, hp: 3, text: 'When played: draw a card.', effect: 'draw1' },
  { id: 'golem', name: 'Stone Golem', suit: 'stone', cost: 3, kind: 'creature', atk: 3, hp: 5, text: 'It does not hurry.' },
  { id: 'drake', name: 'Ember Drake', suit: 'ember', cost: 4, kind: 'creature', atk: 5, hp: 4, text: 'Its shadow is warm.' },
  { id: 'phoenix', name: 'Ash Phoenix', suit: 'ember', cost: 5, kind: 'creature', atk: 6, hp: 5, text: 'It has burned before.' },
  { id: 'burst', name: 'Cinder Burst', suit: 'ember', cost: 2, kind: 'spell', text: 'Deal 3 damage to the rival.', effect: 'dmg3' },
  { id: 'mend', name: 'Tide Mend', suit: 'tide', cost: 2, kind: 'spell', text: 'Restore 6 life.', effect: 'heal6' },
  { id: 'wall', name: 'Stone Wall', suit: 'stone', cost: 1, kind: 'spell', text: 'Your creatures gain +1/+1.', effect: 'buffall' },
  { id: 'snare', name: 'Thorn Snare', suit: 'thorn', cost: 2, kind: 'spell', text: 'Deal 2 damage to all rival creatures.', effect: 'dmgall2' },
];

export const CARD_BY_ID = Object.fromEntries(CARDS.map((c) => [c.id, c]));

// A 20-card deck: two copies of each creature, one of each spell.
export function buildDeck() {
  const deck = [];
  for (const c of CARDS) {
    deck.push(c.id);
    if (c.kind === 'creature') deck.push(c.id);
  }
  return deck;
}

export function cardName(id) {
  return CARD_BY_ID[id]?.name ?? id;
}
