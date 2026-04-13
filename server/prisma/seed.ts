import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import {
  DifficultyLevel,  PrismaClient
} from '@prisma/client';

const prisma = new PrismaClient();

function packImages(...urls: string[]) {
  return urls.join('||');
}

function resolveSceneImages(animeName: string) {
  const scenesDir = path.resolve(__dirname, '../../client/public/images/scenes');
  const extensions = ['jpg', 'jpeg', 'png', 'webp'];
  const localUrls: string[] = [];

  for (let i = 1; i <= 3; i += 1) {
    let matchedUrl: string | null = null;
    for (const ext of extensions) {
      const filename = `${animeName}_${i}.${ext}`;
      const absolutePath = path.join(scenesDir, filename);
      if (fs.existsSync(absolutePath)) {
        matchedUrl = `/images/scenes/${filename}`;
        break;
      }
    }
    if (matchedUrl) {
      localUrls.push(matchedUrl);
    }
  }

  if (localUrls.length === 0) {
    throw new Error(`Missing scene images for "${animeName}" in client/public/images/scenes`);
  }

  while (localUrls.length < 3) {
    localUrls.push(localUrls[localUrls.length - 1]);
  }

  if (localUrls.length < 3) {
    console.warn(`[seed] "${animeName}" has less than 3 scene images.`);
  }

  return packImages(...localUrls.slice(0, 3));
}

