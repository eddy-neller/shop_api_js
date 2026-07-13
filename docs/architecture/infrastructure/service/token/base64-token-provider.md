# Base64TokenProvider

Fichier documente : `src/infrastructure/service/token/base64-token-provider.ts`.

## Role

`Base64TokenProvider` implemente `TokenProviderPort` pour les tokens applicatifs
aleatoires et les tokens encodes contenant une adresse email.

## Fonctions

- `generateRandomToken()` produit 64 caracteres depuis un alphabet
  alphanumerique, avec `randomInt()` de Node.js.
- `encode(token, email)` assemble l'email et le token puis les encode en Base64.
- `split(encodedToken)` decode cette forme et retourne ses deux composants, ou
  un objet vide lorsque le separateur est absent.

Les tokens encodes servent aux flux existants qui transportent email et token ;
Base64 est un encodage, pas un chiffrement. Ils restent donc soumis aux regles de
validite et d'expiration portees par le Domain et les use cases.

## Limites

Ne pas mettre de donnees sensibles supplementaires dans cette representation.
Les refresh tokens ne sont pas encodes par cet adapter : ils sont aleatoires,
retournes bruts au client puis stockes uniquement sous forme de hash SHA-256.
