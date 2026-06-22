# AGENTS.md

Guide pour humains et agents travaillant sur ce depot. Objectif: garder une API NestJS lisible, testable, orientee metier, et coherente avec l'API principale du projet E.N Shop.

Ce projet est l'API secondaire TypeScript de l'application E.N Shop.

---

## Stack

- Node.js 22+
- TypeScript strict (`strict`, `strictPropertyInitialization`, `noImplicitOverride`, `noUncheckedIndexedAccess`)
- NestJS 11
- `@nestjs/cqrs` pour l'entree Presentation -> Application
- Prisma 7 + `@prisma/adapter-pg`
- PostgreSQL
- Vitest
- ESLint flat config + Prettier
- Alias d'import: `@/*` vers `src/*`

Ne pas introduire de dependance qui contourne Clean Architecture, injecte Prisma/Nest dans Domain ou Application, ou remplace CQRS sans decision explicite.

---

## Commandes

```bash
npm install
npm run prisma:generate
npm run prisma:migrate:dev
npm run prisma:seed
npm run fixtures:dev
npm run fixtures:test
npm run start:dev
npm run build
npm test
npm run lint
npm run format
```

Docker:

```bash
npm run docker:up
npm run docker:ps
npm run docker:logs
npm run docker:shell:db
npm run docker:down
```

Avant livraison, lancer au minimum `npm test` et `npm run lint` pour tout changement TypeScript. Lancer aussi `npm run build` si le changement touche Nest, Prisma, le wiring ou les exports.

---

## Variables d'environnement

Voir `.env.example`.

- `DATABASE_URL`: obligatoire pour Prisma, les migrations, les seeds et le runtime Nest.
- `PORT`: port HTTP Nest, defaut runtime `3001`, exemple local `20950`.
- `BCRYPT_SALT_ROUNDS`: defaut code `12`.
- `REGISTER_TOKEN_TTL`: duree ISO-8601 du token d'activation, defaut code `P2D`.
- `RESET_PASSWORD_TOKEN_TTL`: duree ISO-8601 du token de reset password, defaut code `PT15M`.
- `MAX_LOGIN_ATTEMPTS`: nombre d'echecs de mot de passe avant blocage, defaut code `5`.

Ne jamais committer de secrets reels. `.env` reste local.

---

## Architecture

Flux attendu:

```text
HTTP controller
  -> Nest CommandBus / QueryBus
  -> Nest CQRS handler infrastructure
  -> Application use case
  -> Domain
  -> Application ports
  -> Infrastructure adapters
```

Regles de dependances:

- `src/domain`: TypeScript pur. Aucun NestJS, Prisma, decorators, HTTP, DB, bcrypt, `process.env`, ni framework.
- `src/application`: use cases, commands, queries, read models et ports. Peut dependre de `domain`, jamais de NestJS, Prisma, HTTP, Express ou infrastructure concrete.
- `src/infrastructure`: adapters techniques, Prisma, hashing, ID generation, modules Nest, providers Nest et handlers `@nestjs/cqrs`.
- `src/presentation`: HTTP controllers, DTOs, presenters, filters. Peut dependre de Nest HTTP/CQRS, de DTOs application et de read models. Ne depend jamais de Prisma, repositories concrets, hashers ou use cases directs.
- Prisma models sont des modeles de persistance, pas des modeles metier. Convertir via mapper avant de rejoindre Domain/Application.

Mantra CQRS cote Presentation: toujours via `CommandBus` / `QueryBus`, jamais via un use case ou handler injecte directement dans un controller.

---

## Structure actuelle

```text
src/
  domain/
    shared/
    user/
      event/
      exception/
      model/
      value-object/
  application/
    shared/
      port/
    user/
      dto/
      port/
      service/
      use-case/
        command/
        query/
  infrastructure/
    nest/
      cqrs/
      user/
    persistence/
      prisma/
        transaction/
      user/
    service/
      config/
      crypto/
      id/
      time/
      token/
  presentation/
    http/
      shared/
      user/
prisma/
  migrations/
  seed/
test/
  domain/
  application/
```

Conserver cette organisation par bounded context. Si un nouveau domaine apparait, reproduire la meme separation par couche.

---

## Conventions TypeScript

