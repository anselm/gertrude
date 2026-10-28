// Names people hand Gertrude: what they want to be called, and the names of people they mention. Checked word by word
// against handle-guard's hashed lists (no slurs in this repo), never as a sentence, because a real name must not be blocked
// for containing a syllable. Returns the tidied name, or "" if it will not do.
import { createGuard } from "./handle-guard/index.mjs";
const guard = createGuard({ reserved: false });
export function okName(s, max = 80) {
  const n = String(s || "").trim().replace(/\s+/g, " ").slice(0, max);
  if (!n) return "";
  return n.split(" ").some((w) => guard.isOffensive(w)) ? "" : n;
}
export const NAME_WONT_DO = "that is not a name I will write down; what would they rather be called?";
