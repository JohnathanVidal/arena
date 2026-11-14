// Persistencia en Firestore: users/{uid}/series/{id} y users/{uid}/trash/{id}.
// save() de la UI llama a sync(): compara contra lo ya guardado y escribe/borra solo lo que cambió.
import { collection, doc, getDocs, setDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { db } from './firebase-config.js';
import { ensureCloudImages } from './cloudinary.js';

let uid = null, report = () => {}, chain = Promise.resolve();
const snap = { series: new Map(), trash: new Map() };   // id -> JSON guardado
export const setReporter = f => { report = f; };
export function resetSnapshot() { snap.series.clear(); snap.trash.clear(); uid = null; }

// Firestore no admite arrays dentro de arrays: cada ronda del cuadro se guarda como {m:[...]}.
const toDoc = x => { const o = JSON.parse(JSON.stringify(x)); o.seasons.forEach(q => { if (q.bracket) q.bracket = q.bracket.map(r => ({ m: r })); }); return o; };
const fromDoc = o => { o.seasons.forEach(q => { if (q.bracket) q.bracket = q.bracket.map(r => r.m); }); return o; };

export async function loadAll(u) {
  uid = u; const out = { series: [], trash: [] };
  for (const k of ['series', 'trash']) {
    const qs = await getDocs(collection(db, 'users', uid, k));
    qs.forEach(d => out[k].push(fromDoc({ ...d.data(), id: d.id })));
    out[k].forEach(x => snap[k].set(x.id, JSON.stringify(x)));
  }
  out.series.sort((a, b) => (a.ts || 0) - (b.ts || 0));
  out.trash.sort((a, b) => (b.del || 0) - (a.del || 0));
  return out;
}

async function run(get) {
  if (!uid) return false;
  const S = get(); let changed = false; report('saving');
  try {
    for (const k of ['series', 'trash']) {
      const cur = new Map(S[k].map(x => [x.id, x]));
      for (const x of cur.values()) if (await ensureCloudImages(x)) changed = true;
      for (const [id, x] of cur) {
        const j = JSON.stringify(x);
        if (snap[k].get(id) !== j) { await setDoc(doc(db, 'users', uid, k, id), toDoc(x)); snap[k].set(id, j); }
      }
      for (const id of [...snap[k].keys()]) if (!cur.has(id)) { await deleteDoc(doc(db, 'users', uid, k, id)); snap[k].delete(id); }
    }
    report('saved');
  } catch (e) {
    console.error(e);
    report('error', navigator.onLine ? 'No se pudo guardar. Toca para reintentar.' : 'Sin conexión. Toca para reintentar.');
  }
  return changed;
}
// Cola secuencial: las escrituras se ejecutan en orden y un fallo no bloquea las siguientes.
export function sync(get) { const p = chain.then(() => run(get)); chain = p.catch(() => {}); return p.catch(() => false); }

// ---- Migración desde localStorage (versión anterior de un solo archivo) ----
export function readLocal() {
  try { const d = JSON.parse(localStorage.getItem('arena') || 'null'); if (d && ((d.series || []).length || (d.trash || []).length)) return { series: d.series || [], trash: d.trash || [] }; } catch (e) {}
  return null;
}
export const wasMigrated = u => !!localStorage.getItem('arena_migrated_' + u);
export const markMigrated = u => localStorage.setItem('arena_migrated_' + u, '1');
