// factures.js : calculs d'une facture (montants en euros)

const TAUX_TVA = { normal: 0.20, intermediaire: 0.10, reduit: 0.055 };

function arrondir(montant) {
  return Math.round((montant + Number.EPSILON) * 100) / 100;
}

function totalLigne(ligne) {
  if (ligne.quantite < 0 || ligne.prixUnitaire < 0) {
    throw new Error("La quantité et le prix doivent être positifs");
  }
  return arrondir(ligne.quantite * ligne.prixUnitaire);
}

function totalHT(lignes) {
  return arrondir(lignes.reduce((total, ligne) => total + totalLigne(ligne), 0));
}

function appliquerRemise(montant, pourcentage) {
  if (pourcentage < 0 || pourcentage > 100) {
    throw new Error("La remise doit être comprise entre 0 et 100 %");
  }
  return arrondir(montant * (1 - pourcentage / 100));
}

function montantTVA(montantHT, taux = "normal") {
  if (!Object.hasOwn(TAUX_TVA, taux)) {
    throw new Error(`Taux de TVA inconnu : ${taux}`);
  }
  return arrondir(montantHT * TAUX_TVA[taux]);
}

function facture(lignes, remise = 0, taux = "normal") {
  const ht = appliquerRemise(totalHT(lignes), remise);
  const tva = montantTVA(ht, taux);
  return { ht, tva, ttc: arrondir(ht + tva) };
}

module.exports = { TAUX_TVA, arrondir, totalLigne, totalHT, appliquerRemise, montantTVA, facture };