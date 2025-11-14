export interface ActeMedical {
  id: number;
  nom: string;
  type_de_soin: string; // Type de soin (ex: "Dentaire - Soins", "Médecine Spécialisée")
  bss: number; // Base de Remboursement Sécurité Sociale
  txRemboursementAm: number; // Taux AM (ex: 0.7 pour 70%)
  partForfaitaire: number; // Participation Forfaitaire/Franchise
}

export const ACTES_MEDICAUX: ActeMedical[] = [
  {
    id: 1,
    nom: "Consultation Généraliste Secteur 1",
    type_de_soin: "",
    bss: 25.0,
    txRemboursementAm: 0.7,
    partForfaitaire: 1.0,
  },
  {
    id: 2,
    nom: "Consultation Psychiatre - Secteur 1",
    type_de_soin: "",
    bss: 51.7,
    txRemboursementAm: 0.7,
    partForfaitaire: 2.0,
  },
  {
    id: 3,
    nom: "Consultation Spécialiste Secteur 1",
    type_de_soin: "",
    bss: 30.0,
    txRemboursementAm: 0.7,
    partForfaitaire: 1.0,
  },
  {
    id: 4,
    nom: "Détartrage",
    type_de_soin: "",
    bss: 28.92,
    txRemboursementAm: 0.7,
    partForfaitaire: 1.0,
  },
  {
    id: 5,
    nom: "Soin Carie 1 Face",
    type_de_soin: "",
    bss: 12.0,
    txRemboursementAm: 0.7,
    partForfaitaire: 1.0,
  },
  {
    id: 6,
    nom: "Consultation Ophtalmologiste Secteur 1",
    type_de_soin: "",
    bss: 30.0,
    txRemboursementAm: 0.7,
    partForfaitaire: 1.0,
  },
  {
    id: 7,
    nom: "Consultation Gynécologue Secteur 1",
    type_de_soin: "",
    bss: 30.0,
    txRemboursementAm: 0.7,
    partForfaitaire: 1.0,
  },
  {
    id: 8,
    nom: "Consultation Dermatologue Secteur 1",
    type_de_soin: "",
    bss: 30.0,
    txRemboursementAm: 0.7,
    partForfaitaire: 1.0,
  },
  {
    id: 9,
    nom: "Consultation Cardiologue Secteur 1",
    type_de_soin: "",
    bss: 30.0,
    txRemboursementAm: 0.7,
    partForfaitaire: 1.0,
  },
  {
    id: 10,
    nom: "Consultation ORL Secteur 1",
    type_de_soin: "",
    bss: 30.0,
    txRemboursementAm: 0.7,
    partForfaitaire: 1.0,
  },
];

