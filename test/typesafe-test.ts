import test from 'node:test';
import assert from 'node:assert/strict';
import { triageDocument } from '../src/lib/typesafe.ts';

test('TypeSafe Enrollment: Document Triage - Valid CNH', async () => {
  const result = await triageDocument({
    fileName: 'cnh_digital_aluno_2026.pdf',
    fileSize: 102400,
    fileType: 'application/pdf',
    textSnippet: 'Carteira Nacional de Habilitação DETRAN PR Nascimento 15/05/1992',
  });

  assert.equal(result.valid, true);
  assert.equal(result.docType, 'cnh');
  assert.equal(result.is18Plus, true);
  assert.equal(result.isLegible, true);
});

test('TypeSafe Enrollment: Document Triage - Rejects Blurry / Non-Document', async () => {
  const result = await triageDocument({
    fileName: 'foto_embaçado_paisagem.jpg',
    fileSize: 40,
    fileType: 'image/jpeg',
  });

  assert.equal(result.valid, false);
  assert.equal(result.isLegible, false);
});

test('TypeSafe Enrollment: Document Triage - Valid Comprovante de Residência', async () => {
  const result = await triageDocument({
    fileName: 'fatura_energia_copel_2026.pdf',
    fileSize: 85000,
    fileType: 'application/pdf',
    textSnippet: 'Conta de Consumo Energia Elétrica COPEL Vencimento 10/09/2026',
  });

  assert.equal(result.valid, true);
  assert.equal(result.docType, 'comprovante_residencia');
  assert.equal(result.isLegible, true);
});

test('TypeSafe Enrollment: Document Triage - Rejects Underage Candidate (<18 for EJA)', async () => {
  const result = await triageDocument({
    fileName: 'rg_candidato_menor.jpg',
    fileSize: 64000,
    fileType: 'image/jpeg',
    textSnippet: 'Registro Geral SSP PR Nascimento 12/08/2011 (menor de 18 anos)',
  });

  assert.equal(result.valid, false);
  assert.equal(result.is18Plus, false);
});

test('TypeSafe Enrollment: API Endpoint POST /api/v1/academic/documents/triage', async () => {
  const { POST } = await import('../src/pages/api/v1/academic/documents/triage.ts');
  const req = new Request('http://localhost/api/v1/academic/documents/triage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: 'rg_frente_aluno.jpg',
      fileSize: 50000,
      fileType: 'image/jpeg',
      textSnippet: 'Registro Geral SSP PR Nascimento 10/10/1990',
    }),
  });
  const res = await POST({ request: req } as any);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.valid, true);
  assert.equal(data.docType, 'rg');
});
