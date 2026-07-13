# DiskAvatarUploader

Fichier documente : `src/infrastructure/service/storage/disk-avatar-uploader.ts`.

## Role

`DiskAvatarUploader` implemente `AvatarUploaderPort` et stocke les fichiers
d'avatar sur le disque local. Il retourne uniquement le nom de fichier ; le
Domain et Application ne connaissent ni chemin physique ni URL publique.

## Ecriture et nommage

Le repertoire est lu depuis `AVATAR_UPLOAD_DIR`, avec
`public/uploads/images/user/avatar` comme valeur par defaut. Il est cree au
besoin. Le nom est derive du `UserId`, d'un UUID aleatoire et du contenu du
fichier, puis associe a une extension connue (`jpg`, `png` ou `webp`).

La validation du type, de la taille et des dimensions appartient a
`SharpAvatarImageValidator` et doit avoir lieu avant l'upload.

## Suppression

`delete()` ignore un fichier deja absent (`ENOENT`) afin que la suppression soit
idempotente. Les autres erreurs du systeme de fichiers remontent a l'appelant.

## Limites

Ce stockage local convient au runtime actuel. Dans un deploiement a plusieurs
instances, le volume doit etre partage ou cet adapter doit etre remplace par un
stockage objet. Ne jamais faire remonter un chemin local dans une reponse HTTP.
