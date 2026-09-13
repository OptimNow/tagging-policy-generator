import { Policy, RequiredTag, OptionalTag, CloudProvider, DEFAULT_NAMING_RULES } from '../types';

const PROVIDERS: CloudProvider[] = ['aws', 'gcp', 'azure'];

const asString = (value: unknown): string => (typeof value === 'string' ? value : '');

const asStringList = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];

const asObjects = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value)
    ? value.filter((v): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v))
    : [];

const allowedValuesOf = (tag: Record<string, unknown>): string[] | null => {
  const values = asStringList(tag.allowed_values);
  return values.length > 0 ? values : null;
};

/**
 * Recognises a policy JSON saved from this tool (the internal MCP format) and
 * returns it normalised, or returns null when the text is some other format.
 * The AWS and Azure import cards try this first, so a downloaded policy can be
 * loaded back into the editor whatever its provider.
 */
export function tryParseNativePolicy(text: string): Policy | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
  const doc = parsed as Record<string, unknown>;
  if (!Array.isArray(doc.required_tags) && !Array.isArray(doc.optional_tags)) return null;

  // Files without cloud_provider predate multi-cloud support and are AWS.
  const provider: CloudProvider = PROVIDERS.includes(doc.cloud_provider as CloudProvider)
    ? (doc.cloud_provider as CloudProvider)
    : 'aws';

  const requiredTags: RequiredTag[] = asObjects(doc.required_tags).map(tag => ({
    name: asString(tag.name),
    description: asString(tag.description),
    allowed_values: allowedValuesOf(tag),
    validation_regex: asString(tag.validation_regex) || null,
    applies_to: asStringList(tag.applies_to),
  }));

  const optionalTags: OptionalTag[] = asObjects(doc.optional_tags).map(tag => ({
    name: asString(tag.name),
    description: asString(tag.description),
    allowed_values: allowedValuesOf(tag),
  }));

  const rules = (doc.tag_naming_rules && typeof doc.tag_naming_rules === 'object'
    ? doc.tag_naming_rules
    : {}) as Record<string, unknown>;
  const defaults = DEFAULT_NAMING_RULES[provider];

  return {
    version: asString(doc.version) || '1.0',
    last_updated: asString(doc.last_updated) || new Date().toISOString(),
    cloud_provider: provider,
    required_tags: requiredTags,
    optional_tags: optionalTags,
    tag_naming_rules: {
      case_sensitivity: typeof rules.case_sensitivity === 'boolean' ? rules.case_sensitivity : defaults.case_sensitivity,
      allow_special_characters: typeof rules.allow_special_characters === 'boolean' ? rules.allow_special_characters : defaults.allow_special_characters,
      max_key_length: typeof rules.max_key_length === 'number' ? rules.max_key_length : defaults.max_key_length,
      max_value_length: typeof rules.max_value_length === 'number' ? rules.max_value_length : defaults.max_value_length,
    },
  };
}
