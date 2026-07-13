# BcryptPasswordHasher

Fichier documente : `src/infrastructure/service/crypto/bcrypt-password-hasher.ts`.

## Role

`BcryptPasswordHasher` implemente `PasswordHasherPort` pour les mots de passe
utilisateur. Il produit des hashes sales et verifie un mot de passe brut contre
un hash existant avec `bcryptjs`.

## Configuration

Le cout de bcrypt vient de `BCRYPT_SALT_ROUNDS`, avec une valeur de repli de
`12`. Augmenter ce cout renforce la resistance au brute force mais augmente le
temps de connexion et de creation ou modification de mot de passe.

## Limites

- Le mot de passe brut ne doit jamais etre persiste ni journalise.
- Cet adapter est reserve aux mots de passe humains.
- Il ne convient pas aux refresh tokens : leur recherche exige une empreinte
  deterministe, assuree par `Sha256RefreshTokenHasher`.

`BcryptPasswordHasher` est cable comme provider partage dans `CoreModule` sous
le token `PASSWORD_HASHER`.
