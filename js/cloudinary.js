// Subida de fotos a Cloudinary (unsigned). Firestore solo guarda la secure_url, nunca base64.
const CLOUD = 'dbdkdszoe', PRESET = 'arena_unsigned', FOLDER = 'arena', MAX = 400;

// Recorta al centro (cuadrado) y reduce a un máximo de 400x400 antes de subir.
function resize(src) {
  return new Promise((ok, no) => {
    const im = new Image();
    im.onload = () => {
      const m = Math.min(im.width, im.height), sz = Math.min(MAX, m), c = document.createElement('canvas');
      c.width = c.height = sz;
      c.getContext('2d').drawImage(im, (im.width - m) / 2, (im.height - m) / 2, m, m, 0, 0, sz, sz);
      c.toBlob(b => b ? ok(b) : no(new Error('No se pudo procesar la imagen')), 'image/jpeg', .85);
    };
    im.onerror = () => no(new Error('Imagen no válida'));
    im.src = src;
  });
}

async function upload(blob) {
  const f = new FormData();
  f.append('file', blob); f.append('upload_preset', PRESET); f.append('folder', FOLDER);
  const r = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, { method: 'POST', body: f });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.secure_url) throw new Error((j.error && j.error.message) || 'Error al subir la imagen a Cloudinary');
  return j.secure_url;
}

export async function uploadFighterImage(file) {
  const u = URL.createObjectURL(file);
  try { return await upload(await resize(u)); } finally { URL.revokeObjectURL(u); }
}

const isDataUrl = s => typeof s === 'string' && s.startsWith('data:');

// Sube a Cloudinary cualquier imagen base64 heredada (datos locales o importados). Devuelve true si cambió algo.
export async function ensureCloudImages(serie) {
  let changed = false;
  for (const f of serie.fighters || []) if (isDataUrl(f.img)) { f.img = await upload(await resize(f.img)); changed = true; }
  return changed;
}
