# Identity capture and CNH renewal release .91 — 2026-10-11

Latest publication: app `.93` retains the `.92` fixes for step/document-specific reasons, settled review guidance and actionable PDF errors. Backend `.93` preserved all five `.92` overlay hashes. Seven real UI cases, original RG/CNH queue runs and a declared live-network recovery probe passed. [Technical closure and evidence](../../backend.supletivo.net.br/docs/production-audit/identity-pending-closure-2026-10-12.md) supersede the pending-state statements in this historical `.91` report; they do not homologate the complete platform.

App and backend `.91` are published with guarded renewal of CNH credentials. The final real UI reupload passed identity matching and replaced old registration/category with values compared against the original CNH; expiry matched and uncertain RENACH remained null. Original full RG JPG also passed on `.91`, following the `.89` PNG/PDF and both separate orders with reload. Earlier CNH timeouts and incorrect extraction remain recorded below: final success does not establish repeatable provider availability, a complete promoter enrollment, address approval or platform readiness. Only the user homologates delivery.

## Final real .91 observations and cleanup

RG full original JPG task `fe98f9dc6f8348dfaba01c3805ca6353` ran `2026-10-12T01:49:56.029Z`–`01:50:08.123Z` (still 11 October in São Paulo). It approved one `full` source with name/CPF/birth date matching. The UI showed RG approved and both sides received in the same file; the [local screenshot](rg-retest-v91-full-jpg.png) contains no expanded identity values.

CNH final reupload task `765db6dc57d0467bb997c0098dfbece1` ran `2026-10-12T01:51:07.532Z`–`01:51:41.389Z`. Original PDF comparison confirmed extracted and persisted registration/category/expiry. Old registration/category were replaced; invalid numeric RENACH was cleared because the new reading was uncertain. The UI showed identity checked. GOWA observed outgoing approvals: RG `3EB03E71CB17FCDB1D4C44` at `01:50:09Z`, CNH `3EB064B0CB7EB3CECA615C` at `01:51:43Z`. Existing profile values were preserved, not counted as newly extracted CNH fields.

The first `.91` CNH reupload task `9a0c7fbbd4484e10bee07f37eb6ec40b` reached safe review after a 60086 ms Scout read timeout at `2026-10-11T21:37:32.299Z`. The final success used the same published timeout/configuration. Scout intermittency is still open. The candidate also displayed an old address reason in its global error block during identity and kept checking text after reaching review; those UX defects require a separate bounded fix.

After recording the result, the test-only candidate and parking user were removed, the temporary candidate role revoked and the historical suspended promoter restored. Student identity, paid lead, proposal prices, commissions and Diandra's default hub/promoter remained intact. The browser was returned to the student's identity page. No address file, selfie or signature was submitted in this matrix. [Final sanitized backend evidence](../../backend.supletivo.net.br/docs/production-audit/identity-retest-v91-evidence.json) and [full retest report](../../backend.supletivo.net.br/docs/production-audit/identity-retest-2026-10-11.md) preserve the failed attempts as well as successes.

## Published CNH renewal .91

| Evidence | Observed value |
| --- | --- |
| App/backend release | `0.0.0-sandbox.91` |
| Backend artifact SHA256 | `3466b120c0d98076d5dbe9b3c159326677dc9714a8356ef3140a7a8bfdd69ced` |
| Backend web/qcluster image | `sha256:a30a4ae2976b4767fed6fa40958ee796b43c8a9a8f58545209cf86e314319119` |
| Backend built at | `2026-10-11T21:31:55.825954Z` |
| Backend promoted at | `2026-10-11T21:35:42.694126Z` |
| Backend health | `db=true`; zero pending migrations |
| App Worker `.91` | `aaab7a43-602a-41da-870f-4175d2310301` |
| App/oracle observation | `2026-10-11T21:36:17.872Z` |
| Broad local gate | 137 tests passed in 10.95 s; app build passed |
| Focused renewal gate | 80 tests passed in 5.34 s, including 20 new renewal cases |
| Real `.91` CNH reupload | Final identity/registration/category/expiry comparison passed; old credentials replaced; earlier timeout retained as open intermittency |

The `.90` reader retains Scout identity/validity and reads only registration/category with Cloudflare Gemma. The `.91` persistence fix replaces previous CNH number/category only when the new payload has a valid 11-digit registration, a canonical category and matching identity. These checks also protect automatic filling after a human decision; the human decision itself remains final. Invalid previous RENACH is cleared when the new reading is uncertain; a valid previous RENACH is retained without a new valid reading. Existing profile data and RG filling behavior are preserved.

