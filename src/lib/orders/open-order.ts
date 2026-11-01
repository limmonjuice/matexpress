import { canSeeOrder } from "./proof";
import { findOrder } from "./repo";
import { currentUser, mightBeSignedIn, provenOrders } from "./session";

/**
 * The order, if this browser may open it, and who's asking. A browser with no session and
 * no proof can't open any order, so it costs no query, and a guess takes the same time
 * whether the number exists or not.
 */
export async function openOrder(number: string) {
  const [proven, session] = await Promise.all([provenOrders(), mightBeSignedIn()]);
  if (!session && !proven.includes(number)) return { user: undefined };
  const [user, found] = await Promise.all([currentUser(), findOrder(number)]);
  return { user, found: found && canSeeOrder(found.order, proven, user) ? found : undefined };
}
