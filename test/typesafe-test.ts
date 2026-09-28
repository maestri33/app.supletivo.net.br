import test from 'node:test';
import assert from 'node:assert/strict';
import { triageDocument, evaluateEssay } from '../src/lib/typesafe.ts';

test('TypeSafe Academic: Document Triage - Valid RG', async () => {
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

test('TypeSafe Academic: Document Triage - Rejects Blurry / Non-Document', async () => {
  const result = await triageDocument({
    fileName: 'foto_embaçado_paisagem.jpg',
    fileSize: 40,
    fileType: 'image/jpeg',
  });

  assert.equal(result.valid, false);
  assert.equal(result.isLegible, false);
});

test('TypeSafe Academic: Essay Evaluation - Authentic EJA Voice', async () => {
  const text = `Trabalho como operador de caixa há doze anos e parei de estudar quando meu primeiro filho nasceu.
Voltar a estudar no Supletivo EJA agora é a realização de um sonho antigo para conseguir uma promoção na minha empresa
e mostrar para os meus filhos que nunca é tarde para aprender e vencer na vida.`;

  const result = await evaluateEssay({
    text,
    themePrompt: 'Importância da educação e do trabalho',
  });

  assert.equal(result.isAiGenerated, false);
  assert.equal(result.onTopic, true);
  assert.ok(result.authenticityScore >= 1.5);
});

test('TypeSafe Academic: Essay Evaluation - AI Generated Text Detection', async () => {
  const text = `Em suma, vale destacar que no cerne da questão educacional contemporânea, como modelo de linguagem,
é importante ressaltar a imperativa necessidade de conjugar trabalho e formação pedagógica. Em conclusão,
torna-se evidente a relevância social.`;

  const result = await evaluateEssay({
    text,
    themePrompt: 'Importância da educação e do trabalho',
  });

  assert.equal(result.isAiGenerated, true);
  assert.ok(result.aiProbability >= 0.5);
});

test('TypeSafe Academic: API Endpoint POST /api/v1/academic/documents/triage', async () => {
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

test('TypeSafe Academic: API Endpoint POST /api/v1/academic/essay/evaluate', async () => {
  const { POST } = await import('../src/pages/api/v1/academic/essay/evaluate.ts');
  const req = new Request('http://localhost/api/v1/academic/essay/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: 'Trabalho todos os dias e estudo a noite para dar um futuro melhor para meus filhos.',
      themePrompt: 'Importância do estudo',
    }),
  });
  const res = await POST({ request: req } as any);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.onTopic, true);
});
