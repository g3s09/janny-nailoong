export default function DraftStatus({
  status,
  preview,
  files = false,
}: {
  status: "loading" | "empty" | "saved" | "unavailable";
  preview: boolean;
  files?: boolean;
}) {
  return (
    <small className="draft-note" role="status">
      {status === "unavailable"
        ? "No se pudo conservar el borrador. Mantén esta sección abierta para no perder tus cambios."
        : status === "loading"
          ? "Recuperando tu borrador…"
          : preview
            ? "Borrador temporal: se conserva hasta reiniciar esta prueba."
            : status === "saved"
              ? "Borrador guardado en este dispositivo."
              : "Tus cambios se guardan como borrador en este dispositivo."}
      {files &&
        " Los archivos deben volver a seleccionarse si todavía no se han enviado."}
    </small>
  );
}
