import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { DollarSign, Filter } from 'lucide-react';

export default function Paiements() {
  const [participations, setParticipations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadPaiements();
  }, []);

  async function loadPaiements() {
    const { data } = await supabase
      .from('participations')
      .select(`
        id,
        nom_complet,
        type_participant,
        montant,
        created_at,
        activities(nom, date_debut),
        faculties(nom),
        promotions(nom)
      `)
      .order('created_at', { ascending: false });
    setParticipations(data || []);
    setTotal((data || []).reduce((s, p) => s + Number(p.montant), 0));
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Paiements</h1>
          <p className="text-slate-500 text-sm mt-1">Liste de tous les paiements enregistrés</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-4 py-3 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary-600" />
          <span className="text-sm text-slate-600">Total :</span>
          <span className="font-bold text-slate-800">{total.toLocaleString()} FC</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nom</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Activité</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Faculté</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Montant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {participations.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-slate-800">{p.nom_complet}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${p.type_participant === 'etudiant' ? 'bg-primary-50 text-primary-700' : 'bg-purple-50 text-purple-700'}`}>
                      {p.type_participant === 'etudiant' ? 'Étudiant' : 'Visiteur'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{p.activities?.nom || '-'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{p.faculties?.nom || '-'}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-700">{Number(p.montant).toLocaleString()} FC</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{new Date(p.created_at).toLocaleDateString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {participations.length === 0 && (
          <p className="text-center py-12 text-slate-400 text-sm">Aucun paiement enregistré</p>
        )}
      </div>
    </div>
  );
}
