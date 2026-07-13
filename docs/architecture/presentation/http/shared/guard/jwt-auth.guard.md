# JwtAuthGuard

Fichier documente: `src/presentation/http/shared/guard/jwt-auth.guard.ts`.

## Role

`JwtAuthGuard` est le guard HTTP charge d'authentifier les requetes avec un JWT d'acces.

Il est enregistre comme guard global via `APP_GUARD` dans `src/infrastructure/nest/modules/core/core.module.ts`. Cela signifie que les routes sont protegees par defaut. Une route ne devient publique que si elle porte le decorateur `@Public()`.

Le guard ne contient pas de logique metier utilisateur. Il fait uniquement le travail de transport HTTP:

- detecter si une route est publique;
- lire le header HTTP `Authorization`;
- extraire un token `Bearer`;
- verifier ce token via le port Application `AccessTokenProviderPort`;
- poser l'utilisateur authentifie sur `request.user`.

## Dependances

Le guard depend de:

- `Reflector`, fourni par Nest, pour lire les metadata posees par les decorateurs;
- `ACCESS_TOKEN_PROVIDER`, port Application qui expose `verify(token)`;
- `Request` Express, uniquement pour acceder au header HTTP et enrichir la requete avec `user`.

La verification concrete du JWT est faite par l'infrastructure, via l'implementation branchee sur `ACCESS_TOKEN_PROVIDER`. Le guard ne depend donc pas directement de `JwtService`, de la configuration runtime, ni d'une implementation technique.

## Fonctionnement pas a pas

### 1. Nest appelle le guard avant le controller

Pour chaque requete HTTP protegee par le module, Nest appelle:

```ts
canActivate(context: ExecutionContext): boolean
```

Si cette methode retourne `true`, la requete continue vers le controller. Si elle lance une exception, Nest arrete la requete et renvoie l'erreur HTTP correspondante.

### 2. Le guard verifie si la route est publique

Le guard lit la metadata `IS_PUBLIC_KEY`:

```ts
const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
  context.getHandler(),
  context.getClass(),
]);
```

`context.getHandler()` represente la methode du controller. `context.getClass()` represente la classe du controller.

`getAllAndOverride` permet de chercher la metadata aux deux niveaux, avec priorite a la methode. C'est ce qui permet d'utiliser `@Public()` sur une route precise ou sur un controller entier.

Si `isPublic === true`, le guard retourne directement `true`.

### 3. Le guard recupere la requete HTTP

Pour les routes non publiques, le guard bascule le contexte Nest vers HTTP:

```ts
const request = context
  .switchToHttp()
  .getRequest<Request & { user?: AuthenticatedUser }>();
```

Le type ajoute `user?: AuthenticatedUser`, car le guard va enrichir la requete avec l'utilisateur authentifie si le token est valide.

### 4. Le guard extrait le token Bearer

Le guard appelle:

```ts
const token = this.extractBearerToken(request);
```

Cette methode lit:

```http
Authorization: Bearer <accessToken>
```

Elle retourne `null` si:

- le header `Authorization` est absent;
- le schema n'est pas exactement `Bearer`;
- la valeur du token est absente;
- la valeur du token est vide apres `trim()`.

Si aucun token valide n'est extrait, le guard lance:

```ts
UnauthorizedException("Missing bearer token.")
```

La reponse HTTP est donc un `401 Unauthorized`.

### 5. Le guard verifie le token

Si un token est present, le guard appelle le port Application:

```ts
const claims = this.accessTokens.verify(token);
```

Les claims attendus sont:

```ts
{
  sub: string;
  email: string;
  username: string;
  roles: string[];
}
```

`sub` est l'identifiant utilisateur porte par le JWT.

### 6. Le guard cree le principal HTTP

Quand la verification reussit, le guard transforme les claims en `AuthenticatedUser`:

```ts
request.user = {
  id: claims.sub,
  email: claims.email,
  username: claims.username,
  roles: claims.roles,
};
```

Cette affectation est importante: les elements suivants de la pipeline HTTP peuvent ensuite recuperer l'utilisateur courant depuis `request.user`.

### 7. La requete continue

Apres avoir pose `request.user`, le guard retourne:

```ts
return true;
```

Nest laisse alors la requete continuer vers les autres guards, pipes, interceptors et finalement le controller.

Dans ce projet, `RolesGuard` est enregistre apres `JwtAuthGuard`. Il peut donc lire `request.user.roles` pour appliquer les restrictions de roles.

## Gestion des erreurs

Deux erreurs principales peuvent sortir de ce guard:

```ts
UnauthorizedException("Missing bearer token.")
```

Cette erreur signifie que la route requiert une authentification, mais que la requete ne fournit pas de token Bearer exploitable.

```ts
UnauthorizedException("Invalid bearer token.")
```

Cette erreur signifie qu'un token a ete fourni, mais que sa verification a echoue: signature invalide, expiration, secret incorrect, payload invalide, ou autre erreur masquee par le provider.

Le guard ne propage pas l'erreur interne du provider. Il expose volontairement une erreur HTTP stable et generique.

## Interaction avec les decorateurs

### `@Public()`

`@Public()` pose la metadata `IS_PUBLIC_KEY` a `true`. Le guard la lit au debut de `canActivate`.

Une route marquee `@Public()` ne demande pas de token.

### `@CurrentUser()`

`@CurrentUser()` lit `request.user`.

Ce decorateur suppose donc que `JwtAuthGuard` est deja passe et a pose l'utilisateur authentifie. Si `request.user` est absent, il lance une `UnauthorizedException("Authentication required.")`.

### `@Roles(...)`

`@Roles(...)` est exploite par `RolesGuard`, pas directement par `JwtAuthGuard`.

L'ordre global est important:

```ts
{ provide: APP_GUARD, useClass: JwtAuthGuard },
{ provide: APP_GUARD, useClass: RolesGuard },
```

`JwtAuthGuard` authentifie d'abord et pose `request.user`. `RolesGuard` autorise ensuite selon les roles contenus dans `request.user.roles`.

## Exemple de flux

Pour une requete authentifiee:

```http
GET /users/me
Authorization: Bearer eyJ...
```

Le flux est:

```text
Requete HTTP
  -> JwtAuthGuard
    -> route publique ? non
    -> extraction du Bearer token
    -> verification du JWT via AccessTokenProviderPort
    -> request.user = AuthenticatedUser
  -> RolesGuard
  -> Controller
    -> @CurrentUser() lit request.user
```

Pour une route publique:

```text
Requete HTTP
  -> JwtAuthGuard
    -> route publique ? oui
    -> return true
  -> Controller
```

## Points d'attention

- Le guard attend le schema `Bearer` avec une majuscule initiale. `bearer` est refuse.
- Le guard ne recharge pas l'utilisateur depuis la base de donnees. Il fait confiance aux claims verifies du JWT.
- Les routes publiques doivent etre explicitement marquees avec `@Public()`.
- Les routes qui utilisent `@CurrentUser()` doivent rester non publiques, sauf cas tres particulier ou le code gere explicitement l'absence d'utilisateur.
- Les controles d'autorisation par role restent dans `RolesGuard`, pas dans `JwtAuthGuard`.
