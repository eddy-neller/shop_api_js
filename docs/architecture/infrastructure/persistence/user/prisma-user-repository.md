# PrismaUserRepository

Fichiers documentes :

- `src/infrastructure/persistence/user/prisma-user.repository.ts` ;
- `src/infrastructure/persistence/user/user.mapper.ts`.

## Role

`PrismaUserRepository` implemente `UserRepositoryPort` pour l'agregat central
`User` du bounded context Identity. Il encapsule Prisma et transforme chaque
enregistrement persiste en agregat Domain avant de le retourner aux use cases.

`UserMapper` est la frontiere entre le modele Prisma `User` et le snapshot de
l'agregat. Aucun objet Prisma, ni type `Prisma.*`, ne sort de l'infrastructure.

## Donnees persistees

Le modele Prisma `User` correspond a la table `users`, possedee par
`identity-service`. Il porte notamment l'identite, le profil, l'email, le hash
de mot de passe, les roles, le statut et les informations de securite.

Les champs `roles`, `security`, `activeEmail`, `resetPassword` et `preferences`
sont stockes en JSON. Le mapper valide la forme minimale de ces valeurs avant de
rehydrater l'agregat. Une valeur JSON corrompue est une erreur de persistence :
elle ne doit pas etre silencieusement interpretee comme une donnee metier valide.

## Operations

- `nextIdentity()` construit un `UserId` a partir de `IdGeneratorPort`.
- `save()` utilise un `upsert` sur l'identifiant : le meme chemin persiste la
  creation comme les mutations de l'agregat.
- `delete()` supprime l'utilisateur identifie par son snapshot.
- `findById()`, `findByEmail()` et `findByUsername()` retournent un `User` ou
  `null`.
- `findByActivationToken()` et `findByResetPasswordToken()` interrogent les
  proprietes `token` des colonnes JSON correspondantes.
- `list()` applique les filtres optionnels `username` et `email` de maniere
  insensible a la casse, le tri demande et la pagination ; il retourne les
  agregats et les metadonnees de totalisation attendus par le port.

Les regles d'unicite, d'autorisation et de validite restent dans Application et
Domain. Les contraintes de base, notamment l'unicite de l'email, completent ces
regles mais ne les remplacent pas.

## Mapping

`toPersistence()` utilise `User.toSnapshot()` car il ecrit une representation
interne complete, incluant des champs sensibles tels que `passwordHash` et les
tokens de cycle de vie. Cette representation ne doit jamais etre reutilisee dans
un read model ou une reponse HTTP.

`toDomain()` utilise `User.fromSnapshot()` apres avoir valide :

- que `roles` est une liste de chaines ;
- que chaque champ JSON attendu est un objet ;
- les valeurs par defaut de compatibilite des snapshots, par exemple les
  compteurs de securite absents ou la langue `fr`.

Les Value Objects et invariants du Domain restent la validation finale de la
donnee rehydratee.

## Transaction et cablage

Chaque operation utilise le client actif de `PrismaTransactionContext` lorsqu'il
existe ; sinon elle utilise `PrismaService`. Les use cases qui combinent plusieurs
operations de persistence les encadrent via `TransactionalPort`.

`CoreModule` associe `USER_REPOSITORY` a `PrismaUserRepository` avec une factory
Nest et lui fournit `PrismaService`, `PrismaTransactionContext` et
`ID_GENERATOR`. Le repository reste ainsi une classe sans decorateur Nest,
instanciable directement en test.

## Points d'attention

- Toute evolution du modele `User` exige un mapping explicite dans les deux sens
  et une migration Prisma lorsqu'elle modifie le schema.
- Conserver les noms de colonnes et index definis dans `prisma/schema.prisma`.
- Ne pas exposer le snapshot persistant vers Presentation : il contient des
  donnees sensibles.
- Traiter explicitement les violations de contraintes Prisma lorsqu'une course
  entre operations doit etre traduite en erreur applicative.
