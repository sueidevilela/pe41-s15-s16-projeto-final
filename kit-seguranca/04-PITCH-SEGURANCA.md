# Pitch — trecho de segurança (cerca de 50 segundos)

Dentro dos 5 minutos, este trecho entra logo depois da demonstração do app.

---

**[Slide: "Segurança não se prioriza. Se resolve no mesmo instante."]**

> Em projetos feitos com IA, segurança costuma ser a última pergunta. No CUIDAR, foi a primeira. Porque aqui a gente lida com dado de saúde, e dado de saúde é dado sensível na LGPD. Mesmo sendo um protótipo com dados fictícios, eu construí como se fossem reais.

**[Slide: as duas fechaduras — porta (login) e fechadura (RLS no banco)]**

> São duas camadas. A tela de login é a porta: confirma quem você é. Mas a segurança de verdade está no banco, com regras linha por linha. Cada paciente e cada cuidadora só enxerga a própria jornada. Nenhuma chave secreta fica no código: a chave da IA mora no servidor.

**[Slide: tabela de testes — print do checklist]**

> E eu testei. Criei uma conta "intrusa" e tentei ver os dados de outra pessoa pela tela e direto pela API: não conseguiu. Tentei entrar sem login, com senha errada, mandar textos gigantes, fazer dezenas de pedidos seguidos. Tudo bloqueado.

**[Slide: guardrails do Tradutor da Saúde]**

> O Tradutor da Saúde explica termos, mas tem limites claros: não diagnostica, nunca mexe em dose de remédio, e quando aparece um sinal de alerta, como febre depois do transplante, ele para tudo e manda procurar a equipe ou o SAMU. Também testei tentativas de enganar a IA com comandos escondidos no texto do exame. Ela não obedeceu.

---

## Números para preencher antes de apresentar

- Testes de acesso: ___ de ___ passaram
- Testes de guardrail: ___ de 10 passaram

## Próximos passos (se perguntarem)

- Vínculo cuidadora ↔ paciente na mesma jornada, com permissões próprias
- Alerta automático quando o uso passar de 80% do limite
- Filtro automático de saída da IA
- Revisão formal de LGPD antes de qualquer uso com pacientes reais

## Cuidados no dia

- Nenhum print com chave, e-mail real ou senha aparecendo.
- Fazer a demo com as contas fictícias.
