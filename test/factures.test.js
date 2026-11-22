const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const {
  TAUX_TVA,
  arrondir,
  totalLigne,
  totalHT,
  appliquerRemise,
  montantTVA,
  facture,
} = require("../factures.js");

describe("TAUX_TVA", () => {
  test("contient les trois taux français", () => {
    assert.deepEqual(TAUX_TVA, { normal: 0.2, intermediaire: 0.1, reduit: 0.055 });
  });
});

describe("arrondir", () => {
  test("cas normaux", () => {
    assert.equal(arrondir(12.345), 12.35);
    assert.equal(arrondir(12.344), 12.34);
    assert.equal(arrondir(10), 10);
  });

  test("cas limites : 0 et arrondi au centime", () => {
    assert.equal(arrondir(0), 0);
    assert.equal(arrondir(1.005), 1.01);
    assert.equal(arrondir(0.1 + 0.2), 0.3);
  });
});

describe("totalLigne", () => {
  test("cas normal : quantité × prix unitaire", () => {
    assert.equal(totalLigne({ quantite: 2, prixUnitaire: 10.5 }), 21);
  });

  test("cas limites : quantité ou prix à 0", () => {
    assert.equal(totalLigne({ quantite: 0, prixUnitaire: 99 }), 0);
    assert.equal(totalLigne({ quantite: 5, prixUnitaire: 0 }), 0);
  });

  test("cas limite : arrondi au centime", () => {
    assert.equal(totalLigne({ quantite: 3, prixUnitaire: 0.1 }), 0.3);
    assert.equal(totalLigne({ quantite: 0.5, prixUnitaire: 0.05 }), 0.03);
  });

  test("erreur : quantité négative", () => {
    assert.throws(() => totalLigne({ quantite: -1, prixUnitaire: 10 }), {
      message: "La quantité et le prix doivent être positifs",
    });
  });

  test("erreur : prix négatif", () => {
    assert.throws(() => totalLigne({ quantite: 1, prixUnitaire: -10 }), {
      message: "La quantité et le prix doivent être positifs",
    });
  });
});

describe("totalHT", () => {
  test("cas normal : somme des lignes", () => {
    assert.equal(
      totalHT([
        { quantite: 2, prixUnitaire: 10 },
        { quantite: 1, prixUnitaire: 5.5 },
      ]),
      25.5
    );
  });

  test("cas limite : liste vide", () => {
    assert.equal(totalHT([]), 0);
  });

  test("cas limite : arrondi de la somme", () => {
    assert.equal(
      totalHT([
        { quantite: 1, prixUnitaire: 0.1 },
        { quantite: 1, prixUnitaire: 0.2 },
      ]),
      0.3
    );
  });

  test("erreur : une ligne avec quantité négative", () => {
    assert.throws(
      () =>
        totalHT([
          { quantite: 1, prixUnitaire: 10 },
          { quantite: -2, prixUnitaire: 10 },
        ]),
      { message: "La quantité et le prix doivent être positifs" }
    );
  });
});

describe("appliquerRemise", () => {
  test("cas normaux", () => {
    assert.equal(appliquerRemise(200, 15), 170);
    assert.equal(appliquerRemise(19.99, 10), 17.99);
  });

  test("cas limites : remise de 0 % et de 100 %", () => {
    assert.equal(appliquerRemise(100, 0), 100);
    assert.equal(appliquerRemise(100, 100), 0);
  });

  test("cas limite : montant à 0", () => {
    assert.equal(appliquerRemise(0, 30), 0);
  });

  test("cas limite : arrondi au centime", () => {
    assert.equal(appliquerRemise(10.99, 50), 5.5);
  });

  test("erreur : remise négative", () => {
    assert.throws(() => appliquerRemise(100, -1), {
      message: "La remise doit être comprise entre 0 et 100 %",
    });
  });

  test("erreur : remise supérieure à 100 %", () => {
    assert.throws(() => appliquerRemise(100, 101), {
      message: "La remise doit être comprise entre 0 et 100 %",
    });
  });
});

describe("montantTVA", () => {
  test("cas normaux : chaque taux", () => {
    assert.equal(montantTVA(100), 20);
    assert.equal(montantTVA(100, "intermediaire"), 10);
    assert.equal(montantTVA(100, "reduit"), 5.5);
  });

  test("taux normal par défaut", () => {
    assert.equal(montantTVA(50), montantTVA(50, "normal"));
  });

  test("cas limites : montant à 0", () => {
    assert.equal(montantTVA(0), 0);
    assert.equal(montantTVA(0, "reduit"), 0);
  });

  test("cas limite : arrondi au centime", () => {
    assert.equal(montantTVA(0.01, "reduit"), 0);
  });

  test("erreur : taux inconnu", () => {
    assert.throws(() => montantTVA(100, "inconnu"), {
      message: "Taux de TVA inconnu : inconnu",
    });
  });

  test("erreur : propriété héritée d'Object refusée", () => {
    assert.throws(() => montantTVA(100, "toString"), {
      message: "Taux de TVA inconnu : toString",
    });
  });
});

describe("facture", () => {
  test("cas normal : taux normal par défaut", () => {
    assert.deepEqual(facture([{ quantite: 2, prixUnitaire: 50 }]), {
      ht: 100,
      tva: 20,
      ttc: 120,
    });
  });

  test("cas normal : avec remise et taux intermédiaire", () => {
    assert.deepEqual(facture([{ quantite: 2, prixUnitaire: 50 }], 10, "intermediaire"), {
      ht: 90,
      tva: 9,
      ttc: 99,
    });
  });

  test("cas limite : liste vide", () => {
    assert.deepEqual(facture([]), { ht: 0, tva: 0, ttc: 0 });
  });

  test("cas limite : remise de 100 %", () => {
    assert.deepEqual(facture([{ quantite: 1, prixUnitaire: 100 }], 100), {
      ht: 0,
      tva: 0,
      ttc: 0,
    });
  });

  test("cas limite : taux réduit", () => {
    assert.deepEqual(facture([{ quantite: 1, prixUnitaire: 100 }], 0, "reduit"), {
      ht: 100,
      tva: 5.5,
      ttc: 105.5,
    });
  });

  test("erreur : remise hors limites", () => {
    assert.throws(() => facture([{ quantite: 1, prixUnitaire: 10 }], 150));
  });

  test("erreur : taux inconnu", () => {
    assert.throws(() => facture([{ quantite: 1, prixUnitaire: 10 }], 0, "luxe"), {
      message: "Taux de TVA inconnu : luxe",
    });
  });

  test("erreur : ligne avec valeur négative", () => {
    assert.throws(() => facture([{ quantite: -1, prixUnitaire: 10 }]), {
      message: "La quantité et le prix doivent être positifs",
    });
  });
});