The focused renewal gate ran `tests/test_candidate_credential_renewal.py`, `tests/test_candidate_doc_race.py`, `tests/test_identity_visual_transcription.py` and `tests/test_candidate_document_pipeline_contract.py`. Its 80-test count differs from the earlier 80-test offline audit below. All local adapter/controlled-failure results remain separate from the real `.91` queue and persistence observations above.

### Current rollback reference: .91 to .90

Restore app `.90` Worker `a0033036-e403-491b-8ffe-abab1a275fc8`. From the verified `.91` backend release directory, the reviewed code rollback command is:

```sh
python release.py rollback --expected-artifact 3466b120c0d98076d5dbe9b3c159326677dc9714a8356ef3140a7a8bfdd69ced
```

The controller restores the saved `.90` web/qcluster images and verifies their digests. It does not restore or roll back the database, reverse migrations or change records. This is a rollback reference; no rollback was executed for this documentation update.

## Capture contract and implementation

Students submit RG only, through one capture area. Promoter candidates use that same capture state for RG or CNH; the first recognized file determines the type automatically. Recognition identifies `front`, `back`, or `full` from the actual file. An unknown result cannot default to the requested side.

Each recognized face is uploaded immediately. A confirmed storage ACK enables capture of the missing face without waiting for asynchronous OCR. Both face receipts, or one complete-file receipt, end collection. `full` means both physical sides in one file or the complete digital document. JPG, PNG and PDF are supported; PDF is limited to two pages and rendered as its actual composition by PDFium in an isolated child process.

- `StudentRgEnrollmentView.svelte`: one capture area, accessible source dialog, recognition before upload, asynchronous polling and authenticated preview. Student enrollment accepts RG only.
- `PromoterCandidateView.svelte` and `rg-capture.ts`: shared RG/CNH capture state, automatic initial type, confirmed ACK receipts, missing-side capture, rejection recapture and GET revision/sequence checks.
- Backend capture resets remove pointers and photo verdicts from the previous capture mode when switching between a complete file and separate faces. A rejected identity can be recaptured even when visual photo checks had passed.
- Structured extraction checks the holder name, including marriage variations, the printed CPF when present and birth date before automatic approval and filling. Filling after a human decision also runs the identity check; the decision and automatic filling are separate.
- Generation, validation status and source paths are rechecked before applying a result, finalizing an inference error or performing late filling after review. The profile is reread after inference. A stale read cannot apply its old result to a changed upload or decision.
- The new reader normalizes an omitted `cpf_present` to null. An unreadable/unknown CPF presence or invalid CPF goes to review; it cannot silently become an absent CPF.
- PDF classification has a 50-second total budget, up to 45 seconds for inference, and a 60-second browser timeout in both student and promoter views. RG and CNH use separate side descriptions. Address proof still uses the shared classifier; this change does not establish address acceptance.

The existing adaptive role/status navigation remains in the shared layout. These changes do not introduce manual identity approval in the browser.

## Historical .89 publication and technical checks

| Evidence | Observed value |
| --- | --- |
| Published app release | `0.0.0-sandbox.89` |
| App Worker version | `a38a8864-5ec5-498d-a8ab-2487566c5c83` |
| Published backend release | `0.0.0-sandbox.89` / `identity-retest-20261011-v89` |
| Backend artifact SHA256 | `df34b84257ede903705d170eed487e7b63364890d9a556261beca3993a1a4fe7` |
| Backend image | `sha256:fe692adf9baea6537cedcc37573918b0a682fbeb9de34fa0e9041e3bcb7fba86` |
| Backend built at | `2026-10-11T20:59:11.085448Z` |
| Backend promoted at | `2026-10-11T21:00:14.346082Z` |
| Cloudflare gateway `.89` Worker | `96bc4518-859e-404f-9eb3-202e3e4bcb56` |
| Focused tests | 27 backend, including 4 new bounded-recovery cases; 27 frontend passed |
| Exact previous local test set | 80 passed with offline adapters and controlled failures |
| Frontend checks | Astro checked 117 files with zero errors; build passed |
| Production `.89` complete-file retests | PNG and PDF passed; one `full` source and matching identity checks each |
| Production `.89` separate-face retests | Front→back and back→front with reload approved; matching identity checks |
| Promoter `.89` rejection cases | 9 real chooser inputs rejected; type and CNH pointers remained unset |
| CNH capture outcome after `.89` failure | Final corrected `.91` reupload passed identity and original credential comparison; provider intermittency remains open |

