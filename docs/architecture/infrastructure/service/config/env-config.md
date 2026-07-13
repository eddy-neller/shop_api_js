# EnvConfig

Fichier documente : `src/infrastructure/service/config/env-config.ts`.

## Role

`EnvConfig` implemente `ConfigPort` et isole l'acces a `process.env` dans
l'infrastructure. Domain et Application ne lisent donc jamais directement les
variables d'environnement.

## Comportement

- `getString(name, defaultValue)` retourne la valeur non vide ou la valeur par
  defaut.
- `getNumber(name, defaultValue)` retourne un nombre fini ou la valeur par
  defaut si la variable est absente, vide ou invalide.

Les valeurs de repli sont definies par les consommateurs lorsque la valeur est
propre a leur cas d'usage. Les secrets obligatoires sont verifies par l'adapter
qui les consomme, par exemple `JwtAccessTokenProvider` pour `JWT_SECRET`.

## Cablage et attention

`EnvConfig` est un provider partage de `CoreModule`. Ajouter une nouvelle
configuration consiste a la documenter dans `.env.example` et `AGENTS.md`, puis
a la lire via `ConfigPort`, jamais directement depuis Application ou Domain.
