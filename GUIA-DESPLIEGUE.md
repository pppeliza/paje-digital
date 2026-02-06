# 🎄 Paje Digital - Guía de Despliegue

## 📋 Paso 1: Configurar Supabase

### 1.1 Crear las tablas en la base de datos

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard
2. En el menú lateral, haz clic en **SQL Editor**
3. Copia TODO el contenido del archivo `supabase-schema.sql`
4. Pégalo en el editor SQL
5. Haz clic en **Run** (botón verde en la esquina inferior derecha)
6. Deberías ver un mensaje de éxito ✅

### 1.2 Crear el bucket de almacenamiento para imágenes

1. En el menú lateral de Supabase, haz clic en **Storage**
2. Haz clic en **New bucket**
3. Configura así:
   - **Name**: `gift-images`
   - **Public bucket**: ✅ Activado (muy importante)
   - **File size limit**: 5 MB
   - **Allowed MIME types**: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
4. Haz clic en **Create bucket**

### 1.3 Configurar políticas del bucket

1. En Storage, haz clic en el bucket `gift-images`
2. Ve a la pestaña **Policies**
3. Crea las siguientes políticas haciendo clic en **New policy**:

**Política 1 - Ver imágenes (SELECT):**
```sql
CREATE POLICY "Anyone can view gift images"
ON storage.objects FOR SELECT
USING (bucket_id = 'gift-images');
```

**Política 2 - Subir imágenes (INSERT):**
```sql
CREATE POLICY "Authenticated users can upload gift images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'gift-images'
  AND auth.role() = 'authenticated'
);
```

**Política 3 - Eliminar imágenes (DELETE):**
```sql
CREATE POLICY "Users can delete their own gift images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'gift-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### 1.4 Obtener las credenciales de Supabase

1. En el menú lateral, ve a **Project Settings** (icono de engranaje)
2. Haz clic en **API**
3. Guarda estos dos valores (los necesitarás para Vercel):
   - **Project URL**: `https://ybbsjuhrdxjdtbzwoive.supabase.co`
   - **anon public key**: `eyJ...` (una clave larga que empieza con eyJ)

⚠️ **IMPORTANTE**: Necesito que me proporciones la **anon public key** (la clave pública anónima) para actualizar el código. La que me diste antes parece ser una clave secreta (empieza con `sb_secret_`).

---

## 📋 Paso 2: Desplegar en Vercel

### 2.1 Preparar el código

1. Crea una cuenta en GitHub si no la tienes: https://github.com
2. Crea un nuevo repositorio (puede ser privado):
   - Nombre: `paje-digital`
   - Descripción: "Aplicación para organizar regalos de Reyes"
3. Sube todos los archivos que te he proporcionado al repositorio

### 2.2 Conectar con Vercel

1. Ve a Vercel: https://vercel.com
2. Haz clic en **Add New...** → **Project**
3. Selecciona **Import Git Repository**
4. Autoriza a Vercel para acceder a tu GitHub
5. Selecciona el repositorio `paje-digital`

### 2.3 Configurar el proyecto en Vercel

En la configuración del proyecto:

1. **Framework Preset**: Vite
2. **Build Command**: `npm run build`
3. **Output Directory**: `dist`
4. **Install Command**: `npm install`

### 2.4 Añadir variables de entorno

En la sección **Environment Variables**, añade:

```
VITE_SUPABASE_URL = https://ybbsjuhrdxjdtbzwoive.supabase.co
VITE_SUPABASE_ANON_KEY = [TU_ANON_PUBLIC_KEY_AQUÍ]
```

⚠️ Reemplaza `[TU_ANON_PUBLIC_KEY_AQUÍ]` con la clave anon public que obtuviste en el paso 1.4

### 2.5 Desplegar

1. Haz clic en **Deploy**
2. Espera 2-3 minutos mientras se construye y despliega
3. ¡Listo! Te dará una URL como `https://paje-digital.vercel.app`

---

## 🎯 Paso 3: Probar la aplicación

1. Abre la URL que te dio Vercel
2. Regístrate con un usuario
3. Crea una familia
4. Guarda el código de invitación
5. Regístrate con otro usuario (puedes usar el modo incógnito del navegador)
6. Únete a la familia con el código
7. Sube regalos y prueba las funcionalidades

---

## 🔧 Solución de problemas

### Error: "Invalid API key"
- Verifica que hayas copiado bien la **anon public key** (no la secret key)
- Asegúrate de que las variables de entorno en Vercel están bien configuradas

### Error: "Storage bucket not found"
- Verifica que el bucket `gift-images` está creado en Supabase
- Verifica que es público
- Verifica que las políticas están bien configuradas

### Las imágenes no se suben
- Verifica las políticas del bucket
- Verifica que el bucket es público
- Verifica que los MIME types permitidos incluyen las imágenes que intentas subir

### No puedo registrarme
- Ve a Supabase → Authentication → Providers
- Verifica que "Email" está habilitado
- Desactiva "Confirm email" si quieres que sea más rápido (para desarrollo)

---

## 📱 Funcionalidades implementadas

✅ Registro y login de usuarios
✅ Creación de familias (grupos)
✅ Códigos de invitación únicos
✅ Sistema de roles (admin/miembro)
✅ Subir regalos con:
  - Nombre
  - Descripción (talla, color, etc.)
  - Enlace
  - Foto
✅ Reservar/des-reservar regalos
✅ Los usuarios NO ven quién reservó SUS regalos
✅ Los usuarios SÍ ven quién reservó los regalos de OTROS
✅ Notificaciones automáticas (en la base de datos, listas para mostrar)
✅ Diseño responsive (funciona en móvil y escritorio)
✅ Tema navideño con colores festivos

---

## 🎨 Próximas mejoras (opcionales)

- [ ] Mostrar notificaciones en la interfaz
- [ ] Enviar notificaciones por email
- [ ] Permitir editar regalos
- [ ] Añadir filtros y búsqueda
- [ ] Modo oscuro
- [ ] Compartir enlaces directos a familias
- [ ] Exportar lista de regalos a PDF

---

## 📞 Soporte

Si tienes algún problema durante el despliegue, avísame y te ayudo a solucionarlo paso a paso.
