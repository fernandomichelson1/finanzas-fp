// Seam de backend. La app consume el store; el store se hidrata/sincroniza con
// la nube vía estos helpers (Supabase). En modo local todo es no-op y la
// persistencia la maneja el middleware `persist` del store. El acceso es sin
// login: se entra eligiendo perfil y la base acepta el rol anónimo.
//
// Para cambiar de proveedor (Firebase, backend propio), reimplementá `cloud.ts`
// manteniendo la misma superficie.
export { fetchRemote, saveRemote, ensureRemoteState, startCloudSync, stopCloudSync, type SyncedState } from './cloud';
