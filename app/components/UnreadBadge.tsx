export default function UnreadBadge({ count }: { count: number }) {
  if (count < 1) return null;
  return (
    <span className="unread-count" role="status" aria-label={`${count} mensajes sin leer`}>
      <span aria-hidden="true">{count > 99 ? "99+" : count}</span>
    </span>
  );
}
