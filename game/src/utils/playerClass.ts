export type PlayerClass = 'techBro' | 'indieHacker' | 'collegeStudent' | 'corporateDev';
export type Strategy = 'planThenBuild' | 'justStart' | 'oneShot' | 'vibeCode';
export type ModelTier = 'free' | 'standard' | 'frontier' | 'local' | 'sketchy' | 'openSource';

const MODEL_TIERS: readonly ModelTier[] = ['free', 'standard', 'frontier', 'local', 'sketchy', 'openSource'];

export function isModelTier(value: unknown): value is ModelTier {
  return typeof value === 'string' && (MODEL_TIERS as readonly string[]).includes(value);
}