The tests cover the implemented capture, identity and PDF paths. They are separate from real model accuracy and deployment evidence. The `.87` app Worker was `cd7d7dc1-fde4-4407-9016-f6e4fcb1036a`, and its focused test run had 48 backend/27 frontend passes. Earlier desktop/360 px UI inspection and the 25-test run belong to the previous student-only capture release.

## Observed .88 OCR failure and bounded .89 recovery

A later real RG upload on `.88` reached `review` at `2026-10-11T20:54:09Z` after Cloudflare OCR raised “Não foi possível extrair dados estruturados do documento.” The earlier `.88` approval did not establish that a fresh capture would repeatedly complete successfully.

The gateway had discarded `response_format` and `chat_template_kwargs`, replaced the actual finish reason with `stop`, and returned empty usage. In `.89`, it forwards JSON and thinking options, defaults Gemma `enable_thinking` to false, and preserves upstream `choices`, `usage` and finish reasons. For legacy text responses without a finish reason, it uses null and does not invent token usage. Authentication, the Cloudflare model allowlist and model/provider selection are preserved.

The RG reader explicitly requests JSON mode and permits at most **two total attempts**: the first read and one recovery for a retryable inference failure or unstructured response. A non-retryable failure stops immediately. Exhausted recovery proceeds to the existing manual-review path; it cannot fabricate identity data or approval.

Student RG polling uses the ACK's `poll_after_ms` and absolute `expires_at`, with bounded defaults when absent. It stops rescheduling at expiry or when analysis settles. Poll generation and snapshot revision/sequence checks discard late responses; a consultation failure retains confirmed upload receipts. Expiry or a stopped poll is not document approval. The backend TTL/review result remains authoritative.

The gateway TypeScript check, package dry-run and 11 local contract cases with a simulated AI binding passed. Their evidence is local; the live `.89` results are recorded separately below.

## Observed production capture retests on .89

| Authorized real queue task | Started UTC | Completed UTC | Observed result |
| --- | --- | --- | --- |
| Complete RG PNG: `97050aceaa0b4c7a868be242a7180e72` | `2026-10-11T21:01:06.218Z` | `2026-10-11T21:01:17.659Z` | Name/CPF/birth date all `match`; fields filled; only one `full` source |
| Complete RG PDF: `9eb263ca621044658a05cdf0c7345496` | `2026-10-11T21:02:25.552Z` | `2026-10-11T21:02:36.231Z` | Name/CPF/birth date all `match`; fields filled; only one `full` source |
| Separate RG front→back with reload: `400324ed53924cb2b1553bf503522e85` | `2026-10-11T21:07:18.172Z` | `2026-10-11T21:07:24.549Z` | Approved; name/CPF/birth date all `match` |
| Separate RG back→front with reload: `28af36113696488289b20edbe3dc4755` | `2026-10-11T21:08:53.985972Z` | `2026-10-11T21:09:03.718817Z` | Approved; name/CPF/birth date all `match` |

When the UI requested the RG back, offering the already received front was rejected with “Esse lado já foi recebido. Envie o verso do RG.” A separate direct backend replay of identical front/back bytes returned `DOCUMENT_SIDE_DUPLICATE` and preserved the stored front. The later front→back run exercised reload and completed approval; its [captured UI evidence](rg-retest-v89-separated.png) is retained locally.

Both separate RG orders with reload are now observed as approved. GOWA also observed outgoing RG-approved notifications for complete PNG (`3EB0B90F521F5285BE68B6`, `2026-10-11T21:01:18Z`), complete PDF (`3EB06DEB9B841488C164F6`, `2026-10-11T21:02:37Z`) and front→back (`3EB0263968C01C9A9A66BE`, `2026-10-11T21:07:26Z`). These message records do not include recipient or extracted identity values.

The promoter complete CNH was classified as `cnh_full` and the UI did not ask for another side. Wrong-name task `02248608881a4040890ea496f12c544a` completed at `2026-10-11T21:13:36.149Z` with rejection and `identity_checks.name=mismatch`, without applying fields. The subsequent matching-identity CNH run exposed the extraction failure below; the complete promoter journey remains open.

### Observed .89 CNH credential extraction failure

Real queue task `a7602bae46e14bc391ca2c8f9a03594b` ran from `2026-10-11T21:14:06.592Z` to `2026-10-11T21:14:51.304Z`. Name/CPF/birth date matched and the document became approved, but the CNH `number` copied the `DOC. IDENTIDADE` field, including issuing-agency/state letters (`SESP`/UF), and the category was wrong. Comparison against the original PDF confirmed the mismatch. Identity approval does not establish correct CNH credential transcription; this is a failed CNH happy-path retest.

