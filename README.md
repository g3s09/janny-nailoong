# El rincón de Janny

Aplicación privada para dos personas, hecha con Next.js, Supabase y Motion. Producción: https://janny-nailoong.vercel.app.

## Desarrollo

1. Instalar con `npm ci`.
2. Copiar `.env.example` a `.env.local` y completar la URL y clave publicable de Supabase.
3. Ejecutar `npm run dev`.

Nunca colocar claves secretas o `service_role` en variables `NEXT_PUBLIC_*`. `.env.local` está excluido de Git.

La vista local sin Supabase solo se habilita en desarrollo. En producción, la falta de configuración mantiene cerrado el acceso.

## Comprobaciones

- `npm run lint`
- `npm run typecheck`
- `npm test`: políticas de privacidad, cartas programadas, adjuntos y economía con PostgreSQL embebido.
- `npm run build`

## Acceso y privacidad

El acceso usa enlaces enviados al correo invitado. El cliente conserva la sesión y renueva los tokens; cada navegador/dispositivo tiene su propia sesión. Cerrar sesión, borrar cookies, usar navegación privada o invalidar la sesión puede exigir otro enlace.

Los usuarios autorizados necesitan una cuenta en Supabase Auth y una fila en `profiles`. Los roles únicos `gela` y `janny` limitan la aplicación a dos perfiles. El diario pertenece exclusivamente a su autora. El buzón permite texto e imágenes/audio y se actualiza con Realtime y comprobaciones periódicas.

La migración `supabase/migrations/001_private_world.sql` ya se instaló en el proyecto remoto. No ejecutarla otra vez a ciegas: no es una migración completamente idempotente. Mantener los cambios posteriores en migraciones nuevas.

## Animaciones y accesibilidad

Los diálogos usan entrada/salida con Motion y mantienen el modal hasta terminar el cierre. Escape, el botón de cerrar y el clic exterior cierran la sección y restauran el foco. Los efectos respetan `prefers-reduced-motion`. Las sugerencias de escritura son opcionales, editables y no envían ni guardan contenido automáticamente.

## Instalación y límites actuales

El manifiesto, los iconos y el service worker permiten instalar la web como PWA. El botón de instalación ofrece instrucciones cuando el navegador no expone instalación directa. La pantalla sin conexión solo almacena recursos públicos; no guarda cartas ni diarios en caché.

- La mensajería necesita internet. Las notificaciones actuales se muestran dentro de la aplicación; no hay notificaciones push con la app cerrada.
- La animación actual de Nailoong parte del PNG original. El soporte Rive es opcional y requiere proporcionar un archivo `.riv` compatible.
- Las fotos, cartas y fechas personales deben aportarlas los usuarios; no se generan recuerdos ficticios.
- La validación final entre dos dispositivos requiere que ambos abran sus enlaces y envíen/reciban un mensaje real.

## Publicación

El repositorio en GitHub despliega `main` en Vercel. Variables de producción: `NEXT_PUBLIC_SUPABASE_PROJECT_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; se conservan alias anteriores para compatibilidad. Comprobar siempre el resultado del despliegue después de publicar.
