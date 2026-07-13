# CoreModule

Fichier documente: `src/infrastructure/nest/modules/core/core.module.ts`.

`CoreModule` porte le cablage partage par les modules de capacite.

Il importe et exporte:

- `ConfigModule.forRoot()`;
- `CqrsModule`;
- `JwtModule.register({})`;
- `PrismaModule`.

Il fournit les ports et services techniques partages:

- `ACCESS_TOKEN_PROVIDER`;
- `AVATAR_URL_RESOLVER`;
- `USER_REPOSITORY`;
- `USER_UNIQUENESS_CHECKER`;
- `PASSWORD_HASHER`;
- `ID_GENERATOR`;
- `TOKEN_PROVIDER`;
- `CLOCK`;
- `TRANSACTIONAL`;
- `CONFIG`.

Il enregistre aussi les guards globaux dans cet ordre:

1. `JwtAuthGuard`;
2. `RolesGuard`.

Il enregistre enfin le filtre d'exception global `DomainExceptionFilter` via le token `APP_FILTER`. C'est un filet de securite: il catche toute `DomainException` qu'aucun filtre plus proche (`UserDomainExceptionFilter`, pose par `@UseFilters` sur les controllers) n'a traitee, et rend un `400` propre au lieu de laisser fuiter un `500`. Il reste volontairement generique; le mapping fin vers les status HTTP precis vit dans `UserDomainExceptionFilter` (voir `src/presentation/AGENTS.md`).

### Pourquoi `APP_FILTER` et non `app.useGlobalFilters()`

`DomainExceptionFilter` n'a pas de dependance injectee, donc `app.useGlobalFilters(new DomainExceptionFilter())` dans `main.ts` serait techniquement possible. On garde neanmoins `APP_FILTER` pour trois raisons:

1. **Coherence**: les preoccupations transverses globales (guards + filtre) sont enregistrees au meme endroit, avec le meme pattern token, a cote des `APP_GUARD`.
2. **Testabilite**: un filtre enregistre via `APP_FILTER` fait partie du graphe de modules, donc il s'applique dans un test d'integration monte avec `Test.createTestingModule()`. Un filtre pose via `app.useGlobalFilters()` dans `main.ts` n'est pas ramasse par ce bootstrap de test.
3. **Evolutivite**: si le filtre doit un jour injecter une dependance (`ClockPort`, `ConfigPort`, logger), `APP_FILTER` la supporte deja sans migration.

Les providers sont declares dans `src/infrastructure/nest/modules/core/core.providers.ts`.

Les providers specifiques restent dans leur module de capacite. Exemple: `REFRESH_TOKEN_REPOSITORY` reste dans `AuthModule`; `AVATAR_UPLOADER` et `AVATAR_IMAGE_VALIDATOR` restent dans `AccountModule`.
