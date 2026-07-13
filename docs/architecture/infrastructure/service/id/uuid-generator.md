# UuidGenerator

Fichier documente : `src/infrastructure/service/id/uuid-generator.ts`.

## Role

`UuidGenerator` implemente `IdGeneratorPort` au moyen de `randomUUID()` de
Node.js. Il fournit des identifiants UUID aux repositories qui creent des
agregats ou des agregats de support.

## Responsabilite

La strategie de generation est technique et reste hors du Domain. Le repository
demande une identite avec `nextIdentity()` ; un use case ne depend donc pas
directement du generateur. Cette separation permet de remplacer facilement
l'implementation ou d'utiliser un double deterministe dans les tests.

## Cablage

`UuidGenerator` est un provider partage de `CoreModule`, expose sous le token
`ID_GENERATOR`. Il est notamment fourni aux repositories Prisma User et Refresh
Token via leurs factories Nest.
