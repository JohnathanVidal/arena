// Punto de entrada: control de sesión, carga de datos, migración y arranque de la UI.
import { onUser, loginGoogle, logout, friendlyAuthError } from './auth.js?v=3';
import { loadAll, resetSnapshot, setReporter, sync, readLocal, wasMigrated, markMigrated } from './db.js?v=3';
import { setData, getData, setUser, render, resetView, status } from './ui.js?v=3';

const $ = id => document.getElementById(id);
const show = w => ['login', 'loader', 'app'].forEach(k => { $(k).hidden = k !== w; });
const loader = (msg, err) => { show('loader'); $('loader-msg').textContent = msg; $('loader-act').hidden = !err; $('spin').hidden = !!err; };
const ask = () => new Promise(res => { $('mig').hidden = false; const done = v => { $('mig').hidden = true; res(v); }; $('mig-yes').onclick = () => done(true); $('mig-no').onclick = () => done(false); });
let user = null;

async function start(u) {
  loader('Cargando tus datos…');
  try {
    const data = await loadAll(u.uid);
    setData(data); setUser({ name: u.displayName || u.email }); resetView();
    const loc = readLocal();
    if (loc && !wasMigrated(u.uid)) {            // datos antiguos de localStorage: solo se migran si el usuario acepta
      const yes = await ask(); markMigrated(u.uid);
      if (yes) {
        loader('Migrando datos…');
        const ids = new Set([...data.series, ...data.trash].map(x => x.id));
        for (const k of ['series', 'trash']) for (const x of loc[k]) { if (ids.has(x.id)) x.id = Math.random().toString(36).slice(2, 9); data[k].push(x); }
        await sync(() => data);
      }
    }
    show('app'); render();
  } catch (e) { console.error(e); loader('No se pudieron cargar tus datos. Revisa tu conexión.', true); }
}

setReporter(status);
$('btn-login').onclick = async () => { $('login-err').textContent = ''; try { await loginGoogle(); } catch (e) { $('login-err').textContent = friendlyAuthError(e); } };
$('btn-retry').onclick = () => user && start(user);
$('btn-out').onclick = () => logout();
$('status').onclick = () => { if ($('status').classList.contains('error')) sync(getData).then(ch => ch && render()); };
onUser(u => {
  user = u;
  if (!u) { setData({ series: [], trash: [] }); resetSnapshot(); show('login'); return; }  // sin sesión no se muestra la app
  start(u);
});