- Classes, enums, types exportes: `PascalCase`.
- Variables, fonctions, proprietes: `camelCase`.
- Constantes globales et tokens DI: `UPPER_SNAKE_CASE`.
- Fichiers: garder le style existant `kebab-case` avec suffixes explicites (`*.use-case.ts`, `*.port.ts`, `*.repository.ts`, `*.mapper.ts`, `*.request.ts`).
- Preferer les imports `type` quand l'import est uniquement type. ESLint l'exige.
- Ne pas utiliser `any`; modeliser les formes ou utiliser `unknown` puis valider.
- Garder les signatures publiques explicites.
- Utiliser l'alias `@/...` pour les imports depuis `src`; les tests peuvent utiliser des imports relatifs pour leurs helpers locaux.
- Eviter les side effects au chargement des modules hors bootstrap, seed ou configuration.

---

## Domain

Role: coeur metier pur.

Contient:

- Aggregats et entites dans `model/`.
- Value Objects dans `value-object/`.
- Domain Events dans `event/`.
- Exceptions metier dans `exception/`.
- Exceptions d'unicite dans `exception/uniqueness/` quand elles concernent un invariant utilisateur.

Regles:

- Aucune dependance vers Application, Infrastructure ou Presentation.
- Aucune dependance NestJS, Prisma, class-validator, bcrypt, crypto, HTTP, DB ou environnement.
- Les Value Objects valident et normalisent leurs invariants (`Email`, `UserId`, `PasswordHash`).
- Les comparaisons de Value Objects se font via `equals()` quand disponible.
- Les aggregats exposent des methodes metier et des factories (`register`, `fromSnapshot`), pas de setters publics.
- `fromSnapshot` sert a rehydrater depuis la persistance et ne doit pas enregistrer d'event metier.
- Les comportements utilisateur actuels couvrent inscription, demande/validation d'activation, demande/confirmation de reset password, enregistrement et remise a zero des tentatives de mauvais mot de passe.
- Les events Domain sont des faits passes (`UserRegisteredEvent`) et doivent rester independants des frameworks.
- Le temps est fourni au Domain par parametre (`now: Date`), jamais cree directement dans le Domain.
- Les snapshots sont des contrats internes Domain <-> mapper; ne pas les exposer tels quels en HTTP.

Quand un nouvel invariant est ajoute, ajouter ou mettre a jour l'exception Domain ciblee et les tests unitaires associes.

---

## Application

Role: orchestration des cas d'usage.

Contient:

- Commands et Queries (`RegisterUserCommand`, `GetUserByIdQuery`).
- Use cases (`RegisterUserUseCase`, `GetUserByIdUseCase`).
- Ports user (`UserRepositoryPort`, `PasswordHasherPort`, `IdGeneratorPort`, `TokenProviderPort`, `UserUniquenessCheckerPort`).
- Ports partages (`ClockPort`, `ConfigPort`, `TransactionalPort`) dans `src/application/shared/port`.
- Services applicatifs purs (`UserUniquenessChecker`) quand ils orchestrent plusieurs ports sans dependance technique.
- Read models et mappers de read model.
- Erreurs Domain/Application attendues (`UserNotFoundException`, exceptions d'unicite, erreurs de token, limites d'activation/reset, utilisateur bloque).

Regles:

- Depend uniquement de Domain et des ports Application.
- Ne depend jamais de NestJS, Prisma, Express, HTTP decorators, DTOs Presentation ou implementations Infrastructure.
- Les use cases orchestrent: valider les entrees en VOs, charger via ports, appeler Domain, persister via ports, retourner un read model.
- La logique metier reste dans Domain; Application gere seulement les decisions d'orchestration et les erreurs de cas d'usage.
- Toute dependance externe ou technique doit passer par un port dans `src/application/**/port`.
- Les tokens de DI (`USER_REPOSITORY`, `PASSWORD_HASHER`, `ID_GENERATOR`, `TOKEN_PROVIDER`, `USER_UNIQUENESS_CHECKER`, `CLOCK`, `CONFIG`, `TRANSACTIONAL`) vivent avec les ports.
- Les durees et limites configurables passent par `ConfigPort`; garder les valeurs par defaut dans le use case si elles sont propres au cas d'usage.
- Les use cases qui modifient l'agregat et persistent doivent passer par `TransactionalPort`.
- Les read models Application sont des objets/types simples et stables; Presentation les transforme via presenters.
- Ne pas retourner d'agregat Domain, d'objet Prisma ou d'objet Nest depuis un use case.

Temps:

- Le temps courant passe par `ClockPort`. Ne pas utiliser `new Date()` dans les use cases sauf pour transformer une valeur deja recue.
- Les TTL applicatifs utilisent des durees ISO-8601 avec `addIsoDuration`.

---

## Infrastructure

Role: implementation des ports et integration frameworks.

Contient:

