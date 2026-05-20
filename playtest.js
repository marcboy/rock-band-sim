// Headless playtest of the prototype's sim logic.
// Mirrors the formulas in rock-band-sim-prototype.html.

// Deterministic-ish RNG for repeatable test
let _seed = 42;
function rand(a, b) {
  _seed = (_seed * 9301 + 49297) % 233280;
  const r = _seed / 233280;
  return r * (b - a) + a;
}
function randint(a, b) { return Math.floor(rand(a, b + 1)); }
function conversionRate(q) {
  if (q < 4) return 0.05;
  if (q < 7) return 0.15;
  if (q < 9) return 0.30;
  return 0.45;
}

const S = {
  week: 1, year: 1, fans: 0, cash: 8000, energy: 80,
  songs: [], albums: [], pendingTask: null, songCounter: 0, albumCounter: 0,
  weeklySalesHistory: [],
};

function weekIndex() { return (S.year - 1) * 52 + S.week; }

function finishTask(task) {
  if (task.type === "write_song") {
    const hook = randint(3, 9), vibe = randint(3, 9), edge = randint(3, 9);
    S.songs.push({ id: ++S.songCounter, hook, vibe, edge, state: "demo" });
  } else if (task.type === "record_song") {
    const s = S.songs.find(x => x.id === task.target);
    if (s) s.state = "recorded";
  }
}

function releaseAlbum(album) {
  const launch = rand(0.6, 2.0);
  const seasonality = rand(0.85, 1.15);
  const conv = conversionRate(album.quality);
  const discoveryFloor = album.quality * 80;
  const firstWeek = Math.round((S.fans * conv + discoveryFloor) * launch * seasonality);
  if (S.albums.length === 0) S.fans += Math.round(firstWeek * 0.4);
  album.releasedWeek = S.week;
  album.releasedYear = S.year;
  album.lifetimeSales = firstWeek;
  album.weeklySales = [{week: weekIndex(), units: firstWeek}];
  S.albums.unshift(album);
  S.cash += firstWeek * 1.5;
  if (launch > 1.5) S.fans += Math.round(firstWeek * 0.05);
}

function advanceWeek() {
  if (S.week >= 52) { S.week = 1; S.year += 1; } else S.week += 1;
  if (S.pendingTask) {
    S.pendingTask.weeksLeft -= 1;
    if (S.pendingTask.weeksLeft <= 0) { finishTask(S.pendingTask); S.pendingTask = null; }
  }
  let salesThisWeek = 0, fansFromSales = 0;
  for (const album of S.albums) {
    const last = album.weeklySales[album.weeklySales.length - 1];
    if (last.week === weekIndex()) continue;
    const decay = album.quality >= 7 ? 0.88 : 0.85;
    const newUnits = Math.max(1, Math.round(last.units * decay));
    album.weeklySales.push({week: weekIndex(), units: newUnits});
    album.lifetimeSales += newUnits;
    salesThisWeek += newUnits;
    fansFromSales += newUnits / 6;
    S.cash += newUnits * 1.5;
  }
  S.cash -= 200;
  const wordOfMouth = S.fans * 0.002;
  let dormantDecay = 0;
  const weeksSinceLastRelease = S.albums.length > 0
    ? weekIndex() - ((S.albums[0].releasedYear-1)*52 + S.albums[0].releasedWeek) : Infinity;
  if (S.albums.length === 0 || weeksSinceLastRelease > 26) dormantDecay = S.fans * 0.005;
  S.fans = Math.max(0, S.fans + Math.round(fansFromSales + wordOfMouth - dormantDecay));
  S.weeklySalesHistory.push(salesThisWeek);
}

function writeSong() {
  if (S.pendingTask || S.cash < 500) return false;
  S.cash -= 500;
  S.pendingTask = { type: "write_song", weeksLeft: 1 };
  return true;
}
function recordSong(songId) {
  if (S.pendingTask || S.cash < 500) return false;
  const s = S.songs.find(x => x.id === songId);
  if (!s || s.state !== "demo") return false;
  S.cash -= 500;
  s.state = "recording";
  S.pendingTask = { type: "record_song", weeksLeft: 1, target: songId };
  return true;
}
function shipAlbum() {
  const recorded = S.songs.filter(s => s.state === "recorded");
  if (recorded.length < 4 || S.cash < 1000) return false;
  S.cash -= 1000;
  const quality = recorded.reduce((a, s) => a + (s.hook+s.vibe+s.edge)/3, 0) / recorded.length;
  const album = { id: ++S.albumCounter, quality, trackCount: recorded.length };
  S.songs = S.songs.filter(s => s.state !== "recorded");
  releaseAlbum(album);
  return true;
}

// --- Smarter AI: write a backlog of demos, then record them all, then ship ---
function aiTurn() {
  if (S.pendingTask) return;
  const recorded = S.songs.filter(s => s.state === "recorded").length;
  const demos = S.songs.filter(s => s.state === "demo");
  // Ship as soon as we have 4+ recorded
  if (recorded >= 4 && S.cash >= 1000) { shipAlbum(); return; }
  // Record demos
  if (demos.length > 0 && S.cash >= 700 && recorded < 4) { recordSong(demos[0].id); return; }
  // Keep writing until 4 in queue
  if (demos.length + recorded < 4 && S.cash >= 700) { writeSong(); return; }
  // Otherwise idle (saving up)
}

// --- Run 100 weeks ---
const samples = [];
for (let w = 0; w < 100; w++) {
  aiTurn();
  advanceWeek();
  if ((w+1) % 10 === 0) {
    samples.push({
      week: `Y${S.year} W${S.week}`,
      fans: S.fans,
      cash: Math.round(S.cash),
      lifetimeSales: S.albums.reduce((a,b)=>a+b.lifetimeSales,0),
      albumCount: S.albums.length,
      songsBacklog: S.songs.length,
    });
  }
}

console.log("Week-by-10 snapshot:");
console.table(samples);
console.log("\nFinal album discography:");
console.table(S.albums.map(a => ({
  id: a.id,
  quality: a.quality.toFixed(2),
  tracks: a.trackCount,
  released: `Y${a.releasedYear} W${a.releasedWeek}`,
  lifetime: a.lifetimeSales,
})));
console.log(`\nFinal state: fans=${S.fans}, cash=${Math.round(S.cash)}, albums=${S.albums.length}`);
