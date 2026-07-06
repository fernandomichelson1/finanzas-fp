# Conectar el backend (Supabase) — guía paso a paso

La app funciona **sin backend** (modo local, datos en el navegador). Para que **Fer y
Pao** compartan los datos con sincronización en vivo, seguí estos pasos. El acceso es
**sin contraseña**: se entra eligiendo perfil. Todo es **gratis** (plan free de Supabase).

## 1. Crear el proyecto

1. Entrá a https://supabase.com → **Sign up** (con Google o email).
2. **New project** → nombre `finanzas-fp`, elegí una contraseña de base de datos
   (guardala) y una región cercana (ej. São Paulo). Esperá ~1 minuto.

## 2. Crear las tablas

1. En el proyecto, menú izquierdo → **SQL Editor** → **New query**.
2. Copiá y pegá todo el contenido de [`supabase/schema.sql`](supabase/schema.sql).
3. **Run**. Debería decir "Success".

## 3. Conectar la app

1. Menú izquierdo → **Project Settings** → **API**. Copiá:
   - **Project URL**
   - **anon public** key (la clave larga "anon").
2. En la raíz del proyecto, copiá `.env.example` a `.env` y completá:

   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGc...
   ```

3. Reiniciá el server (`npm run dev`). Se entra eligiendo perfil (Fer o Pao), **sin
   contraseña**, y los datos quedan guardados y sincronizados entre los dos.

> Si las variables están vacías, la app sigue en modo local (sin nube). Útil para
> desarrollo.

## Notas

- Los datos del hogar se guardan en la tabla `household_state` (un documento JSON).
- La sincronización es en vivo: lo que carga uno aparece en el otro al toque.
- En el deploy (Vercel), estas mismas variables se cargan en *Environment Variables*.