async function main() {
  await prisma.guess.deleteMany();
  await prisma.round.deleteMany();
  await prisma.gameSession.deleteMany();
  await prisma.scene.deleteMany();
  await prisma.animeTitle.deleteMany();
  await prisma.user.deleteMany();

  const animeCatalog = [
    {
      name: 'Attack on Titan',
      description: 'Militarized districts and gigantic walls under constant threat.'
    },
    {
      name: 'Your Name',
      description: 'Twilight cityscapes and nostalgic rural vistas.'
    },
    {
      name: 'Demon Slayer',
      description: 'Taisho-era paths, forests and shrine-laced environments.'
    },
    {
      name: 'Jujutsu Kaisen',
      description: 'Modern city nights with supernatural tension.'
    },
    {
      name: 'Naruto',
      description: 'Hidden villages, training grounds and chakra-heavy architecture.'
    },
    {
      name: 'Spirited Away',
      description: 'Mystical bathhouse spaces and fantasy realms.'
    },
    {
      name: 'My Hero Academia',
      description: 'Hero academies, urban zones and flashy action hubs.'
    },
    {
      name: 'One Piece',
      description: 'Colorful port towns and adventurous fantasy landscapes.'
    }
  ];

  const additionalAnimeTitles = [
    'Dragon Ball',
    'Dragon Ball Z',
    'Dragon Ball Super',
    'Dragon Ball GT',
    'Naruto Shippuden',
    'Boruto: Naruto Next Generations',
    'Bleach',
    'Bleach: Thousand-Year Blood War',
    'Fullmetal Alchemist',
    'Fullmetal Alchemist: Brotherhood',
    'Death Note',
    'Code Geass',
    'Steins;Gate',
    'Cowboy Bebop',
    'Neon Genesis Evangelion',
    'The End of Evangelion',
    'Gurren Lagann',
    'Samurai Champloo',
    'Trigun',
    'Berserk',
    'Berserk (2016)',
    'Claymore',
    'Vinland Saga',
    'Monster',
    'Pluto',
    'Psycho-Pass',
    'Parasyte',
    'Tokyo Ghoul',
    'Tokyo Revengers',
    'Chainsaw Man',
    'Hellâ€™s Paradise',
    'Blue Lock',
    'Haikyuu!!',
    'Kurokoâ€™s Basketball',
    'Slam Dunk',
    'Hajime no Ippo',
    'Yuri on Ice',
    'Free!',
    'Run with the Wind',
    'Ace of Diamond',
    'Major',
    'Megalobox',
    'Food Wars!',
    'Dr. Stone',
    'The Promised Neverland',
    'Made in Abyss',
    'Land of the Lustrous',
    'Erased',
    'Another',
    'Higurashi: When They Cry',
    'Future Diary',
    'Elfen Lied',
    'No Game No Life',
    'Re:Zero',
    'Konosuba',
    'Overlord',
    'That Time I Got Reincarnated as a Slime',
    'Mushoku Tensei',
    'The Rising of the Shield Hero',
    'Sword Art Online',
    'Log Horizon',
    'Grimgar of Fantasy and Ash',
    'The Eminence in Shadow',
    'Solo Leveling',
    'Frieren: Beyond Journeyâ€™s End',
    'Delicious in Dungeon',
    'Dandadan',
    'Mob Psycho 100',
    'One-Punch Man',
    'Spy x Family',
    'Bocchi the Rock!',
    'K-On!',
    'Sound! Euphonium',
    'Violet Evergarden',
    'A Silent Voice',
    'Your Lie in April',
    'Clannad',
    'Clannad: After Story',
    'Toradora!',
    'Golden Time',
    'Horimiya',
    'Kaguya-sama: Love is War',
    'My Dress-Up Darling',
    'The Quintessential Quintuplets',
    'Rascal Does Not Dream of Bunny Girl Senpai',
    'Nisekoi',
    'Kimi ni Todoke',
    'Skip and Loafer',
    'Blue Spring Ride',
    'Say I Love You',
    'Anohana',
    'The Pet Girl of Sakurasou',
    'Oregairu',
    'Domestic Girlfriend',
    'Rent-a-Girlfriend',
    'Komi Canâ€™t Communicate',
    'My Love Story!!',
    'Lovelyâ…Complex',
    'Fruits Basket',
    'Maid Sama!',
    'Ouran High School Host Club',
    'Inuyasha',
    'Ranma Â˝',
    'Rurouni Kenshin',
    'Yu Yu Hakusho',
    'Hunter x Hunter',
    'JoJoâ€™s Bizarre Adventure',
    'Black Clover',
    'Fairy Tail',
    'Seven Deadly Sins',
    'Magi',
    'Fire Force',
    'Soul Eater',
    'Akame ga Kill!',
    'Seraph of the End',
    'Noragami',
    'Blue Exorcist',
    'The Irregular at Magic High School',
    'Magi: The Labyrinth of Magic',
    'Magi: The Kingdom of Magic',
    'Fate/stay night',
    'Fate/Zero',
    'Fate/stay night: Unlimited Blade Works',
    'Fate/Apocrypha',
    'Fate/Grand Order',
    'Kara no Kyoukai',
    'Garden of Sinners',
    'Bungo Stray Dogs',
    'Great Pretender',
    'Durarara!!',
    'Baccano!',
    'Black Lagoon',
    'Jormungand',
    '91 Days',
    'Banana Fish',
    'Gangsta.',
    'Akudama Drive',
    'Cyberpunk: Edgerunners',
    'Ghost in the Shell',
    'Ghost in the Shell: SAC',
    'Akira',
    'Serial Experiments Lain',
    'Texhnolyze',
    'Kaiba',
    'FLCL',
    'Space Dandy',
    'Made in Abyss: The Golden City of the Scorching Sun',
    'Odd Taxi',
    'Ranking of Kings',
    'To Your Eternity',
    'Natsumeâ€™s Book of Friends',
    'Mushishi',
    'March Comes in Like a Lion',
    'Ping Pong the Animation',
    'Tatami Galaxy',
    'Kids on the Slope',
    'Beck',
    'Nana',
    'Carole & Tuesday',
    'Paranoia Agent',
    'Perfect Blue',
    'Paprika',
    'Millennium Actress',
    'Howlâ€™s Moving Castle',
    'My Neighbor Totoro',
    'Princess Mononoke',
    'Spirited Away',
    'Ponyo',
    'Castle in the Sky',
    'Kikiâ€™s Delivery Service',
    'The Boy and the Heron',
    'Weathering with You',
    'Suzume',
    'The Garden of Words',
    '5 Centimeters per Second',
    'The Girl Who Leapt Through Time',
    'Summer Wars',
    'Wolf Children',
    'Belle',
    'Mirai',
    'The Tunnel to Summer, the Exit of Goodbyes',
    'Oshi no Ko',
    'Vivy: Fluorite Eyeâ€™s Song',
    '86',
    'Aldnoah.Zero',
    'Darling in the Franxx',
    'Eureka Seven',
    'Gundam Wing',
    'Mobile Suit Gundam: Iron-Blooded Orphans',
    'Code Geass: Lelouch of the Rebellion R2',
    'World Trigger',
    'D.Gray-man',
    'Shaman King',
    'Saint Seiya',
    'Medabots',
    'Digimon Adventure',
    'PokĂ©mon',
    'Beyblade',
    'Yu-Gi-Oh!',
    'Bakugan Battle Brawlers',
    'Detective Conan',
    'The Apothecary Diaries'
  ];

  const allAnimeTitles = [
    ...animeCatalog,
    ...additionalAnimeTitles.map((name) => ({ name, description: null }))
  ].reduce<Array<{ name: string; description: string | null }>>((acc, item) => {
    if (!acc.some((existing) => existing.name === item.name)) {
      acc.push({ name: item.name, description: item.description ?? null });
    }
    return acc;
  }, []);

  await prisma.animeTitle.createMany({ data: allAnimeTitles });

  const animeTitles = await prisma.animeTitle.findMany();
  const animeIdByName = Object.fromEntries(animeTitles.map((item) => [item.name, item.id]));

  const scenes = [
    {
      anime: 'Attack on Titan',
      difficulty: DifficultyLevel.MEDIUM
    },
    {
      anime: 'Code Geass',
      difficulty: DifficultyLevel.HARD
    },
    {
      anime: 'Violet Evergarden',
      difficulty: DifficultyLevel.EASY
    },
    {
      anime: 'Your Lie in April',
      difficulty: DifficultyLevel.MEDIUM
    },
    {
      anime: 'Demon Slayer',
      difficulty: DifficultyLevel.EASY
    },
    {
      anime: 'Hunter x Hunter',
      difficulty: DifficultyLevel.MEDIUM
    },
    {
      anime: 'Jujutsu Kaisen',
      difficulty: DifficultyLevel.EASY
    },
    {
      anime: 'Haikyuu!!',
      difficulty: DifficultyLevel.MEDIUM
    },
    {
      anime: 'Naruto',
      difficulty: DifficultyLevel.EASY
    },
    {
      anime: 'Spirited Away',
      difficulty: DifficultyLevel.HARD
    },
    {
      anime: 'My Hero Academia',
      difficulty: DifficultyLevel.EASY
    },
    {
      anime: 'One Piece',
      difficulty: DifficultyLevel.MEDIUM
    },
    {
      anime: 'Bleach',
      difficulty: DifficultyLevel.MEDIUM
    },
    {
      anime: 'Death Note',
      difficulty: DifficultyLevel.HARD
    },
    {
      anime: 'Dragon Ball Z',
      difficulty: DifficultyLevel.EASY
    },
    {
      anime: 'Blue Lock',
      difficulty: DifficultyLevel.MEDIUM
    },
    {
      anime: 'Spy x Family',
      difficulty: DifficultyLevel.EASY
    },
    {
      anime: 'Vinland Saga',
      difficulty: DifficultyLevel.HARD
    },
    {
      anime: 'Chainsaw Man',
      difficulty: DifficultyLevel.MEDIUM
    },
    {
      anime: 'Solo Leveling',
      difficulty: DifficultyLevel.EASY
    }
  ];

  await prisma.scene.createMany({
    data: scenes.map((scene) => ({
      animeTitleId: animeIdByName[scene.anime],
      imageUrl: resolveSceneImages(scene.anime),
      difficulty: scene.difficulty
    }))
  });

  console.log('Seed completed: anime titles and quiz scenes.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });



