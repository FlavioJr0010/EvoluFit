# Especificação de Requisitos — Sistema Pessoal de Dieta, Treinos e Evolução

## 1. Visão do projeto

Desenvolver uma aplicação web pessoal para organizar alimentação, treinos e acompanhamento físico diário. O sistema deve permitir registrar alimentos e seus nutrientes, montar refeições e dietas, registrar treinos em detalhe e visualizar a evolução de carga, peso corporal e consumo de água.

O foco da primeira versão é **uso individual**, com arquitetura preparada para suportar mais usuários no futuro sem expor os dados de uma pessoa para outra.

## 2. Tecnologias obrigatórias

- **Frontend e backend:** Next.js, React e TypeScript.
- **Arquitetura Next.js:** App Router e Server Actions para operações de criação, edição e exclusão. Não criar uma API REST separada na primeira versão, salvo se houver uma necessidade técnica clara.
- **Hospedagem inicial:** Vercel.
- **Banco de dados e autenticação:** Supabase com PostgreSQL e Supabase Auth.
- **Validação:** Zod nas Server Actions e nos formulários.
- **Gráficos:** biblioteca compatível com React, como Recharts.
- **Estilo:** interface responsiva, com prioridade para celular e uso diário simples.

## 3. Segurança e regras técnicas

1. Implementar autenticação antes de disponibilizar os módulos que armazenam dados.
2. Todas as tabelas que pertencem ao usuário devem ter a coluna `user_id`, vinculada ao usuário autenticado.
3. Ativar Row Level Security (RLS) em todas as tabelas pessoais.
4. As políticas devem garantir que uma pessoa só possa consultar, inserir, atualizar e excluir dados cujo `user_id` seja o seu próprio ID.
5. Nunca expor a chave `service_role` no cliente. Usar apenas variáveis de ambiente no servidor quando necessário.
6. Usar migrations versionadas para criar e evoluir o banco.
7. Usar `numeric` para nutrientes e cargas quando houver casas decimais; evitar cálculos financeiros ou nutricionais críticos com `float`.
8. Datas devem ser armazenadas com timezone quando representarem um instante (`timestamptz`) e como `date` quando representarem apenas o dia do registro.

## 4. Módulo de alimentação

### 4.1 Cadastro de alimentos

O usuário deve conseguir cadastrar alimentos reutilizáveis, por exemplo: pão francês, ovo, manteiga, melão, arroz, frango ou leite.

#### Campos do alimento

| Campo | Regra |
|---|---|
| Nome | Obrigatório |
| Calorias | Obrigatório; valor numérico maior ou igual a zero |
| Base de cálculo | Obrigatório: gramas, mililitros ou unidade |
| Quantidade da base | Obrigatório; exemplo: 100 g, 1 unidade, 15 ml |
| Carboidratos | Opcional |
| Proteínas | Opcional |
| Fibras | Opcional |
| Gorduras totais | Opcional |
| Gorduras saturadas | Opcional |
| Sódio | Opcional |
| Observação | Opcional |

Os nutrientes devem ser registrados para a quantidade-base. Exemplo: melão com 34 kcal, 8,2 g de carboidratos e 0,9 g de fibras para cada 100 g.

O sistema deve calcular os valores proporcionalmente à quantidade usada. Exemplo: se o alimento foi cadastrado para 100 g e a refeição usar 150 g, todos os nutrientes devem ser multiplicados por 1,5.

### 4.2 Preparações e receitas

O sistema deve permitir criar preparações compostas por outros alimentos, por exemplo, “ovo mexido”.

Exemplo de receita:

- 2 unidades de ovo;
- 5 g de manteiga.

O sistema deve somar automaticamente as calorias e nutrientes dos ingredientes e permitir que a preparação seja usada em uma refeição como um item único. A receita não deve duplicar calorias: seus valores devem sempre resultar dos ingredientes cadastrados.

### 4.3 Montagem de refeições e dieta diária

O usuário deve conseguir criar refeições como café da manhã, almoço, lanche, jantar ou uma refeição personalizada.

Para cada item da refeição, deve ser possível:

- escolher um alimento ou uma preparação;
- informar a quantidade consumida;
- informar a unidade apropriada;
- visualizar calorias e nutrientes calculados para aquele item;
- editar ou remover o item antes de salvar.

