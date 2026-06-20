// The two AI hosts. Speakers in the transcript are 'A'/'B'; these are their
// display names (must match the server's engine/config host names).
export const HOSTS: Record<string, string> = {
  A: 'Alex',
  B: 'Maya',
};

/** Resolve a transcript speaker code to a host name. */
export function hostName(speaker: string): string {
  return HOSTS[speaker] ?? speaker;
}

/** "Alex & Maya" — for the player's hosts byline. */
export const HOSTS_LABEL = `${HOSTS.A} & ${HOSTS.B}`;
