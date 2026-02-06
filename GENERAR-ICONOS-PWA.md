# Generar Iconos PWA

Necesitas crear dos iconos para que la PWA funcione:

1. **icon-192.png** (192x192 px)
2. **icon-512.png** (512x512 px)

## Opción 1: Usar un generador online (FÁCIL)

1. Ve a: https://www.pwabuilder.com/imageGenerator
2. Sube un logo/imagen (cuadrado, mínimo 512x512)
3. Genera los iconos
4. Descarga y coloca en `/public/`

## Opción 2: Crear manualmente

Crea dos imágenes PNG cuadradas con el logo de Paje Digital:
- Fondo: Rojo (#dc2626) o blanco
- Icono: Un regalo 🎁 o las letras "PD"
- Tamaños: 192x192 y 512x512 píxeles

## Opción 3: Usar el emoji 🎁 (RÁPIDO)

Mientras tanto, puedes usar este código para generar iconos temporales:

```html
<!-- Crea un archivo icon.html y ábrelo en el navegador -->
<!DOCTYPE html>
<html>
<body>
<canvas id="canvas" width="512" height="512"></canvas>
<script>
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Fondo rojo
ctx.fillStyle = '#dc2626';
ctx.fillRect(0, 0, 512, 512);

// Emoji gift
ctx.font = '300px Arial';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('🎁', 256, 280);

// Descargar
const link = document.createElement('a');
link.download = 'icon-512.png';
link.href = canvas.toDataURL();
link.click();

// Para 192x192, cambia width/height a 192 y font a '110px'
</script>
</body>
</html>
```

Ejecuta dos veces (512 y 192) y guarda como:
- `/public/icon-192.png`
- `/public/icon-512.png`

## Ubicación final

Los iconos deben estar en:
```
public/
  ├── icon-192.png
  ├── icon-512.png
  ├── manifest.json
  └── sw.js
```

## Verificar

Una vez subidos a Vercel, verifica que funcionan visitando:
- https://tu-app.vercel.app/icon-192.png
- https://tu-app.vercel.app/icon-512.png

Ambos deben mostrar el icono correctamente.
