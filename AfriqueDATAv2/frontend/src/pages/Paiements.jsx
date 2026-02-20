import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { DollarSign, CheckCircle, Clock, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Paiements() {
  const { adminProfile } = useAuth();
  const [participations, setParticipations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [validatingId, setValidatingId] = useState(null);

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
        statut_paiement,
        created_at,
        activity_id,
        activities(id, nom, date_debut),
        faculties(nom),
        promotions(nom)
      `)
      .order('created_at', { ascending: false });
    setParticipations(data || []);
    setTotal((data || []).reduce((s, p) => s + Number(p.montant), 0));
    setLoading(false);
  }

  async function handleApprove(participationId) {
    setValidatingId(participationId);
    try {
      const { error } = await supabase
        .from('participations')
        .update({
          statut_paiement: 'valide',
          validated_at: new Date().toISOString(),
          validated_by: adminProfile?.id || null,
        })
        .eq('id', participationId);
      if (error) throw error;
      toast.success('Inscription approuvée');
      loadPaiements();
    } catch (err) {
      toast.error(err?.message || 'Erreur');
    } finally {
      setValidatingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  const enAttente = participations.filter((p) => p.statut_paiement === 'en_attente');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Paiements</h1>
          <p className="text-slate-500 text-sm mt-1">Approuvez les inscriptions (QR) et consultez les paiements</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-4 py-3 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary-600" />
          <span className="text-sm text-slate-600">Total :</span>
          <span className="font-bold text-slate-800">{total.toLocaleString()} FC</span>
        </div>
      </div>

      {enAttente.length > 0 && (
        <div className="bg-amber-50 rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
          <div className="px-6 py-3 border-b border-amber-200 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" />
            <h2 className="font-semibold text-amber-800">
              {enAttente.length} inscription{enAttente.length > 1 ? 's' : ''} en attente d&apos;approbation
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-amber-100/50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-800 uppercase">Nom</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-800 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-800 uppercase">Activité</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-800 uppercase">Montant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-800 uppercase">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-amber-800 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-200">
                {enAttente.map((p) => (
                  <tr key={p.id} className="hover:bg-amber-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">{p.nom_complet}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${p.type_participant === 'etudiant' ? 'bg-primary-50 text-primary-700' : 'bg-purple-50 text-purple-700'}`}>
                        {p.type_participant === 'etudiant' ? 'Étudiant' : 'Visiteur'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <Link to={p.activity_id ? `/admin/activites/${p.activity_id}` : '#'} className="text-primary-600 hover:underline inline-flex items-center gap-1">
                        {p.activities?.nom || '-'}
                        {p.activity_id && <ChevronRight size={14} />}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-700">{Number(p.montant).toLocaleString()} FC</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{new Date(p.created_at).toLocaleDateString('fr-FR')}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleApprove(p.id)}
                        disabled={validatingId === p.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-60 transition-colors"
                      >
                        <CheckCircle size={16} />
                        {validatingId === p.id ? '…' : 'Approuver'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-slate-500" />
          <h2 className="font-semibold text-slate-800">Toutes les inscriptions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nom</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Activité</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Faculté</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Montant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
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
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {p.activity_id ? (
                      <Link to={`/admin/activites/${p.activity_id}`} className="text-primary-600 hover:underline inline-flex items-center gap-1">
                        {p.activities?.nom || '-'}
                        <ChevronRight size={14} />
                      </Link>
                    ) : (
                      p.activities?.nom || '-'
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{p.faculties?.nom || '-'}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-700">{Number(p.montant).toLocaleString()} FC</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                      p.statut_paiement === 'valide' ? 'bg-green-50 text-green-700' :
                      p.statut_paiement === 'paye' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {p.statut_paiement === 'valide' ? 'Approuvée' : p.statut_paiement === 'paye' ? 'Payée' : 'En attente'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{new Date(p.created_at).toLocaleDateString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {participations.length === 0 && (
          <p className="text-center py-12 text-slate-400 text-sm">Aucune inscription. Les participants s&apos;inscrivent via le QR code.</p>
        )}
      </div>
    </div>
  );
}
