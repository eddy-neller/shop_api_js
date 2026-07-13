# PathAvatarUrlResolver

Fichier documente : `src/infrastructure/service/storage/path-avatar-url-resolver.ts`.

## Role

`PathAvatarUrlResolver` implemente `AvatarUrlResolverPort`. Il transforme le nom
de fichier persiste d'un avatar en son URL publique, sans modifier la donnee
stockee dans l'agregat User.

## Configuration

Le prefixe public vient de `AVATAR_BASE_URL`, avec
`/uploads/images/user/avatar` comme valeur par defaut. Un slash final eventuel
est retire avant de concatener le nom de fichier.

Si l'utilisateur n'a pas d'avatar, `resolve()` retourne `null`.

## Limites

L'adapter ne verifie pas l'existence du fichier et ne sert aucun contenu. Le
serveur HTTP ou le stockage choisi est responsable de l'exposition du repertoire.
Changer de CDN ou de stockage ne doit modifier que cet adapter et son cablage.
