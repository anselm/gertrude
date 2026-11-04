// The voice line from the browser: one LiveKit room per call, her audio attached to the page, captions from the agent's
// transcription stream. livekit-client loads only when someone picks up the telephone.
import { rpc } from "./api.js";
export const line = $state({ status: "idle", err: "", seconds: 0, her: "", captions: [] }); // status: idle | connecting | open
let room = null, tick = null, els = [];
export async function open() {
  if (line.status !== "idle") return; line.status = "connecting"; line.err = ""; line.captions = []; line.her = ""; line.seconds = 0;
  try {
    const { Room, RoomEvent } = await import("livekit-client"); const { url, token } = await rpc("voice.token");
    room = new Room({ adaptiveStream: false, dynacast: false });
    room.on(RoomEvent.TrackSubscribed, (track) => { if (track.kind !== "audio") return; const el = track.attach(); el.setAttribute("playsinline", ""); el.style.display = "none"; document.body.appendChild(el); els.push(el); });
    room.on(RoomEvent.ParticipantAttributesChanged, (changed) => { if (changed["lk.agent.state"]) line.her = changed["lk.agent.state"]; });
    room.on(RoomEvent.Disconnected, () => { if (line.status !== "idle") teardown(); });
    room.registerTextStreamHandler("lk.transcription", async (reader, info) => { const a = reader.info.attributes || {}; const id = a["lk.segment_id"] || reader.info.id; const who = info.identity === room.localParticipant.identity ? "you" : "her"; let text = "";
      for await (const chunk of reader) { text += chunk; put(id, who, text, a["lk.transcription_final"] === "true"); } put(id, who, text, true); });
    await room.connect(url, token); await room.localParticipant.setMicrophoneEnabled(true); try { await room.startAudio(); } catch {}
    line.status = "open"; tick = setInterval(() => line.seconds++, 1000);
  } catch (e) { line.err = e?.message || String(e); teardown(); }
}
function put(id, who, text, final) { const i = line.captions.findIndex((c) => c.id === id); const c = { id, who, text, final }; if (i < 0) line.captions = [...line.captions.slice(-5), c]; else line.captions[i] = c; }
export async function hangup() { try { await room?.disconnect(); } catch {} teardown(); }
function teardown() { clearInterval(tick); tick = null; for (const el of els) el.remove(); els = []; room = null; line.status = "idle"; line.her = ""; }
export const clock = (s) => Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
