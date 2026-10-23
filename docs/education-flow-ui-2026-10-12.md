# UI/UX escolaridade — aluno e promotor

O fluxo agora separa as regras de negócio por papel e termina com uma confirmação explícita de veracidade.

- **Aluno:** Fundamental 1–9 ou Médio 1–3; o 3º ano concluído mostra bloqueio e não envia a matrícula. Quem parou
  no 3º ano pode seguir. A tela pede UF e só depois carrega as cidades do IBGE.
- **Promotor:** Fundamental, Médio ou Superior, incluindo Superior completo/interrompido. A formação superior
  aceita graduação, pós-graduação, mestrado e doutorado.
- **Modal:** texto de responsabilidade específico para cada papel, checkbox obrigatório, SVG inline de proteção,
  foco inicial no checkbox, foco preso no diálogo e animação desativada com `prefers-reduced-motion`.
- **Falha do IBGE:** timeout de 8 segundos, mensagem recuperável e envio bloqueado até existir um par UF/cidade válido.

O contrato enviado sempre inclui `declaration_accepted: true`. A API é a fonte dos dados; o frontend não inventa
status nem aprovação.
