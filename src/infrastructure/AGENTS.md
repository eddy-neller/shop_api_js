# Infrastructure Layer

> Couche `src/infrastructure/`. Regles transverses (stack, dependances, conventions, commandes) : voir `AGENTS.md` racine.

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
- Cablage DI Nest reparti par module de capacite dans `src/infrastructure/nest/modules/**/**.providers.ts`. `CoreModule` porte les providers partages; les modules `auth`, `onboarding`, `account` et `user-management` portent uniquement leurs controllers, handlers CQRS, use cases et adapters specifiques.
  - Un module de capacite n'exporte rien: pas de propriete `exports` dans `*.module.ts`.
  - Un module de capacite n'importe jamais un autre module de capacite. Il importe `CoreModule` uniquement; la composition entre capacites se fait au niveau `AppModule`.
  - Tout provider consomme par plusieurs capacites ou par un mecanisme global (`APP_GUARD`, presenter partage, token transversal, resolver public commun) doit etre cable dans `CoreModule`.
  - Aucun adapter ne porte `@Inject(...)`; les dependances sont toujours cablees cote provider.
  - Cabler via `useFactory` + `inject`, en passant les dependances au constructeur. C'est le defaut: idiomatique Clean Architecture + Nest, recommande par la communaute DDD/Nest, et seul moyen de resoudre un port reference par un token symbole (ex. `ID_GENERATOR`). L'adapter peut alors etre une classe pure sans `@Injectable()` (cf. `PrismaUserRepository`), instanciable a la main (`new Adapter(...)`) et testable sans Nest.
  - `useClass` reste possible pour un adapter dont toutes les dependances se resolvent par leur type concret (aucun token symbole en jeu). Dans ce cas l'adapter garde `@Injectable()`, car c'est Nest qui l'instancie et resout son constructeur par type (cf. `BcryptPasswordHasher`, `UuidGenerator`, `SystemClock`, `EnvConfig`).
  - La verbosite de `useFactory` est le prix assume du decouplage; confinee a ce fichier d'Infrastructure, elle ne pollue jamais Domain/Application.
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

- `PrismaUserRepository.nextIdentity()` fabrique l'identite des nouveaux agregats: il recoit `IdGeneratorPort` en parametre constructeur et retourne un `UserId`. C'est le repository, pas le use case, qui porte la strategie d'identite. Le cablage (`PrismaService`, `PrismaTransactionContext`, `ID_GENERATOR`) se fait via `useFactory` + `inject` dans `core.providers.ts`; le repository ne porte pas de decorateur `@Inject`.
- `PrismaUserRepository.save` utilise `upsert`.
- Les lectures `findById`, `findByEmail`, `findByUsername`, `findByActivationToken` et `findByResetPasswordToken` retournent `User | null`.
- La methode `toPersistence()` de chaque mapper retourne une entree Prisma create/update compatible; garder le mapping exhaustif et explicite.
- `PrismaUserRepository` doit utiliser le client transactionnel quand `TransactionalPort` execute une operation.
