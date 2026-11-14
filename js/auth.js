// Autenticación: solo Google Sign-In.
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { auth } from './firebase-config.js?v=3';

const provider = new GoogleAuthProvider();

export async function loginGoogle() {
  try { await signInWithPopup(auth, provider); }
  catch (e) {
    if (e.code === 'auth/popup-blocked') return signInWithRedirect(auth, provider); // navegadores que bloquean popups
    if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') return;
    throw e;
  }
}
export const logout = () => signOut(auth);
export const onUser = cb => onAuthStateChanged(auth, cb);

export function friendlyAuthError(e) {
  return ({
    'auth/unauthorized-domain': 'Este dominio no está autorizado en Firebase Authentication (Settings → Authorized domains).',
    'auth/configuration-not-found': 'Firebase Authentication aún no está activado en el proyecto: en la consola entra a Authentication → Get started y habilita el proveedor Google.',
    'auth/operation-not-allowed': 'El acceso con Google no está habilitado en Firebase Authentication.',
    'auth/network-request-failed': 'Error de red. Revisa tu conexión e inténtalo de nuevo.'
  })[e.code] || ('No se pudo iniciar sesión: ' + (e.message || e.code));
}
