/**
 * Pokemon-themed quotes shown on the dashboard.
 *
 * Lifted out of Dashboard.tsx so the component file isn't padded with data
 * and so the list is easy to add to in one place.
 */

export interface PokemonQuote {
  quote: string;
  author: string;
}

export const POKEMON_QUOTES: PokemonQuote[] = [
  {
    quote: 'Do you have what it takes to be a Pokemon Master?',
    author: 'Professor Oak',
  },
  {
    quote: "The important thing is not how long you live. It's what you accomplish with your life.",
    author: 'Grovyle',
  },
  {
    quote: 'We do have a lot in common. The same earth, the same air, the same sky.',
    author: 'Mewtwo',
  },
  {
    quote: "There's no sense in going out of your way just to get somebody to like you.",
    author: 'Ash Ketchum',
  },
  {
    quote: "Knowing what's right doesn't mean much unless you do what's right.",
    author: 'N',
  },
  {
    quote: "Even if we can't understand each other, that's not a reason to reject each other.",
    author: 'Ash Ketchum',
  },
];

export const getRandomQuote = (): PokemonQuote =>
  POKEMON_QUOTES[Math.floor(Math.random() * POKEMON_QUOTES.length)];
