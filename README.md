# tp-factures

Petit module Node.js de calcul d'une facture : totaux, remises, TVA et arrondis au centime.
Tous les montants sont en euros.

## À quoi ça sert

`factures.js` fournit les briques de calcul d'une facture :

- calculer le total d'une ligne (quantité × prix unitaire) ;
- additionner les lignes pour obtenir le total hors taxes ;
- appliquer une remise en pourcentage ;
- calculer la TVA selon le taux choisi ;
- assembler le tout dans un objet `facture` (HT, TVA, TTC).

Chaque montant renvoyé est arrondi au centime.

## Installation

Prérequis : **Node.js 24** ou plus récent.

```bash
git clone https://github.com/<votre-compte>/tp-factures.git
cd tp-factures
```

Le module n'a aucune dépendance : pas besoin de `npm install`.

## Utilisation

```js
const { facture } = require("./factures.js");

facture([{ quantite: 2, prixUnitaire: 50 }], 10, "intermediaire");
// { ht: 90, tva: 9, ttc: 99 }
```

## Lancer les tests

```bash
npm test
```

Les tests utilisent le lanceur intégré à Node.js (`node --test`) : aucune dépendance à installer.

## Fonctions

### `TAUX_TVA`

Constante qui liste les taux de TVA disponibles.

- **Valeur** : `{ normal: 0.2, intermediaire: 0.1, reduit: 0.055 }`
- **Exemple** :

```js
const { TAUX_TVA } = require("./factures.js");

TAUX_TVA.normal; // 0.2
```

### `arrondir(montant)`

Arrondit un montant au centime le plus proche.

- **Paramètres**
  - `montant` (`number`) : le montant à arrondir.
- **Retour** : `number`, le montant arrondi à 2 décimales.
- **Erreurs** : aucune.
- **Exemple** :

```js
arrondir(12.345); // 12.35
arrondir(1.005);  // 1.01
```

### `totalLigne(ligne)`

Calcule le total d'une ligne : `quantite × prixUnitaire`, arrondi au centime.

- **Paramètres**
  - `ligne.quantite` (`number`) : quantité, doit être positive ou nulle.
  - `ligne.prixUnitaire` (`number`) : prix unitaire, doit être positif ou nul.
- **Retour** : `number`, le total de la ligne.
- **Erreurs** :
  - `Error` « La quantité et le prix doivent être positifs » si `quantite` ou `prixUnitaire` est négatif.
- **Exemples** :

```js
totalLigne({ quantite: 2, prixUnitaire: 10.5 }); // 21
totalLigne({ quantite: 0.5, prixUnitaire: 0.05 }); // 0.03

totalLigne({ quantite: -1, prixUnitaire: 10 });
// Error: La quantité et le prix doivent être positifs
```

### `totalHT(lignes)`

Additionne le total de chaque ligne pour obtenir le total hors taxes.

- **Paramètres**
  - `lignes` (`Array`) : liste d'objets `{ quantite, prixUnitaire }` (voir `totalLigne`). Une liste vide donne `0`.
- **Retour** : `number`, le total hors taxes, arrondi au centime.
- **Erreurs** : celles de `totalLigne`, si une ligne contient une valeur négative.
- **Exemples** :

```js
totalHT([
  { quantite: 2, prixUnitaire: 10 },
  { quantite: 1, prixUnitaire: 5.5 },
]); // 25.5

totalHT([]); // 0
```

### `appliquerRemise(montant, pourcentage)`

Retire une remise en pourcentage à un montant, arrondi au centime.

- **Paramètres**
  - `montant` (`number`) : le montant avant remise.
  - `pourcentage` (`number`) : la remise, entre `0` et `100` (`15` pour 15 %).
- **Retour** : `number`, le montant après remise.
- **Erreurs** :
  - `Error` « La remise doit être comprise entre 0 et 100 % » si `pourcentage` est en dehors de `[0, 100]`.
- **Exemples** :

```js
appliquerRemise(200, 15); // 170
appliquerRemise(10.99, 50); // 5.5

appliquerRemise(100, 101);
// Error: La remise doit être comprise entre 0 et 100 %
```

### `montantTVA(montantHT, taux = "normal")`

Calcule le montant de TVA d'un montant hors taxes, arrondi au centime.

- **Paramètres**
  - `montantHT` (`number`) : le montant hors taxes.
  - `taux` (`string`, optionnel, `"normal"` par défaut) : une clé de `TAUX_TVA` : `"normal"`, `"intermediaire"` ou `"reduit"`.
- **Retour** : `number`, le montant de TVA.
- **Erreurs** :
  - `Error` « Taux de TVA inconnu : <taux> » si la clé n'existe pas dans `TAUX_TVA`.
- **Exemples** :

```js
montantTVA(100); // 20
montantTVA(100, "intermediaire"); // 10

montantTVA(100, "luxe");
// Error: Taux de TVA inconnu : luxe
```

### `facture(lignes, remise = 0, taux = "normal")`

Assemble une facture complète : total HT, remise, TVA et total TTC.

- **Paramètres**
  - `lignes` (`Array`) : liste d'objets `{ quantite, prixUnitaire }`.
  - `remise` (`number`, optionnel, `0` par défaut) : remise en pourcentage, entre `0` et `100`.
  - `taux` (`string`, optionnel, `"normal"` par défaut) : clé de `TAUX_TVA`.
- **Retour** : un objet `{ ht, tva, ttc }` :
  - `ht` : total hors taxes après remise ;
  - `tva` : montant de TVA ;
  - `ttc` : total toutes taxes comprises.
- **Erreurs** : celles de `totalHT`, `appliquerRemise` et `montantTVA`.
- **Exemples** :

```js
facture([{ quantite: 2, prixUnitaire: 50 }], 10, "intermediaire");
// { ht: 90, tva: 9, ttc: 99 }

facture([]);
// { ht: 0, tva: 0, ttc: 0 }
```
