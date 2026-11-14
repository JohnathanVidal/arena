// Importación de peleadores desde Excel. Columnas: Personaje | Arte marcial / Estilo | País | Resumen breve
import { findCode, norm } from './countries.js';

// Convierte filas (array de arrays) en peleadores. Detecta columnas por su encabezado; si no hay, usa el orden A-D.
export function rowsToPeople(rows) {
  const head = (rows[0] || []).map(norm), hasHead = head.some(h => /personaje|nombre|pais/.test(h));
  const col = (keys, d) => { const i = head.findIndex(h => keys.some(k => h.includes(k))); return i >= 0 ? i : d; };
  const [n, st, pa, de] = [col(['personaje', 'nombre'], 0), col(['estilo', 'arte'], 1), col(['pais'], 2), col(['resumen', 'descrip', 'contexto'], 3)];
  const val = v => String(v == null ? '' : v).trim();
  return rows.slice(hasHead ? 1 : 0).map(r => ({ name: val(r[n]), style: val(r[st]), country: findCode(r[pa]), desc: val(r[de]) })).filter(p => p.name);
}

// SheetJS se carga bajo demanda (solo al importar).
export async function parsePeople(file) {
  const X = await import('https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs');
  const wb = X.read(await file.arrayBuffer());
  return rowsToPeople(X.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '' }));
}
