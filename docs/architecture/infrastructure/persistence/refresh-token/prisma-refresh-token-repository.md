# PrismaRefreshTokenRepository

Fichiers documentes :

- `src/infrastructure/persistence/refresh-token/prisma-refresh-token.repository.ts` ;
- `src/infrastructure/persistence/refresh-token/refresh-token.mapper.ts`.

## Role

`PrismaRefreshTokenRepository` implemente le port Application
`RefreshTokenRepositoryPort`. Il persiste l'agregat de support `RefreshToken` du
bounded context Identity et ne manipule jamais un refresh token brut.

Le repository convertit les enregistrements Prisma avec `RefreshTokenMapper` avant
de retourner un agregat Domain. Prisma et son modele de persistence restent donc
confines a l'infrastructure.

## Donnees possedees

La table `refresh_tokens` est possedee par `identity-service`. Une session contient :

- son identifiant ;
- la reference `userId` vers l'utilisateur, par identite uniquement ;
- `tokenHash`, l'empreinte SHA-256 unique du secret ;
- `expiresAt` et `createdAt`.

Le repository ne charge pas l'objet `User` pour reconstituer une session : la
relation entre les deux agregats passe par `UserId`.

## Operations

- `nextIdentity()` cree une identite de session a partir de `IdGeneratorPort`.
- `save()` cree une session emise par `AuthTokenIssuer`.
- `findByHash()` retrouve une session a partir de l'empreinte deterministe du
  token presente.
- `delete()` revoque une session precise.
- `deleteAllForUser()` revoque toutes les sessions d'un utilisateur, notamment
  lorsqu'une regle de securite applicative l'exige.

La suppression utilise `deleteMany` : revoquer une session deja absente reste une
operation idempotente.

## Transaction et rotation

Le repository utilise le client stocke dans `PrismaTransactionContext` lorsqu'une
transaction est active, sinon `PrismaService`.

La rotation est orchestree dans `RefreshTokenUseCase`, pas dans le repository :

```text
hash du token recu
  -> findByHash
  -> verifier expiration et etat du User
  -> delete de l'ancienne session
  -> emission et save d'une nouvelle session
```

Cette sequence s'execute via `TransactionalPort`. Le repository fournit les
primitives de persistence ; les regles de validite, de rotation et de securite
restent dans Domain et Application.

## Cablage

`AuthModule` associe `REFRESH_TOKEN_REPOSITORY` a
`PrismaRefreshTokenRepository` avec une factory Nest. La factory fournit
`PrismaService`, `PrismaTransactionContext` et `ID_GENERATOR` sans introduire de
decorateur Nest dans le repository.

## Points d'attention

- Ne jamais ajouter une colonne contenant le token brut.
- Conserver l'unicite de `tokenHash` au niveau de la base.
- Garder le mapping explicite et ne jamais exposer un objet Prisma hors de
  l'infrastructure.
- Les changements de schema passent par une nouvelle migration Prisma ; ne pas
  modifier une migration partagee.
