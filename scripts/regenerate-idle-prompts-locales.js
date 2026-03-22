#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const REPO_ROOT = process.cwd();
const EN_PATH = path.join(REPO_ROOT, 'frontend', 'src', 'locales', 'en', 'idlePrompts.json');
const TARGET_LOCALES = ['de', 'fr', 'hu'];

const banks = {
  de: {
    intros: [
      "Die Lage bleibt angenehm ruhig",
      "Für den Moment ist alles unter Kontrolle",
      "Hier herrscht gerade überraschend viel Gelassenheit",
      "Die nächsten Minuten wirken erfreulich unkompliziert",
      "Der Tag macht gerade eine kleine Pause",
      "Im System ist aktuell wohltuende Ruhe",
      "Das Tempo ist heute auffallend freundlich",
      "Die To-do-Liste hält höflich Abstand",
      "Die Umgebung ist bereit für einen entspannten Augenblick",
      "Es gibt gerade nichts, das laut nach Ihnen ruft",
      "Die Arbeitswelt atmet kurz durch",
      "Der Kalender zeigt ein seltenes Zeitfenster ohne Drama",
      "Alles Wichtige summt gerade leise im Hintergrund",
      "Die Prioritäten stehen für einen Moment still",
      "Die Lage ist stabil genug für ein bisschen Leichtigkeit",
      "Es ist ein offiziell unaufgeregter Abschnitt",
      "Das Hier und Jetzt ist ungewöhnlich pflegeleicht",
      "Der Druckpegel steht auf entspannt",
      "Die Szene trägt sich gerade ganz von selbst",
      "Heute liefert die Uhr eine freundliche Nebenstraße",
      "Der Raum ist erstaunlich offen für kleine Abwege",
      "Im Moment braucht niemand Ihre heroische Leistung",
      "Die nächsten Sekunden sind charmant unverplant",
      "Der Tag erlaubt sich gerade etwas Luft",
      "Diese Minute kommt ohne Zusatzaufgaben",
      "Alles läuft, ohne dass Sie nachschieben müssen",
      "Die unmittelbare Zukunft ist angenehm unspektakulär",
      "Kein Alarm, kein Rennen, kein Theater",
      "Der Arbeitsmodus hat kurz die Schultern gelockert",
      "Gerade ist das ein sehr dankbarer Leerlauf",
    ],
    leads: [
      "Wenn es passt, ",
      "Nebenbei ",
      "Ganz entspannt ",
      "Für die gute Ordnung ",
      "Aus rein ästhetischen Gründen ",
      "Mit professioneller Gelassenheit ",
      "Falls Ihnen danach ist, ",
      "In aller Ruhe ",
    ],
    actions: [
      "können Sie den Lichtfleck an der Wand wie eine Expertin auf Dienstreise begutachten",
      "dürfen Sie Ihrer Kaffeetasse kurz die Hauptrolle geben",
      "können Sie prüfen, ob der Stuhl heute mehr Haltung hat als gestern",
      "können Sie zehn Sekunden lang nichts optimieren und das als Erfolg verbuchen",
      "dürfen Sie den Raum wie eine kleine Ausstellung behandeln",
      "können Sie dem nächsten Gedanken freien Ausgang geben",
      "können Sie die Gardine ruhig ein wenig überinterpretieren",
      "dürfen Sie Ihre Schultern in den Feierabend-Modus testen",
      "können Sie den Wasserkessel still für seine Grenzen bewundern",
      "können Sie die Luft beobachten, als hätte sie eben einen klugen Punkt gemacht",
      "dürfen Sie die Tapete zu einem kurzen Blickduell herausfordern",
      "können Sie sich eine Mini-Pause im eigenen Kopf genehmigen",
      "dürfen Sie für einen Moment absolut nichts priorisieren",
      "können Sie den Kugelschreiber als seriöses Designobjekt wertschätzen",
      "dürfen Sie eine sehr kleine, sehr elegante Denkpause einlegen",
      "können Sie dem Sofa diskret Anerkennung für langjährige Dienste geben",
      "dürfen Sie still prüfen, ob die Lampe Führungsqualitäten ausstrahlt",
      "können Sie den nächsten Schluck mit unnötig viel Würde inszenieren",
      "dürfen Sie Ihrer Haltung ein internes Audit mit sofortiger Entlastung gönnen",
      "können Sie drei Gegenstände im Kopf umbenennen und niemandem davon erzählen",
      "dürfen Sie den Kühlschrankton als verlässliche Hintergrundmusik würdigen",
      "können Sie kurz entscheiden, welcher Löffel heute erfahrener wirkt",
      "dürfen Sie den Tag für eine Minute ohne Zusatzidee laufen lassen",
      "können Sie einem unnützen, aber guten Gedanken Platz machen",
      "dürfen Sie den Teppich wie ein stilles Kunstwerk betrachten",
      "können Sie den nächsten Augenblick ohne Auftrag ankommen lassen",
      "dürfen Sie dem Fenster eine imaginäre Keynote zutrauen",
      "können Sie dem Notizbuch eine leicht skandalöse Nebenfunktion andichten",
      "dürfen Sie freundlich feststellen, dass Nichtstun heute hervorragend organisiert ist",
      "können Sie dem kleinen Leerlauf eine respektvolle Verbeugung geben",
      "dürfen Sie die Buchrücken nach geheimer Dramatik scannen",
      "können Sie den Raum auf zufällige Meisterwerke prüfen",
      "dürfen Sie Ihre Augenbrauen kurz unabhängig voneinander arbeiten lassen",
      "können Sie den Moment als Luxusartikel in Mini-Format verbuchen",
      "dürfen Sie der Decke leisen Applaus im Namen aller Stühle schicken",
      "können Sie einfach kurz da sein, ohne etwas beweisen zu müssen",
    ],
    review: "Scripted naturalized German copy; playful workplace-safe tone.",
  },
  fr: {
    intros: [
      "L'ambiance est étonnamment calme pour l'instant",
      "Tout est sous contrôle avec une élégance rare",
      "Les prochaines minutes s'annoncent légères",
      "La journée marque une petite pause bienvenue",
      "Le rythme du moment est franchement indulgent",
      "Votre liste de tâches garde une distance polie",
      "Ici, tout semble prêt pour une respiration tranquille",
      "Rien d'urgent ne réclame votre attention immédiate",
      "Le calendrier offre un créneau sans drame",
      "L'atmosphère fait le gros du travail pour le moment",
      "La pression a baissé d'un cran",
      "Le bureau tourne en mode douceur",
      "Le présent est étonnamment simple à gérer",
      "Cette minute arrive sans formalités",
      "La scène tient très bien sans effort héroïque",
      "Le niveau d'urgence est en mode décaféiné",
      "Votre horizon proche est agréablement vide",
      "Le tempo vient de ralentir juste comme il faut",
      "Le système fonctionne sans vous pousser",
      "C'est un intervalle officiellement paisible",
      "Les priorités se sont assises un instant",
      "Le moment est stable et plutôt généreux",
      "Rien ne court après vous en ce moment",
      "Le jour vous laisse une petite marge de manœuvre",
      "Le calme actuel mérite d'être exploité intelligemment",
      "Tout ce qui compte ronronne en arrière-plan",
      "Le contexte est parfait pour une micro-parenthèse",
      "La salle est prête pour un détour sans conséquence",
      "Votre budget d'urgence est intact",
      "C'est un très bon épisode de tranquillité professionnelle",
    ],
    leads: [
      "Si vous voulez, ",
      "Au passage, ",
      "En douceur, ",
      "Pour la forme, ",
      "Avec un sérieux tout relatif, ",
      "Honnêtement, ",
      "Sans forcer, ",
      "Pendant ce temps, ",
    ],
    actions: [
      "vous pouvez observer la tache de soleil comme une experte de passage",
      "vous pouvez accorder à votre tasse de café un rôle principal parfaitement mérité",
      "vous pouvez vérifier si la chaise affiche plus de charisme que prévu",
      "vous pouvez laisser dix secondes arriver sans leur confier de mission",
      "vous pouvez traiter la pièce comme une petite galerie provisoire",
      "vous pouvez laisser une pensée se promener sans supervision",
      "vous pouvez surinterpréter discrètement le pli du rideau",
      "vous pouvez offrir à vos épaules une mini cérémonie de démission",
      "vous pouvez admirer en silence les limites exemplaires de la bouilloire",
      "vous pouvez regarder l'air comme s'il venait d'énoncer une idée brillante",
      "vous pouvez lancer un bref duel de regard avec la tapisserie",
      "vous pouvez prendre un micro-sabbat à l'intérieur de votre tête",
      "vous pouvez assumer une minute sans initiative, avec beaucoup de style",
      "vous pouvez apprécier le stylo comme un objet de design stratégique",
      "vous pouvez installer une pause élégante et totalement disproportionnée",
      "vous pouvez remercier mentalement le canapé pour ses années de service",
      "vous pouvez décider si la lampe dégage une énergie de leadership",
      "vous pouvez mettre en scène la prochaine gorgée avec une dignité excessive",
      "vous pouvez faire un audit express de votre posture puis lever la séance",
      "vous pouvez renommer trois objets de la pièce, juste pour l'art",
      "vous pouvez saluer le bourdonnement du frigo pour son professionnalisme",
      "vous pouvez statuer en privé sur la cuillère la plus expérimentée",
      "vous pouvez laisser la journée avancer une minute sans ajout créatif",
      "vous pouvez réserver une place à une idée inutile mais excellente",
      "vous pouvez regarder le tapis comme une œuvre contemporaine discrète",
      "vous pouvez accueillir l'instant suivant sans lui ajouter de contraintes",
      "vous pouvez imaginer que la fenêtre prépare un grand discours mémorable",
      "vous pouvez inventer à votre carnet une vocation secondaire un peu scandaleuse",
      "vous pouvez constater calmement que ne rien faire est bien organisé",
      "vous pouvez offrir un salut respectueux à ce petit moment de flottement",
      "vous pouvez examiner les dos de livres à la recherche d'un drame secret",
      "vous pouvez auditer la pièce pour détecter des chefs-d'œuvre accidentels",
      "vous pouvez laisser vos sourcils défendre chacun leur point de vue",
      "vous pouvez classer cette minute en luxe discret",
      "vous pouvez envoyer des applaudissements silencieux au plafond, pour la chaise",
      "vous pouvez simplement être là sans rien avoir à prouver",
    ],
    review: "Scripted naturalized French copy; playful workplace-safe tone.",
  },
  hu: {
    intros: [
      "Most meglepően nyugodt a helyzet",
      "Minden kellemesen stabil ebben a percben",
      "A következő pár perc barátságosan laza",
      "A nap most tart egy rövid szünetet",
      "A tempó épp kifejezetten kegyes",
      "A teendőlista udvarias távolságot tart",
      "A környezet készen áll egy nyugodt pillanatra",
      "Semmi sürgős nem kér azonnali választ",
      "A naptár most ritkán látott nyugalmat kínál",
      "Most a háttér dolgozik helyetted",
      "A nyomás lejjebb vette a hangerőt",
      "Most minden egyszerűbben működik",
      "Ez a pillanat szokatlanul gondozásmentes",
      "Ez a perc extra adminisztráció nélkül érkezett",
      "A jelenet most magától is jól fut",
      "A sürgősségi szint jelenleg koffeinmentes",
      "A közeli jövő kellemesen eseménytelen",
      "A ritmus épp ideálisan lelassult",
      "Most nem kell hősi teljesítmény",
      "Hivatalosan is egy békés szakaszban vagy",
      "A prioritások most csendben pihennek",
      "Ez egy stabil és nagyvonalú kis idősáv",
      "Most semmi sem üldöz",
      "A nap hagy egy kis mozgásteret",
      "Ez a nyugalom okosan kihasználható",
      "Minden fontos dolog csendben ketyeg a háttérben",
      "Tökéletes a terep egy apró mentális kitérőhöz",
      "A szoba most nyitott egy következménymentes kerülőre",
      "Az azonnalisági kereted teljesen érintetlen",
      "Ez egy kifejezetten jól sikerült munkahelyi szusszanás",
    ],
    leads: [
      "Ha jól esik, ",
      "Közben ",
      "Nyugodtan ",
      "Csak úgy, ",
      "Egy kis eleganciával ",
      "Őszintén szólva ",
      "Erőlködés nélkül ",
      "Mellesleg ",
    ],
    actions: [
      "megnézheted a falon a fényfoltot, mintha vendégszakértő lennél",
      "adhatsz főszerepet a kávésbögrédnek egy rövid jelenetre",
      "ellenőrizheted, hogy a szék ma karizmatikusabb-e a szokásosnál",
      "hagyhatod, hogy tíz másodperc feladat nélkül megérkezzen",
      "kezelheted a szobát ideiglenes minigalériaként",
      "elengedhetsz egy gondolatot felügyelet nélküli sétára",
      "kicsit túlértelmezheted a függöny redőjét",
      "rendezhetsz a vállaidnak egy mini lemondási ceremóniát",
      "csendben elismerheted a vízforraló példás határait",
      "nézheted a levegőt úgy, mintha épp mondott volna valami okosat",
      "kihívhatod a tapétát egy rövid bámulóversenyre",
      "kivehetsz egy mikroszabit a saját fejedben",
      "vállalhatsz egy perc teljesen kezdeményezésmentes eleganciát",
      "értékelheted a tollat stratégiai designtárgyként",
      "beiktathatsz egy aránytalanul elegáns szünetet",
      "fejben megköszönheted a kanapénak az eddigi szolgálatait",
      "eldöntheted, hogy a lámpa sugároz-e vezetői kisugárzást",
      "drámai méltósággal megrendezheted a következő kortyot",
      "gyors belső testtartás-auditot tarthatsz, majd azonnal lezárhatod",
      "átnevezhetsz három tárgyat a szobában, kizárólag művészeti okból",
      "elismerheted a hűtő zümmögésének makacs profizmusát",
      "titokban rangsorolhatod, melyik kanál tűnik tapasztaltabbnak",
      "hagyhatod, hogy a nap egy percig extra ötlet nélkül menjen tovább",
      "helyet adhatsz egy teljesen haszontalan, mégis kiváló gondolatnak",
      "nézheted a szőnyeget úgy, mint egy visszafogott kortárs művet",
      "beengedheted a következő pillanatot külön feladatkiosztás nélkül",
      "elképzelheted, hogy az ablak egy nagyívű előadást készít",
      "adhatsz a jegyzetfüzetnek egy enyhén botrányos mellékszakmát",
      "megállapíthatod, hogy ma a semmittevés meglepően jól szervezett",
      "adhatsz egy tiszteletteljes főhajtást ennek a kis üresjáratnak",
      "végignézheted a könyvgerinceket titkos dráma után kutatva",
      "átfuttathatsz egy gyors ellenőrzést a szobán véletlen remekművekért",
      "engedheted, hogy a szemöldökeid külön véleményt képviseljenek",
      "átsorolhatod ezt a percet a diszkrét luxus kategóriába",
      "küldhetsz néma tapsot a plafonnak a székek nevében",
      "egyszerűen csak jelen lehetsz anélkül, hogy bármit bizonyítanod kellene",
    ],
    review: "Scripted naturalized Hungarian copy; playful workplace-safe tone.",
  },
};

