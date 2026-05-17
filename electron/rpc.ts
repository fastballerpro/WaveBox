/**
 * Discord Rich Presence integration. Optional & non-fatal.
 * Set DISCORD_CLIENT_ID env or in Settings later. If the user has no Discord
 * running, all calls are silently ignored.
 */

let RPC: any = null;
let client: any = null;
let connected = false;

const DEFAULT_CLIENT_ID = process.env.DISCORD_CLIENT_ID || '1290000000000000000'; // placeholder

async function ensureClient(clientId = DEFAULT_CLIENT_ID) {
  if (!RPC) {
    try {
      RPC = require('discord-rpc');
    } catch {
      return null;
    }
  }
  if (client) return client;
  client = new RPC.Client({ transport: 'ipc' });
  client.on('ready', () => {
    connected = true;
  });
  try {
    await client.login({ clientId });
  } catch {
    client = null;
    connected = false;
    return null;
  }
  return client;
}

export async function setPresence(activity: {
  title: string;
  artist: string;
  artwork?: string | null;
  durationMs?: number;
  positionMs?: number;
}) {
  const c = await ensureClient();
  if (!c || !connected) return;
  const startTimestamp = activity.positionMs ? Math.floor((Date.now() - activity.positionMs) / 1000) : undefined;
  const endTimestamp =
    activity.durationMs && activity.positionMs !== undefined
      ? Math.floor((Date.now() + (activity.durationMs - activity.positionMs)) / 1000)
      : undefined;
  try {
    await c.setActivity({
      details: activity.title.slice(0, 128),
      state: `by ${activity.artist}`.slice(0, 128),
      largeImageKey: activity.artwork || 'wavebox',
      largeImageText: 'Wavebox',
      smallImageKey: 'play',
      smallImageText: 'Playing',
      startTimestamp,
      endTimestamp,
      instance: false,
    });
  } catch {
    /* ignore */
  }
}

export async function clearPresence() {
  if (!client || !connected) return;
  try {
    await client.clearActivity();
  } catch {
    /* ignore */
  }
}