Ao salvar, o sistema deve mostrar os totais da refeição: calorias e, quando disponíveis, carboidratos, proteínas, fibras, gorduras e sódio.

O usuário deve poder registrar refeições para uma data específica e consultar o total alimentar do dia. A primeira versão não precisa prescrever dieta, recomendar calorias nem substituir orientação de nutricionista; deve apenas organizar e calcular os dados inseridos pelo usuário.

## 5. Módulo de treinos

### 5.1 Cadastro de exercícios

Permitir cadastrar exercícios reutilizáveis, como leg press, cadeira extensora, supino, puxada alta ou rosca direta.

Campos sugeridos:

- nome do exercício;
- grupo muscular principal;
- equipamento ou máquina, opcional;
- observações ou instruções pessoais, opcionais.

### 5.2 Registro de treino realizado

O usuário deve registrar um treino em uma data e associá-lo a um título, por exemplo, “Treino de pernas”, “Peito e tríceps” ou “Costas”.

Cada treino contém exercícios e cada exercício contém séries individuais.

#### Dados por exercício

- exercício selecionado;
- ordem no treino;
- observação opcional.

#### Dados por série

- número da série;
- carga em quilogramas, opcional quando o exercício não usar peso;
- número de repetições;
- opcionalmente, campo para observação, como falha muscular, dor, descanso ou técnica.

Exemplo de registro:

| Exercício | Série | Carga | Repetições |
|---|---:|---:|---:|
| Leg press | 1 | 120 kg | 10 |
| Leg press | 2 | 130 kg | 8 |
| Leg press | 3 | 130 kg | 8 |

O sistema deve suportar séries com cargas e repetições diferentes dentro do mesmo exercício. Não armazenar apenas médias, pois os registros por série são a fonte de verdade.

### 5.3 Cálculos e evolução dos treinos

Para exercícios com carga, calcular o volume total como:

`volume_total = soma(carga_em_kg × repetições)`

Mostrar, no mínimo:

- maior carga registrada por exercício;
- total de séries;
- total de repetições;
- média de repetições por série;
- volume total por exercício e por treino;
- comparação do mesmo exercício entre semanas, meses ou períodos selecionados.

O sistema deve permitir identificar progressão de carga, de repetições e de volume, sem afirmar automaticamente que houve melhora quando os dados forem insuficientes.

## 6. Módulo de acompanhamento diário

O usuário deve conseguir criar um registro diário associado a uma data.

### Campos da primeira versão

- peso corporal em kg;
- consumo de água em litros ou mililitros;
- observação opcional.

### Campos previstos para evolução futura

- horas de sono;
- nível de disposição;
- medidas corporais;
- humor;
- fotos de progresso.

Deve existir no máximo um registro diário principal por usuário e por data. Se o usuário corrigir o peso ou a água, o sistema deve atualizar o registro do dia em vez de criar outro duplicado.

## 7. Relatórios e gráficos

Criar uma área de dashboard com dados fáceis de entender.

### 7.1 Peso corporal

- gráfico de linha do peso por data;
- opção de período: 7 dias, 30 dias, 90 dias e personalizado;
- exibir também uma média móvel semanal quando houver dados suficientes;
- destacar a diferença entre o primeiro e o último peso do período selecionado.

A média semanal deve ser apresentada como tendência, pois o peso diário pode oscilar por hidratação, sal, alimentação e outros fatores de curto prazo.

### 7.2 Hidratação

- gráfico ou histórico do consumo diário de água;
- média de consumo no período;
- sem definir uma meta automática na primeira versão, pois ela depende de avaliação individual.

### 7.3 Alimentação

- total de calorias consumidas por dia;
- detalhamento por refeição;
- totais diários de nutrientes somente quando os dados estiverem disponíveis nos alimentos cadastrados;
- deixar claro quando um total é parcial porque algum alimento não possui determinado nutriente cadastrado.

### 7.4 Treinos

- histórico de treinos por data;
- gráfico de maior carga por exercício;
- gráfico de volume total por exercício;
- comparação entre períodos;
- relatório de exercícios realizados, séries, repetições e cargas.

## 8. Modelo de dados sugerido

Criar migrations para as seguintes entidades. Os nomes podem ser ajustados, mas as responsabilidades devem ser preservadas.

