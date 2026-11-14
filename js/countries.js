// Países del mundo (ISO 3166-1 alpha-2). Nombres en español vía Intl; banderas de https://flagsapi.com
const CODES = ('AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN WF WS YE YT ZA ZM ZW XK').split(' ');
const dnEs = new Intl.DisplayNames(['es'], { type: 'region' }), dnEn = new Intl.DisplayNames(['en'], { type: 'region' });
const nameOf = (d, c) => { try { const n = d.of(c); return n && n !== c ? n.replace(/^RAE de (.*?) \(China\)$/, '$1') : ''; } catch (e) { return ''; } }; // 'RAE de Hong Kong (China)' -> 'Hong Kong'

// Normaliza para comparar: sin tildes, sin paréntesis, minúsculas.
export const norm = t => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\(.*?\)/g, ' ').replace(/[^a-z0-9 ]/gi, ' ').toLowerCase().replace(/\s+/g, ' ').trim();

export const COUNTRIES = CODES.map(c => ({ code: c, name: nameOf(dnEs, c) || nameOf(dnEn, c) || c })).sort((a, b) => a.name.localeCompare(b.name, 'es'));
export const countryName = code => (COUNTRIES.find(c => c.code === code) || {}).name || '';

const ALIAS = { 'hong kong': 'HK', macao: 'MO', eeuu: 'US', 'ee uu': 'US', usa: 'US', 'estados unidos de america': 'US', inglaterra: 'GB', escocia: 'GB', gales: 'GB', corea: 'KR', 'republica checa': 'CZ', holanda: 'NL', birmania: 'MM', 'costa de marfil': 'CI', taiwan: 'TW', palestina: 'PS', vaticano: 'VA' };
const INDEX = new Map();
COUNTRIES.forEach(c => { INDEX.set(norm(c.name), c.code); INDEX.set(norm(nameOf(dnEn, c.code)), c.code); });

// Texto libre ("Japón", "Hong Kong / China", "JP") -> código ISO, o '' si es desconocido.
export function findCode(text) {
  for (const part of String(text || '').split(/[\/,;]/)) {
    const n = norm(part); if (!n) continue;
    const p = part.trim();
    if (/^[A-Z]{2}$/.test(p) && CODES.includes(p)) return p;
    const c = ALIAS[n] || INDEX.get(n); if (c) return c;
  }
  return '';
}
