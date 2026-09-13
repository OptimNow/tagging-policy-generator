import React, { useState, useEffect, useId } from 'react';
import { RequiredTag, OptionalTag, CloudProvider, getResourceCategories, getResourceTypes } from '../types';
import { Input, TextArea, Checkbox } from './Input';
import { Button } from './Button';
import { useTheme } from '../context/ThemeContext';
import { Trash2, ChevronDown, ChevronUp, AlertCircle, CheckCircle, ChevronRight, Copy, Check, X } from 'lucide-react';
import { generateAzurePortalJson } from '../services/azure-converter';

interface TagFormProps {
  tag: RequiredTag | OptionalTag;
  isRequired: boolean;
  cloudProvider: CloudProvider;
  onChange: (updatedTag: RequiredTag | OptionalTag) => void;
  onRemove: () => void;
  index: number;
}

const PROVIDER_LABEL: Record<CloudProvider, string> = { aws: 'AWS', gcp: 'GCP', azure: 'Azure' };

export const TagForm: React.FC<TagFormProps> = ({ tag, isRequired, cloudProvider, onChange, onRemove, index }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const bodyId = useId();
  const resourceCategories = getResourceCategories(cloudProvider);
  const allResourceTypes = getResourceTypes(cloudProvider);
  const [isExpanded, setIsExpanded] = useState(false);
  const [testRegexInput, setTestRegexInput] = useState('');
  const [regexTestResult, setRegexTestResult] = useState<boolean | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [azureCopied, setAzureCopied] = useState(false);

  useEffect(() => {
    setExpandedCategories(new Set());
  }, [cloudProvider]);

  const appliesTo = isRequired ? ((tag as RequiredTag).applies_to || []) : [];
  // Resource types no checkbox represents, e.g. from an imported policy or an
  // older file. They are listed separately so they can be removed; otherwise
  // they would fail validation with no way to untick them.
  const unknownResourceTypes = appliesTo.filter(r => !allResourceTypes.includes(r));
  const tagLabel = tag.name || (isRequired ? `Required Tag #${index + 1}` : `Optional Tag #${index + 1}`);

  const handleAllowedValuesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange({
      ...tag,
      allowed_values: val.trim() === '' ? null : val.split(',').map(v => v.trim())
    });
  };

  const handleAppliesToChange = (resource: string) => {
    if (!isRequired) return;
    const updated = appliesTo.includes(resource)
      ? appliesTo.filter(r => r !== resource)
      : [...appliesTo, resource];
    onChange({ ...tag, applies_to: updated } as RequiredTag);
  };

  const handleApplyToAll = (checked: boolean) => {
    if (!isRequired) return;
    onChange({ ...tag, applies_to: checked ? [...allResourceTypes] : [] } as RequiredTag);
  };

  const removeResourceType = (resource: string) => {
    if (!isRequired) return;
    onChange({ ...tag, applies_to: appliesTo.filter(r => r !== resource) } as RequiredTag);
  };

  const isAllSelected = isRequired && allResourceTypes.every(r => appliesTo.includes(r));

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  };

  const handleCategoryToggle = (categoryResources: string[], checked: boolean) => {
    if (!isRequired) return;
    const updated = checked
      ? [...new Set([...appliesTo, ...categoryResources])]
      : appliesTo.filter(r => !categoryResources.includes(r));
    onChange({ ...tag, applies_to: updated } as RequiredTag);
  };

  const getCategorySelectedCount = (categoryResources: string[]) =>
    categoryResources.filter(r => appliesTo.includes(r)).length;

  const isCategoryFullySelected = (categoryResources: string[]) =>
    isRequired && categoryResources.every(r => appliesTo.includes(r));

  const isCategoryPartiallySelected = (categoryResources: string[]) => {
    const selectedCount = getCategorySelectedCount(categoryResources);
    return isRequired && selectedCount > 0 && selectedCount < categoryResources.length;
  };

  const testRegex = () => {
    const pattern = (tag as RequiredTag).validation_regex;
    if (!pattern) return;
    try {
      const regex = new RegExp(pattern);
      setRegexTestResult(regex.test(testRegexInput));
    } catch (e) {
      setRegexTestResult(false);
      alert("Invalid Regex Pattern");
    }
  };

  const handleCopyAzureJson = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const effect = isRequired ? 'deny' : 'audit';
    const json = generateAzurePortalJson(tag.name, tag.description, effect, tag.allowed_values, appliesTo);
    try {
      await navigator.clipboard.writeText(JSON.stringify(json, null, 2));
      setAzureCopied(true);
      setTimeout(() => setAzureCopied(false), 2000);
    } catch {
      setAzureCopied(false);
    }
  };

  const toggleExpanded = () => setIsExpanded(prev => !prev);

  return (
    <div className={`rounded-lg overflow-hidden mb-4 transition-all ${isDark ? 'bg-white/5 border border-white/10 hover:border-white/20' : 'bg-white border border-gray-200 hover:border-gray-300'}`}>
      {/* Header. The title is a disclosure button inside a heading (the WAI-ARIA
          accordion pattern), so keyboard and screen-reader users can open the
          card. The action buttons sit beside it, not inside it. */}
      <div className={`flex items-center justify-between gap-2 pr-4 ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
        <h3 className="flex-1 min-w-0">
          <button
            type="button"
            onClick={toggleExpanded}
            aria-expanded={isExpanded}
            aria-controls={bodyId}
            className="w-full flex items-center gap-3 p-4 text-left select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-chartreuse"
          >
            <span aria-hidden="true" className={`w-2 h-8 rounded-full shrink-0 ${isRequired ? 'bg-chartreuse' : 'bg-gray-500'}`}></span>
            <span className={`font-semibold truncate ${isDark ? 'text-white' : 'text-charcoal'}`}>{tagLabel}</span>
            {!tag.name && <span className="text-xs text-red-400 flex items-center gap-1 shrink-0"><AlertCircle size={12} aria-hidden="true" /> Name required</span>}
          </button>
        </h3>
        <div className="flex items-center gap-2 shrink-0">
          {cloudProvider === 'azure' && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleCopyAzureJson}
              title="Copy Azure Policy JSON — paste directly into Azure Portal"
            >
              {azureCopied ? <><Check size={14} className="mr-1" aria-hidden="true" /> Copied</> : <><Copy size={14} className="mr-1" aria-hidden="true" /> Azure JSON</>}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
            aria-label={`Delete ${tagLabel}`}
            title={`Delete ${tagLabel}`}
          >
            <Trash2 size={16} aria-hidden="true" />
          </Button>
          {/* Mouse shortcut for the same toggle. Hidden from assistive tech,
              because the title button already provides it. */}
          <button type="button" tabIndex={-1} aria-hidden="true" onClick={toggleExpanded} className="p-1 text-gray-400">
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {/* Body */}
      {isExpanded && (
        <div id={bodyId} className={`p-4 space-y-4 ${isDark ? 'border-t border-white/10' : 'border-t border-gray-200'}`}>
          <Input
            label="Tag Name"
            placeholder={cloudProvider === 'gcp' ? 'e.g. cost_center' : 'e.g. CostCenter'}
            value={tag.name}
            onChange={(e) => onChange({ ...tag, name: e.target.value })}
            error={!tag.name}
          />

          <TextArea
            label="Description"
            placeholder="Describe the purpose of this tag..."
            value={tag.description}
            onChange={(e) => onChange({ ...tag, description: e.target.value })}
            error={!tag.description}
          />

          <div className="flex flex-col gap-1">
             <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Allowed Values</label>
             <Input
               placeholder="Comma separated values (e.g. Prod, Dev, Stage). Leave empty for any."
               value={tag.allowed_values ? tag.allowed_values.join(', ') : ''}
               onChange={handleAllowedValuesChange}
             />
             <span className="text-xs text-gray-500">Leave blank to allow any value.</span>
          </div>

          {isRequired && (
            <>
              <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Validation Regex</label>
                  <div className="flex gap-2">
                      <Input
                          className="flex-1 font-mono"
                          placeholder="e.g. ^[0-9]{3}$"
                          value={(tag as RequiredTag).validation_regex || ''}
                          onChange={(e) => onChange({ ...tag, validation_regex: e.target.value || null } as RequiredTag)}
                      />
                  </div>
                  {(tag as RequiredTag).validation_regex && (
                      <div className={`mt-2 flex gap-2 items-center p-2 rounded ${isDark ? 'bg-black/20 border border-white/5' : 'bg-gray-50 border border-gray-200'}`}>
                          <span className="text-xs text-gray-400 uppercase tracking-wider">Test:</span>
                          <input
                            className={`bg-transparent border-none focus:ring-0 text-sm flex-1 focus:outline-none ${isDark ? 'text-white' : 'text-charcoal'}`}
                            placeholder="Type to test..."
                            value={testRegexInput}
                            onChange={(e) => {
                                setTestRegexInput(e.target.value);
                                setRegexTestResult(null);
                            }}
                          />
                          <Button
                            variant="unstyled"
                            size="sm"
                            onClick={testRegex}
                            className={`font-semibold ${isDark ? 'text-chartreuse hover:text-white' : 'text-lime-800 hover:text-charcoal'}`}
                          >
                            Run
                          </Button>
                          {regexTestResult === true && <CheckCircle size={16} className="text-chartreuse"/>}
                          {regexTestResult === false && <AlertCircle size={16} className="text-red-500"/>}
                      </div>
                  )}
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Applies To</label>
                  <Checkbox
                    label="Apply to All"
                    checked={isAllSelected}
                    onChange={(e) => handleApplyToAll(e.target.checked)}
                  />
                </div>
                <div className={`rounded overflow-hidden ${isDark ? 'bg-black/20 border border-white/5' : 'bg-gray-50 border border-gray-200'}`}>
                  {resourceCategories.map((category) => {
                    const isOpen = expandedCategories.has(category.name);
                    const isFullySelected = isCategoryFullySelected(category.resources);
                    const isPartiallySelected = isCategoryPartiallySelected(category.resources);
                    const selectedCount = getCategorySelectedCount(category.resources);

                    return (
                      <div key={category.name} className={`${isDark ? 'border-b border-white/5 last:border-b-0' : 'border-b border-gray-200 last:border-b-0'}`}>
                        {/* Category Header */}
                        <div
                          className={`flex items-center gap-2 px-3 py-2 cursor-pointer select-none ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100'}`}
                        >
                          <button
                            type="button"
                            onClick={() => toggleCategory(category.name)}
                            className="p-0.5"
                          >
                            {isOpen ? (
                              <ChevronDown size={14} className="text-gray-400" />
                            ) : (
                              <ChevronRight size={14} className="text-gray-400" />
                            )}
                          </button>
                          <div className="flex-1 flex items-center gap-2" onClick={() => toggleCategory(category.name)}>
                            <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-charcoal'}`}>
                              {category.name}
                            </span>
                            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                              {category.description}
                            </span>
                          </div>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${selectedCount > 0 ? 'bg-chartreuse/20 text-chartreuse' : isDark ? 'bg-white/10 text-gray-500' : 'bg-gray-200 text-gray-500'}`}>
                            {selectedCount}/{category.resources.length}
                          </span>
                          <Checkbox
                            label=""
                            checked={isFullySelected}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleCategoryToggle(category.resources, e.target.checked);
                            }}
                            className={isPartiallySelected ? 'opacity-50' : ''}
                          />
                        </div>
                        {/* Category Resources */}
                        {isOpen && (
                          <div className={`grid ${cloudProvider === 'gcp' || cloudProvider === 'azure' ? 'grid-cols-1' : 'grid-cols-2'} gap-1 px-3 pb-2 pt-1 ${isDark ? 'bg-black/20' : 'bg-white/50'}`}>
                            {category.resources.map(resource => (
                              <Checkbox
                                key={resource}
                                label={resource}
                                checked={appliesTo.includes(resource)}
                                onChange={() => handleAppliesToChange(resource)}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {unknownResourceTypes.length > 0 && (
                  <div className={`rounded p-3 flex flex-col gap-2 text-xs ${isDark ? 'bg-red-500/10 border border-red-500/30 text-red-200' : 'bg-red-50 border border-red-200 text-red-800'}`}>
                    <span>Not in the {PROVIDER_LABEL[cloudProvider]} resource list, so these fail validation. Remove them, and tick the types you want above.</span>
                    <ul className="flex flex-wrap gap-2">
                      {unknownResourceTypes.map(resource => (
                        <li key={resource} className={`inline-flex items-center gap-1 rounded-full pl-2.5 pr-1 py-0.5 font-mono ${isDark ? 'bg-black/30' : 'bg-white border border-red-200'}`}>
                          {resource}
                          <button
                            type="button"
                            onClick={() => removeResourceType(resource)}
                            aria-label={`Remove ${resource}`}
                            className="p-0.5 rounded-full hover:bg-red-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                          >
                            <X size={12} aria-hidden="true" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {appliesTo.length === 0 && <span className="text-xs text-red-400">Select at least one resource.</span>}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
