# SystemClock

Fichier documente : `src/infrastructure/service/time/system-clock.ts`.

## Role

`SystemClock` implemente `ClockPort` et retourne l'heure courante du processus.
Il est la seule source de temps de production injectee dans les use cases.

## Pourquoi un port

Les regles temporelles — expiration, activation, reset de mot de passe,
blocage et duree des tokens — restent testables car Application depend de
`ClockPort`, pas de `new Date()`. Les tests utilisent un clock fixe et peuvent
ainsi couvrir les cas limites sans dependance a l'heure reelle.

## Cablage

`SystemClock` est fourni par `CoreModule` sous le token `CLOCK`. Il ne contient
aucune logique de fuseau horaire : les dates manipulees par l'application sont
des instants JavaScript.
