# Decisões fechadas — EvoluFit V1

Complementa `Especificacao_Requisitos_Sistema_Saude_Pessoal.md`. Em caso de conflito, **este documento prevalece**.

## Alimentação

| Ponto | Decisão |
|---|---|
| Conversão de unidades | O item usa a mesma unidade da base do alimento por padrão. `peso_por_unidade` é opcional e permite, por exemplo, lançar 1 pão quando o alimento foi cadastrado em gramas. |
| Rendimento de receitas | `rendimento_em_porcoes` obrigatório, padrão 1. A refeição informa porções consumidas, inclusive frações (0,5). Não calcular por gramas de receita na V1. |
| Receita dentro de receita | Não permitido. Receita contém apenas alimentos. |
| Exclusão de alimentos | Alimentos usados em refeições ou receitas não podem ser apagados, apenas arquivados. Alimentos nunca utilizados podem ser excluídos. |
| “Dieta” | Apenas registros realizados (sem planos). Ação “duplicar refeições de uma data anterior”. |
| Nutrientes vazios | `NULL` = “não cadastrado”, diferente de zero. Snapshots preservam `NULL`. |
| Totais nutricionais | Calorias sempre completas. Nutrientes opcionais somam os valores conhecidos e indicam total parcial quando algum item não possui o nutriente. |
| Unidades | kcal; carboidratos, proteínas, fibras e gorduras em g; sódio em mg. |
| Tipos de refeição | Lista fixa: café da manhã, almoço, lanche, jantar, personalizada (com nome). Pode haver mais de uma do mesmo tipo no dia. |
| Edição de refeição | Permitida após salvar. Editar itens ou quantidades recalcula snapshots e totais. |

## Treinos

| Ponto | Decisão |
|---|---|
| Treinos modelo | Apenas treinos realizados, com ação “duplicar treino anterior”. Fichas A/B ficam para versão futura. |
| Tendência | Comparar períodos só com ao menos 2 sessões do exercício em cada período; senão, “dados insuficientes para comparar”. |
| Exercícios sem carga | Registram séries e repetições, mas não entram no volume. |
| Cardio | Fora do escopo da V1. |
| Aquecimento | Campo `aquecimento` na série. Fica no histórico, mas fora de totais, volume e comparações. |
| Halteres | Carga registrada = carga total movimentada (2 × 10 kg = 20 kg). A interface deve deixar isso explícito. |
| Grupo muscular | Lista fixa; um grupo principal por exercício. |

## Acompanhamento diário

| Ponto | Decisão |
|---|---|
| Água | `daily_checkins` guarda o total do dia em ml. Interface com +250 ml, +500 ml e edição manual. |
| Peso e água | Ambos opcionais; o check-in exige pelo menos um. |
| Média móvel de peso | Média das pesagens dos últimos 7 dias corridos, exibida apenas com ao menos 4 pesagens na janela. |

## Plataforma

| Ponto | Decisão |
|---|---|
| Cadastro de usuários | Cadastro público desativado após criar a conta inicial. Login e recuperação de senha permanecem. **Sem confirmação de e-mail** (uso pessoal, conta única). |
| Fuso horário | Fuso salvo no perfil, padrão `America/Bahia`. Registros diários usam `date` enviado pela interface no fuso do usuário; criação/edição usam `timestamptz`. |
| Supabase | Projeto exclusivo para o EvoluFit (o app usa o Auth remoto). Migrations e RLS são validados num container Postgres local (imagem `supabase/postgres`, porta 55432, via `docker-compose.yml`) e aplicados no remoto somente após validação, pelo Supabase CLI. |
| UI e testes | Tailwind CSS + shadcn/ui. Vitest para proporção, receitas, volume, médias móveis e validações. |

## Segurança do banco

- Todas as tabelas, inclusive as filhas, têm `user_id`.
- Políticas RLS validam o `user_id` e a posse dos registros relacionados.
- Item de refeição não pode apontar para alimento ou receita de outro usuário.
- Item de receita não pode usar alimento de outro usuário.
- Série não pode ser inserida em exercício de treino de outro usuário.
- Onde fizer sentido, chaves compostas `(id, user_id)` reforçam a integridade no próprio banco.
- Entradas decimais em pt-BR aceitam vírgula (ex.: `8,2`), convertidas com segurança antes da validação numérica.
- `profiles` mínimo: nome opcional e fuso horário obrigatório.

## Decisões complementares (aprovadas em 18/11/2026)

| Ponto | Decisão |
|---|---|
| Edição de refeição salva | Apenas itens alterados têm o snapshot recalculado; os demais mantêm o snapshot original. Os totais da refeição são re-somados. |
| Duplicar refeições | O usuário escolhe a data de origem e quais refeições copiar. Os itens são recalculados com os cadastros atuais. Itens de alimentos arquivados são copiados com aviso. |
| Duplicar treino | Copia exercícios e séries com cargas e repetições anteriores, todas editáveis. |
| Arquivamento | A regra “arquivar se estiver em uso” vale também para receitas e exercícios (`archived_at` + FKs `ON DELETE RESTRICT`). |
| Tela de cadastro | Não existe na V1. App tem login e recuperação de senha; a conta inicial é criada pelo painel/Studio do Supabase. |
| E-mails | SMTP padrão do Supabase (limite baixo, suficiente para uso pessoal). SMTP próprio pode ser configurado depois. O template de recuperação de senha usa `token_hash` + `/auth/confirm` e deve ser replicado no painel do projeto remoto, onde também se desliga “Confirm email”. |
| `peso_por_unidade` | Conversão nos dois sentidos entre unidade e g/ml. Sem conversão g ↔ ml (densidade) na V1. |
| Senha | Mínimo de 8 caracteres, com letras e números (aplicado no Supabase Auth e no Zod). |
