# JwtAccessTokenProvider

Fichier documente : `src/infrastructure/service/token/jwt-access-token-provider.ts`.

## Role

`JwtAccessTokenProvider` implemente `AccessTokenProviderPort` pour emettre et
verifier les JWT d'acces. Il encapsule `JwtService` de Nest afin que les couches
Application et Presentation ne dependent pas directement de cette librairie.

## Claims et duree de vie

Le token contient `sub`, `email`, `username` et `roles`. Sa duree de vie est lue
dans `JWT_ACCESS_TTL` (valeur par defaut : `PT15M`) et convertie en secondes pour
la signature. La valeur `expiresIn` retournee au client correspond a cette meme
duree.

`JWT_SECRET` est obligatoire au runtime. Une valeur absente ou vide produit une
erreur de configuration ; aucun secret par defaut n'est accepte.

## Verification

La verification valide la signature avec le meme secret puis recompose les
claims attendues par le port. Tout token invalide, expire ou impossible a
verifier est converti en `InvalidCredentialsException`, sans exposer le detail
technique de JWT.

## Cablage et limites

L'adapter est cable dans `CoreModule` sous `ACCESS_TOKEN_PROVIDER` car il est
utilise par l'authentification et le guard JWT global. Un JWT d'acces reste
stateless : sa revocation individuelle n'est pas geree par cet adapter. La
gestion des sessions et la rotation sont portees par les refresh tokens.
