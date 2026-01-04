import React, { useState, useEffect, useMemo } from 'react';
import { Policy, RequiredTag, OptionalTag } from './types';
import { TEMPLATES } from './services/templates';
import { validatePolicy } from './services/validator';
import { convertAwsPolicyToMcp } from './services/converter';
import { Button } from './components/Button';
import { Input, Checkbox } from './components/Input';
import { TagForm } from './components/TagForm';
import { FileJson, Plus, Download, Copy, LayoutTemplate, ArrowRight, AlertTriangle, Check, Terminal, CheckCircle } from 'lucide-react';

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
  const [view, setView] = useState<ViewState>('start');
  const [policy, setPolicy] = useState<Policy>(INITIAL_POLICY);
  const [awsImportText, setAwsImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

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
  const downloadJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(policy, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "tagging_policy.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(policy, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- Views ---

  if (view === 'start') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-charcoal text-white">
        <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8">
          
          {/* Header Section */}
          <div className="md:col-span-2 text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 mb-6 border border-white/10">
              <FileJson size={32} className="text-chartreuse" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">AWS Tagging Policy Generator</h1>
            <p className="text-gray-400 max-w-lg mx-auto">
              Create, validate, and export standard FinOps tagging policies for your AWS infrastructure. 
              Pure client-side, secure, and ready for MCP.
            </p>
          </div>

          {/* Option 1: Create New */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-chartreuse/50 transition-all flex flex-col items-start">
            <div className="w-12 h-12 rounded-full bg-chartreuse/10 flex items-center justify-center mb-4">
              <Plus className="text-chartreuse" />
            </div>
            <h2 className="text-xl font-bold mb-2">Create from Scratch</h2>
            <p className="text-gray-400 text-sm mb-8 flex-1">
              Start with a blank canvas or use a template to build your policy step-by-step.
            </p>
            
            <div className="w-full space-y-3">
              <Button onClick={() => setView('editor')} className="w-full justify-between group">
                Start Blank <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform"/>
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[#333333] px-2 text-gray-500 rounded">Or pick a template</span>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2">
                 {TEMPLATES.map(t => (
                   <button 
                    key={t.name}
                    onClick={() => applyTemplate(t.name)}
                    className="flex items-center gap-2 p-3 rounded bg-white/5 hover:bg-white/10 text-sm text-left transition-colors border border-transparent hover:border-white/20"
                   >
                     <LayoutTemplate size={14} className="text-gray-400" />
                     <span className="flex-1">{t.name}</span>
                   </button>
                 ))}
              </div>
            </div>
          </div>

          {/* Option 2: Import */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-chartreuse/50 transition-all flex flex-col items-start">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
              <Terminal className="text-blue-400" />
            </div>
            <h2 className="text-xl font-bold mb-2">Import AWS Policy</h2>
            <p className="text-gray-400 text-sm mb-6">
              Paste an existing AWS Organizations JSON policy to convert it automatically.
            </p>
            <textarea 
              className="w-full flex-1 bg-black/30 border border-white/10 rounded-lg p-3 text-xs font-mono text-gray-300 focus:outline-none focus:border-chartreuse mb-4 resize-none"
              placeholder='{"tags": { ... }}'
              value={awsImportText}
              onChange={(e) => setAwsImportText(e.target.value)}
            />
            {importError && (
              <div className="w-full p-2 mb-4 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-xs flex items-center gap-2">
                <AlertTriangle size={12} /> {importError}
              </div>
            )}
            <Button variant="secondary" onClick={handleImport} className="w-full" disabled={!awsImportText.trim()}>
              Import & Convert
            </Button>
          </div>

        </div>
      </div>
    );
  }

  // --- Editor View ---

  return (
    <div className="flex h-screen flex-col md:flex-row bg-charcoal overflow-hidden">
      
      {/* LEFT PANEL: FORM BUILDER */}
      <div className="w-full md:w-1/2 lg:w-3/5 h-full flex flex-col border-r border-white/10">
        
        {/* Header */}
        <div className="h-16 px-6 border-b border-white/10 flex items-center justify-between bg-charcoal shrink-0">
          <div className="flex items-center gap-3">
             <div onClick={() => setView('start')} className="cursor-pointer hover:bg-white/10 p-2 rounded-full transition-colors">
               <FileJson className="text-chartreuse" size={24} />
             </div>
             <h1 className="font-bold text-lg hidden sm:block">Policy Builder</h1>
          </div>
          <div className="flex items-center gap-2">
            <select 
              className="bg-white/5 border border-white/10 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-chartreuse text-gray-300"
              onChange={(e) => applyTemplate(e.target.value)}
              value=""
            >
              <option value="" disabled>Load Template...</option>
              {TEMPLATES.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
            </select>
          </div>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
          
          {/* Naming Rules */}
          <section className="mb-8">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Global Naming Rules</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-white/5 p-4 rounded-lg border border-white/10">
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
            
            <Button onClick={addRequiredTag} variant="secondary" className="w-full border-dashed border-2 border-gray-600 bg-transparent text-gray-400 hover:text-white hover:border-gray-400 hover:bg-white/5">
              <Plus size={16} className="mr-2"/> Add Required Tag
            </Button>
          </section>

          {/* Optional Tags */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
               <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Optional Tags</h2>
               <span className="text-xs bg-white/10 text-gray-400 px-2 py-0.5 rounded-full">{policy.optional_tags.length}</span>
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
            
            <Button onClick={addOptionalTag} variant="ghost" className="w-full border-dashed border-2 border-gray-700 text-gray-500 hover:text-white hover:border-gray-500">
              <Plus size={16} className="mr-2"/> Add Optional Tag
            </Button>
          </section>

          {/* Bottom padding for scroll */}
          <div className="h-10"></div>
        </div>
      </div>

      {/* RIGHT PANEL: PREVIEW */}
      <div className="w-full md:w-1/2 lg:w-2/5 bg-light-grey flex flex-col h-full border-l border-white/10 relative">
        
        {/* Toolbar */}
        <div className="h-16 px-4 bg-light-grey border-b border-gray-300 flex items-center justify-between shrink-0">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-2">Live Preview</span>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={copyToClipboard} className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50">
               {copied ? <Check size={14} className="mr-1 text-green-600"/> : <Copy size={14} className="mr-1"/>}
               {copied ? "Copied" : "Copy"}
            </Button>
            <Button size="sm" onClick={downloadJson} disabled={validationErrors.length > 0}>
               <Download size={14} className="mr-1"/> Download
            </Button>
          </div>
        </div>

        {/* JSON Preview */}
        <div className="flex-1 overflow-auto p-4 relative group bg-[#F4F4F4]">
           <pre className="font-mono text-xs text-charcoal leading-relaxed p-2">
             {JSON.stringify(policy, null, 2)}
           </pre>
        </div>

        {/* Validation Footer */}
        <div className={`shrink-0 p-4 transition-all duration-300 ${validationErrors.length > 0 ? 'bg-red-50 border-t border-red-200 h-auto max-h-48 overflow-y-auto' : 'bg-green-50 border-t border-green-200 h-12 flex items-center'}`}>
           {validationErrors.length > 0 ? (
             <div>
               <div className="flex items-center gap-2 text-red-600 font-bold text-sm mb-2 sticky top-0 bg-red-50">
                 <AlertTriangle size={16} />
                 {validationErrors.length} Validation Errors
               </div>
               <ul className="list-disc pl-5 space-y-1">
                 {validationErrors.map((err, i) => (
                   <li key={i} className="text-xs text-red-700">{err}</li>
                 ))}
               </ul>
             </div>
           ) : (
             <div className="flex items-center gap-2 text-green-700 text-sm font-medium w-full justify-center">
               <CheckCircle size={16} /> Policy Valid
             </div>
           )}
        </div>

      </div>
    </div>
  );
};

export default App;