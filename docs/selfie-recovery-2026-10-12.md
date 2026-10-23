# Selfie: observed production failure and recovery

## Production evidence

The owner's enrollment received the live selfie on 2026-10-12 at 13:40 UTC.
Its stored status is `review`, not pending: the biometric comparison attempted
`http://localhost:8001` from the Azure backend and received connection refused.
No biometric container exists on that VM. A biometric container exists only on
the developer's Docker Desktop. Both enrollment and candidate call the same
`users.roles._selfie.add_face_match` gate. No approval was forced or gate disabled.

The production browser showed “Avisamos você em instantes” for review, inviting
the user to wait for a result that needs coordinator intervention. The student
also saw an unnecessary new consent/camera control after a received selfie.

## Frontend repair

- Shared live camera: 15-second permission deadline, 8-second playback/frame and
  image encoding deadlines, cancellation, retry, release of late streams.
- Capture is unavailable until real video dimensions/frames exist. Disconnects
  and occupied/denied cameras have actionable feedback. No gallery upload added.
- Student reload resumes pending analysis. A poll deadline gives visible feedback.
- Student/promoter review explicitly states coordinator review, without claiming
  automatic completion soon. Received selfies do not request another capture.

## Technical checks

- TypeScript and Astro diagnostics: no errors, warnings or hints (120 files).
- Workflow regression run: 26 checks passed, including 7 new recovery checks.
- Separate live-frame capture/upload-failure checks: student and promoter passed
  (canvas-generated camera frames, local API fixtures, no real personal data).
- 3 unit checks cover timeout, cancellation, late stream release, denial/success.
- These automated fixtures do not prove production biometric approval.

## Library research and remaining work

- [MediaDevices](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
  can remain unresolved if the permission prompt is ignored.
- [webcam-easy](https://github.com/bensonruan/webcam-easy) wraps camera/capture;
  [webrtc-adapter](https://github.com/webrtcHacks/adapter) handles browser differences.
  Neither documents a solution to our missing biometric service; adding a dependency
  is not justified for the bounded camera lifecycle repair.
- The biometric deployment location requires the owner's answer because the
  standing requirement places AI on Cloudflare. The currently configured
  InsightFace model also needs its production usage terms checked:
  [official model license](https://github.com/deepinsight/insightface#license).
- Restore the real comparison service, warm/load the model, check a real positive
  and negative comparison, then reprocess the stored canary via the normal pipeline.
- The contract returned by production still contains placeholder wording. This
  must be replaced by the owner's official contract; no legal text was invented.

## Release / rollback

Frontend patch 0.0.0-sandbox.96; backend remains its education .95 artifact.
Before deployment record `wrangler deployments list` into local evidence. Rollback
with `wrangler rollback <previous-version-id> --config wrangler.jsonc`, then check
the student and candidate routes. No database migrations or user data changes.
User homologation and a complete production biometric pass remain outstanding.
