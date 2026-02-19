import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Search, User, Clock } from 'lucide-react';

const RECENT_KEY = 'smart-gestion-recent-students';
const MAX_RECENT = 8;

/**
 * Recherche floue simple : normalise et compare des chaînes
 */
function fuzzyMatch(str, query) {
  const s = (str || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
  const q = (query || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
  return s.includes(q) || q.split('').every((c) => s.includes(c));
}

function highlightMatch(text, query) {
  if (!query?.trim()) return text;
  const re = new RegExp(`(${query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(re, '<mark class="bg-primary-200 text-primary-900 rounded px-0.5">$1</mark>');
}

export default function StudentSearch({
  facultyId,
  promotionId,
  excludeIds = [],
  onSelect,
  placeholder = 'Rechercher par nom ou matricule...',
}) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_KEY);
      if (stored) setRecent(JSON.parse(stored));
    } catch {
      setRecent([]);
    }
  }, []);

  const saveRecent = useCallback((student) => {
    setRecent((prev) => {
      const next = [student, ...prev.filter((s) => s.id !== student.id)].slice(0, MAX_RECENT);
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  useEffect(() => {
    const q = query?.trim();
    if (!q || q.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    async function search() {
      let qry = supabase
        .from('students')
        .select('id, nom_complet, matricule, promotion_id, promotions(nom, faculty_id, faculties(nom))')
        .or(`nom_complet.ilike.%${q}%,matricule.ilike.%${q}%`)
        .limit(20);

      if (promotionId) qry = qry.eq('promotion_id', promotionId);
      else if (facultyId) {
        const { data: promos } = await supabase.from('promotions').select('id').eq('faculty_id', facultyId);
        const ids = (promos || []).map((p) => p.id);
        if (ids.length) qry = qry.in('promotion_id', ids);
      }

      const { data } = await qry;
      if (cancelled) return;

      const list = (data || []).filter((s) => !excludeIds.includes(s.id));
      setSuggestions(list);
      setLoading(false);
    }

    search();
    return () => { cancelled = true; };
  }, [query, promotionId, facultyId, excludeIds]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayList = query.trim().length >= 2 ? suggestions : recent.filter((s) => !excludeIds.includes(s.id));
  const showDropdown = open && (displayList.length > 0 || loading);

  function handleSelect(student) {
    saveRecent(student);
    onSelect(student);
    setQuery('');
    setOpen(false);
    setSuggestions([]);
    inputRef.current?.focus();
  }

  function handleKeyDown(e) {
    if (!showDropdown) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx((i) => Math.min(i + 1, displayList.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && highlightIdx >= 0 && displayList[highlightIdx]) {
      e.preventDefault();
      handleSelect(displayList[highlightIdx]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setHighlightIdx(-1);
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setHighlightIdx(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="input-field pl-10 w-full"
          autoComplete="off"
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
        )}
      </div>
      {showDropdown && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg py-1 max-h-60 overflow-auto animate-fade-in">
          {loading && displayList.length === 0 ? (
            <div className="px-4 py-6 text-center text-slate-500 text-sm">Recherche...</div>
          ) : (
            displayList.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSelect(s)}
                onMouseEnter={() => setHighlightIdx(i)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  i === highlightIdx ? 'bg-primary-50' : 'hover:bg-slate-50'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-slate-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="font-medium text-slate-800 truncate"
                    dangerouslySetInnerHTML={{
                      __html: highlightMatch(s.nom_complet, query.trim()) || s.nom_complet,
                    }}
                  />
                  <p className="text-xs text-slate-500">
                    {s.matricule}
                    {s.promotions?.faculties?.nom && ` • ${s.promotions.faculties.nom}`}
                  </p>
                </div>
                {query.trim().length < 2 && (
                  <Clock className="w-3.5 h-3.5 text-slate-300 shrink-0" title="Sélection récente" />
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
