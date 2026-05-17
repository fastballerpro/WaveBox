/**
 * Static ambient backdrop — pure CSS gradient, zero GPU layers.
 * Provides the subtle color tint behind glass surfaces.
 */
export function AmbientBackdrop() {
  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none"
      aria-hidden
      style={{
        background:
          'radial-gradient(ellipse 60% 50% at 15% 20%, rgba(255,106,0,0.12) 0%, transparent 70%),' +
          'radial-gradient(ellipse 50% 60% at 85% 80%, rgba(79,70,229,0.10) 0%, transparent 70%),' +
          '#06060a',
      }}
    />
  );
}
