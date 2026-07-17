# Presentation Layer (HTTP)

> Couche `src/presentation/`. Regles transverses (stack, dependances, conventions, commandes) : voir `AGENTS.md` racine.

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
- **Pas d'instance de VO Domain en Presentation.** La Presentation ne doit **jamais construire, typer ni transporter une instance** de VO Domain: pas de `new XxxVo()` ni `XxxVo.from*()`, pas de propriete, parametre ou retour type par un VO. La conversion scalaire -> VO et la validation des invariants metier appartiennent au handler Application (voir `src/application/AGENTS.md`). Seuls sont autorises les **enums Domain** references pour leurs membres constants — les roles dans la securite (`@Roles(UserRole.Admin)`, hierarchie du `RolesGuard`).
- **Inputs (DTOs de requete) scalaires.** Un DTO de requete ne porte que des scalaires (ou des formes structurees de scalaires); il ne porte jamais d'instance de VO Domain. Il construit la `Command`/`Query` a partir de ces scalaires; l'hydratation en VOs se fait cote Application.
- Presenters convertissent les read models Application en reponses HTTP. Forme libre selon le besoin: un presenter **sans dependance** reste une simple methode/fonction (statique); **des qu'il a besoin d'une dependance**, il devient un **service Nest injectable** (`@Injectable`, enregistre dans le module, injecte dans le controller). Les deux formes coexistent (cf. `../api/`).
- Toute **derivation propre au transport** se fait dans le presenter, jamais dans un use case (sinon elle se duplique a chaque cas d'usage). Exemple: resoudre une URL publique a partir d'un nom de fichier brut porte par le read model, via un port injecte. Le read model reste sur la donnee brute du domaine.
- Un presenter injectable peut dependre d'un **port Application** (en plus des read models/DTOs): c'est autorise (la Presentation peut dependre de l'Application; cf. presenter de reference cote `../api/`).
- Les filtres convertissent les exceptions Domain/Application connues en reponses HTTP stables.
- Quand une nouvelle erreur Domain/Application peut remonter a l'API, l'ajouter au mapping du filtre concerne.

Mapping des exceptions metier (deux niveaux):

- **Mapping fin, par controller**: `UserDomainExceptionFilter` (`@UseFilters` sur chaque controller) traduit chaque exception `UserDomainException` / `InvalidUuidException` vers son status HTTP precis (409, 404, 422, 423, 429, 401, 403...). C'est ici qu'on ajoute une nouvelle correspondance quand une erreur metier remonte a l'API.
- **Filet de securite global**: `DomainExceptionFilter` est enregistre en `APP_FILTER` (cf. `CoreModule`) et catche `DomainException` (la base). Nest resout du scope le plus proche au plus large (methode -> controller -> global): le filtre global n'intervient donc **qu'en rattrapage**, pour une `DomainException` qu'aucun filtre plus proche n'a traitee (ex: controller sans `@UseFilters`). Il rend un `400` propre au lieu de laisser fuiter un `500`. Ce n'est pas l'endroit ou l'on affine un status: il reste volontairement generique.
- Garder la validation globale de `src/main.ts`: `whitelist`, `forbidNonWhitelisted`, `transform`.

Ordre des routes:

- Le routage Nest/Express se resout **par methode HTTP** et **dans l'ordre de declaration** des handlers dans le controller.
- Pour une meme methode HTTP, declarer les routes **statiques avant les routes parametrees** (`:id`, `:id/...`). Une route parametree declaree avant une route statique peut la masquer.
- Exemple: `@Post("register")`, `@Post("reset-password/...")` doivent precede `@Post(":id/avatar")`. Idem `@Get()` avant `@Get(":id")`.
- Cette regle s'applique segment par segment, mais ne pas se reposer sur un mismatch de nombre de segments ou de litteral pour eviter une collision: respecter l'ordre statique -> parametre reste la garantie robuste.

Authentification:

- JWT d'acces (HS256) + refresh token persiste a usage unique (rotation). Voir `src/application/auth/use-case/command/{login,refresh-token,logout}` et `src/infrastructure/service/token/jwt-access-token-provider.ts`.
- Securise par defaut: `JwtAuthGuard` et `RolesGuard` globaux (`APP_GUARD`, cf. `CoreModule`). Une route est ouverte uniquement si elle porte `@Public()`; une route admin porte `@Roles(UserRole.Admin)` (hierarchie de roles appliquee par `RolesGuard`).
- `@CurrentUser()` injecte le principal (`AuthenticatedUser { id, email, username, roles }`) issu des claims du JWT. Les routes `/users/me/*` derivent toujours l'id cible du token, jamais de l'URL.

Routes auth (`AuthController`, `@Public` sauf invalidate):

- `POST /auth/login` avec `LoginRequest`, reponse `{ accessToken, refreshToken, tokenType, expiresIn }` (`200`).
- `POST /auth/token/refresh` avec `RefreshTokenRequest`, meme reponse (rotation du refresh token).
- `POST /auth/token/invalidate` (authentifie) avec `LogoutRequest`, reponse `204` (revoque le refresh token, idempotent).

Routes publiques (`@Public`):

- `POST /users/register` avec `RegisterUserRequest`.
- `POST /users/register/email-activation-request` avec `RequestActivationEmailRequest`, reponse `204`.
- `POST /users/register/validation` avec `ValidateActivationRequest`, reponse `204`.
- `POST /users/reset-password/request` avec `RequestPasswordResetRequest`, reponse `204`.
- `POST /users/reset-password/check` avec `CheckPasswordResetTokenRequest`, reponse `{ isValid: boolean }`.
- `POST /users/reset-password/confirm` avec `ConfirmPasswordResetRequest`, reponse `204`.

Routes du compte courant (`MeController`, authentifiees):

- `GET /users/me`, reponse `UserResponse`.
- `PATCH /users/me/password` avec `UpdatePasswordRequest`, reponse `204`.
- `POST /users/me/avatar` en `multipart/form-data` (champ `avatarFile`), reponse `UserResponse` avec `avatarUrl`.

Routes admin (`UserManagementController`, `@Roles(UserRole.Admin)`):

- `GET /users` (liste paginee).
- `GET /users/:id` avec `DisplayUserQuery`.
- `POST /users` avec `CreateUserByAdminRequest`.
- `PATCH /users/:id` avec `UpdateUserByAdminRequest`.
- `DELETE /users/:id`, reponse `204`.

Attention: les ids d'agregat exposes sont des UUID. Toute validation de parametre `id` doit etre compatible UUID.
