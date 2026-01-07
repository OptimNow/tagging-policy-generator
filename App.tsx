import React, { useState, useEffect, useRef } from 'react';
import { Policy, RequiredTag, OptionalTag } from './types';
import { TEMPLATES } from './services/templates';
import { validatePolicy } from './services/validator';
import { convertAwsPolicyToMcp, convertMcpToAwsPolicy, getAwsExportWarnings } from './services/converter';
import { downloadJson, downloadMarkdown, downloadAwsPolicy } from './services/exporter';
import { Button } from './components/Button';
import { Input, Checkbox } from './components/Input';
import { TagForm } from './components/TagForm';
import { useTheme } from './context/ThemeContext';
import { Plus, Download, Upload, Copy, LayoutTemplate, ArrowRight, AlertTriangle, Check, Terminal, CheckCircle, Sun, Moon, ChevronDown, BookOpen } from 'lucide-react';

const INITIAL_POLICY: Policy = {
  version: "1.0",
  last_updated: new Date().toISOString(),
  required_tags: [],
  optional_tags: [],
  tag_naming_rules: {
    case_sensitivity: false,
    allow_special_characters: false,
    max_key_length: 128,
    max_value_length: 256
  }
};

type ViewState = 'start' | 'editor';

const App: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [view, setViewState] = useState<ViewState>('start');
  const [policy, setPolicy] = useState<Policy>(INITIAL_POLICY);
  const [awsImportText, setAwsImportText] = useState('');
  const [awsExportText, setAwsExportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const downloadMenuRef = useRef<HTMLDivElement>(null);

  const isDark = theme === 'dark';

  // Wrapper for setView that also updates browser history
  const setView = (newView: ViewState, pushHistory = true) => {
    setViewState(newView);
    if (pushHistory) {
      window.history.pushState({ view: newView }, '', newView === 'editor' ? '#editor' : '#');
    }
  };

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state?.view) {
        setViewState(event.state.view);
      } else {
        // Default to start if no state (e.g., initial load or direct navigation)
        const hash = window.location.hash;
        setViewState(hash === '#editor' ? 'editor' : 'start');
      }
    };

    // Set initial state
    window.history.replaceState({ view: 'start' }, '', '#');

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Close download menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
        setShowDownloadMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update validation whenever policy changes
  useEffect(() => {
    if (view === 'editor') {
      const errors = validatePolicy(policy);
      setValidationErrors(errors);
      // Update timestamp
      setPolicy(prev => ({ ...prev, last_updated: new Date().toISOString() }));
    }
  }, [policy, view]);

  // Handle Template Selection
  const applyTemplate = (templateName: string) => {
    const template = TEMPLATES.find(t => t.name === templateName);
    if (template) {
      setPolicy({
        ...INITIAL_POLICY,
        ...template.policy,
        last_updated: new Date().toISOString()
      });
      setView('editor');
    }
  };

  // Handle Import
  const handleImport = () => {
    try {
      const converted = convertAwsPolicyToMcp(awsImportText);
      setPolicy(converted);
      setImportError(null);
      setView('editor');
    } catch (e) {
      if (e instanceof Error) {
        setImportError(e.message);
      } else {
        setImportError("Unknown error occurred during import");
      }
    }
  };

  // Handle Export (convert pasted JSON policy to AWS format)
  const handleExportConvert = () => {
    try {
      const parsed = JSON.parse(awsExportText);
      // Check if it has the expected structure
      if (!parsed.required_tags && !parsed.optional_tags) {
        throw new Error("Invalid policy format. Expected required_tags or optional_tags.");
      }
      const awsPolicy = convertMcpToAwsPolicy(parsed as Policy);
      const awsJson = JSON.stringify(awsPolicy, null, 2);

      // Copy to clipboard
      navigator.clipboard.writeText(awsJson);
      setExportError(null);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (e) {
      if (e instanceof Error) {
        setExportError(e.message);
      } else {
        setExportError("Unknown error occurred during export");
      }
      setExportSuccess(false);
    }
  };

  // State Modifiers
  const addRequiredTag = () => {
    setPolicy(prev => ({
      ...prev,
      required_tags: [
        ...prev.required_tags,
        {
          name: '',
          description: '',
          allowed_values: null,
          validation_regex: null,
          applies_to: []
        }
      ]
    }));
  };

  const addOptionalTag = () => {
    setPolicy(prev => ({
      ...prev,
      optional_tags: [
        ...prev.optional_tags,
        {
          name: '',
          description: '',
          allowed_values: null
        }
      ]
    }));
  };

  const updateRequiredTag = (index: number, tag: RequiredTag | OptionalTag) => {
    const newTags = [...policy.required_tags];
    newTags[index] = tag as RequiredTag;
    setPolicy({ ...policy, required_tags: newTags });
  };

  const removeRequiredTag = (index: number) => {
    setPolicy({
      ...policy,
      required_tags: policy.required_tags.filter((_, i) => i !== index)
    });
  };

  const updateOptionalTag = (index: number, tag: RequiredTag | OptionalTag) => {
    const newTags = [...policy.optional_tags];
    newTags[index] = tag as OptionalTag;
    setPolicy({ ...policy, optional_tags: newTags });
  };

  const removeOptionalTag = (index: number) => {
    setPolicy({
      ...policy,
      optional_tags: policy.optional_tags.filter((_, i) => i !== index)
    });
  };

  // Export
  const handleDownloadJson = () => {
    downloadJson(policy);
    setShowDownloadMenu(false);
  };

  const handleDownloadMarkdown = () => {
    downloadMarkdown(policy);
    setShowDownloadMenu(false);
  };

  const handleDownloadAwsPolicy = () => {
    const warnings = getAwsExportWarnings(policy);
    if (warnings.length > 0) {
      const proceed = window.confirm(
        `Note: Some features will not be preserved in AWS format:\n\n${warnings.join('\n')}\n\nContinue with export?`
      );
      if (!proceed) return;
    }
    downloadAwsPolicy(policy);
    setShowDownloadMenu(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(policy, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- Views ---

  if (view === 'start') {
    return (
      <div className={`min-h-screen flex flex-col p-6 ${isDark ? 'bg-charcoal text-white' : 'bg-light-grey text-charcoal'}`}>

        {/* Top Bar with Logo and Theme Toggle */}
        <div className="max-w-5xl w-full mx-auto flex items-center justify-between mb-8">
          <a href="https://www.optimnow.io" target="_blank" rel="noopener noreferrer">
            <img
              src={isDark ? "/Images/logo-darkbackground.png" : "/Images/logo.png"}
              alt="OptimNow Logo"
              className="h-8"
            />
          </a>
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/OptimNow/tagging-policy-generator/blob/main/USER_MANUAL.md"
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-charcoal/10 text-gray-600 hover:text-charcoal'}`}
            >
              <BookOpen size={16} />
              <span className="hidden sm:inline">User Manual</span>
            </a>
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-charcoal/10 text-gray-600 hover:text-charcoal'}`}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center py-8">
          <div className="max-w-5xl w-full space-y-8">

            {/* Header Section */}
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">FinOps Tagging Policy Generator</h1>
              <p className={`max-w-lg mx-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Create, validate, and export tagging policies for cloud cost attribution.
                Pure client-side, secure, and ready for MCP.
              </p>
            </div>

          {/* Option 1: Create New - Full Width */}
          <div className={`rounded-2xl p-8 hover:border-chartreuse/50 transition-all ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'}`}>
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-chartreuse/10 flex items-center justify-center">
                  <Plus className="text-chartreuse" />
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-2">Create from Scratch</h2>
                <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Start with a blank canvas or use a template to build your policy step-by-step.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button onClick={() => setView('editor')} className="justify-between group">
                    Start Blank <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform"/>
                  </Button>
                  <div className="flex flex-wrap gap-2">
                    {TEMPLATES.map(t => (
                      <button
                        key={t.name}
                        onClick={() => applyTemplate(t.name)}
                        className={`flex items-center gap-2 px-4 py-2 rounded text-sm transition-colors border ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20' : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'}`}
                      >
                        <LayoutTemplate size={14} className="text-gray-400" />
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Import/Export Row */}
          <div className="grid md:grid-cols-2 gap-8">

            {/* Option 2: Import from AWS Policy */}
            <div className={`rounded-2xl p-8 hover:border-chartreuse/50 transition-all flex flex-col ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'}`}>
              <div className="flex items-start gap-4 mb-2">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <Upload className="text-blue-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-1">Import AWS Policy</h2>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Paste an AWS Organizations tag policy to convert it to our format.
                  </p>
                </div>
              </div>
              <div className="mb-4"></div>
              <textarea
                className={`w-full flex-1 min-h-[120px] rounded-lg p-3 text-xs font-mono focus:outline-none focus:border-chartreuse mb-4 resize-none ${isDark ? 'bg-black/30 border border-white/10 text-gray-300' : 'bg-gray-50 border border-gray-200 text-gray-700'}`}
                placeholder='{"tags": { "CostCenter": { ... } }}'
                value={awsImportText}
                onChange={(e) => setAwsImportText(e.target.value)}
              />
              {importError && (
                <div className="w-full p-2 mb-4 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-xs flex items-center gap-2">
                  <AlertTriangle size={12} /> {importError}
                </div>
              )}
              <Button variant="secondary" onClick={handleImport} className="w-full" disabled={!awsImportText.trim()}>
                <Upload size={14} className="mr-2" /> Import & Edit
              </Button>
            </div>

            {/* Option 3: Export to AWS Policy */}
            <div className={`rounded-2xl p-8 hover:border-chartreuse/50 transition-all flex flex-col ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'}`}>
              <div className="flex items-start gap-4 mb-2">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <Download className="text-green-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-1">Export to AWS Policy</h2>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Paste a policy JSON to convert it to AWS Organizations format.
                  </p>
                </div>
              </div>
              <div className="mb-4"></div>
              <textarea
                className={`w-full flex-1 min-h-[120px] rounded-lg p-3 text-xs font-mono focus:outline-none focus:border-chartreuse mb-4 resize-none ${isDark ? 'bg-black/30 border border-white/10 text-gray-300' : 'bg-gray-50 border border-gray-200 text-gray-700'}`}
                placeholder='{"version": "1.0", "required_tags": [...] }'
                value={awsExportText}
                onChange={(e) => setAwsExportText(e.target.value)}
              />
              {exportError && (
                <div className="w-full p-2 mb-4 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-xs flex items-center gap-2">
                  <AlertTriangle size={12} /> {exportError}
                </div>
              )}
              {exportSuccess && (
                <div className="w-full p-2 mb-4 bg-green-500/10 border border-green-500/20 rounded text-green-400 text-xs flex items-center gap-2">
                  <CheckCircle size={12} /> AWS policy copied to clipboard!
                </div>
              )}
              <Button variant="secondary" onClick={handleExportConvert} className="w-full" disabled={!awsExportText.trim()}>
                <Download size={14} className="mr-2" /> Convert & Copy
              </Button>
            </div>

          </div>

          </div>
        </div>
      </div>
    );
  }

  // --- Editor View ---

  return (
    <div className={`flex h-screen flex-col md:flex-row overflow-hidden ${isDark ? 'bg-charcoal' : 'bg-light-grey'}`}>

      {/* LEFT PANEL: FORM BUILDER */}
      <div className={`w-full md:w-1/2 lg:w-3/5 h-full flex flex-col ${isDark ? 'border-r border-white/10' : 'border-r border-gray-200'}`}>

        {/* Header */}
        <div className={`h-16 px-6 flex items-center justify-between shrink-0 ${isDark ? 'border-b border-white/10 bg-charcoal' : 'border-b border-gray-200 bg-white'}`}>
          <div className="flex items-center gap-3">
             <button
               onClick={() => setView('start')}
               className={`cursor-pointer p-2 rounded-full transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
               aria-label="Back to home"
             >
               <img
                 src={isDark ? "/Images/logo-darkbackground.png" : "/Images/logo.png"}
                 alt="OptimNow Logo"
                 className="h-6"
               />
             </button>
             <h1 className={`font-bold text-lg hidden sm:block ${isDark ? 'text-white' : 'text-charcoal'}`}>Policy Builder</h1>
          </div>
          <div className="flex items-center gap-2">
            <select
              className={`rounded px-3 py-1.5 text-sm focus:outline-none focus:border-chartreuse ${isDark ? 'bg-white/5 border border-white/10 text-gray-300' : 'bg-gray-50 border border-gray-200 text-gray-700'}`}
              onChange={(e) => applyTemplate(e.target.value)}
              value=""
            >
              <option value="" disabled>Load Template...</option>
              {TEMPLATES.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
            </select>
            <a
              href="https://github.com/OptimNow/tagging-policy-generator/blob/main/USER_MANUAL.md"
              target="_blank"
              rel="noopener noreferrer"
              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-charcoal'}`}
              aria-label="User Manual"
              title="User Manual"
            >
              <BookOpen size={18} />
            </a>
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-charcoal'}`}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>

        {/* Scrollable Form Content */}
        <div className={`flex-1 overflow-y-auto p-6 scroll-smooth ${isDark ? '' : 'bg-light-grey'}`}>

          {/* Naming Rules */}
          <section className="mb-8">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Global Naming Rules</h2>
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-lg ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'}`}>
              <Checkbox
                label="Case Sensitive"
                checked={policy.tag_naming_rules.case_sensitivity}
                onChange={(e) => setPolicy({ ...policy, tag_naming_rules: { ...policy.tag_naming_rules, case_sensitivity: e.target.checked } })}
              />
              <Checkbox
                label="Allow Special Chars"
                checked={policy.tag_naming_rules.allow_special_characters}
                onChange={(e) => setPolicy({ ...policy, tag_naming_rules: { ...policy.tag_naming_rules, allow_special_characters: e.target.checked } })}
              />
              <Input
                type="number"
                label="Max Key Len"
                value={policy.tag_naming_rules.max_key_length}
                onChange={(e) => setPolicy({ ...policy, tag_naming_rules: { ...policy.tag_naming_rules, max_key_length: parseInt(e.target.value) || 0 } })}
              />
              <Input
                type="number"
                label="Max Value Len"
                value={policy.tag_naming_rules.max_value_length}
                onChange={(e) => setPolicy({ ...policy, tag_naming_rules: { ...policy.tag_naming_rules, max_value_length: parseInt(e.target.value) || 0 } })}
              />
            </div>
          </section>

          {/* Required Tags */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
               <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Required Tags</h2>
               <span className="text-xs bg-chartreuse/20 text-chartreuse px-2 py-0.5 rounded-full">{policy.required_tags.length}</span>
            </div>

            {policy.required_tags.map((tag, idx) => (
              <TagForm
                key={idx}
                index={idx}
                tag={tag}
                isRequired={true}
                onChange={(updated) => updateRequiredTag(idx, updated)}
                onRemove={() => removeRequiredTag(idx)}
              />
            ))}

            <Button onClick={addRequiredTag} variant="secondary" className={`w-full border-dashed border-2 bg-transparent ${isDark ? 'border-gray-600 text-gray-400 hover:text-white hover:border-gray-400 hover:bg-white/5' : 'border-gray-300 text-gray-500 hover:text-charcoal hover:border-gray-400 hover:bg-white'}`}>
              <Plus size={16} className="mr-2"/> Add Required Tag
            </Button>
          </section>

          {/* Optional Tags */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
               <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Optional Tags</h2>
               <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-white/10 text-gray-400' : 'bg-gray-200 text-gray-600'}`}>{policy.optional_tags.length}</span>
            </div>

            {policy.optional_tags.map((tag, idx) => (
              <TagForm
                key={idx}
                index={idx}
                tag={tag}
                isRequired={false}
                onChange={(updated) => updateOptionalTag(idx, updated)}
                onRemove={() => removeOptionalTag(idx)}
              />
            ))}

            <Button onClick={addOptionalTag} variant="ghost" className={`w-full border-dashed border-2 ${isDark ? 'border-gray-700 text-gray-500 hover:text-white hover:border-gray-500' : 'border-gray-300 text-gray-500 hover:text-charcoal hover:border-gray-400'}`}>
              <Plus size={16} className="mr-2"/> Add Optional Tag
            </Button>
          </section>

          {/* Bottom padding for scroll */}
          <div className="h-10"></div>
        </div>
      </div>

      {/* RIGHT PANEL: PREVIEW */}
      <div className={`w-full md:w-1/2 lg:w-2/5 flex flex-col h-full relative ${isDark ? 'bg-[#1a1a1a] border-l border-white/10' : 'bg-white border-l border-gray-200'}`}>

        {/* Toolbar */}
        <div className={`h-16 px-4 flex items-center justify-between shrink-0 ${isDark ? 'bg-[#1a1a1a] border-b border-white/10' : 'bg-white border-b border-gray-200'}`}>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-2">Live Preview</span>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={copyToClipboard} className={isDark ? 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}>
               {copied ? <Check size={14} className="mr-1 text-green-600"/> : <Copy size={14} className="mr-1"/>}
               {copied ? "Copied" : "Copy"}
            </Button>
            <div className="relative" ref={downloadMenuRef}>
              <Button
                size="sm"
                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                disabled={validationErrors.length > 0}
              >
                <Download size={14} className="mr-1"/> Download <ChevronDown size={14} className="ml-1"/>
              </Button>
              {showDownloadMenu && (
                <div className={`absolute right-0 top-full mt-1 py-1 rounded-lg shadow-lg z-10 min-w-[160px] ${isDark ? 'bg-[#2a2a2a] border border-white/10' : 'bg-white border border-gray-200'}`}>
                  <button
                    onClick={handleDownloadJson}
                    className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${isDark ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-50 text-gray-700'}`}
                  >
                    JSON
                  </button>
                  <button
                    onClick={handleDownloadAwsPolicy}
                    className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${isDark ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-50 text-gray-700'}`}
                  >
                    AWS Tag Policy
                  </button>
                  <button
                    onClick={handleDownloadMarkdown}
                    className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${isDark ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-50 text-gray-700'}`}
                  >
                    Markdown
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* JSON Preview */}
        <div className={`flex-1 overflow-auto p-4 relative group ${isDark ? 'bg-[#111111]' : 'bg-[#F4F4F4]'}`}>
           <pre className={`font-mono text-xs leading-relaxed p-2 ${isDark ? 'text-gray-300' : 'text-charcoal'}`}>
             {JSON.stringify(policy, null, 2)}
           </pre>
        </div>

        {/* Validation Footer */}
        <div className={`shrink-0 p-4 transition-all duration-300 ${validationErrors.length > 0 ? (isDark ? 'bg-red-900/30 border-t border-red-800 h-auto max-h-48 overflow-y-auto' : 'bg-red-50 border-t border-red-200 h-auto max-h-48 overflow-y-auto') : (isDark ? 'bg-green-900/30 border-t border-green-800 h-12 flex items-center' : 'bg-green-50 border-t border-green-200 h-12 flex items-center')}`}>
           {validationErrors.length > 0 ? (
             <div>
               <div className={`flex items-center gap-2 font-bold text-sm mb-2 sticky top-0 ${isDark ? 'text-red-400 bg-red-900/30' : 'text-red-600 bg-red-50'}`}>
                 <AlertTriangle size={16} />
                 {validationErrors.length} Validation Errors
               </div>
               <ul className="list-disc pl-5 space-y-1">
                 {validationErrors.map((err, i) => (
                   <li key={i} className={`text-xs ${isDark ? 'text-red-300' : 'text-red-700'}`}>{err}</li>
                 ))}
               </ul>
             </div>
           ) : (
             <div className={`flex items-center gap-2 text-sm font-medium w-full justify-center ${isDark ? 'text-green-400' : 'text-green-700'}`}>
               <CheckCircle size={16} /> Policy Valid
             </div>
           )}
        </div>

      </div>
    </div>
  );
};

export default App;