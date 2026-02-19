/**
 * Smart Gestion - Moteur d'insights IA
 * Détection d'anomalies, recommandations, résumés en langage naturel
 */

/** Moyenne et écart-type pour détection d'anomalies (Z-score) */
function mean(arr) {
  if (!arr?.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
function stdDev(arr) {
  if (!arr?.length) return 0;
  const m = mean(arr);
  const sq = arr.map((x) => (x - m) ** 2);
  return Math.sqrt(sq.reduce((a, b) => a + b, 0) / arr.length);
}

/** Détecte les valeurs aberrantes (Z > 2 ou Z < -2) */
export function detectAnomalies(values, threshold = 2) {
  const m = mean(values);
  const s = stdDev(values) || 1;
  return values.map((v, i) => ({
    index: i,
    value: v,
    zScore: (v - m) / s,
    isAnomaly: Math.abs((v - m) / s) > threshold,
  }));
}

/** Prévision simple (moyenne mobile / tendance linéaire) */
export function simpleForecast(historical, periods = 3) {
  if (!historical?.length) return [];
  const last = historical.slice(-6);
  const avg = mean(last.map((x) => x.value ?? x.revenu ?? x));
  const trend = last.length >= 2
    ? (last[last.length - 1]?.value ?? last[last.length - 1]?.revenu ?? 0) -
      (last[0]?.value ?? last[0]?.revenu ?? 0)
    : 0;
  return Array.from({ length: periods }, (_, i) => ({
    period: i + 1,
    forecast: Math.max(0, avg + (trend / last.length) * (i + 1)),
  }));
}

/** Génère les insights financiers */
export function generateFinancialInsights(data) {
  const insights = [];
  const { dailyRevenue, monthlyRevenue, activityProfitability, participations } = data;

  if (monthlyRevenue?.length >= 2) {
    const last = Number(monthlyRevenue[monthlyRevenue.length - 1]?.revenu ?? 0);
    const prev = Number(monthlyRevenue[monthlyRevenue.length - 2]?.revenu ?? 0);
    const pct = prev > 0 ? ((last - prev) / prev) * 100 : 0;
    if (Math.abs(pct) >= 5) {
      insights.push({
        type: 'financial',
        icon: 'trend',
        text: pct > 0
          ? `Revenus du dernier mois en hausse de ${pct.toFixed(1)}% par rapport au mois précédent`
          : `Revenus du dernier mois en baisse de ${Math.abs(pct).toFixed(1)}% par rapport au mois précédent`,
        value: last.toLocaleString('fr-FR') + ' FC',
        sentiment: pct > 0 ? 'positive' : 'negative',
      });
    }
  }

  if (dailyRevenue?.length >= 7) {
    const last7 = dailyRevenue.slice(-7).map((d) => Number(d.revenu_valide ?? d.revenu_total ?? 0));
    const anomalies = detectAnomalies(last7);
    const spike = anomalies.find((a) => a.zScore > 2);
    const drop = anomalies.find((a) => a.zScore < -2);
    if (spike) {
      insights.push({
        type: 'financial',
        icon: 'spike',
        text: `Pic de revenus détecté récemment (${(spike.zScore).toFixed(1)}σ au-dessus de la normale)`,
        sentiment: 'info',
      });
    }
    if (drop && last7[drop.index] > 0) {
      insights.push({
        type: 'financial',
        icon: 'drop',
        text: `Chute inhabituelle des revenus détectée`,
        sentiment: 'warning',
      });
    }
  }

  const totalParticipants = participations?.length ?? 0;
  const totalRevenue = participations?.reduce((s, p) => s + Number(p.montant ?? 0), 0) ?? 0;
  if (totalParticipants > 0 && totalRevenue > 0) {
    const avgPerUser = totalRevenue / totalParticipants;
    insights.push({
      type: 'financial',
      icon: 'avg',
      text: `Revenu moyen par participant : ${avgPerUser.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} FC`,
      value: avgPerUser.toLocaleString('fr-FR') + ' FC',
      sentiment: 'neutral',
    });
  }

  if (activityProfitability?.length > 0) {
    const top = activityProfitability[0];
    insights.push({
      type: 'financial',
      icon: 'star',
      text: `Activité la plus rentable : « ${top?.nom || 'N/A'} » (${Number(top?.revenu ?? 0).toLocaleString('fr-FR')} FC)`,
      sentiment: 'positive',
    });
  }

  return insights;
}

/** Génère les insights participation */
export function generateParticipationInsights(data) {
  const insights = [];
  const { hourlyParticipation, facultyParticipation, JOURS_SEMAINE } = data;

  if (hourlyParticipation?.length > 0) {
    const byHour = {};
    hourlyParticipation.forEach((r) => {
      const h = r.heure;
      byHour[h] = (byHour[h] || 0) + Number(r.nb_participations ?? 0);
    });
    const entries = Object.entries(byHour).sort((a, b) => b[1] - a[1]);
    if (entries.length > 0) {
      const [peakHour, count] = entries[0];
      insights.push({
        type: 'participation',
        icon: 'peak',
        text: `Heure de pointe : ${String(peakHour).padStart(2, '0')}h (${count} inscriptions)`,
        value: `${peakHour}h`,
        sentiment: 'positive',
      });
    }

    const byDay = {};
    hourlyParticipation.forEach((r) => {
      const d = r.jour_semaine;
      byDay[d] = (byDay[d] || 0) + Number(r.nb_participations ?? 0);
    });
    const dayEntries = Object.entries(byDay).sort((a, b) => b[1] - a[1]);
    if (dayEntries.length > 0) {
      const [dow, dayCount] = dayEntries[0];
      insights.push({
        type: 'participation',
        icon: 'calendar',
        text: `${JOURS_SEMAINE?.[dow] ?? 'Jour'} est le jour le plus actif (${dayCount} inscriptions)`,
        sentiment: 'positive',
      });
    }
  }

  if (facultyParticipation?.length >= 2) {
    const first = facultyParticipation[0];
    const second = facultyParticipation[1];
    const r1 = Number(first?.nb_participations ?? 0);
    const r2 = Number(second?.nb_participations ?? 0);
    if (r1 > 0 && r2 > 0 && r1 / r2 >= 1.5) {
      insights.push({
        type: 'participation',
        icon: 'faculty',
        text: `Les étudiants de ${first?.faculte ?? 'N/A'} participent environ ${(r1 / r2).toFixed(1)}× plus que ${second?.faculte ?? 'les suivants'}`,
        sentiment: 'info',
      });
    }
  }

  const totalStudents = facultyParticipation?.reduce((s, f) => s + (Number(f.nb_etudiants) || 0), 0) ?? 0;
  const totalVisitors = facultyParticipation?.reduce((s, f) => s + (Number(f.nb_visiteurs) || 0), 0) ?? 0;
  const total = totalStudents + totalVisitors;
  if (total > 0) {
    const ratio = (totalStudents / total) * 100;
    insights.push({
      type: 'participation',
      icon: 'ratio',
      text: `Ratio Étudiants / Visiteurs : ${ratio.toFixed(0)}% étudiants, ${(100 - ratio).toFixed(0)}% visiteurs`,
      sentiment: 'neutral',
    });
  }

  return insights;
}

/** Génère les insights performance activités */
export function generateActivityInsights(data) {
  const insights = [];
  const { activityTypePerf, activityProfitability, participations } = data;

  if (activityTypePerf?.length > 0) {
    const underperformers = activityTypePerf.filter((t) => {
      const rev = Number(t.revenu ?? 0);
      const avg = activityTypePerf.reduce((s, x) => s + Number(x.revenu ?? 0), 0) / activityTypePerf.length;
      return rev < avg * 0.5 && rev >= 0;
    });
    underperformers.slice(0, 2).forEach((t) => {
      insights.push({
        type: 'activity',
        icon: 'underperform',
        text: `Les activités « ${t.type_activite} » sous-performent (${Number(t.revenu ?? 0).toLocaleString('fr-FR')} FC)`,
        sentiment: 'warning',
      });
    });

    const top = activityTypePerf[0];
    if (top) {
      insights.push({
        type: 'activity',
        icon: 'popular',
        text: `Type le plus populaire : « ${top.type_activite} » (${top.nb_participations ?? 0} participants)`,
        sentiment: 'positive',
      });
    }
  }

  if (activityProfitability?.length > 0) {
    const withCapacity = activityProfitability.filter((a) => a.capacite > 0);
    const lowFill = withCapacity.filter((a) => (a.taux_remplissage_pct ?? 0) < 50);
    if (lowFill.length > 0) {
      insights.push({
        type: 'activity',
        icon: 'capacity',
        text: `${lowFill.length} activité(s) avec taux de remplissage sous 50%`,
        sentiment: 'warning',
      });
    }
  }

  return insights;
}

/** Génère les insights comportementaux */
export function generateBehavioralInsights(data) {
  const insights = [];
  const { recurrentUsers, participations } = data;

  if (recurrentUsers?.length > 0) {
    const top = recurrentUsers[0];
    insights.push({
      type: 'behavioral',
      icon: 'recurrent',
      text: `${top?.nb_participations ?? 0} utilisateurs récurrents identifiés. Meilleur : ${top?.nb_participations ?? 0} participations`,
      sentiment: 'positive',
    });
  }

  if (participations?.length >= 10) {
    const withDate = participations.map((p) => new Date(p.created_at).getTime()).sort((a, b) => a - b);
    const gaps = [];
    for (let i = 1; i < Math.min(50, withDate.length); i++) {
      gaps.push((withDate[i] - withDate[i - 1]) / (60 * 1000)); // minutes
    }
    const avgGap = mean(gaps);
    if (avgGap < 5 && avgGap > 0) {
      insights.push({
        type: 'behavioral',
        icon: 'speed',
        text: 'Inscriptions rapprochées détectées (vitesse d\'inscription élevée)',
        sentiment: 'info',
      });
    }
  }

  return insights;
}

/** Détection de doublons potentiels (même nom, même activité, dates proches) */
export function detectDuplicateCandidates(participations) {
  const seen = {};
  const duplicates = [];
  participations.forEach((p) => {
    const key = `${(p.nom_complet || '').toLowerCase().trim()}|${p.activity_id}`;
    if (seen[key]) {
      const prev = seen[key];
      const diff = Math.abs(new Date(p.created_at) - new Date(prev.created_at)) / (60 * 60 * 1000);
      if (diff < 24) duplicates.push({ current: p, previous: prev, hoursApart: diff });
    } else {
      seen[key] = p;
    }
  });
  return duplicates;
}

/** Paiements outliers (montant très élevé) */
export function detectPaymentOutliers(participations, thresholdMultiplier = 3) {
  const amounts = participations.map((p) => Number(p.montant ?? 0)).filter((x) => x > 0);
  if (amounts.length < 5) return [];
  const m = mean(amounts);
  const s = stdDev(amounts) || 1;
  return participations
    .filter((p) => {
      const amt = Number(p.montant ?? 0);
      return amt > 0 && (amt - m) / s > thresholdMultiplier;
    })
    .map((p) => ({ ...p, zScore: (Number(p.montant) - m) / s }));
}

/** Recommandations intelligentes */
export function generateRecommendations(data) {
  const recs = [];
  const { hourlyParticipation, facultyParticipation, activityTypePerf } = data;

  if (hourlyParticipation?.length > 0) {
    const byHour = {};
    hourlyParticipation.forEach((r) => {
      byHour[r.heure] = (byHour[r.heure] || 0) + Number(r.revenu ?? 0);
    });
    const best = Object.entries(byHour).sort((a, b) => b[1] - a[1])[0];
    if (best) {
      recs.push({
        text: `Privilégier les créneaux autour de ${best[0]}h pour maximiser les revenus`,
        category: 'timing',
      });
    }

    const byDay = {};
    hourlyParticipation.forEach((r) => {
      byDay[r.jour_semaine] = (byDay[r.jour_semaine] || 0) + Number(r.revenu ?? 0);
    });
    const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const bestDay = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0];
    if (bestDay && Number(bestDay[1]) > 0) {
      recs.push({
        text: `Recommander de programmer les formations le ${dayNames[bestDay[0]]} (meilleur jour)`,
        category: 'scheduling',
      });
    }
  }

  if (activityTypePerf?.length > 0) {
    const low = activityTypePerf.filter((t) => Number(t.revenu ?? 0) < 1000);
    if (low.length > 0) {
      recs.push({
        text: `Envisager une promotion ou une refonte des activités « ${low.map((l) => l.type_activite).join(', ')} »`,
        category: 'marketing',
      });
    }
  }

  return recs.slice(0, 5);
}

/** Génère tous les insights et recommandations */
export function runInsightEngine(data) {
  const financial = generateFinancialInsights(data);
  const participation = generateParticipationInsights(data);
  const activity = generateActivityInsights(data);
  const behavioral = generateBehavioralInsights(data);
  const recommendations = generateRecommendations(data);
  const duplicates = detectDuplicateCandidates(data.participations || []);
  const outliers = detectPaymentOutliers(data.participations || []);

  return {
    financial,
    participation,
    activity,
    behavioral,
    recommendations,
    anomalies: {
      duplicates: duplicates.slice(0, 10),
      paymentOutliers: outliers.slice(0, 10),
    },
  };
}