- Modules Nest et providers dans `src/infrastructure/nest`.
- Handlers `@nestjs/cqrs` dans `src/infrastructure/nest/cqrs`.
- Prisma client/service/repositories/mappers dans `src/infrastructure/persistence`.
- Transaction Prisma (`PrismaTransactional`, `PrismaTransactionContext`).
- Services techniques (`BcryptPasswordHasher`, `UuidGenerator`, `Base64TokenProvider`, `SystemClock`, `EnvConfig`).

Regles:

- Infrastructure peut dependre de Domain, des ports Application, NestJS, Prisma et bibliotheques techniques.
- Infrastructure ne depend pas de `src/presentation`.
- Les handlers Nest CQRS adaptent `CommandBus`/`QueryBus` vers les use cases. Ils ne contiennent pas de logique metier.
- Les providers de ports sont centralises dans `src/infrastructure/nest/user/user.providers.ts`.
- Les implementations de ports doivent rester substituables par des doubles de test.
- `process.env` doit rester derriere `EnvConfig` ou un adapter Infrastructure equivalent, pas dans Domain/Application.
- Les repositories Prisma doivent utiliser le client de transaction courant via `PrismaTransactionContext` quand il existe.

Handlers CQRS:

- Un `*NestCommandHandler` pour chaque command ecrite exposee via Nest CQRS.
- Un `*NestQueryHandler` pour chaque query lue exposee via Nest CQRS.
- Le handler injecte le use case et appelle `execute`.
- Ne pas injecter Prisma, hasher ou repository concret dans un handler CQRS si un use case et un port existent.

---

## Prisma et persistance

Source de verite persistence: `prisma/schema.prisma` + migrations.

Regles:

- Le modele Prisma `User` mappe la table `users`; respecter les `@map` et `@@map` existants.
- `passwordHash` mappe la colonne `password`.
- JSON Prisma (`roles`, `security`, `activeEmail`, `resetPassword`, `preferences`) doit etre valide par mapper avant d'entrer dans Domain.
- Les index nommes doivent rester explicites (`UserUsernameIdx`, `UserEmailIdx`, `UserCreatedAtIdx`).
- Toute modification de schema doit etre accompagnee d'une migration Prisma.
- Apres changement de schema, lancer `npm run prisma:generate` puis les tests pertinents.
- Ne pas faire fuiter `Prisma.User`, `PrismaClient` ou des `Prisma.*Input` hors Infrastructure.
- Les repositories convertissent toujours via `UserMapper`.
- Les contraintes d'unicite DB ne remplacent pas les erreurs applicatives; si une race condition est traitee, convertir l'erreur Prisma en erreur applicative claire.

Repository actuel:

- `PrismaUserRepository.save` utilise `upsert`.
- Les lectures `findById`, `findByEmail`, `findByUsername`, `findByActivationToken` et `findByResetPasswordToken` retournent `User | null`.
- `UserMapper.toPersistence` retourne une entree Prisma create/update compatible; garder le mapping exhaustif et explicite.
- `PrismaUserRepository` doit utiliser le client transactionnel quand `TransactionalPort` execute une operation.

---

## Presentation HTTP

Role: transport HTTP, validation d'entree, mapping HTTP.

Contient:

- Controllers Nest dans `src/presentation/http/**`.
- DTOs de requete avec `class-validator`.
- Presenters HTTP.
- Exception filters et mapping erreurs -> status HTTP.

Regles:

- Controllers utilisent uniquement `CommandBus` et `QueryBus` pour declencher un cas d'usage.
- Pas d'injection de use case, repository, Prisma service, hasher ou adapter technique dans un controller.
- DTOs Presentation valident la forme HTTP, pas les invariants metier profonds.
- Presenters convertissent les read models Application en reponses HTTP.
- Les filtres convertissent les exceptions Domain/Application connues en reponses HTTP stables.
- Quand une nouvelle erreur Domain/Application peut remonter a l'API, l'ajouter au mapping du filtre concerne.
- Garder la validation globale de `src/main.ts`: `whitelist`, `forbidNonWhitelisted`, `transform`.

Routes actuelles:

- `POST /users/register` avec `RegisterUserRequest`.
- `POST /users/register/email-activation-request` avec `RequestActivationEmailRequest`, reponse `204`.
- `POST /users/register/validation` avec `ValidateActivationRequest`, reponse `204`.
- `POST /users/reset-password/request` avec `RequestPasswordResetRequest`, reponse `204`.
- `POST /users/reset-password/confirm` avec `ConfirmPasswordResetRequest`, reponse `204`.
- `GET /users/:id` avec `GetUserByIdQuery`.

