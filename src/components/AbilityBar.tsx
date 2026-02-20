import { ABILITIES } from '../game/Abilities';
import type { AbilityState } from '../game/Abilities';

interface AbilityBarProps {
  abilities: AbilityState;
  resources: { energy: number; scrap: number; steel: number; electronics: number; data: number };
  onUse: (id: string) => void;
  paused: boolean;
  isGameOver: boolean;
}

export const AbilityBar = ({ abilities, resources, onUse, paused, isGameOver }: AbilityBarProps) => {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '6px 25px', backgroundColor: '#2d3436', borderBottom: '1px solid #636e72',
      gap: '12px', flexShrink: 0,
    }}>
      <span style={{ color: '#b2bec3', fontSize: '11px', fontWeight: 'bold', fontFamily: 'monospace', marginRight: '4px' }}>
        FÄHIGKEITEN
      </span>
      {ABILITIES.map(ability => {
        const cd = abilities.cooldowns[ability.id] || 0;
        const active = (abilities.active[ability.id] || 0) > 0;
        const onCooldown = cd > 0;
        const canAfford = (ability.cost.energy || 0) <= resources.energy
          && (ability.cost.steel || 0) <= resources.steel
          && (ability.cost.electronics || 0) <= resources.electronics
          && (ability.cost.data || 0) <= resources.data
          && (ability.cost.scrap || 0) <= resources.scrap;
        const disabled = paused || isGameOver || onCooldown || !canAfford;

        // Cost label
        const costParts: string[] = [];
        if (ability.cost.energy) costParts.push(`${ability.cost.energy} E`);
        if (ability.cost.steel) costParts.push(`${ability.cost.steel} St`);
        if (ability.cost.electronics) costParts.push(`${ability.cost.electronics} El`);
        if (ability.cost.data) costParts.push(`${ability.cost.data} D`);
        if (ability.cost.scrap) costParts.push(`${ability.cost.scrap} S`);

        return (
          <button
            key={ability.id}
            onClick={() => !disabled && onUse(ability.id)}
            title={`${ability.description}\nKosten: ${costParts.join(', ')}\nCooldown: ${ability.cooldown}s`}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '5px 14px', cursor: disabled ? 'not-allowed' : 'pointer',
              borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', fontFamily: 'monospace',
              backgroundColor: active ? ability.color : onCooldown ? '#636e72' : !canAfford ? '#4a4a4a' : ability.color + '30',
              color: active ? '#000' : onCooldown ? '#b2bec3' : !canAfford ? '#b2bec3' : ability.color,
              border: `2px solid ${active ? ability.color : onCooldown ? '#636e72' : !canAfford ? '#4a4a4a' : ability.color}`,
              opacity: disabled && !active ? 0.6 : 1,
              transition: 'all 0.2s',
              position: 'relative',
              overflow: 'hidden',
              minWidth: '140px',
            }}
          >
            {/* Cooldown overlay */}
            {onCooldown && !active && (
              <div style={{
                position: 'absolute', left: 0, bottom: 0,
                width: `${(cd / ability.cooldown) * 100}%`, height: '100%',
                backgroundColor: 'rgba(0,0,0,0.3)',
                transition: 'width 1s linear',
              }} />
            )}
            <span style={{ fontSize: '16px', position: 'relative', zIndex: 1 }}>{ability.icon}</span>
            <span style={{ position: 'relative', zIndex: 1 }}>
              {ability.name} [{ability.hotkey}]
            </span>
            {active && (
              <span style={{
                position: 'relative', zIndex: 1,
                fontSize: '10px', backgroundColor: '#000', color: ability.color,
                padding: '1px 4px', borderRadius: '3px',
              }}>
                {abilities.active[ability.id]}s
              </span>
            )}
            {onCooldown && !active && (
              <span style={{
                position: 'relative', zIndex: 1,
                fontSize: '10px', color: '#dfe4ea',
              }}>
                {cd}s
              </span>
            )}
            {!onCooldown && !active && (
              <span style={{
                position: 'relative', zIndex: 1,
                fontSize: '9px', color: canAfford ? ability.color : '#e74c3c',
              }}>
                {costParts.join(' ')}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
