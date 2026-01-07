import { Policy } from '../types';

export const generateMarkdown = (policy: Policy): string => {
  const lines: string[] = [];

  lines.push('# Tagging Policy');
  lines.push('');
  lines.push(`**Version:** ${policy.version}`);
  lines.push(`**Last Updated:** ${new Date(policy.last_updated).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`);
  lines.push('');

  // Tag Naming Rules
  lines.push('## Tag Naming Rules');
  lines.push('');
  lines.push('| Rule | Value |');
  lines.push('|------|-------|');
  lines.push(`| Case Sensitive | ${policy.tag_naming_rules.case_sensitivity ? 'Yes' : 'No'} |`);
  lines.push(`| Allow Special Characters | ${policy.tag_naming_rules.allow_special_characters ? 'Yes' : 'No'} |`);
  lines.push(`| Max Key Length | ${policy.tag_naming_rules.max_key_length} |`);
  lines.push(`| Max Value Length | ${policy.tag_naming_rules.max_value_length} |`);
  lines.push('');

  // Required Tags
  if (policy.required_tags.length > 0) {
    lines.push('## Required Tags');
    lines.push('');

    policy.required_tags.forEach((tag, index) => {
      lines.push(`### ${index + 1}. ${tag.name || 'Unnamed Tag'}`);
      lines.push('');
      if (tag.description) {
        lines.push(`${tag.description}`);
        lines.push('');
      }

      lines.push('| Property | Value |');
      lines.push('|----------|-------|');

      if (tag.allowed_values && tag.allowed_values.length > 0) {
        lines.push(`| Allowed Values | \`${tag.allowed_values.join('`, `')}\` |`);
      } else {
        lines.push('| Allowed Values | Any |');
      }

      if (tag.validation_regex) {
        lines.push(`| Validation Regex | \`${tag.validation_regex}\` |`);
      }

      if (tag.applies_to && tag.applies_to.length > 0) {
        lines.push(`| Applies To | ${tag.applies_to.join(', ')} |`);
      }

      lines.push('');
    });
  }

  // Optional Tags
  if (policy.optional_tags.length > 0) {
    lines.push('## Optional Tags');
    lines.push('');

    policy.optional_tags.forEach((tag, index) => {
      lines.push(`### ${index + 1}. ${tag.name || 'Unnamed Tag'}`);
      lines.push('');
      if (tag.description) {
        lines.push(`${tag.description}`);
        lines.push('');
      }

      if (tag.allowed_values && tag.allowed_values.length > 0) {
        lines.push('| Property | Value |');
        lines.push('|----------|-------|');
        lines.push(`| Allowed Values | \`${tag.allowed_values.join('`, `')}\` |`);
        lines.push('');
      }
    });
  }

  lines.push('---');
  lines.push('');
  lines.push('*Generated with [OptimNow Tagging Policy Generator](https://www.optimnow.io)*');

  return lines.join('\n');
};

export const downloadJson = (policy: Policy, filename: string = 'tagging_policy.json') => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(policy, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", filename);
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
};

export const downloadMarkdown = (policy: Policy, filename: string = 'tagging_policy.md') => {
  const markdown = generateMarkdown(policy);
  const dataStr = "data:text/markdown;charset=utf-8," + encodeURIComponent(markdown);
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", filename);
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
};