Attention: les ids User sont des UUID. Toute validation de parametre `id` doit etre compatible UUID.

---

## Fixtures et seeds

Les seeds Prisma vivent dans `prisma/seed`.

- `npm run prisma:seed` charge le groupe `dev` par defaut.
- `npm run fixtures:dev` force `FIXTURE_GROUP=dev`.
- `npm run fixtures:test` force `FIXTURE_GROUP=test`.
- Les groupes acceptes sont `dev` et `test`.
- Les fixtures test doivent rester deterministes et limitees.
- Les mots de passe seedes sont hashes avec `bcryptjs` et `BCRYPT_SALT_ROUNDS`.
- Les donnees JSON des fixtures doivent rester compatibles avec `UserMapper`.

Ne pas utiliser les fixtures comme source de logique metier. Elles servent uniquement a initialiser des donnees locales ou de test.

---

## Tests

Framework: Vitest.

Commandes:

```bash
npm test
npm run test:watch
```

Conventions:

- Tests sous `test/**/*.spec.ts`.
- Tests Domain: purs, sans Nest, sans Prisma, sans DB.
- Tests Application: instancier les use cases directement avec des ports fake/in-memory.
- Utiliser des UUID et dates fixes des que l'assertion depend de la valeur.
- Ne pas demarrer l'application Nest pour tester Domain/Application.
- Les helpers de test locaux peuvent rester dans `test/application/**`.
- Pour tout nouveau Value Object ou aggregat, ajouter un test Domain.
- Pour tout nouveau use case, ajouter un test Application couvrant chemin nominal et erreurs attendues.
- Pour tout nouveau mapper Prisma ou repository, ajouter un test adapte si la logique depasse du mapping trivial.
- Pour tout comportement HTTP ou filtre d'exception non trivial, ajouter un test Presentation cible.
- Pour tout adapter transactionnel ou repository Prisma avec logique de transaction, ajouter ou mettre a jour les tests Infrastructure.

Pattern actuel:

- `InMemoryUserRepository` est le double de repository pour les tests Application.
- Les ports `PasswordHasherPort`, `IdGeneratorPort`, `TokenProviderPort`, `ClockPort`, `ConfigPort` et `TransactionalPort` sont remplaces par de simples objets types dans les tests Application.
- Les tests temporels doivent injecter un `ClockPort` fixe plutot que dependre de l'heure courante.

---

## Qualite et verification

Avant de rendre un changement:

```bash
npm test
npm run lint
```

Ajouter selon le perimetre:

- `npm run build` si Nest, modules, providers, decorators, TS config ou exports changent.
- `npm run prisma:generate` si `schema.prisma` change.
- `npm run prisma:migrate:dev` si une migration est requise.
- `npm run fixtures:test` si les fixtures test changent et qu'une DB locale est disponible.

Ne pas corriger des fichiers sans rapport pour satisfaire un formatage global sauf demande explicite. Garder les diffs scopes.

---

## Git et hygiene

- Ne pas committer `.env`, secrets, dumps DB, `node_modules`, `dist`, `coverage`.
- Garder `package-lock.json` synchronise avec `package.json`.
- Si un port Docker change, mettre a jour `docker-compose*.yaml`, `.env.example` et la documentation utile ensemble.
- Ne pas modifier une migration deja partagee pour changer l'historique; creer une nouvelle migration sauf contexte local explicitement jetable.
- Les changements d'architecture doivent etre refletes ici si les conventions changent.

---

## Checklist transversale

- [ ] Domain ne contient aucun import NestJS, Prisma, HTTP, bcrypt, crypto ou infrastructure.
- [ ] Application ne contient aucun import NestJS, Prisma, Presentation ou implementation concrete.
- [ ] Presentation passe par `CommandBus` / `QueryBus`, jamais par un use case direct.
- [ ] Infrastructure implemente les ports Application et ne depend pas de Presentation.
- [ ] Les donnees Prisma sont converties par mapper avant Domain/Application.
- [ ] Les mutations applicatives passent par `TransactionalPort` quand plusieurs operations doivent rester coherentes.
- [ ] Le temps courant passe par `ClockPort`; la configuration runtime passe par `ConfigPort`.
- [ ] Les erreurs nouvelles sont mappees vers HTTP si elles sortent de l'API.
- [ ] Les ids User sont traites comme UUID.
- [ ] Les tests unitaires couvrent les nouveaux VOs, aggregats et use cases.
- [ ] `npm test` et `npm run lint` passent ou les echecs sont expliques.
