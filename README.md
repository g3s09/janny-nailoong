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

El acceso principal usa correo y contraseña con Supabase Auth. El cliente conserva la sesión y renueva los tokens; cada navegador/dispositivo tiene su propia sesión. «Crear o recuperar contraseña» envía un enlace solo para establecer una nueva contraseña. El callback `/auth/callback` conduce a `/password`. No existe registro público.

Las cuentas que antes entraban por enlace necesitan asignar una contraseña una vez. Cada persona puede hacerlo desde su enlace de recuperación. Como alternativa administrativa, `npm run setup:passwords` usa `SUPABASE_SERVICE_ROLE_KEY` de `.env.local`, identifica los dos perfiles existentes y solicita confirmación antes de asignar contraseñas generadas. No guarda contraseñas en archivos ni cambia los roles. Si el correo sigue sin confirmar, su dueño debe aceptar la invitación; el script no marca direcciones ajenas como verificadas. `npm run setup:passwords -- --generate-only` solo muestra sugerencias y no cambia ninguna cuenta. No publicar ni compartir la clave administrativa.

Los usuarios autorizados necesitan una cuenta en Supabase Auth y una fila en `profiles`. Los roles únicos `gela` y `janny` limitan la aplicación a dos perfiles. El diario pertenece exclusivamente a su autora. El buzón permite texto e imágenes/audio y se actualiza con Realtime y comprobaciones periódicas.

La migración `supabase/migrations/001_private_world.sql` ya se instaló en el proyecto remoto. No ejecutarla otra vez a ciegas: no es una migración completamente idempotente. Mantener los cambios posteriores en migraciones nuevas.

## Animaciones y accesibilidad

Los diálogos usan entrada/salida con Motion y mantienen el modal hasta terminar el cierre. Escape, el botón de cerrar y el clic exterior cierran la sección y restauran el foco. Los efectos respetan `prefers-reduced-motion`. Las sugerencias de escritura son opcionales y editables: rellenan el borrador, pero nunca envían una carta ni publican una entrada del diario por sí solas.

El buzón agrupa cartas por día y carga el historial en páginas de 40 con un cursor de fecha e identificador. Los eventos de mensajes actualizan esa conversación; el resto de tablas se refresca de forma independiente. Las transiciones se comparten mediante `lib/motion.ts`; preferencias, personaje y conversación viven en `lib/world/`.

Los borradores incluyen texto, ánimo, programación, recuerdos y detalles del administrador. Se guardan localmente por perfil, se recuperan si tienen menos de 30 días y se eliminan al cerrar sesión; no se sincronizan entre dispositivos. La interfaz avisa si falla el almacenamiento. Los archivos todavía no subidos deben seleccionarse otra vez. La vista `/preview` conserva borradores solo en memoria y reinicia la bienvenida, con el nombre vacío, al recargar. En producción solo el perfil administrador puede abrirla.

## Envíos fiables y actualización de la base de datos

1. Aplicar `003_reliable_messages.sql` después de la 001. Añade un identificador único por remitente y la función `send_private_message`. Esta fase conserva compatibilidad con la versión anterior.
2. Desplegar el cliente y `/api/messages`. La API usa la sesión del usuario, valida el contenido y llama a la función; no usa la clave administrativa para enviar cartas. El mismo intento conserva su identificador y sus datos hasta confirmar la respuesta.
3. Aplicar `005_close_legacy_message_writes.sql` después del despliegue para retirar las escrituras directas de clientes antiguos. Nunca aplicar la 005 antes de cambiar el cliente.
4. Si se usa Web Push, aplicar también `004_push_retries.sql` después de la 002. Añade avisos a las cartas futuras cuando una persona se suscribe después de que fueran programadas, y limpia trabajos leídos o caducados.

No publicar el cliente nuevo sin instalar antes la 003: conservará los borradores, pero el servidor no podrá confirmar los envíos. Estas migraciones están preparadas en el repositorio; su presencia no significa que se hayan aplicado al proyecto remoto.

Los formularios bloquean envíos simultáneos y conservan su contenido al fallar. Las cartas se deduplican en PostgreSQL, incluso entre pestañas. Los recuerdos y detalles nuevos reutilizan un identificador en los reintentos. Los adjuntos ya subidos no se eliminan cuando se desconoce si la escritura se confirmó, para evitar romper una carta o recuerdo guardado.

## Avisos con la aplicación cerrada

