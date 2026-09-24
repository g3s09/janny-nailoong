import { NextResponse } from "next/server";
import { after } from "next/server";
import { serverDb } from "@/lib/supabase/server";
import { InputError, parseMessage } from "@/lib/validation";
import { dispatchPush, pushReady } from "@/lib/push-server";

export const maxDuration = 60;
const failure = (error: string, status: number, retryable = false) =>
  NextResponse.json(
    { error, retryable },
    { status, headers: { "Cache-Control": "private, no-store" } },
  );

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return failure("Solicitud no permitida.", 403);
  if (Number(request.headers.get("content-length")) > 65536)
    return failure("La carta es demasiado grande.", 413);
  const db = await serverDb();
  if (!db)
    return failure("La conexión privada aún no está configurada.", 503, true);
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user)
    return failure("Vuelve a iniciar sesión para enviar tu carta.", 401, true);
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > 65536)
      return failure("La carta es demasiado grande.", 413);
    let input: unknown;
    try {
      input = JSON.parse(raw);
    } catch {
      return failure("El envío no es válido.", 400);
    }
    const submission = parseMessage(input, user.id);
    const { data, error } = await db.rpc("send_private_message", {
      request_key: submission.requestId,
      recipient: submission.recipientId,
      message_body: submission.body,
      file_path: submission.attachment,
      file_type: submission.attachmentType,
      special: submission.important,
      delivery: submission.deliverAt,
    });
    if (error) {
      if (error.code === "42501")
        return failure("Tu cuenta no puede realizar este envío.", 403);
      if (error.code === "22023" || error.code === "23514")
        return failure(
          "Revisa el contenido, la fecha y el archivo de la carta.",
          400,
        );
      if (error.code === "PGRST202")
        return failure(
          "El envío necesita completar una actualización del servidor. Tu borrador está a salvo.",
          503,
          true,
        );
      return failure(
        "No pudimos confirmar la entrega. Reintenta el mismo envío de forma segura.",
        503,
        true,
      );
    }
    if (pushReady())
      after(async () => {
        try {
          await dispatchPush(user.id);
        } catch {
          /* The scheduled worker retries pending jobs. */
        }
      });
    return NextResponse.json(
      { message: data },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return e instanceof InputError
      ? failure(e.message, 400)
      : failure(
          "No pudimos confirmar la entrega. Puedes reintentar sin duplicar la carta.",
          503,
          true,
        );
  }
}
