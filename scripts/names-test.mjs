import { okName } from "../lib/names.mjs";
const fail = (m) => { console.error("FAIL", m); process.exit(1); };
if (okName("  Mary   Smith ") !== "Mary Smith") fail("tidy");
if (okName("Anselm Hook") !== "Anselm Hook" || okName("Ida") !== "Ida" || okName("Rhea Tolliver") !== "Rhea Tolliver") fail("plain names pass");
if (okName("") !== "" || okName(null) !== "") fail("empty");
if (okName("sh1t") !== "" || okName("Dave Sh!thead") !== "") fail("mild profanity, leet, inside a name");
console.log("names: tidy, plain names pass, profanity blocked");
