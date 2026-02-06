# 🎄 Paje Digital

**Aplicación web para organizar los regalos de Reyes en familia**

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18.2-blue.svg)
![Supabase](https://img.shields.io/badge/Supabase-Database-green.svg)

---

## ✨ Características

- 👥 **Gestión de Familias**: Crea grupos familiares y comparte códigos de invitación
- 🎁 **Lista de Regalos**: Cada miembro sube sus regalos deseados con fotos, enlaces y detalles
- 🔒 **Privacidad**: No puedes ver quién reservó tus propios regalos
- 👀 **Transparencia**: Sí puedes ver quién reservó los regalos de otros familiares
- 📱 **Responsive**: Funciona perfectamente en móvil, tablet y escritorio
- 🔔 **Notificaciones**: Sistema de notificaciones cuando hay actividad en la familia
- 🖼️ **Imágenes**: Sube fotos de los regalos que deseas
- 🔗 **Enlaces**: Comparte links directos a productos

---

## 🚀 Inicio Rápido

### Requisitos previos

- Cuenta en [Supabase](https://supabase.com) (gratis)
- Cuenta en [Vercel](https://vercel.com) (gratis)
- Cuenta en [GitHub](https://github.com) (gratis)

### Instalación

Sigue la **[Guía de Despliegue completa](GUIA-DESPLIEGUE.md)** para instrucciones paso a paso.

**Resumen rápido:**

1. **Configurar Supabase**:
   - Ejecutar el script SQL (`supabase-schema.sql`)
   - Crear bucket de storage `gift-images`
   - Obtener las credenciales API

2. **Desplegar en Vercel**:
   - Subir código a GitHub
   - Conectar repositorio con Vercel
   - Configurar variables de entorno
   - Deploy automático ✅

---

## 🛠️ Tecnologías

- **Frontend**: React 18 + Vite
- **Estilos**: Tailwind CSS
- **Backend/DB**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Storage**: Supabase Storage
- **Hosting**: Vercel
- **Iconos**: Lucide React

---

## 📂 Estructura del Proyecto

```
paje-digital/
├── src/
│   ├── main.jsx           # Punto de entrada
│   └── index.css          # Estilos globales
├── paje-digital.jsx       # Componente principal
├── supabase-schema.sql    # Schema de la base de datos
├── package.json           # Dependencias
├── vite.config.js         # Configuración de Vite
├── tailwind.config.js     # Configuración de Tailwind
├── index.html             # HTML principal
└── GUIA-DESPLIEGUE.md     # Guía paso a paso
```

---

## 🎮 Uso

1. **Regístrate** con tu email y contraseña
2. **Crea una familia** o únete a una existente con un código
3. **Añade tus regalos** con todos los detalles que quieras
4. **Reserva regalos** de otros familiares cuando decidas regalarlos
5. **Disfruta** de una Navidad organizada sin sorpresas duplicadas

---

## 🔐 Seguridad y Privacidad

- ✅ Autenticación segura con Supabase Auth
- ✅ Row Level Security (RLS) en todas las tablas
- ✅ Los usuarios solo ven datos de sus familias
- ✅ Nadie ve quién reservó sus propios regalos
- ✅ Las contraseñas están hasheadas
- ✅ HTTPS obligatorio en producción

---

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Haz fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

## 🎄 ¡Felices Fiestas!

Desarrollado con ❤️ para facilitar la organización de regalos en familia.

Si tienes problemas o sugerencias, abre un issue en GitHub.
