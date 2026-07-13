# RolesGuard

Fichier documente: `src/presentation/http/shared/guard/roles.guard.ts`.

## Role

`RolesGuard` est le guard HTTP charge d'autoriser ou de refuser l'acces a une route selon les roles de l'utilisateur authentifie.

Il est enregistre comme guard global via `APP_GUARD` dans `src/infrastructure/nest/modules/core/core.module.ts`, juste apres `JwtAuthGuard`.

Son role est strictement l'autorisation par role:

- lire les roles requis par une route ou un controller;
- recuperer l'utilisateur authentifie depuis `request.user`;
- appliquer la hierarchie de roles;
- verifier qu'au moins un role requis est accorde;
- refuser la requete avec `403 Forbidden` si les roles sont insuffisants.

Il ne verifie pas le JWT et ne cree pas `request.user`. Cette responsabilite appartient a `JwtAuthGuard`.

## Dependances

Le guard depend de:

- `Reflector`, fourni par Nest, pour lire les metadata posees par `@Roles(...)`;
- `Request` Express, pour lire `request.user`;
- `UserRole`, pour definir la hierarchie de roles;
- `AuthenticatedUser`, type du principal HTTP pose par `JwtAuthGuard`.

Il ne depend pas d'un use case, d'un repository, de Prisma, ni d'un service de token.

## Hierarchie des roles

Le guard declare une hierarchie locale:

```ts
const ROLE_HIERARCHY: Record<string, readonly string[]> = {
  [UserRole.SuperAdmin]: [UserRole.Admin],
  [UserRole.Admin]: [UserRole.Moderator],
  [UserRole.Moderator]: [UserRole.User],
  [UserRole.User]: [],
};
```

Cela signifie:

```text
ROLE_SUPER_ADMIN
  -> ROLE_ADMIN
    -> ROLE_MODERATOR
      -> ROLE_USER
```

Un utilisateur avec `ROLE_SUPER_ADMIN` herite donc des droits de `ROLE_ADMIN`, `ROLE_MODERATOR` et `ROLE_USER`.

Un utilisateur avec `ROLE_ADMIN` herite des droits de `ROLE_MODERATOR` et `ROLE_USER`, mais pas de `ROLE_SUPER_ADMIN`.

## Fonctionnement pas a pas

### 1. Nest appelle le guard apres JwtAuthGuard

Dans `CoreModule`, les guards globaux sont declares dans cet ordre:

```ts
{ provide: APP_GUARD, useClass: JwtAuthGuard },
{ provide: APP_GUARD, useClass: RolesGuard },
```

`JwtAuthGuard` passe d'abord. Si la route n'est pas publique, il verifie le token et pose `request.user`.

`RolesGuard` passe ensuite et utilise ce `request.user` pour verifier les roles.

### 2. Le guard lit les roles requis

Le guard lit la metadata `ROLES_KEY`:

```ts
const requiredRoles = this.reflector.getAllAndOverride<string[] | undefined>(
  ROLES_KEY,
  [context.getHandler(), context.getClass()],
);
```

`context.getHandler()` represente la methode du controller. `context.getClass()` represente la classe du controller.

`getAllAndOverride` cherche les roles aux deux niveaux, avec priorite a la methode. Cela permet d'utiliser `@Roles(...)` sur une route precise ou sur un controller entier.

### 3. Si aucun role n'est requis, la requete passe

Si la route ou le controller ne declare pas de role:

```ts
if (requiredRoles === undefined || requiredRoles.length === 0) {
  return true;
}
```

Le guard ne bloque pas la requete.

Important: cela ne veut pas forcement dire que la route est publique. Une route sans `@Roles(...)` peut quand meme etre authentifiee si elle n'a pas `@Public()`, car `JwtAuthGuard` est passe avant.

### 4. Le guard recupere l'utilisateur authentifie

Pour une route avec roles requis, le guard lit:

```ts
const request = context
  .switchToHttp()
  .getRequest<Request & { user?: AuthenticatedUser }>();
const user = request.user;
```

`request.user` doit normalement avoir ete pose par `JwtAuthGuard`.

Si aucun utilisateur n'est present, le guard lance:

```ts
ForbiddenException("Authentication required.")
```

La reponse HTTP est donc un `403 Forbidden`.

### 5. Le guard etend les roles de l'utilisateur

Le guard appelle:

```ts
const granted = this.expandRoles(user.roles);
```

