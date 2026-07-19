# Application Layer

> Couche `src/application/`. Regles transverses (stack, dependances, conventions, commandes) : voir `AGENTS.md` racine.

Role: orchestration des cas d'usage.

Contient:

- Use cases organises par capacite applicative:
  - `auth`: connexion, deconnexion, rotation du refresh token.
  - `onboarding`: inscription et activation du compte.
  - `account`: compte courant, profil, mot de passe, avatar, reset password et securite du compte.
  - `user-management`: administration des utilisateurs.
- Commands et Queries dans la capacite qui les porte (`RegisterUserCommand` dans `onboarding`, `UpdatePasswordCommand` dans `account`, `CreateUserByAdminCommand` dans `user-management`, etc.).
- DTOs/read models dans la capacite qui les expose quand ils sont specifiques (`AuthTokensReadModel` dans `auth`, `PasswordResetTokenCheckReadModel` dans `account`, `UserListReadModel` dans `user-management`).
- Contrats partages dans `shared` quand plusieurs capacites en dependent: DTOs dans `shared/dto`, ports dans `shared/port`, services applicatifs dans `shared/service`.
- Ports partages (`ClockPort`, `ConfigPort`, `TransactionalPort`, `IdGeneratorPort`, `PasswordHasherPort`, `TokenProviderPort`, `UserRepositoryPort`, `UserUniquenessCheckerPort`) dans `src/application/shared/port`.
- Services applicatifs purs (`UserUniquenessChecker`) quand ils orchestrent plusieurs ports sans dependance technique.
- Read models: classes avec une factory statique `from<Aggregate>(...)` faisant office de mapper (pas de fichier mapper separe).
- Erreurs Domain/Application attendues (`UserNotFoundException`, exceptions d'unicite, erreurs de token, limites d'activation/reset, utilisateur bloque, `InvalidCurrentPasswordException`, `SamePasswordException`, `InvalidPreferencesException`, `InvalidUserStatusException`, `InvalidRoleException`).
- La regle "nouveau mot de passe different de l'actuel" est appliquee dans `UpdatePasswordUseCase` (via `PasswordHasherPort.verify` sur le hash courant), pas en Presentation: une comparaison de hash en Domain serait inutile (bcrypt re-sale).
- La validite des valeurs propres a l'agregat est un invariant Domain mappe en `422`, pas une regle de DTO: la langue (`Preferences` -> `InvalidPreferencesException`), le statut (`UserStatus.fromNumber` -> `InvalidUserStatusException`) et le role (`toUserRole` -> `InvalidRoleException`). `toUserRole` rejette les roles inconnus (`InvalidRoleException.unknown`) et `ROLE_SUPER_ADMIN`, non assignable via une entree admin (`InvalidRoleException.notAssignable`): c'est traite comme une entree utilisateur erronee (`422`), pas comme une autorisation (`403`). `ROLE_SUPER_ADMIN` reste un role valide rehydrate via `fromSnapshot` (qui ne passe pas par `toUserRole`). Les DTOs admin ne gardent que la validation de forme (`@IsInt`, `@IsString({ each: true })`), la valeur etant validee par le Domain.

Regles:

