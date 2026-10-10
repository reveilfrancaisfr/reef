// Remplace le paquet "rolldown" dans le serveur Vercel (voir astro.config.mjs).
// L'adapter ne s'en sert que pendant le build ; la fonction qui repond aux visiteurs n'en a pas besoin.
export function rolldown() {
  throw new Error("rolldown n'existe pas dans la fonction serveur : il ne sert qu'au build.");
}
