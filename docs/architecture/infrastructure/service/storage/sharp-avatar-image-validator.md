# SharpAvatarImageValidator

Fichier documente : `src/infrastructure/service/storage/sharp-avatar-image-validator.ts`.

## Role

`SharpAvatarImageValidator` implemente `AvatarImageValidatorPort`. Il valide un
fichier d'avatar avant sa persistence en utilisant les metadonnees lues par
Sharp.

## Regles appliquees

- le fichier et son buffer ne doivent pas etre vides ;
- seuls JPEG, PNG et WebP sont acceptes ;
- la taille ne doit pas depasser `AVATAR_MAX_SIZE` (2 097 152 octets par
  defaut, soit 2 MiB) ;
- largeur et hauteur doivent etre lisibles et ne pas depasser
  `AVATAR_MAX_DIMENSION` (512 pixels par defaut).

Un echec produit une `InvalidAvatarException`, erreur Domain que la Presentation
convertit vers la reponse HTTP appropriee.

## Limites

L'adapter ne redimensionne ni ne reencode l'image ; il valide le fichier recu.
Tout nouveau format autorise doit etre ajoute de maniere coherente au validateur
et a `DiskAvatarUploader`, qui determine l'extension du fichier persiste.
