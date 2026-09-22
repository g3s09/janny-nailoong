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

Los diálogos usan entrada/salida con Motion y mantienen el modal hasta terminar el cierre. Escape, el botón de cerrar y el clic exterior cierran la sección y restauran el foco. Los efectos respetan `prefers-reduced-motion`. Las sugerencias de escritura son opcionales y editables: rellenan el borrador, pero nunca envían una carta ni publican una entrada del diario por sí solas.

El buzón agrupa cartas por día y permite saltar al mensaje más reciente. Los borradores de cartas y diario se guardan localmente por perfil, se recuperan si tienen menos de 30 días y se eliminan al cerrar sesión; no se sincronizan entre dispositivos. Los archivos deben seleccionarse otra vez. La vista `/preview` conserva borradores solo en memoria y reinicia la bienvenida, con el nombre vacío, al recargar. En producción solo el perfil administrador puede abrirla.

## Avisos con la aplicación cerrada

El código de Web Push está implementado, pero necesita configuración del servidor antes de activarse. La interfaz indica su disponibilidad real y nunca pide permiso por sí sola.

1. Instalar `supabase/migrations/002_private_push.sql` una sola vez después de la 001.
2. Generar claves VAPID con `npx web-push generate-vapid-keys` y guardarlas como secretos del servidor en Vercel: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` y `VAPID_SUBJECT` (`mailto:` de contacto).
3. Guardar `SUPABASE_SERVICE_ROLE_KEY` y un `PUSH_DISPATCH_SECRET` aleatorio fuerte en el servidor. Nunca publicarlos ni prefijarlos con `NEXT_PUBLIC_`.
4. Guardar el mismo secreto de envío en Supabase Vault, nombre `janny_push_dispatch_secret`. Ejecutar `supabase/push-scheduler.sql` para los envíos y reintentos cada minuto. El planificador no contiene el valor del secreto.
5. Volver a desplegar y activar los avisos voluntariamente desde cada cuenta/dispositivo. En iOS se necesita la aplicación instalada en la pantalla de inicio.

El aviso contiene solo un texto genérico, nunca nombres, cartas o adjuntos. La cola respeta `deliver_at`, omite cartas leídas y permite hasta cinco intentos durante 24 horas. La entrega depende del navegador, la conectividad y los permisos del dispositivo. Cerrar sesión elimina la suscripción del dispositivo actual; «Desactivar mis avisos» elimina las suscripciones de toda la cuenta.

## Instalación y límites actuales

El manifiesto, los iconos y el service worker permiten instalar la web como PWA. El botón de instalación ofrece instrucciones cuando el navegador no expone instalación directa. La pantalla sin conexión solo almacena recursos públicos; no guarda cartas ni diarios en caché.

- La mensajería necesita internet. Los avisos dentro de la aplicación funcionan independientemente de la configuración opcional de Web Push.
- La animación actual de Nailoong parte del PNG original. El soporte Rive es opcional y requiere proporcionar un archivo `.riv` compatible.
- Las fotos, cartas y fechas personales deben aportarlas los usuarios; no se generan recuerdos ficticios.
- La validación final entre dos dispositivos requiere que ambos abran sus enlaces y envíen/reciban un mensaje real.

## Publicación

El repositorio en GitHub despliega `main` en Vercel. Variables de producción: `NEXT_PUBLIC_SUPABASE_PROJECT_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; se conservan alias anteriores para compatibilidad. Comprobar siempre el resultado del despliegue después de publicar.