Cette methode calcule tous les roles accordes a partir des roles directement presents dans le JWT.

Exemple avec:

```ts
user.roles = [UserRole.Admin];
```

Le resultat est:

```text
ROLE_ADMIN
ROLE_MODERATOR
ROLE_USER
```

### 6. Le guard teste les roles requis

Le guard accepte la requete si au moins un role requis est present dans les roles accordes:

```ts
const allowed = requiredRoles.some((role) => granted.has(role));
```

La logique est donc un `OR`, pas un `AND`.

Exemple:

```ts
@Roles(UserRole.Admin, UserRole.Moderator)
```

L'utilisateur doit posseder `ROLE_ADMIN` ou `ROLE_MODERATOR`, directement ou via la hierarchie.

### 7. Le guard refuse si aucun role requis n'est accorde

Si aucun role requis ne correspond:

```ts
throw new ForbiddenException("Insufficient role.");
```

La reponse HTTP est un `403 Forbidden`.

### 8. La requete continue

Si l'utilisateur possede un role suffisant, le guard retourne:

```ts
return true;
```

Nest laisse alors la requete continuer vers le controller.

## Detail de `expandRoles`

`expandRoles` utilise une pile:

```ts
const granted = new Set<string>();
const stack = [...roles];
```

Tant que la pile contient un role:

1. le guard retire un role de la pile;
2. il ignore le role s'il est absent ou deja traite;
3. il ajoute le role a `granted`;
4. il ajoute dans la pile les roles herites depuis `ROLE_HIERARCHY`.

Le `Set` evite les doublons et protege contre les cycles accidentels dans la hierarchie.

Si un role inconnu est present, il est ajoute a `granted`, mais il n'herite d'aucun autre role car `ROLE_HIERARCHY[role]` vaut `undefined`.

## Interaction avec les decorateurs

### `@Roles(...)`

`@Roles(...)` pose la metadata `ROLES_KEY`.

Exemple:

```ts
@Roles(UserRole.Admin)
```

La route demande alors un utilisateur ayant `ROLE_ADMIN`, ou un role superieur qui herite de `ROLE_ADMIN`.

### `@Public()`

`RolesGuard` ne lit pas directement `@Public()`.

Une route `@Public()` passe deja dans `JwtAuthGuard` sans token. Si cette meme route declare aussi `@Roles(...)`, `RolesGuard` demandera quand meme `request.user`, qui sera absent, et renverra `403 Forbidden`.

En pratique, il ne faut donc pas combiner `@Public()` et `@Roles(...)` sur la meme route.

### `@CurrentUser()`

`@CurrentUser()` lit aussi `request.user`, mais il est utilise dans les parametres de controller.

`RolesGuard` intervient avant le controller. Il peut donc bloquer la requete avant que `@CurrentUser()` ne soit resolu.

## Exemple de flux

Pour une route admin:

```ts
@Get("/users")
@Roles(UserRole.Admin)
```

Avec une requete:

```http
GET /users
Authorization: Bearer eyJ...
```

Le flux est:

```text
Requete HTTP
  -> JwtAuthGuard
    -> verification du JWT
    -> request.user = { roles: [...] }
  -> RolesGuard
    -> lecture de @Roles(UserRole.Admin)
    -> expansion des roles de request.user
    -> verification qu'un role accorde contient ROLE_ADMIN
  -> Controller
```

## Cas typiques

Utilisateur `ROLE_ADMIN`, route `@Roles(UserRole.Admin)`:

```text
accepte
```

Utilisateur `ROLE_SUPER_ADMIN`, route `@Roles(UserRole.Admin)`:

```text
accepte, car ROLE_SUPER_ADMIN herite de ROLE_ADMIN
```

Utilisateur `ROLE_USER`, route `@Roles(UserRole.Admin)`:

```text
refuse avec 403 Forbidden
```

Route sans `@Roles(...)`:

```text
acceptee par RolesGuard
```

## Points d'attention

- `RolesGuard` fait de l'autorisation, pas de l'authentification.
- `JwtAuthGuard` doit passer avant `RolesGuard`, sinon `request.user` ne sera pas disponible.
- La verification utilise une logique "au moins un role requis".
- La hierarchie donne des droits descendants, jamais ascendants.
- Une route publique ne doit pas porter `@Roles(...)`.
- Les routes admin doivent declarer explicitement `@Roles(UserRole.Admin)` ou un role plus precis si necessaire.
