//#region src/lib/poll.ts
var POLL_INTERVAL_MS = 2500;
var POLL_MAX_MS = 6e4;
/**
* Polling bounds from the upload ack (`poll_after_ms`/`expires_at`), with safe
* defaults if the server doesn't send them. The deadline is an absolute
* timestamp (ms) so the caller can stop even if the loop blocks.
*/
function ackPoll(ack) {
	const intervalMs = ack?.poll_after_ms && ack.poll_after_ms > 0 ? ack.poll_after_ms : POLL_INTERVAL_MS;
	const exp = ack?.expires_at ? Date.parse(ack.expires_at) : NaN;
	return {
		intervalMs,
		deadlineMs: Number.isFinite(exp) ? Math.min(exp, Date.now() + POLL_MAX_MS) : Date.now() + POLL_MAX_MS
	};
}
//#endregion
export { ackPoll as t };
