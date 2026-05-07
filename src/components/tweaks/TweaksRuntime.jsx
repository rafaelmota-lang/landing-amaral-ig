import { TweaksPanel, TweakSection, TweakRadio } from './TweaksPanel.jsx';

export default function TweaksRuntime({ tweaks, setTweak }) {
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection title="Hero · Variações de copy">
        <TweakRadio
          label="Headline"
          value={tweaks.headlineVariant}
          onChange={(v) => setTweak('headlineVariant', v)}
          options={[
            { value: 'original', label: 'Original' },
            { value: 'direct', label: 'Direta' },
            { value: 'urgent', label: 'Urgência' },
          ]}
        />
        <TweakRadio
          label="Subtítulo"
          value={tweaks.subheadVariant}
          onChange={(v) => setTweak('subheadVariant', v)}
          options={[
            { value: 'original', label: 'Original' },
            { value: 'direct', label: 'Prova social' },
            { value: 'urgent', label: 'Urgência' },
          ]}
        />
        <TweakRadio
          label="CTA principal"
          value={tweaks.ctaVariant}
          onChange={(v) => setTweak('ctaVariant', v)}
          options={[
            { value: 'original', label: 'Original' },
            { value: 'direct', label: 'Direto' },
            { value: 'urgent', label: 'Urgência' },
          ]}
        />
      </TweakSection>
    </TweaksPanel>
  );
}
