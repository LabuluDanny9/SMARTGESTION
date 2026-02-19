import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Rapport secrétaire – PDF (sans colonne Côté)
 * Tableau: N° | Nom | Faculté | Promotion | Montant
 */
export function exportActivityToPDF(activity, participations, adminName = 'Secrétaire') {
  const doc = new jsPDF();
  const total = participations.reduce((s, p) => s + Number(p.montant), 0);
  const dateGen = new Date().toLocaleString('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const pageHeight = doc.internal.pageSize.height;

  const addHeader = (y = 12) => {
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, doc.internal.pageSize.width, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('SMART GESTION', 105, y, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Rapport secrétaire – Salle du Numérique UNILU', 105, y + 14, { align: 'center' });
    doc.setTextColor(0, 0, 0);
  };

  addHeader();

  doc.setFontSize(9);
  doc.text(`Activité : ${activity.nom}`, 14, 38);
  doc.text(`Type : ${activity.activity_types?.nom || '-'}`, 14, 43);
  doc.text(`Date : ${activity.date_debut} • Heure : ${activity.heure_debut} • Durée : ${activity.duree_minutes} min`, 14, 48);

  const headers = [['N°', 'Nom', 'Faculté', 'Promotion', 'Montant']];
  const rows = participations.map((p, i) => [
    String(i + 1),
    (p.nom_complet || '').substring(0, 40),
    (p.faculties?.nom || '-').substring(0, 20),
    (p.promotions?.nom || '-').substring(0, 20),
    `${Number(p.montant).toLocaleString()} FC`,
  ]);

  autoTable(doc, {
    head: headers,
    body: rows,
    startY: 54,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [241, 245, 249], textColor: [51, 65, 85] },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) return;
      addHeader(14);
    },
  });

  const finalY = doc.lastAutoTable.finalY + 14;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, finalY - 4, 196, finalY - 4);
  doc.setFontSize(10);
  doc.text(`Total encaissé : ${total.toLocaleString()} FC`, 14, finalY + 4);
  doc.text(`Généré par : ${adminName}`, 14, finalY + 10);
  doc.text(`Date et heure : ${dateGen}`, 14, finalY + 16);
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Document officiel – SMART GESTION – Salle du Numérique UNILU', 105, pageHeight - 8, { align: 'center' });
  doc.save(`rapport-secretaire-${(activity.nom || 'activite').replace(/[^a-z0-9-]/gi, '-')}-${activity.date_debut}.pdf`);
}

/**
 * Liste de cotation – PDF (avec colonne Côté uniquement, pour le professeur)
 */
export function exportActivityToPDFCotation(activity, participations, adminName = 'Secrétaire') {
  const doc = new jsPDF();
  const dateGen = new Date().toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
  const pageHeight = doc.internal.pageSize.height;

  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, doc.internal.pageSize.width, 24, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('SMART GESTION', 105, 12, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Liste de cotation – Salle du Numérique UNILU', 105, 18, { align: 'center' });
  doc.setTextColor(0, 0, 0);

  doc.setFontSize(9);
  doc.text(`Activité : ${activity.nom}`, 14, 34);
  doc.text(`Type : ${activity.activity_types?.nom || '-'}`, 14, 40);

  const headers = [['N°', 'Nom', 'Matricule', 'Faculté', 'Promotion', 'Cote']];
  const rows = participations.map((p, i) => [
    String(i + 1),
    (p.nom_complet || '').substring(0, 30),
    (p.matricule || '-').substring(0, 15),
    (p.faculties?.nom || '-').substring(0, 15),
    (p.promotions?.nom || '-').substring(0, 15),
    (p.cote || '-').substring(0, 10),
  ]);

  autoTable(doc, {
    head: headers,
    body: rows,
    startY: 46,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [241, 245, 249], textColor: [51, 65, 85] },
    margin: { left: 14, right: 14 },
  });

  const finalY = doc.lastAutoTable.finalY + 12;
  doc.setFontSize(9);
  doc.text(`Généré par : ${adminName}`, 14, finalY);
  doc.text(`Date : ${dateGen}`, 14, finalY + 6);
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Liste de cotation – Document académique', 105, pageHeight - 8, { align: 'center' });
  doc.save(`liste-cotation-${(activity.nom || 'activite').replace(/[^a-z0-9-]/gi, '-')}-${activity.date_debut}.pdf`);
}

