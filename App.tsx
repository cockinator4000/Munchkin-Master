import React, { useState, useEffect } from 'react';
import { Player, GameLog, BattleState, Language } from './types';
import PlayerCard from './components/PlayerCard';
import { soundService } from './src/services/soundService';
import { Plus, RotateCcw, X, ScrollText, Sword, Ghost, Zap, Share2, Skull, Shield } from 'lucide-react';
import confetti from 'canvas-confetti';
import { translations } from './translations';
// FIREBASE
import { db } from './firebase';
import { ref, onValue, set } from 'firebase/database';

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('pl');
  const [players, setPlayers] = useState<Player[]>([]);
  const [logs, setLogs] = useState<GameLog[]>([]);
  const [isSuperMunchkin, setIsSuperMunchkin] = useState(false);

  const t = translations[lang];

  // --- SAFE INITIAL STATE ---
  const defaultBattle: BattleState = {
    active: false,
    monsterLevel: 1,
    monsterBonus: 0,
    selectedPlayerIds: [],
    playerBonuses: {}
  };

  const [battle, setBattle] = useState<BattleState>(defaultBattle);

  const sanitizeBattle = (data: any): BattleState => {
    if (!data) return defaultBattle;
    return {
      active: !!data.active,
      monsterLevel: Number(data.monsterLevel) || 1,
      monsterBonus: Number(data.monsterBonus) || 0,
      selectedPlayerIds: Array.isArray(data.selectedPlayerIds) ? data.selectedPlayerIds : [],
      playerBonuses: data.playerBonuses || {}
    };
  };

  // --- MULTIPLAYER LOGIC ---
  const [roomId, setRoomId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let currentRoom = params.get('room');
    if (!currentRoom) {
      currentRoom = Math.random().toString(36).substring(2, 8);
      const url = new URL(window.location.href);
      url.searchParams.set('room', currentRoom);
      window.history.replaceState({}, '', url);
    }
    setRoomId(currentRoom);
  }, []);

  useEffect(() => {
    if (!roomId) return;

    // 1. Sync Players
    const playersRef = ref(db, `rooms/${roomId}/players`);
    const unsubPlayers = onValue(playersRef, (snapshot) => {
      const data = snapshot.val();
      setPlayers(Array.isArray(data) ? data : []);
    });

    // 2. Sync Battle
    const battleRef = ref(db, `rooms/${roomId}/battle`);
    const unsubBattle = onValue(battleRef, (snapshot) => {
      const data = snapshot.val();
      setBattle(sanitizeBattle(data));
    });

    // 3. Sync Logs
    const logsRef = ref(db, `rooms/${roomId}/logs`);
    const unsubLogs = onValue(logsRef, (snapshot) => {
      const data = snapshot.val();
      setLogs(Array.isArray(data) ? data : []);
    });

    return () => { unsubPlayers(); unsubBattle(); unsubLogs(); };
  }, [roomId]);

  const updateCloud = (newPlayers: Player[]) => {
    if (roomId) set(ref(db, `rooms/${roomId}/players`), newPlayers);
  };

  const updateBattleCloud = (newBattle: BattleState) => {
    if (roomId) set(ref(db, `rooms/${roomId}/battle`), newBattle);
  };

  const pushLogToCloud = (message: string, type: GameLog['type'] = 'info') => {
    if (!roomId) return;
    const newLog: GameLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      message,
      type
    };
    const newLogsList = [newLog, ...logs].slice(0, 50);
    set(ref(db, `rooms/${roomId}/logs`), newLogsList);
  };

  // --- GAME LOGIC ---
  const maxLevel = isSuperMunchkin ? 20 : 10;

  const createDefaultPlayer = (index: number = 1): Player => ({
    id: Math.random().toString(36).substring(2, 11),
                                                              name: `${lang === 'en' ? 'Player' : 'Gracz'} ${index}`,
                                                              level: 1,
                                                              gear: 0,
                                                              gender: 'Male',
                                                              class: t.classes[0],
                                                              race: t.races[0],
                                                              isSuper: false
  });

  const handleAddPlayer = () => {
    soundService.play('click');
    const newPlayer = createDefaultPlayer(players.length + 1);
    const list = [...players, newPlayer];
    updateCloud(list);
    pushLogToCloud(`${newPlayer.name} ${t.newChallenger}`, 'info');
  };

  const handleUpdatePlayer = (id: string, updates: Partial<Player>) => {
    const list = players.map(p => {
      if (p.id !== id) return p;
      const updated = { ...p, ...updates };

      if (updated.level > p.level) {
        soundService.play('levelUp');
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
        pushLogToCloud(`${p.name} ${t.leveledUp} ${updated.level}!`, 'success');

        if (updated.level === maxLevel) {
          soundService.play('victory');
          confetti({ particleCount: 200, spread: 100 });
          pushLogToCloud(`${p.name} ${t.victory}`, 'warning');
        }
      }
      else if (updated.level < p.level) {
        soundService.play('levelDown');
        pushLogToCloud(`${p.name} ${t.lostLevel}`, 'danger');
      }

      return updated;
    });
    updateCloud(list);
  };

  const handleDeletePlayer = (id: string) => {
    if (confirm(t.deleteConfirm)) {
      soundService.play('click');
      const p = players.find(x => x.id === id);
      if (p) pushLogToCloud(`${p.name} ${t.eatenByGazebo}`, 'danger');
      updateCloud(players.filter(x => x.id !== id));
    }
  };

  const handleResetGame = () => {
    if (confirm(t.resetWarning)) {
      soundService.play('click');
      updateCloud(players.map(p => ({ ...p, level: 1, gear: 0 })));
      if (roomId) set(ref(db, `rooms/${roomId}/logs`), []);
      pushLogToCloud(t.resetLog, 'warning');
    }
  };

  // --- BATTLE HANDLERS ---
  const toggleBattleMode = () => {
    const current = sanitizeBattle(battle);
    const newState = {
      ...current,
      active: !current.active,
      selectedPlayerIds: !current.active ? (players.length > 0 ? [players[0].id] : []) : []
    };
    updateBattleCloud(newState);
  };

  const updateBattle = (updates: Partial<BattleState>) => {
    const current = sanitizeBattle(battle);
    updateBattleCloud({ ...current, ...updates });
  };

  const toggleBattlePlayer = (playerId: string) => {
    const current = sanitizeBattle(battle);
    const ids = current.selectedPlayerIds;
    const newIds = ids.includes(playerId)
    ? ids.filter(id => id !== playerId)
    : [...ids, playerId];
    updateBattle({ selectedPlayerIds: newIds });
  };

  // --- NEW: HANDLE PLAYER BONUS UI ---
  const handlePlayerBonus = (amount: number) => {
    const current = sanitizeBattle(battle);
    // Dodajemy bonus pierwszemu zaznaczonemu graczowi (jako liderowi)
    // Dzięki temu mamy gdzie zapisać "wspólne" bonusy
    if (current.selectedPlayerIds.length === 0) return;

    const leaderId = current.selectedPlayerIds[0];
    const currentBonus = current.playerBonuses?.[leaderId] || 0;

    updateBattle({
      playerBonuses: {
        ...current.playerBonuses,
        [leaderId]: currentBonus + amount
      }
    });
  };

  // --- CALCULATIONS & RULES ---
  const getCombatStrength = (p: Player) => {
    const bonuses = battle?.playerBonuses || {};
    return (p.level || 1) + (p.gear || 0) + (bonuses[p.id] || 0);
  };

  const safeSelectedIds = Array.isArray(battle?.selectedPlayerIds) ? battle.selectedPlayerIds : [];

  const totalPlayerStrength = safeSelectedIds.reduce((sum, id) => {
    const p = players.find(p => p.id === id);
    return sum + (p ? getCombatStrength(p) : 0);
  }, 0);

  // Obliczamy sumę samych bonusów (One-shots) dla graczy, żeby wyświetlić w UI
  const totalPlayerBonuses = safeSelectedIds.reduce((sum, id) => sum + (battle.playerBonuses?.[id] || 0), 0);

  const totalMonsterStrength = (battle?.monsterLevel || 1) + (battle?.monsterBonus || 0);

  // --- WARRIOR RULE LOGIC ---
  const hasWarrior = safeSelectedIds.some(id => {
    const p = players.find(px => px.id === id);
    return p && (p.class === 'Warrior' || p.class === 'Wojownik');
  });

  const playersWinning = totalPlayerStrength > totalMonsterStrength ||
  (totalPlayerStrength === totalMonsterStrength && hasWarrior);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Link copied!");
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-6 font-sans selection:bg-purple-500/30">
    <header className="max-w-6xl mx-auto mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
    <div className="flex items-center gap-4">
    <div className="relative group cursor-pointer" onClick={() => soundService.play('click')}>
    <div className="absolute inset-0 bg-purple-600 blur-xl opacity-20 rounded-full"></div>
    <img
    src="https://img.icons8.com/color/96/dungeons-and-dragons.png"
    alt="Logo"
    className="w-16 h-16 relative z-10 drop-shadow-lg"
    />
    </div>
    <div>
    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400 game-font tracking-wider">
    {t.title}
    </h1>
    <p className="text-slate-400 text-xs tracking-widest uppercase flex items-center gap-2">
    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
    Live Session
    </p>
    </div>
    </div>

    <div className="flex gap-3">
    <button onClick={copyLink} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow-lg shadow-indigo-500/20 active:scale-95 transition-all">
    <Share2 size={18} /> Invite
    </button>
    <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700/50">
    <button onClick={() => setLang('en')} className={`px-3 py-1 rounded text-xs font-bold ${lang === 'en' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}>EN</button>
    <button onClick={() => setLang('pl')} className={`px-3 py-1 rounded text-xs font-bold ${lang === 'pl' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}>PL</button>
    </div>
    </div>
    </header>

    <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

    <div className="lg:col-span-1 space-y-6">
    <div className={`relative overflow-hidden rounded-2xl border transition-all duration-500 ${battle.active ? 'bg-slate-800/80 border-red-500/50 shadow-red-900/20 shadow-2xl' : 'bg-slate-800/40 border-slate-700/50 border-dashed hover:border-slate-600'}`}>
    {!battle.active ? (
      <button onClick={toggleBattleMode} className="w-full h-32 flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-red-400 transition-colors group">
      <div className="p-3 rounded-full bg-slate-800 group-hover:scale-110 transition-transform duration-300 border border-slate-700">
      <Sword size={32} />
      </div>
      <span className="font-game text-xl tracking-wide">{t.battleArena}</span>
      </button>
    ) : (
      <div className="p-5 animate-in zoom-in-95 duration-300">
      <div className="flex justify-between items-start mb-6">
      <h2 className="text-xl font-bold text-red-400 flex items-center gap-2 game-font">
      <Skull size={24} /> {t.battleArena}
      </h2>
      <button onClick={toggleBattleMode} className="text-slate-500 hover:text-white"><X size={20} /></button>
      </div>

      <div className="space-y-4 mb-6">
      {/* SEKCJA POTWORA */}
      <div className="flex justify-between items-center bg-black/20 p-3 rounded-lg border border-red-500/20">
      <span className="text-red-300 font-bold uppercase text-xs tracking-wider">{t.monster}</span>
      <div className="flex items-center gap-4">
      <button onClick={() => updateBattle({ monsterLevel: Math.max(1, (battle.monsterLevel || 1) - 1) })} className="w-8 h-8 rounded bg-slate-700 text-white">-</button>
      <span className="text-3xl font-black text-white w-12 text-center">{battle.monsterLevel || 1}</span>
      <button onClick={() => updateBattle({ monsterLevel: (battle.monsterLevel || 1) + 1 })} className="w-8 h-8 rounded bg-slate-700 text-white">+</button>
      </div>
      </div>
      <div className="flex justify-between items-center bg-black/20 p-3 rounded-lg border border-orange-500/20">
      <span className="text-orange-300 font-bold uppercase text-xs tracking-wider">{t.oneShots}</span>
      <div className="flex items-center gap-4">
      <button onClick={() => updateBattle({ monsterBonus: (battle.monsterBonus || 0) - 5 })} className="w-8 h-8 rounded bg-slate-700 text-white text-xs">-5</button>
      <span className="text-xl font-bold text-white w-12 text-center">{(battle.monsterBonus || 0) > 0 ? '+' : ''}{battle.monsterBonus || 0}</span>
      <button onClick={() => updateBattle({ monsterBonus: (battle.monsterBonus || 0) + 5 })} className="w-8 h-8 rounded bg-slate-700 text-white text-xs">+5</button>
      </div>
      </div>

      {/* NOWA SEKCJA: BONUSY GRACZY (ONE-SHOTS) */}
      <div className="flex justify-between items-center bg-black/20 p-3 rounded-lg border border-blue-500/20">
      <span className="text-blue-300 font-bold uppercase text-xs tracking-wider">Party Bonus</span>
      <div className="flex items-center gap-4">
      <button onClick={() => handlePlayerBonus(-1)} className="w-8 h-8 rounded bg-slate-700 text-white">-</button>
      <span className="text-xl font-bold text-white w-12 text-center">
      {totalPlayerBonuses > 0 ? '+' : ''}{totalPlayerBonuses}
      </span>
      <button onClick={() => handlePlayerBonus(1)} className="w-8 h-8 rounded bg-slate-700 text-white">+</button>
      </div>
      </div>
      </div>

      {/* PODSUMOWANIE */}
      <div className="grid grid-cols-2 gap-4 mb-4">
      <div className={`p-3 rounded-lg border text-center transition-colors ${playersWinning ? 'bg-green-500/20 border-green-500/50' : 'bg-slate-800 border-slate-700'}`}>
      <div className="text-xs uppercase text-slate-400 mb-1">{t.party}</div>
      <div className="text-3xl font-black text-white">{totalPlayerStrength}</div>
      {/* Ikonka wygranej Wojownika przy remisie */}
      {totalPlayerStrength === totalMonsterStrength && hasWarrior && (
        <div className="text-[10px] text-green-400 mt-1 uppercase tracking-widest flex justify-center items-center gap-1">
        <Sword size={10} /> Warrior Win
        </div>
      )}
      </div>
      <div className={`p-3 rounded-lg border text-center transition-colors ${!playersWinning ? 'bg-red-500/20 border-red-500/50' : 'bg-slate-800 border-slate-700'}`}>
      <div className="text-xs uppercase text-slate-400 mb-1">{t.threatLevel}</div>
      <div className="text-3xl font-black text-white">{totalMonsterStrength}</div>
      </div>
      </div>

      <div className={`p-3 rounded-lg font-bold text-center text-lg animate-pulse ${playersWinning ? 'bg-green-600 text-white shadow-lg shadow-green-900/50' : 'bg-red-600 text-white shadow-lg shadow-red-900/50'}`}>
      {playersWinning ? t.playersWinning : t.monsterWinning}
      </div>
      </div>
    )}
    </div>

    <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-4 h-[300px] flex flex-col relative overflow-hidden backdrop-blur-sm">
    <h3 className="text-xs font-bold uppercase text-slate-500 mb-3 flex items-center gap-2"><ScrollText size={14} /> {t.dungeonLog}</h3>
    <div className="overflow-y-auto flex-1 space-y-3 pr-2 custom-scrollbar">
    {logs.map(log => (
      <div key={log.id} className="text-sm flex flex-col gap-1 animate-in slide-in-from-left duration-300">
      <div className="flex gap-3">
      <span className="text-slate-600 font-mono text-xs mt-0.5 whitespace-nowrap">
      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
      <p className={`${log.type === 'success' ? 'text-green-400' : ''} ${log.type === 'danger' ? 'text-red-400' : ''} ${log.type === 'warning' ? 'text-amber-400 font-bold' : ''} ${log.type === 'info' ? 'text-slate-300' : ''}`}>
      {log.message}
      </p>
      </div>
      </div>
    ))}
    {logs.length === 0 && <div className="text-slate-600 text-sm italic">{t.silenceInDungeon}</div>}
    </div>
    </div>
    </div>

    <div className="lg:col-span-2 space-y-6">
    <div className="flex flex-wrap gap-3">
    <button onClick={handleAddPlayer} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-900/20 active:scale-95 transition-all flex items-center justify-center gap-2 group">
    <div className="bg-white/20 p-1 rounded-full group-hover:scale-110 transition-transform"><Plus size={18} strokeWidth={3} /></div>
    {t.addPlayer}
    </button>
    <button onClick={() => setIsSuperMunchkin(!isSuperMunchkin)} className={`px-4 py-3 rounded-xl font-bold border transition-all flex items-center gap-2 ${isSuperMunchkin ? 'bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-900/30' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'}`}>
    <Zap size={18} className={isSuperMunchkin ? 'fill-white' : ''} />
    {t.superMode}
    </button>
    <button onClick={handleResetGame} className="px-4 py-3 rounded-xl font-bold bg-slate-800 border border-slate-700 text-red-400 hover:bg-red-900/20 hover:border-red-500/50 hover:text-red-300 transition-all flex items-center gap-2" title={t.reset}>
    <RotateCcw size={18} />
    </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {players.map(player => (
      <div key={player.id} className="relative group">
      {battle.active && (
        <div className="absolute -left-3 top-1/2 -translate-y-1/2 z-10">
        <button onClick={() => toggleBattlePlayer(player.id)} className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all ${safeSelectedIds.includes(player.id) ? 'bg-green-500 text-white scale-110 ring-4 ring-green-500/30' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}>
        {safeSelectedIds.includes(player.id) ? <Sword size={16} /> : <Plus size={16} />}
        </button>
        </div>
      )}
      <div className={`transition-all duration-300 ${battle.active && !safeSelectedIds.includes(player.id) ? 'opacity-50 scale-95 grayscale' : ''}`}>
      <PlayerCard
      player={player}
      onUpdate={handleUpdatePlayer}
      onDelete={handleDeletePlayer}
      maxLevel={maxLevel}
      lang={lang}
      isInBattle={battle.active}
      onToggleBattle={() => toggleBattlePlayer(player.id)}
      />
      </div>
      </div>
    ))}
    {players.length === 0 && (
      <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-800 rounded-2xl">
      <Ghost className="mx-auto text-slate-700 mb-4" size={48} />
      <p className="text-slate-500 font-medium">{t.silenceInDungeon}</p>
      <p className="text-slate-600 text-sm mt-1">Click "Add Player" to start the adventure</p>
      </div>
    )}
    </div>
    </div>
    </main>
    </div>
  );
}

export default App;