- Depend uniquement de Domain et des ports Application.
- Ne depend jamais de NestJS, Prisma, Express, HTTP decorators, DTOs Presentation ou implementations Infrastructure.
- Les use cases orchestrent: valider les entrees en VOs, charger via ports, appeler Domain, persister via ports, retourner un read model.
- Un service applicatif pur interne est injecte directement par sa classe (ex. `AuthTokenIssuer`), sans creer de port ni d'adapter artificiel. Un port represente une dependance externe ou technique que l'Application doit abstraire (repository, horloge, configuration, chiffrement, fournisseur de token, etc.).
- **Commands et Queries portent des primitives, jamais de VOs Domain.** Une Command/Query est un message de transport (serialisable, loggable, transportable sur un bus): elle expose des scalaires bruts (`userId: string`, pas `userId: UserId`). La conversion primitive -> VO (`UserId.fromString(command.userId)`) se fait **a l'entree du use case**, qui est le seul point ou une entree devient un concept metier valide. Mettre un VO dans la Command deplacerait la validation Domain vers la Presentation (qui construit le message) et casserait la serialisabilite. Seules exceptions transverses admises: quelques types structures mais non-metier, qui restent des sacs de scalaires et non des instances de VO — le fichier uploade (`UpdateAvatarCommand.file: AvatarFile`, port), les formes de pagination/tri/filtre (`ListUsersQuery` page/itemsPerPage/filters/order) et un snapshot de primitives (`RegisterUserCommand.preferences: Partial<PreferencesSnapshot>`). N'ajouter une nouvelle exception de ce genre que si elle est transverse et sans logique metier.
- La logique metier reste dans Domain; Application gere seulement les decisions d'orchestration et les erreurs de cas d'usage.
- Toute dependance externe ou technique doit passer par un port dans `src/application/**/port`.
- Les tokens de DI (`USER_REPOSITORY`, `PASSWORD_HASHER`, `ID_GENERATOR`, `TOKEN_PROVIDER`, `USER_UNIQUENESS_CHECKER`, `CLOCK`, `CONFIG`, `TRANSACTIONAL`) vivent avec les ports.
- Les durees et limites configurables passent par `ConfigPort`; garder les valeurs par defaut dans le use case si elles sont propres au cas d'usage.
- Les use cases qui modifient l'agregat et persistent doivent passer par `TransactionalPort`.
- **Transactions des commandes : les garder aussi courtes que possible sans separer une decision de l'etat persistant qu'elle protege.** Avec le port local, cela signifie entourer la partie coherente par `transactional.execute(async () => ...)`.
  - **Avant la transaction** : effectuer ce qui est pur et independant de la persistance : validation de forme deja recue par le use case, parsing d'identifiants, construction de Value Objects, calculs, generation locale d'une valeur et validation d'un fichier. Une erreur a ce stade ne doit jamais appeler `TransactionalPort.execute`.
  - **Dans la transaction** : faire toute lecture de repository qui conditionne une ecriture, puis les mutations Domain et leurs persistances. Cela inclut notamment les controles d'existence, d'appartenance, d'unicite applicative et toute relecture necessaire pour construire le resultat de la commande. Une erreur issue d'une telle lecture est donc levee depuis le callback transactionnel.
  - **Hors transaction** : laisser les queries reellement independantes et tout I/O externe ou potentiellement long (HTTP, stockage de fichier, queue). Une lecture de preflight est egalement admise ici si elle n'est qu'une optimisation (par exemple eviter un upload inutile) et si la lecture qui decide effectivement la mutation est refaite dans la transaction. Ces effets ne doivent pas prolonger un verrou de base de donnees ; les coordonner par le mecanisme approprie au besoin (par exemple outbox pour un evenement).
  - **Tests Application** : pour une erreur de validation pure, verifier que le double de `TransactionalPort` n'est pas appele ; pour une erreur issue d'une lecture DB decisionnelle, verifier que le callback transactionnel a bien ete execute.
- L'identite d'un nouvel agregat vient de son repository via `nextIdentity()`; un use case ne doit pas injecter de generateur d'identifiant pour fabriquer un id. La generation d'id est une responsabilite de la couche persistance.
- Un read model Application est une **classe** exposant une factory statique de projection de l'agregat. Cette factory remplace un fichier mapper separe: la projection vit avec la forme. Lire l'agregat via ses **getters** (deballage des VOs en primitives, dates en ISO), jamais via `toSnapshot()` (reserve a la persistance: il porte des champs sensibles comme un hash de mot de passe ou des tokens). Conserver `toSnapshot()` uniquement dans la methode `toPersistence()` du mapper; remplacer tout usage Application par un getter cible et n'ajouter un getter que lorsqu'un cas d'usage en a reellement besoin.
- Un read model porte la **donnee brute du domaine**, pas une valeur derivee du transport (ex. un nom de fichier stocke plutot qu'une URL publique): la derivation revient a la Presentation. Voir `src/presentation/AGENTS.md`.
- **Une seule representation de lecture par agregat**: ne pas multiplier les read models par endpoint (detail vs liste). Un read model unique et complet est retourne par les queries comme par les commandes; le tri des champs exposes se fait en Presentation (presenters). Cohérent avec l'API source (`../api/`, ex. read model unique + groupes de serialisation cote Presentation).
- Les read models Application sont stables; Presentation les transforme via presenters.
- Ne pas retourner d'agregat Domain, d'objet Prisma ou d'objet Nest depuis un use case.

Temps:

- Le temps courant passe par `ClockPort`. Ne pas utiliser `new Date()` dans les use cases sauf pour transformer une valeur deja recue.
- Les TTL applicatifs utilisent des durees ISO-8601 avec `addIsoDuration`.
