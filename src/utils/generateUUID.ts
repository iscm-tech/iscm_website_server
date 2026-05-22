import { v4 } from "uuid";

export default function generateID(): string {
  const uuid = v4();

  return uuid;
}