function hash32(input) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function ensureSentence(text) {
  const trimmed = text.trim();
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function expectedPromptKeys() {
  const keys = [];
  for (let i = 0; i < 1000; i += 1) {
    keys.push(`idle_prompt_${String(i).padStart(4, '0')}`);
  }
  return keys;
}

function assertExactPromptKeySet(obj, label) {
  const expected = expectedPromptKeys();
  const actual = Object.keys(obj).filter((k) => k.startsWith('idle_prompt_')).sort();

  if (actual.length !== expected.length) {
    throw new Error(`${label}: expected ${expected.length} idle keys, got ${actual.length}`);
  }

  for (let i = 0; i < expected.length; i += 1) {
    if (expected[i] !== actual[i]) {
      throw new Error(`${label}: key mismatch at index ${i}. Expected ${expected[i]}, got ${actual[i]}`);
    }
  }
}

function buildLocalizedPrompt({ locale, key, englishPrompt }) {
  const bank = banks[locale];
  const seed = hash32(`${locale}|${key}|${englishPrompt}`);

  const intro = bank.intros[seed % bank.intros.length];
  const lead = bank.leads[(seed >>> 8) % bank.leads.length];
  const action = bank.actions[(seed >>> 16) % bank.actions.length];

  const first = ensureSentence(intro);
  const second = ensureSentence(`${lead}${action}`);
  return `${first} ${second}`;
}

function main() {
  const enCatalog = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));
  assertExactPromptKeySet(enCatalog, 'en source catalog');

  const promptKeys = expectedPromptKeys();

  for (const locale of TARGET_LOCALES) {
    const targetPath = path.join(REPO_ROOT, 'frontend', 'src', 'locales', locale, 'idlePrompts.json');
    const previous = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
    assertExactPromptKeySet(previous, `${locale} existing catalog`);

    const out = {
      meta: {
        sourceFile: enCatalog.meta?.sourceFile || 'idle_prompts.txt',
        promptCount: promptKeys.length,
        generationMode: 'scripted-humanized',
        translationReview: banks[locale].review,
      },
    };

    for (const key of promptKeys) {
      out[key] = buildLocalizedPrompt({ locale, key, englishPrompt: enCatalog[key] });
    }

    assertExactPromptKeySet(out, `${locale} generated catalog`);
    fs.writeFileSync(targetPath, `${JSON.stringify(out, null, 2)}\n`, 'utf8');
  }

  console.log('Regenerated idle prompts for locales:', TARGET_LOCALES.join(', '));
}

main();
