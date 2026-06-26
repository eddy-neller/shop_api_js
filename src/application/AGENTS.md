# Application Layer

> Couche `src/application/`. Regles transverses (stack, dependances, conventions, commandes) : voir `AGENTS.md` racine.

Role: orchestration des cas d'usage.

Contient:

- Commands et Queries (`RegisterUserCommand`, `CreateUserByAdminCommand`, `UpdateUserByAdminCommand`, `UpdatePasswordCommand`, `DeleteUserByAdminCommand`, `DisplayUserQuery`, `CheckPasswordResetTokenQuery`).
- Use cases (`RegisterUserUseCase`, `CreateUserByAdminUseCase`, `UpdateUserByAdminUseCase`, `UpdatePasswordUseCase`, `DeleteUserByAdminUseCase`, `DisplayUserUseCase`, `CheckPasswordResetTokenUseCase`).
- Ports user (`UserRepositoryPort`, `PasswordHasherPort`, `IdGeneratorPort`, `TokenProviderPort`, `UserUniquenessCheckerPort`). `UserRepositoryPort` expose `delete(user)`; `PasswordHasherPort.verify` est requis (verification du mot de passe courant); `UserUniquenessCheckerPort` expose `ensureEmailAvailable`/`ensureUsernameAvailable` avec un `excludeUserId` optionnel pour les mises a jour.
- Ports partages (`ClockPort`, `ConfigPort`, `TransactionalPort`) dans `src/application/shared/port`.
- Services applicatifs purs (`UserUniquenessChecker`) quand ils orchestrent plusieurs ports sans dependance technique.
- Read models: classes avec une factory statique `from<Aggregate>(...)` faisant office de mapper (pas de fichier mapper separe).
- Erreurs Domain/Application attendues (`UserNotFoundException`, exceptions d'unicite, erreurs de token, limites d'activation/reset, utilisateur bloque, `InvalidCurrentPasswordException`, `SamePasswordException`, `InvalidPreferencesException`, `InvalidUserStatusException`, `InvalidRoleException`).
- La regle "nouveau mot de passe different de l'actuel" est appliquee dans `UpdatePasswordUseCase` (via `PasswordHasherPort.verify` sur le hash courant), pas en Presentation: une comparaison de hash en Domain serait inutile (bcrypt re-sale).
- La validite des valeurs propres a l'agregat est un invariant Domain mappe en `422`, pas une regle de DTO: la langue (`Preferences` -> `InvalidPreferencesException`), le statut (`UserStatus.fromNumber` -> `InvalidUserStatusException`) et le role (`toUserRole` -> `InvalidRoleException`). `toUserRole` rejette les roles inconnus (`InvalidRoleException.unknown`) et `ROLE_SUPER_ADMIN`, non assignable via une entree admin (`InvalidRoleException.notAssignable`): c'est traite comme une entree utilisateur erronee (`422`), pas comme une autorisation (`403`). `ROLE_SUPER_ADMIN` reste un role valide rehydrate via `fromSnapshot` (qui ne passe pas par `toUserRole`). Les DTOs admin ne gardent que la validation de forme (`@IsInt`, `@IsString({ each: true })`), la valeur etant validee par le Domain.

Regles:

- Depend uniquement de Domain et des ports Application.
- Ne depend jamais de NestJS, Prisma, Express, HTTP decorators, DTOs Presentation ou implementations Infrastructure.
- Les use cases orchestrent: valider les entrees en VOs, charger via ports, appeler Domain, persister via ports, retourner un read model.
- La logique metier reste dans Domain; Application gere seulement les decisions d'orchestration et les erreurs de cas d'usage.
- Toute dependance externe ou technique doit passer par un port dans `src/application/**/port`.
- Les tokens de DI (`USER_REPOSITORY`, `PASSWORD_HASHER`, `ID_GENERATOR`, `TOKEN_PROVIDER`, `USER_UNIQUENESS_CHECKER`, `CLOCK`, `CONFIG`, `TRANSACTIONAL`) vivent avec les ports.
- Les durees et limites configurables passent par `ConfigPort`; garder les valeurs par defaut dans le use case si elles sont propres au cas d'usage.
- Les use cases qui modifient l'agregat et persistent doivent passer par `TransactionalPort`.
- L'identite d'un nouvel agregat vient du repository via `UserRepositoryPort.nextIdentity(): UserId`; un use case ne doit pas injecter `IdGeneratorPort` pour fabriquer un id. La generation d'id est une responsabilite de la couche persistance (cf. `nextIdentity` cote `DoctrineUserRepository` de l'API principale).
- Un read model Application est une **classe** exposant une factory statique `from<Aggregate>(aggregate): XReadModel` (ex. `UserReadModel.fromUser(user)`) qui projette l'agregat. Cette factory remplace un fichier mapper separe: la projection vit avec la forme. Lire l'agregat via ses **getters** (deballage des VOs en primitives, dates en ISO), jamais via `toSnapshot()` (reserve a la persistance: il porte des champs sensibles comme un hash de mot de passe ou des tokens).
- Un read model porte la **donnee brute du domaine**, pas une valeur derivee du transport (ex. un nom de fichier stocke plutot qu'une URL publique): la derivation revient a la Presentation. Voir `src/presentation/AGENTS.md`.
- **Une seule representation de lecture par agregat**: ne pas multiplier les read models par endpoint (detail vs liste). Un read model unique et complet est retourne par les queries comme par les commandes; le tri des champs exposes se fait en Presentation (presenters). Cohérent avec l'API source (`../api/`, ex. read model unique + groupes de serialisation cote Presentation).
- Les read models Application sont stables; Presentation les transforme via presenters.
- Ne pas retourner d'agregat Domain, d'objet Prisma ou d'objet Nest depuis un use case.

Temps:

- Le temps courant passe par `ClockPort`. Ne pas utiliser `new Date()` dans les use cases sauf pour transformer une valeur deja recue.
- Les TTL applicatifs utilisent des durees ISO-8601 avec `addIsoDuration`.
