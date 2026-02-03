import React, { useRef } from 'react';
import { Player } from '../types';
import { ChevronUp, ChevronDown, Sword, Trash2, Camera, Layers, Star, User } from 'lucide-react';
import { translations } from '../translations';

interface PlayerCardProps {
  player: Player;
  onUpdate: (id: string, updates: Partial<Player>) => void;
  onDelete: (id: string) => void;
  isInBattle?: boolean;
  onToggleBattle?: () => void;
  maxLevel: number;
  lang: 'en' | 'pl';
  disableLevel?: boolean;
}

const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  onUpdate,
  onDelete,
  isInBattle,
  onToggleBattle,
  maxLevel,
  lang,
  disableLevel = false
}) => {
  const t = translations[lang];
  const combatStrength = player.level + player.gear;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdate(player.id, { avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const adjustLevel = (amount: number) => {
    onUpdate(player.id, { level: Math.max(1, Math.min(maxLevel, player.level + amount)) });
  };

  const adjustGear = (amount: number) => {
    onUpdate(player.id, { gear: player.gear + amount });
  };

  // Level lock
  const QuickAdjustButtons = ({ onAdjust, disabled }: { onAdjust: (val: number) => void, disabled?: boolean }) => (
    <div className={`flex justify-between gap-1 mt-3 w-full transition-opacity ${disabled ? 'opacity-30 pointer-events-none' : ''}`}>
    <div className="flex gap-1">
    <button onClick={() => onAdjust(-5)} className="text-[10px] bg-slate-900 hover:bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700 transition-colors">-5</button>
    <button onClick={() => onAdjust(-2)} className="text-[10px] bg-slate-900 hover:bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700 transition-colors">-2</button>
    </div>
    <div className="flex gap-1">
    <button onClick={() => onAdjust(2)} className="text-[10px] bg-slate-900 hover:bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700 transition-colors">+2</button>
    <button onClick={() => onAdjust(5)} className="text-[10px] bg-slate-900 hover:bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700 transition-colors">+5</button>
    </div>
    </div>
  );

  return (
    <div className={`bg-slate-800 border ${isInBattle ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-700'} rounded-xl p-5 shadow-xl transition-all hover:border-amber-500/50 relative group`}>
    <div className="absolute top-4 right-4 flex gap-2 z-10">
    <button
    onClick={(e) => {
      e.stopPropagation();
      onToggleBattle?.();
    }}
    className={`p-1.5 rounded transition-all active:scale-90 ${isInBattle ? 'text-amber-500 bg-amber-500/20' : 'text-slate-500 hover:text-amber-400 md:opacity-0 group-hover:opacity-100 bg-slate-900/40'}`}
    title={isInBattle ? "Remove" : "Battle"}
    >
    <Sword size={18} />
    </button>
    <button
    onClick={(e) => {
      e.stopPropagation();
      console.log('Delete clicked for', player.id);
      onDelete(player.id);
    }}
    className="p-1.5 rounded text-slate-500 hover:text-red-400 md:opacity-0 group-hover:opacity-100 transition-all active:scale-90 bg-slate-900/40"
    title="Delete"
    >
    <Trash2 size={18} />
    </button>
    </div>

    <div className="flex items-center gap-4 mb-4">
    <div
    onClick={handleAvatarClick}
    className="relative group/avatar cursor-pointer w-12 h-12 flex-shrink-0"
    >
    <div className="bg-amber-500 text-slate-900 rounded-full w-full h-full overflow-hidden flex items-center justify-center font-bold text-lg shadow-lg shadow-amber-500/20 border-2 border-slate-700">
    {player.avatar ? (
      <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
    ) : (
      player.name ? player.name.charAt(0).toUpperCase() : '?'
    )}
    </div>
    <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity">
    <Camera size={14} className="text-white" />
    </div>
    <input
    type="file"
    ref={fileInputRef}
    onChange={handleFileChange}
    className="hidden"
    accept="image/*"
    />
    </div>
    <div className="flex-1 min-w-0">
    <input
    type="text"
    value={player.name}
    onChange={(e) => onUpdate(player.id, { name: e.target.value })}
    className="bg-transparent border-b border-transparent hover:border-slate-600 focus:border-amber-500 text-lg font-bold text-white game-font outline-none transition-all w-full truncate"
    placeholder={t.placeholderName}
    />
    </div>
    </div>

    <div className="grid grid-cols-2 gap-4 mb-4">
    {/* --- LEVEL SECTION --- */}
    <div className="bg-slate-900/50 rounded-lg p-3 flex flex-col items-center border border-slate-700/50">
    <span className="text-[10px] text-amber-400 uppercase tracking-widest font-bold mb-1">{t.level}</span>
    <div className="flex items-center justify-center gap-2">
    <button
    onClick={() => adjustLevel(-1)}
    disabled={disableLevel}
    className={`p-1 rounded text-slate-500 transition-colors ${disableLevel ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-700'}`}
    >
    <ChevronDown size={18} />
    </button>
    <span className={`text-3xl font-black text-white leading-none min-w-[1.2ch] text-center ${disableLevel ? 'text-slate-500' : ''}`}>
    {player.level}
    </span>
    <button
    onClick={() => adjustLevel(1)}
    disabled={disableLevel}
    className={`p-1 rounded text-slate-500 transition-colors ${disableLevel ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-700'}`}
    >
    <ChevronUp size={18} />
    </button>
    </div>
    <QuickAdjustButtons onAdjust={adjustLevel} disabled={disableLevel} />
    </div>

    {/* --- GEAR SECTION (ZAWSZE OTWARTA) --- */}
    <div className="bg-slate-900/50 rounded-lg p-3 flex flex-col items-center border border-slate-700/50">
    <span className="text-[10px] text-blue-400 uppercase tracking-widest font-bold mb-1">{t.gear}</span>
    <div className="flex items-center justify-center gap-2">
    <button onClick={() => adjustGear(-1)} className="p-1 hover:bg-slate-700 rounded text-slate-500 transition-colors"><ChevronDown size={18} /></button>
    <span className="text-3xl font-black text-white leading-none min-w-[1.2ch] text-center">{player.gear}</span>
    <button onClick={() => adjustGear(1)} className="p-1 hover:bg-slate-700 rounded text-slate-500 transition-colors"><ChevronUp size={18} /></button>
    </div>
    <QuickAdjustButtons onAdjust={adjustGear} />
    </div>
    </div>

    <div className="grid grid-cols-1 gap-3 mb-4">
    <div className="grid grid-cols-2 gap-3">
    <div className="space-y-1">
    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
    <User size={10} /> {t.gender}
    </label>
    <select
    value={player.gender}
    onChange={(e) => onUpdate(player.id, { gender: e.target.value })}
    className="bg-slate-900 border border-slate-700 text-xs text-white rounded p-2 outline-none focus:border-amber-500 w-full appearance-none cursor-pointer"
    >
    {t.genders.map(g => <option key={g} value={g}>{g}</option>)}
    </select>
    </div>

    <div className="flex flex-col justify-end">
    <button
    onClick={() => onUpdate(player.id, { isHalfBreed: !player.isHalfBreed })}
    className={`flex items-center justify-center gap-1 text-[10px] h-[34px] px-2 rounded border transition-all ${player.isHalfBreed ? 'bg-amber-600/20 border-amber-500 text-amber-400' : 'bg-slate-900 border-slate-700 text-slate-500 hover:text-slate-300'}`}
    >
    <Layers size={12} /> {t.halfBreed}
    </button>
    </div>
    </div>

    <div className="space-y-1">
    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t.race}</label>
    <div className="grid grid-cols-1 gap-1.5">
    <select
    value={player.race}
    onChange={(e) => onUpdate(player.id, { race: e.target.value })}
    className="bg-slate-900 border border-slate-700 text-xs text-white rounded p-2 outline-none focus:border-amber-500 w-full appearance-none cursor-pointer"
    >
    {t.races.map(r => <option key={r} value={r}>{r}</option>)}
    </select>
    {player.isHalfBreed && (
      <select
      value={player.secondaryRace || t.races[0]}
      onChange={(e) => onUpdate(player.id, { secondaryRace: e.target.value })}
      className="bg-slate-900 border border-amber-500/30 text-xs text-white rounded p-2 outline-none focus:border-amber-500 w-full appearance-none cursor-pointer animate-in slide-in-from-top-1 duration-200"
      >
      {t.races.map(r => <option key={r} value={r}>{r}</option>)}
      </select>
    )}
    </div>
    </div>

    <div className="space-y-1">
    <div className="flex items-center justify-between">
    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t.class}</label>
    <button
    onClick={() => onUpdate(player.id, { isSuper: !player.isSuper })}
    className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border transition-all ${player.isSuper ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-slate-900 border-slate-700 text-slate-500 hover:text-slate-300'}`}
    >
    <Star size={10} /> {t.super}
    </button>
    </div>
    <div className="grid grid-cols-1 gap-1.5">
    <select
    value={player.class}
    onChange={(e) => onUpdate(player.id, { class: e.target.value })}
    className="bg-slate-900 border border-slate-700 text-xs text-white rounded p-2 outline-none focus:border-blue-500 w-full appearance-none cursor-pointer"
    >
    {t.classes.map(c => <option key={c} value={c}>{c}</option>)}
    </select>
    {player.isSuper && (
      <select
      value={player.secondaryClass || t.classes[0]}
      onChange={(e) => onUpdate(player.id, { secondaryClass: e.target.value })}
      className="bg-slate-900 border border-blue-500/30 text-xs text-white rounded p-2 outline-none focus:border-blue-500 w-full appearance-none cursor-pointer animate-in slide-in-from-top-1 duration-200"
      >
      {t.classes.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
    )}
    </div>
    </div>
    </div>

    <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-lg p-3 flex items-center justify-between shadow-lg shadow-amber-600/10 border border-white/10">
    <div className="flex items-center gap-2">
    <Sword className="text-white/80" size={18} />
    <span className="font-bold text-white uppercase text-[10px] tracking-widest">{t.combatPower}</span>
    </div>
    <span className="text-2xl font-black text-white">{combatStrength}</span>
    </div>
    </div>
  );
};

export default PlayerCard;
