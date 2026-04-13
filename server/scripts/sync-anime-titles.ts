import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ANILIST_URL = 'https://graphql.anilist.co';
const DEFAULT_PAGES = 8;
const PER_PAGE = 50;

type AnilistMedia = {
  title: {
    romaji?: string | null;
    english?: string | null;
    native?: string | null;
  };
  description?: string | null;
};

type AnilistPage = {
  hasNextPage: boolean;
};

type AnilistResponse = {
  data?: {
    Page?: {
      pageInfo?: AnilistPage;
      media?: AnilistMedia[];
    };
  };
  errors?: Array<{ message?: string }>;
};

const query = `
  query ($page: Int!, $perPage: Int!) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        hasNextPage
      }
      media(type: ANIME, sort: POPULARITY_DESC, isAdult: false) {
        title {
          romaji
          english
          native
        }
        description(asHtml: false)
      }
    }
  }
`;

function normalizeTitle(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function pickBestTitle(media: AnilistMedia) {
  const raw = media.title.english ?? media.title.romaji ?? media.title.native ?? null;
  if (!raw) return null;
  return normalizeTitle(raw);
}

function cleanDescription(value?: string | null) {
  if (!value) return null;
  return value.replace(/<[^>]*>/g, '').trim().slice(0, 700) || null;
}

async function fetchPage(page: number): Promise<{ items: AnilistMedia[]; hasNextPage: boolean }> {
  const response = await fetch(ANILIST_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      query,
      variables: { page, perPage: PER_PAGE }
    })
  });

  if (!response.ok) {
    throw new Error(`AniList HTTP ${response.status}`);
  }

  const payload = (await response.json()) as AnilistResponse;
  if (payload.errors?.length) {
    const first = payload.errors[0]?.message ?? 'Unknown AniList error';
    throw new Error(first);
  }

  const items = payload.data?.Page?.media ?? [];
  const hasNextPage = payload.data?.Page?.pageInfo?.hasNextPage ?? false;

  return { items, hasNextPage };
}

async function main() {
  const maxPages = Number(process.env.ANILIST_SYNC_PAGES ?? DEFAULT_PAGES);
  const collected = new Map<string, string | null>();

  let page = 1;
  let hasNextPage = true;

  while (page <= maxPages && hasNextPage) {
    const result = await fetchPage(page);
    for (const media of result.items) {
      const title = pickBestTitle(media);
      if (!title) continue;
      const description = cleanDescription(media.description);

      if (!collected.has(title)) {
        collected.set(title, description);
      }
    }

    hasNextPage = result.hasNextPage;
    page += 1;
  }

  const incoming = [...collected.entries()].map(([name, description]) => ({ name, description }));

  if (incoming.length === 0) {
    console.log('No titles fetched from AniList.');
    return;
  }

  await prisma.animeTitle.createMany({
    data: incoming,
    skipDuplicates: true
  });

  // Enrich existing rows that might miss description.
  for (const item of incoming) {
    if (!item.description) continue;
    await prisma.animeTitle.updateMany({
      where: {
        name: item.name,
        OR: [{ description: null }, { description: '' }]
      },
      data: {
        description: item.description
      }
    });
  }

  const total = await prisma.animeTitle.count();
  console.log(`AniList sync completed. Imported/checked: ${incoming.length}. Total titles in DB: ${total}.`);
}

main()
  .catch((error) => {
    console.error('AniList sync failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

