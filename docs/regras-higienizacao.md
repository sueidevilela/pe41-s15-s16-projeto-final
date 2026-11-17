# Regras de higienização

"Dados higienizados" = limpos, sem ruído, sem nada que identifique alguém, com fonte rastreável
e escritos para o público do CUIDAR. Esta é a prova que o edital pede.

## Etapa 1 — Limpeza automática (script)
`scripts/limpar_transcricao.py` faz:
- remove textos da plataforma do curso ("Clique acima...", "arquivos para baixar", "deixar algum comentário");
- remove marcações de formatação (`**`, `__`), emojis e caracteres invisíveis;
- remove frases de conversa de aula ("Nós deixamos as aulas gravadas", "vamos ter espaço para dúvidas");
- junta parágrafos quebrados e tira duplicados;
- quebra o texto em **trechos** de ~120–250 palavras e salva em `dados/limpos/trechos_paliativos.json`;
- gera `dados/limpos/relatorio_limpeza.md` com números do antes e depois (vai para a prova).

## Etapa 2 — Curadoria (Claude Code + Sueide)
Para cada trecho limpo:
1. **Entender** o que foi dito. Corrigir erros de transcrição só quando o sentido for óbvio
   e registrar em `notas_curadoria` (ex.: "corrigido 'mochila' → 'morfina'").
2. **Decidir** se vira verbete. Descartar: história pessoal da professora, piadas, exemplos de casos de
   pessoas, falas sobre o curso, opiniões sem relação com o paciente/cuidadora.
3. **Reescrever** em linguagem simples (ver regras de escrita abaixo). Nada de colar o texto original.
4. **Ligar** ao trecho de origem pelo campo `origem` (id do trecho), para rastreabilidade.

## Etapa 3 — Validação (script)
`scripts/validar_biblioteca.py` reprova se:
- faltar campo obrigatório ou o id se repetir;
- `fonte` não estiver na lista de fontes conhecidas;
- explicação passar de 120 palavras ou citação literal passar de 25 palavras;
- aparecer padrão de dado pessoal (CPF, telefone, e-mail, RG, CEP);
- aparecer conduta clínica proibida (dose em mg/ml, "pode parar o remédio", "não precisa ir ao médico").

## REGRA INEGOCIÁVEL: NÃO INVENTAR NADA

Todo verbete precisa dizer exatamente o que a fonte diz. Vale para as fontes abertas
(Ministério da Saúde/SNT, OMS, blog do Prof. Luiz Carneiro) e para as anotações do curso
*Como Trazer Paz para a Morte*, da Dra. Ana Claudia Quintana Arantes.

**Pode (reescrita em linguagem simples):**
- Trocar palavras difíceis por palavras do dia a dia, com o mesmo sentido
  ("atenuado" → "enfraquecido"; "30 dias" → "primeiro mês"; "hepático" → "do fígado";
  "inexorável" → "que não dá para evitar").
- Explicar sigla ou termo técnico entre parênteses, **se a explicação estiver na fonte**.
- Encurtar frases longas e mudar a ordem das ideias, sem mudar o sentido.
- Juntar no mesmo verbete ideias de trechos diferentes da **mesma fonte**, citando os trechos em `origem`.
- Corrigir erro óbvio de transcrição ("mochila" → "morfina"), registrando em `notas_curadoria`.

**Não pode:**
- Acrescentar informação que não está na fonte, mesmo que seja verdadeira.
  Nada de completar com conhecimento próprio de medicina.
- Acrescentar números, prazos, porcentagens, exemplos, sintomas, causas ou recomendações
  que a fonte não traz.
- Generalizar ou exagerar: se a fonte diz "pode", não escreva "sempre"; se diz "em alguns casos",
  não escreva "em geral".
- Suavizar ou endurecer o sentido: se a fonte diz que algo é grave, não diga que é simples, e vice-versa.
- Atribuir a uma fonte algo que veio de outra.
- Criar as "perguntas para levar à equipe" sobre assuntos que o verbete não trata.

**Como conferir cada verbete antes de escrever:**
1. Para cada frase do verbete, aponte de qual trecho da fonte ela saiu.
   Se não conseguir apontar, apague a frase.
2. Em `notas_curadoria`, liste as trocas de palavras feitas (ex.: "atenuado → enfraquecido").
3. Se a fonte for confusa, incompleta ou houver dúvida sobre o sentido, NÃO preencha a lacuna.
   Marque o verbete com ⚠️ em `notas_curadoria` e pergunte à Sueide.
4. Se um tema importante não tiver fonte, não crie o verbete: registre em `docs/lacunas.md`.

Na dúvida entre deixar o texto mais completo ou mais fiel à fonte, escolha sempre a fonte.
Um verbete curto e fiel vale mais do que um verbete completo com uma frase inventada.

Observação de curadoria (aplicação prática, 14/11/2026): também contam como acréscimo
frases de ligação "de segurança" (ex.: "converse com a equipe") que a fonte não diz,
suavizações que mudam o sentido (ex.: "a grande maioria" → "muitas pessoas") e misturar
duas fontes diferentes no texto de um verbete. O campo `o_que_perguntar` traz perguntas
(não afirma fatos) e o campo `termos` traz palavras de busca; os dois não podem afirmar
nada que a fonte não diga.

## Regras de escrita do verbete
- Frases curtas (até ~20 palavras). Voz ativa. "Você" para falar com o leitor.
- Sigla sempre explicada na primeira vez: "MELD (uma pontuação de gravidade)".
- Explique **o que é**, **por que importa** e **o que perguntar à equipe**.
- Nunca: dose, diagnóstico, prognóstico de tempo de vida, promessa de cura, julgamento de família.
- Nunca alarmista. Em temas de fim de vida, tom acolhedor e respeitoso.
- 40 a 120 palavras na explicação. Se precisar de mais, quebre em dois verbetes.

## Checklist antes de marcar `"revisado"`
- [ ] Li a fonte original (ou minha anotação) e o verbete diz a mesma coisa.
- [ ] Uma pessoa idosa sem formação em saúde entenderia.
- [ ] Não tem nome de pessoa real nem caso clínico.
- [ ] Não manda fazer nem parar nenhum tratamento.
- [ ] Fonte, link (quando houver) e data de acesso preenchidos.