Web Push envía avisos al destinatario de cada mensaje nuevo, cuando este tiene una suscripción activa. La interfaz consulta su disponibilidad y solicita permiso solo al pulsar «Activar en este dispositivo». El buzón de ambas cuentas incluye ese control.

1. Instalar `supabase/migrations/002_private_push.sql` una sola vez después de la 001.
2. Generar claves VAPID con `npx web-push generate-vapid-keys` y guardarlas como secretos del servidor en Vercel: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` y `VAPID_SUBJECT` (`mailto:` de contacto).
3. Guardar `SUPABASE_SERVICE_ROLE_KEY` y un `PUSH_DISPATCH_SECRET` aleatorio fuerte en el servidor. Nunca publicarlos ni prefijarlos con `NEXT_PUBLIC_`.
4. Guardar el mismo secreto de envío en Supabase Vault, nombre `janny_push_dispatch_secret`. Ejecutar `supabase/push-scheduler.sql` para los envíos y reintentos cada minuto. El planificador no contiene el valor del secreto.
5. Volver a desplegar y activar los avisos voluntariamente desde cada cuenta/dispositivo. En iOS se necesita la aplicación instalada en la pantalla de inicio.

El aviso contiene solo un texto genérico, nunca nombres, cartas o adjuntos. La cola respeta `deliver_at`, omite cartas leídas y permite hasta cinco intentos durante 24 horas. La entrega depende del navegador, la conectividad y los permisos del dispositivo. Cerrar sesión elimina la suscripción del dispositivo actual; «Desactivar en este dispositivo» elimina únicamente la suscripción del navegador actual. Los demás dispositivos conservan sus avisos.

## Instalación y límites actuales

El manifiesto, los iconos y el service worker permiten instalar la web como PWA. El botón de instalación ofrece instrucciones cuando el navegador no expone instalación directa. La pantalla sin conexión solo almacena recursos públicos; no guarda cartas ni diarios en caché.

- La mensajería necesita internet. Los avisos dentro de la aplicación funcionan independientemente de la configuración opcional de Web Push.
- La animación actual de Nailoong parte del PNG original. El soporte Rive es opcional y requiere proporcionar un archivo `.riv` compatible.
- Las fotos, cartas y fechas personales deben aportarlas los usuarios; no se generan recuerdos ficticios.
- La validación manual entre dos dispositivos corresponde a sus usuarios, iniciando sesión con sus contraseñas y enviando/recibiendo un mensaje real.

## Publicación

El repositorio en GitHub despliega `main` en Vercel. Variables de producción: `NEXT_PUBLIC_SUPABASE_PROJECT_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; se conservan alias anteriores para compatibilidad. Comprobar siempre el resultado del despliegue después de publicar.

## Mensajes ocasionales de Nailoong

La pantalla de inicio muestra un globo diferenciado cada 60–100 segundos de disponibilidad, durante 12 segundos. Las frases se barajan sin repetir hasta agotar la lista. Se suspenden con una sección abierta, al cambiar de pestaña, mientras se escribe o al reaccionar Nailoong a otra acción. «Un ratito en silencio» los pausa hasta abandonar o recargar la vista. La vista de prueba utiliza el mismo componente. No escribe datos de progreso ni mensajes en Supabase.

Configuración administrativa completada el 30 de septiembre de 2026: las tablas y funciones de las migraciones 002 y 004 se instalaron sin alterar los mensajes existentes; las cinco variables de Web Push se guardaron como secretos de producción en Vercel. El secreto del programador se guardó en Vault y los dos trabajos de supabase/push-scheduler.sql quedaron activos. Cada persona debe autorizar los avisos en su dispositivo; esto no puede concederse remotamente desde el servidor.


### Chat y álbum (006)

Aplicar `supabase/migrations/006_chat_details.sql` después de 003 y 005. Añade referencias de respuesta, abrazos, corazones propios y un estado de escritura con caducidad de siete segundos. No borra mensajes ni progreso. Las funciones nuevas del chat se habilitan al detectar las tablas; el envío normal sigue usando el RPC existente. El archivo se aplica una sola vez, dentro de una transacción.

Las notas de voz permiten escuchar, descartar y adjuntar hasta tres minutos de grabación. El micrófono se abre únicamente al pulsar Grabar audio. Las fotos se amplían en un álbum con flechas y deslizamiento; las preferencias de color, fondo y sonido se guardan por perfil en cada navegador.
