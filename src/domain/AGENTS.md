# Domain Layer

> Couche `src/domain/`. Regles transverses (stack, dependances, conventions, commandes) : voir `AGENTS.md` racine.

Role: coeur metier pur.

Contient:

- Aggregats et entites dans `model/`.
- Value Objects dans `value-object/`.
- Domain Events dans `event/`.
- Exceptions metier dans `exception/`.

Regles:

- Aucune dependance vers Application, Infrastructure ou Presentation.
- Aucune dependance NestJS, Prisma, class-validator, bcrypt, crypto, HTTP, DB ou environnement.
- Les Value Objects valident et normalisent leurs invariants (`Email`, `UserId`, `PasswordHash`).
- Les comparaisons de Value Objects se font via `equals()` quand disponible.
- Les aggregats exposent des methodes metier et des factories (`register`, `fromSnapshot`), pas de setters publics.
- `fromSnapshot` sert a rehydrater depuis la persistance et ne doit pas enregistrer d'event metier.
- Les events Domain sont des faits passes (`UserRegisteredEvent`) et doivent rester independants des frameworks.
- Le temps est fourni au Domain par parametre (`now: Date`), jamais cree directement dans le Domain.
- Les snapshots sont des contrats internes Domain <-> mapper; ne pas les exposer tels quels en HTTP.
- Les messages des exceptions metier (Domain et Application) sont toujours rediges en anglais. Aucun message d'erreur en francais ne doit etre committe.

Quand un nouvel invariant est ajoute, ajouter ou mettre a jour l'exception Domain ciblee et les tests unitaires associes.