The credential reader first published in `.90` preserves Scout OCR and its identity JSON, adds a focused Cloudflare Gemma read of the registration number/category using the original image and four quadrant views, and overrides only those credential fields. An uncertain newly extracted RENACH remains null. The `.91` renewal fix additionally handles previously persisted credentials; corrected queue persistence was observed in the final task above.

The local correction gate passed **43 tests** in `tests/test_identity_visual_transcription.py`, with offline adapters and controlled failures. Coverage includes preserving Scout identity/validity, credential-only overrides, missing/invalid values, nulling invalid RENACH and bounded attempts. A separate real Cloudflare helper probe matched registration/category against the original PDF. That direct probe does not establish corrected queue persistence or a completed promoter CNH workflow.

The real `.90` CNH queue task `97875c27d5c24d08b76bfb4f44676201` encountered a Scout network timeout after 60,089 ms and reached review at `2026-10-11T21:25:58Z`. It did not automatically approve or fill fields. The first `.91` reupload also timed out before the later final reupload passed; both failures remain part of this audit.

### Evidence scopes and rejection cases

The **19 deterministic cases** were executed by `backend/.release-build/identity_retest_rules.py` inside the production container: 14 controlled mutations of the already stored real OCR's name/CPF/birth-date fields and 5 real file-decoder cases. They invoked validators/decoders without AI inference or database writes. They are production-process rule checks, distinct from the 80 local tests with offline adapters and controlled failures and from real browser capture cases.

The **10 production UI rejection cases**, observed before `.89`, were empty file, unsupported format, oversized file, corrupt JPG, corrupt PDF, encrypted PDF, PDF with three pages, blank PNG, illegible PNG and CNH offered in the student RG flow. All were rejected; these are not `.89` happy-path or promoter-CNH validation.

The **9 promoter-candidate rejection cases on `.89`** used the real chooser: empty file, unsupported format, oversized file, corrupt JPG, blank PNG, illegible PNG, corrupt PDF, encrypted PDF and PDF with three pages. All were rejected. After these nine inputs, `candidate.doc_type` was still null and CNH photo pointers were absent, verified at `21:12 UTC`, before the subsequent accepted complete-CNH capture.

The [sanitized UI evidence export](../../backend.supletivo.net.br/docs/production-audit/identity-retest-ui-2026-10-11.json) contains **35 entries**, including failed and final CNH observations. This is an event/case record, not 35 complete or approved document workflows.

## Historical .89 rollback reference

Restore the app `.88` Worker `68c5c611-d875-4ad0-ae97-aa5fde5d664e` and gateway `.88` Worker `a0593d51-3e7f-4204-9357-2483a03734c8`. From the verified `identity-retest-20261011-v89` backend staging directory, the code rollback command is:

```sh
python release.py rollback --expected-artifact df34b84257ede903705d170eed487e7b63364890d9a556261beca3993a1a4fe7
```

The controller restores the saved `.88` web/qcluster images and verifies their digests, without database rollback, migration reversal or restoration of records. This is a rollback reference; no rollback was executed for this documentation update.

## Observed production RG canary on .88

The authorized reanalysis used the same already stored complete RG. Its original bytes were preserved, SHA256 `0974c3938952f4780b5896348c51ff7158c335fd8214cc4941515bdec9261aad`. Real queue task `73b93bbbcf084a0e8f43d29b92489b3e` was enqueued at `2026-10-11T20:20:01Z` and completed with `success=true`. The RG became `approved`, with `identity_checks.name=match`, `identity_checks.cpf=match` and `identity_checks.birth_date=match`, validated at `2026-10-11T20:21:23.362152Z`.

The extraction returned `name`, `cpf`, `number`, `ocr_text`, `birth_date`, `birthplace`, `issue_date`, `mother_name`, `father_name` and `issuing_agency`. Persistence checks confirmed that the RG number matches the transcription and the birth date matches; mother/father names, birthplace, issuing agency and issue date were filled. The values themselves are not reproduced here. The production Gemma vision check took 13.139 s; its OCR/identity reading took 68.355 s.

The real `.88` UI displayed “RG aprovado”, confirmation that front and back were received in the same file, and “Continuar matrícula”. GOWA observed the outgoing RG-approved notification at `2026-10-11T20:21:25Z`, message ID `3EB02E5E19086DEA831747`. No phone number, CPF or extracted personal value is included in this record.

