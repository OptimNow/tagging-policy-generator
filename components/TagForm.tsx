import React, { useState } from 'react';
import { RequiredTag, OptionalTag, AWS_RESOURCE_TYPES, RESOURCE_CATEGORIES } from '../types';
import { Input, TextArea, Checkbox } from './Input';
import { Button } from './Button';
import { useTheme } from '../context/ThemeContext';
import { Trash2, ChevronDown, ChevronUp, AlertCircle, CheckCircle, ChevronRight } from 'lucide-react';

interface TagFormProps {
  tag: RequiredTag | OptionalTag;
  isRequired: boolean;
  onChange: (updatedTag: RequiredTag | OptionalTag) => void;
  onRemove: () => void;
  index: number;
}

export const TagForm: React.FC<TagFormProps> = ({ tag, isRequired, onChange, onRemove, index }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [isExpanded, setIsExpanded] = useState(true);
  const [testRegexInput, setTestRegexInput] = useState('');
  const [regexTestResult, setRegexTestResult] = useState<boolean | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(RESOURCE_CATEGORIES.map(c => c.name)));

  const handleAllowedValuesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange({
      ...tag,
      allowed_values: val.trim() === '' ? null : val.split(',').map(v => v.trim())
    });
  };

  const handleAppliesToChange = (resource: string) => {
    if (!isRequired) return;
    const current = (tag as RequiredTag).applies_to;
    const updated = current.includes(resource)
      ? current.filter(r => r !== resource)
      : [...current, resource];

    onChange({
      ...tag,
      applies_to: updated
    } as RequiredTag);
  };

  const handleApplyToAll = (checked: boolean) => {
    if (!isRequired) return;
    onChange({
      ...tag,
      applies_to: checked ? [...AWS_RESOURCE_TYPES] : []
    } as RequiredTag);
  };

  const isAllSelected = isRequired &&
    (tag as RequiredTag).applies_to.length === AWS_RESOURCE_TYPES.length;

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
    const current = (tag as RequiredTag).applies_to;
    let updated: string[];
    if (checked) {
      updated = [...new Set([...current, ...categoryResources])];
    } else {
      updated = current.filter(r => !categoryResources.includes(r));
    }
    onChange({
      ...tag,
      applies_to: updated
    } as RequiredTag);
  };

  const isCategoryFullySelected = (categoryResources: string[]) => {
    if (!isRequired) return false;
    const current = (tag as RequiredTag).applies_to;
    return categoryResources.every(r => current.includes(r));
  };

  const isCategoryPartiallySelected = (categoryResources: string[]) => {
    if (!isRequired) return false;
    const current = (tag as RequiredTag).applies_to;
    const selectedCount = categoryResources.filter(r => current.includes(r)).length;
    return selectedCount > 0 && selectedCount < categoryResources.length;
  };

  const getCategorySelectedCount = (categoryResources: string[]) => {
    if (!isRequired) return 0;
    const current = (tag as RequiredTag).applies_to;
    return categoryResources.filter(r => current.includes(r)).length;
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

  return (
    <div className={`rounded-lg overflow-hidden mb-4 transition-all ${isDark ? 'bg-white/5 border border-white/10 hover:border-white/20' : 'bg-white border border-gray-200 hover:border-gray-300'}`}>
      {/* Header */}
      <div
        className={`flex items-center justify-between p-4 cursor-pointer select-none ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
            <div className={`w-2 h-8 rounded-full ${isRequired ? 'bg-chartreuse' : 'bg-gray-500'}`}></div>
            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-charcoal'}`}>
                {tag.name || (isRequired ? `Required Tag #${index + 1}` : `Optional Tag #${index + 1}`)}
            </h3>
            {!tag.name && <span className="text-xs text-red-400 flex items-center gap-1"><AlertCircle size={12}/> Name required</span>}
        </div>
        <div className="flex items-center gap-2">
            <Button
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); onRemove(); }}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
                <Trash2 size={16} />
            </Button>
            {isExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
        </div>
      </div>

      {/* Body */}
      {isExpanded && (
        <div className={`p-4 space-y-4 ${isDark ? 'border-t border-white/10' : 'border-t border-gray-200'}`}>
          <Input
            label="Tag Name"
            placeholder="e.g. CostCenter"
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
                          <Button variant="ghost" size="sm" onClick={testRegex} className={`text-chartreuse font-semibold ${isDark ? 'hover:text-white' : 'hover:text-charcoal'}`}>Run</Button>
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
                  {RESOURCE_CATEGORIES.map((category) => {
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
                          <div className={`grid grid-cols-2 gap-1 px-3 pb-2 pt-1 ${isDark ? 'bg-black/20' : 'bg-white/50'}`}>
                            {category.resources.map(resource => (
                              <Checkbox
                                key={resource}
                                label={resource}
                                checked={(tag as RequiredTag).applies_to.includes(resource)}
                                onChange={() => handleAppliesToChange(resource)}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {(tag as RequiredTag).applies_to.length === 0 && <span className="text-xs text-red-400">Select at least one resource.</span>}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};