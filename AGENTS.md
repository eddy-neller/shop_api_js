# AGENTS.md

Guide pour humains et agents travaillant sur ce depot. Objectif: garder une API NestJS lisible, testable, orientee metier, et coherente avec les regles metier du projet E.N Shop.

## Perimetre du projet

Ce projet est le **microservice Identity** (`identity-service`) de l'application E.N Shop. C'est un service autonome, proprietaire de ses donnees et de ses regles, qui porte **uniquement** le contexte metier de l'identite:

- inscription utilisateur
- activation de compte
- authentification (login, JWT d'acces, refresh tokens)
- reset de mot de passe
- profil utilisateur et avatar
- regles de securite du compte (tentatives de login, blocage, etc.)

L'agregat central est **User**. Le contexte Identity porte aussi un agregat de support, **RefreshToken** (session d'authentification: emission, expiration, rotation, revocation), qui reference `User` par identite (`UserId`), jamais par objet. Ajouter un agregat de support dans le **meme** bounded context Identity est autorise; ce qui est interdit, c'est d'ouvrir un **nouveau bounded context** metier ici. Les autres domaines (Shop, notifications, catalogue, commandes, paiement...) **ne vivent pas dans ce depot**: ce sont des microservices distincts, avec leur propre base et leurs propres contrats. Il ne faut donc **pas** ajouter de nouveau bounded context metier ici (pas de `domain/shop`, etc.); on etend le contexte Identity, ou on cree/alimente un autre service. Voir `docs/architecture/microservices-roadmap.md` pour la cible microservices et les evenements publies par ce service.

## Reference metier: l'API Symfony

L'API principale (PHP / Symfony / API Platform, Clean Architecture + DDD, dans `../api/`) est la **reference fonctionnelle et metier** pour le domaine Identity: les use cases, le modele User, les regles metier et les invariants de ce projet doivent rester coherents avec elle. Consulter `../api/` (notamment `application/src/`, `domain/**/src`, `presentation/src/`) avant d'ajouter ou de modifier un comportement metier de l'identite.

**Reference metier, pas modele architectural.** `../api/` est un monolithe Symfony; ce projet est un microservice NestJS. La coherence attendue porte sur le **metier** (regles, invariants, comportements du User), pas sur la structure technique. Il est normal — et souhaite — de diverger de `../api/` sur tout ce qui releve de l'architecture microservice: perimetre reduit a l'identite, base de donnees possedee par le service, publication d'evenements (`UserRegistered`, `PasswordResetRequested`...), outbox transactionnel, absence de tables partagees, contrats explicites avec les autres services. Ne pas cloner un decoupage, un detail de transport ou de validation par simple souci de parite.

Regle de decision: si une implementation de `../api/` n'est pas la meilleure solution ici (choix discutable, heritage technique, contrainte propre a Symfony/API Platform, ou logique qui appartient a un autre microservice), le signaler explicitement, proposer la meilleure solution pour un service Identity autonome, et laisser la decision a l'humain.

> **Ne consigner ici que des regles transverses et des resumes.** Toute regle specifique a une couche doit etre ecrite — en detail — dans le `AGENTS.md` de cette couche, jamais dans ce fichier.
>
> **Regles specifiques a une couche** → fichier `AGENTS.md` du dossier correspondant (charge a la demande quand on travaille dans cette couche) :
>
> - [`src/domain/AGENTS.md`](src/domain/AGENTS.md) — DDD, agregats, Value Objects, events, exceptions metier
> - [`src/application/AGENTS.md`](src/application/AGENTS.md) — use cases, CQRS, commands/queries, ports, read models
> - [`src/infrastructure/AGENTS.md`](src/infrastructure/AGENTS.md) — adapters, handlers CQRS, Prisma, mappers, persistance
> - [`src/presentation/AGENTS.md`](src/presentation/AGENTS.md) — controllers HTTP, DTOs, presenters, filtres, routes

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
- `JWT_SECRET`: secret de signature des JWT d'acces (HS256). Obligatoire en runtime; aucune valeur par defaut.
- `JWT_ACCESS_TTL`: duree ISO-8601 de validite du JWT d'acces, defaut code `PT15M`.
- `JWT_REFRESH_TTL`: duree ISO-8601 de validite du refresh token, defaut code `P30D`.
- `AVATAR_UPLOAD_DIR`: repertoire de stockage disque des avatars, defaut code `public/uploads/images/user/avatar`.
- `AVATAR_BASE_URL`: prefixe d'URL publique servant les avatars, defaut code `/uploads/images/user/avatar`.
- `AVATAR_MAX_SIZE`: taille max d'un avatar en octets, defaut code `2097152` (2 Mo).
- `AVATAR_MAX_DIMENSION`: dimension max (largeur/hauteur) d'un avatar en pixels, defaut code `512`.

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

Le detail des regles de chaque couche vit dans son `AGENTS.md` dedie (voir les liens en tete de fichier).

---

## Structure actuelle

```text
src/
  domain/
    shared/
    refresh-token/
      exception/
      model/
      value-object/
    user/
      event/
      exception/
      model/
      value-object/
  application/
    account/
      use-case/
        command/
        query/
    auth/
      use-case/
        command/
    onboarding/
      use-case/
        command/
    shared/
      dto/
      port/
      service/
    user-management/
      dto/
      use-case/
        command/
        query/
  infrastructure/
    nest/
      cqrs/
        account/
        auth/
        onboarding/
        user-management/
      modules/
        account/
        auth/
        core/
        onboarding/
        user-management/
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
      account/
      auth/
      onboarding/
      shared/
      user-management/
prisma/
  migrations/
  seed/
test/
  domain/
  application/
```

Conserver cette organisation par couche autour des agregats du contexte Identity de ce service (**User**, agregat central, et **RefreshToken**, agregat de support). Un nouveau besoin metier hors du perimetre Identity (Shop, notifications, catalogue...) n'ouvre pas un nouveau bounded context ici: il releve d'un autre microservice (voir `docs/architecture/microservices-roadmap.md`). Ce qui evolue dans ce depot etend le contexte Identity.

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
- [ ] Les messages des exceptions metier (Domain et Application) sont en anglais.
- [ ] Les ids User sont traites comme UUID.
- [ ] Les tests unitaires couvrent les nouveaux VOs, aggregats et use cases.
- [ ] `npm test` et `npm run lint` passent ou les echecs sont expliques.