/**
 * Format Excel – Rapport secrétaire (sans Côté)
 * Feuille 1 : activité (en-tête + participants)
 * Feuille 2 : statistiques
 */
export function exportActivityToExcel(activity, participations) {
  const total = participations.reduce((s, p) => s + Number(p.montant), 0);
  const dateGen = new Date().toLocaleDateString('fr-FR');
  const typeNom = activity.activity_types?.nom || '-';

  const header = [
    ['SMART GESTION – Rapport secrétaire'],
    ['Salle du Numérique – UNILU'],
    ['---------------------------------'],
    [`Nom activité : ${activity.nom}`],
    [`Type : ${typeNom}`],
    [`Date : ${activity.date_debut}`],
    [`Heure : ${activity.heure_debut}`],
    [`Durée : ${activity.duree_minutes} min`],
    [],
    ['N°', 'Nom', 'Faculté', 'Promotion', 'Montant'],
  ];
  const rows = participations.map((p, i) => [
    i + 1,
    p.nom_complet,
    p.faculties?.nom || '-',
    p.promotions?.nom || '-',
    Number(p.montant),
  ]);
  const footer = [
    [],
    ['Total encaissé', '', '', '', total.toLocaleString() + ' FC'],
    ['Signature secrétaire : ___________'],
    ['Date génération : ' + dateGen],
  ];
  const sheet1Data = [...header, ...rows, ...footer];
  const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);

  // Feuille 2 : Statistiques
  const etudiants = participations.filter((p) => p.type_participant === 'etudiant').length;
  const visiteurs = participations.filter((p) => p.type_participant === 'visiteur').length;
  const statsData = [
    ['STATISTIQUES - ' + activity.nom],
    [],
    ['Total participants', participations.length],
    ['Étudiants', etudiants],
    ['Visiteurs', visiteurs],
    ['Total encaissé (FC)', total.toLocaleString()],
    ['Date génération', dateGen],
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(statsData);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws1, 'Activité');
  XLSX.utils.book_append_sheet(wb, ws2, 'Statistiques');
  XLSX.writeFile(wb, `rapport-secretaire-${(activity.nom || '').replace(/[^a-z0-9-]/gi, '-')}-${activity.date_debut}.xlsx`);
}

/**
 * Liste de cotation – Excel (avec Côté)
 */
export function exportActivityToExcelCotation(activity, participations) {
  const dateGen = new Date().toLocaleDateString('fr-FR');
  const header = [
    ['SMART GESTION – Liste de cotation'],
    ['Salle du Numérique – UNILU'],
    ['---------------------------------'],
    [`Activité : ${activity.nom}`],
    [`Type : ${activity.activity_types?.nom || '-'}`],
    [`Date : ${activity.date_debut}`],
    [],
    ['N°', 'Nom', 'Matricule', 'Faculté', 'Promotion', 'Cote'],
  ];
  const rows = participations.map((p, i) => [
    i + 1,
    p.nom_complet,
    p.matricule || '',
    p.faculties?.nom || '-',
    p.promotions?.nom || '-',
    p.cote || '',
  ]);
  const footer = [['Généré le : ' + dateGen]];
  const ws = XLSX.utils.aoa_to_sheet([...header, ...rows, ...footer]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Cotation');
  XLSX.writeFile(wb, `liste-cotation-${(activity.nom || '').replace(/[^a-z0-9-]/gi, '-')}-${activity.date_debut}.xlsx`);
}
