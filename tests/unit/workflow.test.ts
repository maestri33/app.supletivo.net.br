import test from "node:test";
import assert from "node:assert/strict";
import {
  ADMIN_PDF_MAX_UPLOAD_BYTES,
  DEFAULT_MAX_UPLOAD_BYTES,
  documentFileError,
  imageError,
  pdfFileError,
  safeReturnTo,
} from "../../src/components/interactive/student/workflow.ts";

function fakeFile(name: string, type: string, size: number): File {
  const file = new File(["x"], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

test("imageError enforces JPG/PNG/WebP and default 10 MB limit", () => {
  assert.equal(imageError(fakeFile("rg.jpg", "image/jpeg", DEFAULT_MAX_UPLOAD_BYTES)), null);
  assert.equal(
    imageError(fakeFile("rg.pdf", "application/pdf", 1024)),
    "Envie uma imagem JPG, PNG ou WebP legível.",
  );
  assert.equal(
    imageError(fakeFile("rg.png", "image/png", DEFAULT_MAX_UPLOAD_BYTES + 1)),
    "Escolha um arquivo de até 10 MB.",
  );
});

test("documentFileError enforces 10 MB by default and 15 MB when explicitly configured", () => {
  assert.equal(documentFileError(fakeFile("conta.pdf", "application/pdf", DEFAULT_MAX_UPLOAD_BYTES)), null);
  assert.equal(
    documentFileError(fakeFile("conta.pdf", "application/pdf", DEFAULT_MAX_UPLOAD_BYTES + 1)),
    "Escolha um arquivo de até 10 MB.",
  );
  assert.equal(
    documentFileError(fakeFile("espelho.pdf", "application/pdf", ADMIN_PDF_MAX_UPLOAD_BYTES), ADMIN_PDF_MAX_UPLOAD_BYTES),
    null,
  );
  assert.equal(
    documentFileError(fakeFile("espelho.pdf", "application/pdf", ADMIN_PDF_MAX_UPLOAD_BYTES + 1), ADMIN_PDF_MAX_UPLOAD_BYTES),
    "Escolha um arquivo de até 15 MB.",
  );
});

test("pdfFileError requires application/pdf and 15 MB admin limit", () => {
  assert.equal(pdfFileError(fakeFile("diploma.png", "image/png", 1024)), "Envie um arquivo PDF válido.");
  assert.equal(pdfFileError(fakeFile("diploma.pdf", "application/pdf", ADMIN_PDF_MAX_UPLOAD_BYTES)), null);
  assert.equal(
    pdfFileError(fakeFile("diploma.pdf", "application/pdf", ADMIN_PDF_MAX_UPLOAD_BYTES + 1)),
    "Escolha um arquivo de até 15 MB.",
  );
});

test("safeReturnTo allows only same-origin relative paths without backslashes", () => {
  const origin = "https://app.supletivo.net.br";
  assert.equal(safeReturnTo("/student/active?tab=1#top", origin), "/student/active?tab=1#top");
  assert.equal(safeReturnTo("//evil.example/phish", origin), null);
  assert.equal(safeReturnTo("/\\evil.example", origin), null);
  assert.equal(safeReturnTo("https://evil.example/phish", origin), null);
  assert.equal(safeReturnTo("/admin/@evil.example", origin), "/admin/@evil.example");
});
