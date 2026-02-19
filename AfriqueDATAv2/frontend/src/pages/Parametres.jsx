import { useAuth } from '../context/AuthContext';

export default function Parametres() {
  const { adminProfile } = useAuth();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Paramètres</h1>
        <p className="text-slate-500 text-sm mt-1">Configuration de la plateforme</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">Compte administrateur</h2>
          <p className="text-slate-500 text-sm mt-1">Informations du compte connecté</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-500">Nom</label>
            <p className="mt-1 text-slate-800 font-medium">{adminProfile?.nom_complet || '-'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500">Email</label>
            <p className="mt-1 text-slate-800 font-medium">{adminProfile?.email || '-'}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold">
            SG
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Smart Gestion</h2>
            <p className="text-slate-500 text-sm">Salle du Numérique – UNILU</p>
          </div>
        </div>
        <p className="text-slate-500 text-sm leading-relaxed">
          Plateforme de gestion des activités de la Salle du Numérique – UNILU.
          Contexte universitaire africain : facultés, promotions, étudiants, visiteurs, activités et paiements en francs congolais (FC).
        </p>
      </div>
    </div>
  );
}
