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
- Presenters convertissent les read models Application en reponses HTTP. Forme libre selon le besoin: un presenter **sans dependance** reste une simple methode/fonction (statique); **des qu'il a besoin d'une dependance**, il devient un **service Nest injectable** (`@Injectable`, enregistre dans le module, injecte dans le controller). Les deux formes coexistent (cf. `../api/`).
- Toute **derivation propre au transport** se fait dans le presenter, jamais dans un use case (sinon elle se duplique a chaque cas d'usage). Exemple: resoudre une URL publique a partir d'un nom de fichier brut porte par le read model, via un port injecte. Le read model reste sur la donnee brute du domaine.
- Un presenter injectable peut dependre d'un **port Application** (en plus des read models/DTOs): c'est autorise (la Presentation peut dependre de l'Application; cf. presenter de reference cote `../api/`).
- Les filtres convertissent les exceptions Domain/Application connues en reponses HTTP stables.
- Quand une nouvelle erreur Domain/Application peut remonter a l'API, l'ajouter au mapping du filtre concerne.
- Garder la validation globale de `src/main.ts`: `whitelist`, `forbidNonWhitelisted`, `transform`.

Ordre des routes:

- Le routage Nest/Express se resout **par methode HTTP** et **dans l'ordre de declaration** des handlers dans le controller.
- Pour une meme methode HTTP, declarer les routes **statiques avant les routes parametrees** (`:id`, `:id/...`). Une route parametree declaree avant une route statique peut la masquer.
- Exemple: `@Post("register")`, `@Post("reset-password/...")` doivent precede `@Post(":id/avatar")`. Idem `@Get()` avant `@Get(":id")`.
- Cette regle s'applique segment par segment, mais ne pas se reposer sur un mismatch de nombre de segments ou de litteral pour eviter une collision: respecter l'ordre statique -> parametre reste la garantie robuste.

Routes actuelles:

- `POST /users/register` avec `RegisterUserRequest`.
- `POST /users/register/email-activation-request` avec `RequestActivationEmailRequest`, reponse `204`.
- `POST /users/register/validation` avec `ValidateActivationRequest`, reponse `204`.
- `POST /users/reset-password/request` avec `RequestPasswordResetRequest`, reponse `204`.
- `POST /users/reset-password/confirm` avec `ConfirmPasswordResetRequest`, reponse `204`.
- `GET /users/:id` avec `DisplayUserQuery`.
- `POST /users` avec `CreateUserByAdminRequest`.
- `PATCH /users/:id` avec `UpdateUserByAdminRequest`.
- `PATCH /users/:id/password` avec `UpdatePasswordRequest`, reponse `204`.
- `POST /users/:id/avatar` en `multipart/form-data` (champ `avatarFile`), reponse `UserResponse` avec `avatarUrl`.
- `DELETE /users/:id`, reponse `204`.
- `POST /users/reset-password/check` avec `CheckPasswordResetTokenRequest`, reponse `{ isValid: boolean }`.

POC: les routes admin/owner (`POST /users`, `PATCH /users/:id`, `PATCH /users/:id/password`, `POST /users/:id/avatar`, `DELETE /users/:id`) sont exposees sans authentification/autorisation pour l'instant. Quand l'auth (JWT, garde admin, contexte `/me`) sera ajoutee, les proteger et introduire les variantes `/users/me/*` en mirror de l'API principale `../api/`.

Attention: les ids User sont des UUID. Toute validation de parametre `id` doit etre compatible UUID.