| Tabela | Finalidade |
|---|---|
| `profiles` | Dados complementares do usuário autenticado |
| `foods` | Alimentos e nutrientes por quantidade-base |
| `recipes` | Preparações compostas, como ovo mexido |
| `recipe_items` | Ingredientes e quantidades de uma preparação |
| `daily_meals` | Uma refeição registrada em uma data |
| `daily_meal_items` | Itens, alimentos ou receitas, de cada refeição |
| `exercises` | Catálogo pessoal de exercícios |
| `workouts` | Treino realizado em determinada data |
| `workout_exercises` | Exercícios dentro de um treino |
| `exercise_sets` | Séries individuais de cada exercício do treino |
| `daily_checkins` | Peso, água e observações diárias |

### Regras de modelagem importantes

1. `foods`, `recipes`, `exercises`, `workouts`, `daily_meals` e `daily_checkins` devem ter `user_id`.
2. Itens filhos devem pertencer a um registro pai que já seja protegido por `user_id`; ainda assim, aplicar políticas RLS adequadas em todas as tabelas expostas.
3. Em `daily_meal_items`, armazenar um snapshot dos valores nutricionais calculados no momento do consumo. Isso preserva o histórico se o cadastro do alimento for corrigido no futuro.
4. Em `exercise_sets`, armazenar carga e repetições por série.
5. Criar índices para consultas frequentes por `user_id` e `date`.
6. Criar uma restrição única para `daily_checkins(user_id, date)`.

## 9. Telas da primeira versão

1. **Login e cadastro:** autenticação por e-mail e senha.
2. **Dashboard:** resumo do dia, peso mais recente, água, calorias registradas e último treino.
3. **Alimentos:** listar, buscar, criar, editar e excluir alimentos.
4. **Preparações:** criar receitas compostas por ingredientes.
5. **Refeições do dia:** selecionar data, criar refeições e adicionar itens com quantidades.
6. **Exercícios:** listar e cadastrar exercícios.
7. **Registrar treino:** selecionar data, criar treino, adicionar exercícios e lançar séries.
8. **Acompanhamento diário:** registrar ou editar peso, água e observação do dia.
9. **Evolução:** gráficos e relatórios de peso, água, alimentação e treinos.

## 10. Ordem de implementação recomendada

1. Configurar Next.js, TypeScript, Supabase, variáveis de ambiente e autenticação.
2. Criar migrations, tipos TypeScript e RLS.
3. Implementar o registro diário de peso e água, incluindo gráfico de peso.
4. Implementar cadastro de alimentos e cálculo proporcional.
5. Implementar refeições do dia e totais nutricionais.
6. Implementar cadastro de exercícios, treinos e séries.
7. Implementar relatórios e gráficos de evolução de treino.
8. Revisar experiência mobile, validações, mensagens de erro e estados vazios.

## 11. Critérios de aceite da primeira versão

- Um usuário autenticado consegue cadastrar um alimento com calorias obrigatórias e nutrientes opcionais.
- O sistema calcula corretamente os nutrientes conforme a quantidade usada em uma refeição.
- Uma receita, como ovo mexido, soma corretamente os ingredientes sem duplicar valores.
- O usuário consegue registrar refeições em uma data e visualizar o total do dia.
- O usuário consegue registrar um treino com exercícios e séries de cargas e repetições distintas.
- O sistema calcula volume total, maior carga, total de séries e repetições por exercício.
- O usuário consegue registrar peso e consumo de água diariamente, sem duplicar o mesmo dia.
- Os gráficos mostram tendências de peso e evolução de treino por período.
- Nenhum usuário consegue acessar ou alterar os dados de outro usuário.
- A aplicação funciona bem em celular e desktop.

## 12. Fora do escopo inicial

- Prescrição nutricional, diagnóstico médico ou recomendação automática de dieta.
- Integração com smartwatch, balança inteligente ou aplicativos externos.
- Reconhecimento de alimentos por imagem.
- Compartilhamento público de dados.
- Planos pagos, assinaturas e recursos comerciais.
- Notificações automáticas e lembretes.

## 13. Instrução final para a implementação

Implemente este sistema como uma aplicação Next.js moderna, com TypeScript, App Router, Server Actions, Supabase Auth e PostgreSQL. Priorize código organizado, componentes reutilizáveis, validação com Zod, migrations claras e segurança com Row Level Security. Crie uma primeira versão funcional e responsiva, sem adicionar funcionalidades fora do escopo antes de concluir os critérios de aceite.
