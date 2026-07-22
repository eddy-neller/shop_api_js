# Domain Layer

> Couche `src/domain/`. Regles transverses (stack, dependances, conventions, commandes) : voir `AGENTS.md` racine.

Role: coeur metier pur.

Contient:

- Aggregats et entites dans `model/`.
- Value Objects dans `value-object/`.
- Domain Events dans `event/`.
- Exceptions metier dans `exception/`.

## `shared/` vs agregats (`user/`, `refresh-token/`)

Ce service porte le bounded context **Identity** (voir `AGENTS.md` racine), avec un
dossier **par agregat** a la racine de `domain/` :

- `user/` : l'agregat central (User, ses VOs, events, exceptions).
- `refresh-token/` : l'agregat de support RefreshToken (session d'authentification),
  qui reference User par identite (`UserId`) et porte son propre cycle de vie
  (`issue`, `isExpired`, revocation). Le secret brut n'est jamais stocke : l'agregat
  ne detient que son empreinte (`RefreshTokenHash`), calculee via un port de hachage.
- `shared/` : les **briques de base** de la couche Domain, agnostiques de l'agregat
  (`DomainException` base de toutes les exceptions metier, `DomainEvent` contrat de
  tous les events, `InvalidUuidException` sur un concept UUID generique).

Critere pour placer un nouveau fichier : *« ce concept parle-t-il d'un agregat precis,
ou du vocabulaire commun de la couche Domain ? »*. Reponse « un agregat » → dossier de
cet agregat ; reponse « commun / base technique du domaine » → `shared/`. Ne pas fondre
`shared/` dans un agregat : cela attribuerait a cet agregat des concepts qui ne lui
appartiennent pas, et
casserait le polymorphisme sur lequel s'appuient le filtre HTTP (`DomainException`)
et la publication d'events (`DomainEvent`).

## Organisation par bounded context et par concern

A l'interieur de `user/`, les gros dossiers (`value-object/`, `event/`, `exception/`)
sont sous-groupes par **concern** :

- `value-object/` : `identity/` (email, user-id, username), `profile/` (firstname,
  lastname, preferences), `security/` (password-hash, reset-password, security),
  `access/` (user-role), `lifecycle/` (user-status).
- `event/` : `lifecycle/`, `security/`, `profile/`, `management/` (actions admin).
- `exception/` : `identity/`, `profile/`, `security/`, `access/`, `lifecycle/`,
  `rate-limit/`, `uniqueness/`. Les exceptions transverses (`user-domain-exception`
  base, `user-not-found`) restent a la racine de `exception/`.

Nouveau fichier : le placer dans le sous-dossier de concern adequat. Un nouveau
sous-dossier de concern est justifie quand un groupe coherent emerge ; ne pas creer
de sous-dossier pour un seul fichier isole.

Regles:

- Aucune dependance vers Application, Infrastructure ou Presentation.
- Aucune dependance NestJS, Prisma, class-validator, bcrypt, crypto, HTTP, DB ou environnement.
- Les Value Objects sont immuables, valident et normalisent leurs invariants (`Email`, `UserId`, `PasswordHash`). Leur constructeur est `private`, sans exception : toute creation passe par une factory statique nommee (`fromString`, `fromObject`, `create`, etc.) qui exprime l'intention et centralise les invariants. Aucun `new ValueObject(...)` hors de sa propre classe.
- Les comparaisons de Value Objects se font via `equals()` quand disponible.
- Les aggregats exposent des methodes metier et des factories (`register`, `fromSnapshot`), pas de setters publics.
- `fromSnapshot` sert a rehydrater depuis la persistance et ne doit pas enregistrer d'event metier.
- Les events Domain sont des faits passes (`UserRegisteredEvent`) et doivent rester independants des frameworks.
- Le temps est fourni au Domain par parametre (`now: Date`), jamais cree directement dans le Domain.
- Les snapshots sont des contrats internes Domain <-> mapper; ne pas les exposer tels quels en HTTP. Conserver `toSnapshot()` uniquement dans la methode `toPersistence()` du mapper; les autres consommateurs lisent l'agregat via des getters cibles.
- Les messages des exceptions metier (Domain et Application) sont toujours rediges en anglais. Aucun message d'erreur en francais ne doit etre committe.

Quand un nouvel invariant est ajoute, ajouter ou mettre a jour l'exception Domain ciblee et les tests unitaires associes.
