# Pagination applicative

`Pagination` (`src/application/shared/pagination.ts`) est une valeur
applicative immuable. Elle regroupe la normalisation de `page` et
`itemsPerPage` pour les requetes de collection.

Elle est placee en couche Application, et non dans le Domain, car la
pagination ne represente pas un concept du metier Identity ni un invariant de
l'agregat `User`. C'est une politique de lecture d'un cas d'usage : une valeur
absente ou invalide est remplacee par `page = 1` et `itemsPerPage = 30`.

Cette decision est coherente avec l'API Symfony de reference, ou la classe
equivalente est `App\Application\Shared\ReadModel\Pagination` et est
instanciee par le handler de liste des utilisateurs.

## Frontiere des couches

- La Presentation transporte seulement les scalaires recus par HTTP.
- La Command ou Query transporte aussi ces primitives : elle ne contient pas
  une instance de `Pagination`.
- Le use case construit `Pagination`, puis transmet les nombres normalises au
  port de repository.
- Le Domain reste reserve aux VOs metier, tels que `UserId`, `Email` et
  `Username`.

Ne deplacer `Pagination` vers le Domain que si la pagination devenait un
concept metier avec des invariants propres a l'agregat, ce qui n'est pas le
cas. A l'inverse, si une regle ne servait qu'a decoder ou presenter HTTP, elle
appartiendrait a la Presentation et non a cette valeur applicative.
