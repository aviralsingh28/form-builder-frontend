export function idOf(entity: { _id?: unknown; id?: unknown }): string {
  const v = entity._id ?? entity.id;
  if (v == null) return "";
  return typeof v === "string" ? v : String(v);
}
