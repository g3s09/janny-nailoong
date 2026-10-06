"use client";
import PrivateMedia from "./PrivateMedia";
export default function ProfileAvatar({
  name,
  path,
}: {
  name: string;
  path?: string | null;
}) {
  return (
    <span className="dm-avatar profile-avatar">
      {path ? (
        <PrivateMedia path={path} alt={`Foto de ${name}`} inline />
      ) : (
        <span aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>
      )}
    </span>
  );
}
