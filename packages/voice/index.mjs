// @gertrude/voice: the part a server imports. Mint a token so a signed-in person can open a line to the agent. The agent
// itself runs in a separate worker process (see worker.mjs) and is dispatched automatically to every room on the project.
import { AccessToken, RoomConfiguration, RoomAgentDispatch } from "livekit-server-sdk";
export const configured = () => !!(process.env.LIVEKIT_URL && process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET);
export const ROOM_PREFIX = process.env.VOICE_ROOM_PREFIX || "line-";
// A room per call: the identity is the brain's person id, the room name carries it too so the worker can find the person
// before anyone speaks. ttl is short; the token only opens the door.
export async function roomToken({ identity, name = "", ttl = "10m", metadata = "", agent = process.env.LIVEKIT_AGENT_NAME || "", attributes = undefined }) {
  if (!configured()) throw new Error("voice is not configured (LIVEKIT_URL/API_KEY/API_SECRET)");
  const room = ROOM_PREFIX + identity + "-" + Math.random().toString(36).slice(2, 8);
  const at = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, { identity, name, ttl, metadata, ...(attributes ? { attributes } : {}) });
  at.addGrant({ room, roomJoin: true, roomCreate: true, canPublish: true, canSubscribe: true, canPublishData: true });
  // A named agent is dispatched only when asked for (a worker started with LIVEKIT_AGENT_NAME_OVERRIDE); unnamed workers take every room.
  if (agent) at.roomConfig = new RoomConfiguration({ agents: [new RoomAgentDispatch({ agentName: agent })] });
  return { url: process.env.LIVEKIT_URL, token: await at.toJwt(), room };
}