This establishes production queue processing, guarded identity validation, persistence, UI state and notification for the preserved RG. It does not represent a fresh upload through the UI, a new payment or a new registration.

## Real pre-deployment evaluation of the .88 readers

The earlier Scout RG probe classified verso as `front`, and its complete-RG extraction returned a wrong CPF. An early Gemma trial also read the complete RG CPF incorrectly. The corrected RG reader now groups rotations 0/90/180/270 of each source in one bounded Gemma 4 call, without sending expected name, CPF or birth date to the model. Its real pre-deployment calls matched the authorized name, CPF and birth date for the complete RG and for the RG back image.

| Real pre-deployment probe | Observed result | Duration |
| --- | --- | --- |
| Gemma classification, RG front | `front` | 13.03 s |
| Gemma classification, RG back | `back` | 6.95 s |
| Gemma classification, complete RG | `full` | 8.20 s |
| Gemma classification, complete CNH PDF | `full` | 24.80 s |
| Gemma classification, blank image | Not a document | 8.68 s |
| Gemma reading, complete RG, four orientations | Name/CPF/birth date matched | 33.23 s |
| Gemma reading, RG back, four orientations | Name/CPF/birth date matched | 41.55 s |
| CNH reader, Scout OCR plus Cloudflare text JSON | Name/CPF/birth date matched; validity extracted | 25.35 s |

Gemma returned an invalid CPF for CNH with duplicated views, which the identity guard sent to review; its single-view trial did not return JSON. The published `.88` CNH reader therefore uses Cloudflare Scout OCR followed by Cloudflare text-to-JSON extraction, without expected identity in the prompt. It shares capture, validation and antifraud checks with RG. The earlier real CNH production probe was non-mutating and matched name/CPF/birth date; the new pre-deployment reading also extracted validity. Neither is a completed promoter enrollment.

At that historical observation, the global oracle and deployed gateway were `.88`, Worker `a0593d51-3e7f-4204-9357-2483a03734c8`. The backend uses Gemma for RG reading and Scout plus Cloudflare text extraction for CNH; `.89` preserves this selection. The successful `.88` reanalysis above demonstrates that individual Gemma run, while the later OCR failure motivates the current recovery release.

## Cloudflare-only AI and acceptance boundary

All application AI uses Cloudflare Workers AI exclusively: text inference, visual recognition, OCR/extraction and other inference workloads. Calls and credentials stay server-side through the gateway at `https://supletivo-ai-gateway.v7m.live`. No inference token belongs in the browser, frontend bundle, source or baked image. Backend web and qcluster must use the protected Cloudflare configuration. Main databases remain on Azure; D1 serves edge data.

Production guards must reject fake/non-Cloudflare providers, development loopback endpoints, missing inference configuration and failed real inference. Reachability, health, an allowed-model listing or a successful HTTP response do not establish correct side recognition or CPF extraction.

The authorized RG has historical `.88` production evidence for identity checks, approved persistence, UI and notification, followed by a real `.88` OCR failure. The `.89` complete-RG PNG/PDF and both separate-face orders with reload passed. The promoter rejected nine invalid chooser inputs without selecting a type or persisting CNH pointers. Its matching-identity `.89` CNH run persisted wrong registration/category. The final `.91` reupload matched the original credential fields and renewed old values after matching identity, as recorded above; two earlier Scout timeouts still demonstrate intermittency. Promoter enrollment end to end and address extraction/approval are not homologated. The remaining student/promoter/hub journey and its payment and partner effects remain open. Only the owner validates and homologates the delivery.

## Historical evidence and its limit

Before the Cloudflare-only integration, an undecided classifier result had silently fallen back to `front`, even for a complete RG. The backend processes used fake inference and an unavailable MiniMax loopback endpoint. Those observations explain the original failure; restoring that provider or requiring an Infisical login is not the release path.

In the earlier `.82` app / `.84` backend canary, the complete RG was recognized as `full`, uploaded, extracted and persisted as `approved` under older identity rules. That earlier status alone did not prove CPF accuracy. The `.88` reanalysis/failure and `.89` RG/rejection observations remain historical evidence. Current `.91` evidence adds original full RG JPG and the final CNH reupload with original credential comparisons and replacement of old fields. The earlier CNH credential failure and two Scout timeouts remain recorded. Existing enrollment and financial records were preserved.

Track the capture implementation in [app#17](https://github.com/maestri33/app.supletivo.net.br/issues/17) and the Cloudflare integration/accuracy evidence in [backend#22](https://github.com/maestri33/backend.supletivo.net.br/issues/22).
