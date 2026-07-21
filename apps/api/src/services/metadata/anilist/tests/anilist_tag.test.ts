// src/services/metadata/anilist/tests/anilist_tag.test.ts
import { describe, it } from 'vitest';

const query = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      title { romaji }
      tags { id name category rank isAdult }
    }
  }
`;

async function fetchTags(id: number) {
  const res = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { id } }),
  });
  const json = await res.json();
  console.log(`\n=== ${json.data.Media.title.romaji} ===`);
  console.log(JSON.stringify(json.data.Media.tags, null, 2));
}

describe('Anilist tags exploration (manual)', () => {
  it('logs real tag data for a few anime', async () => {
    await fetchTags(154587); // Frieren
    await fetchTags(21);     // One Piece
    await fetchTags(16498);  // Attack on Titan
  }, 15000);
});
