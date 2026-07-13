# Sha256RefreshTokenHasher

Fichier documente : `src/infrastructure/service/crypto/sha256-refresh-token-hasher.ts`.

## Role

`Sha256RefreshTokenHasher` implemente le port Application `RefreshTokenHasherPort`.
Il produit l'empreinte persistable d'un refresh token a partir de son secret brut.

Il utilise SHA-256 et retourne une chaine hexadecimale. Cet adapter ne genere pas
de token, ne gere pas sa duree de vie et ne prend aucune decision d'authentification.

## Pourquoi SHA-256 et non bcrypt

Un refresh token est genere aleatoirement par `TokenProviderPort`. Il doit donc
etre imprevisible et avoir une entropie suffisante avant d'etre transmis au client.

Le serveur doit ensuite pouvoir retrouver la session associee au token presente :
le hash doit donc etre deterministe. Le meme secret brut produit toujours la meme
empreinte SHA-256, qui peut etre recherchee par `PrismaRefreshTokenRepository`.

`PasswordHasherPort` ne convient pas a ce besoin : bcrypt sale chaque hash et sa
verification est volontairement couteuse. Il est reserve aux mots de passe,
choisis par des humains et potentiellement faibles. SHA-256 est approprie ici car
le secret d'entree est aleatoire et a haute entropie ; il ne remplace pas le hashage
des mots de passe.

## Stockage et flux

Le secret brut n'est jamais enregistre en base. Seul son hash est stocke dans
`refresh_tokens.token_hash`.

```text
TokenProviderPort
  -> secret de refresh aleatoire
  -> Sha256RefreshTokenHasher.hash(secret)
  -> RefreshTokenHash
  -> PrismaRefreshTokenRepository
  -> refresh_tokens.token_hash
```

Lors d'un refresh ou d'une invalidation, le token recu est hashé a nouveau puis
recherche par son empreinte. Une fuite de la table ne fournit donc pas directement
de refresh token exploitable.

## Cablage

`AuthModule` associe `REFRESH_TOKEN_HASHER` a `Sha256RefreshTokenHasher` via
`useClass`. Les consommateurs restent dependants du port Application, notamment
`AuthTokenIssuer`, `RefreshTokenUseCase` et `LogoutUseCase`.

## Points d'attention

- Ne jamais persister ni journaliser le token brut.
- Ne pas remplacer SHA-256 par bcrypt : la recherche deterministe par empreinte
  ne fonctionnerait plus.
- Ne pas utiliser cet adapter pour les mots de passe.
- Toute evolution du format de hash doit prevoir une strategie de migration des
  sessions existantes.
