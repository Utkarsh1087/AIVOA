import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  analyzeComplaintText, 
  uploadComplaintFile,
  sendAssistantChat,
  addChatMessage,
  resetFormAndAI
} from '../store/complaintSlice';
import { 
  Sparkles, 
  UploadCloud, 
  Loader2, 
  Paperclip, 
  Clipboard, 
  Lightbulb, 
  X, 
  RotateCcw, 
  ArrowUp, 
  User, 
  FlaskConical 
} from 'lucide-react';
import SampleDataSelector from './SampleDataSelector';

export default function ComplaintInputArea() {
  const dispatch = useDispatch();
  const { 
    analyzing, 
    chatLoading, 
    chatMessages, 
    editableForm, 
    aiResponse 
  } = useSelector((state) => state.complaints);

  const [dragActive, setDragActive] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [showSamplesModal, setShowSamplesModal] = useState(false);
  const [showPromptsModal, setShowPromptsModal] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [chatInput, setChatInput] = useState('');

  const fileInputRef = useRef(null);
  const chatBottomRef = useRef(null);
  const plusMenuRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, analyzing]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(event.target)) {
        setShowPlusMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      dispatch(uploadComplaintFile({ file, sourceType: `Uploaded ${file.name}` }));
      setShowPlusMenu(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      dispatch(uploadComplaintFile({ file, sourceType: `Uploaded ${file.name}` }));
    }
  };

  const handlePasteAnalyze = (e) => {
    e.preventDefault();
    if (!pasteText.trim()) return;
    dispatch(analyzeComplaintText({ text: pasteText, source: 'Pasted Message' }));
    setPasteText('');
    setShowPasteModal(false);
    setShowPlusMenu(false);
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    setShowPlusMenu(false);
    setShowPromptsModal(false);

    // Add user message to Redux thread
    dispatch(addChatMessage({ sender: 'user', text: userMsg }));

    // Send to Assistant
    dispatch(sendAssistantChat({
      message: userMsg,
      context: {
        ...editableForm,
        ai_summary: aiResponse ? aiResponse.summary : ''
      }
    }));
  };

  const executePrompt = (text) => {
    setShowPlusMenu(false);
    setShowPromptsModal(false);
    dispatch(addChatMessage({ sender: 'user', text }));
    dispatch(sendAssistantChat({
      message: text,
      context: { ...editableForm, ai_summary: aiResponse ? aiResponse.summary : '' }
    }));
  };

  return (
    <div 
      className={`qms-card ${dragActive ? 'drag-active' : ''}`}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      style={{ 
        padding: '24px', 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%',
        minHeight: 0,
        position: 'relative'
      }}
    >
      {/* Hidden File Input for Attachments */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt,.eml,.msg,.png,.jpg"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Clean Top Header matching reference */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: '18px',
        paddingBottom: '12px',
        borderBottom: '1px solid #f1f5f9'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            color: '#4f46e5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <FlaskConical size={20} strokeWidth={2.3} color="#4f46e5" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e1b4b', margin: 0 }}>
              AIVOA Copilot
            </h2>
            <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '2px 0 0 0' }}>
              Drop complaint files or paste text below.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ 
            width: '8px', 
            height: '8px', 
            borderRadius: '50%', 
            backgroundColor: '#2563eb',
            boxShadow: '0 0 0 2px rgba(37, 99, 235, 0.2)'
          }} />
          <button
            type="button"
            onClick={() => dispatch(resetFormAndAI())}
            className="btn-outline"
            title="Clear and reset chat & form"
            style={{ padding: '4px 8px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px', borderRadius: '6px' }}
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Analyzing Progress Banner (Dynamic) */}
      {analyzing && (
        <div style={{
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '8px',
          padding: '10px 14px',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.80rem',
          color: '#1d4ed8',
          animation: 'fadeIn 0.2s ease-in-out'
        }}>
          <Loader2 size={16} className="pulsing" />
          <div>
            <div style={{ fontWeight: 600 }}>Analyzing complaint document...</div>
            <div style={{ fontSize: '0.72rem', color: '#60a5fa' }}>Extracting product details and evaluating risk</div>
          </div>
        </div>
      )}

      {/* Drag & Drop Visual Overlay */}
      {dragActive && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(239, 246, 255, 0.95)',
          border: '2px dashed #2563eb',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 60,
          pointerEvents: 'none'
        }}>
          <UploadCloud size={46} color="#2563eb" />
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1d4ed8', marginTop: '10px' }}>
            Drop complaint document here
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
            PDF, Email (.eml), Word, or Text
          </div>
        </div>
      )}

      {/* Main Spacious Chat Message Thread matching reference screenshots */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '14px',
        paddingRight: '6px',
        marginBottom: '14px'
      }}>
        {chatMessages.map((msg) => (
          <div key={msg.id}>
            {msg.sender === 'user' ? (
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start', gap: '8px' }}>
                <div style={{
                  backgroundColor: '#4338ca',
                  color: '#ffffff',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  fontSize: '0.84rem',
                  lineHeight: 1.5,
                  maxWidth: '85%',
                  boxShadow: '0 2px 8px rgba(67, 56, 202, 0.2)'
                }}>
                  {msg.text}
                </div>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: '#e0e7ff',
                  color: '#4338ca',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <User size={15} />
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start', gap: '8px' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {msg.text.includes('parsed successfully') || msg.text.includes('logged') ? (
                    <Check size={14} color="#2563eb" />
                  ) : (
                    <Sparkles size={14} color="#2563eb" />
                  )}
                </div>
                <div style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  fontSize: '0.84rem',
                  color: '#334155',
                  lineHeight: 1.5,
                  maxWidth: '88%',
                  boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)'
                }}>
                  {msg.text}
                </div>
              </div>
            )}
          </div>
        ))}

        {chatLoading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start', gap: '8px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Loader2 size={14} className="pulsing" />
            </div>
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '10px 14px',
              fontSize: '0.82rem',
              color: '#64748b',
              fontStyle: 'italic'
            }}>
              Processing complaint with LangGraph AI...
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Modern Input Container matching reference */}
      <div style={{ position: 'relative', marginTop: 'auto' }} ref={plusMenuRef}>
        
        {/* Floating Plus (+) Menu */}
        {showPlusMenu && (
          <div style={{
            position: 'absolute',
            bottom: '100%',
            left: '0',
            marginBottom: '10px',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '12px',
            boxShadow: '0 16px 36px -4px rgba(15, 23, 42, 0.18), 0 6px 12px -2px rgba(15, 23, 42, 0.08)',
            padding: '8px',
            zIndex: 50,
            width: '260px',
            animation: 'fadeIn 0.15s ease-out'
          }}>
            <div style={{ fontSize: '0.70rem', fontWeight: 700, color: '#94a3b8', padding: '4px 8px', letterSpacing: '0.04em' }}>
              ATTACH & TOOLS
            </div>

            <button
              type="button"
              onClick={() => {
                setShowPlusMenu(false);
                fileInputRef.current?.click();
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 10px',
                border: 'none',
                background: 'transparent',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '0.82rem',
                color: '#1e293b',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Paperclip size={14} color="#2563eb" />
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>Upload Document</div>
                <div style={{ fontSize: '0.70rem', color: '#64748b' }}>PDF, Email, Word, Text</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowPasteModal(true);
                setShowPlusMenu(false);
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 10px',
                border: 'none',
                background: 'transparent',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '0.82rem',
                color: '#1e293b',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clipboard size={14} color="#16a34a" />
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>Paste Raw Text</div>
                <div style={{ fontSize: '0.70rem', color: '#64748b' }}>Customer message or notes</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowSamplesModal(true);
                setShowPlusMenu(false);
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 10px',
                border: 'none',
                background: 'transparent',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '0.82rem',
                color: '#1e293b',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: '#fdf4ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={14} color="#c026d3" />
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>Sample Cases</div>
                <div style={{ fontSize: '0.70rem', color: '#64748b' }}>Pre-loaded test scenarios</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowPromptsModal(true);
                setShowPlusMenu(false);
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 10px',
                border: 'none',
                background: 'transparent',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '0.82rem',
                color: '#1e293b',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Lightbulb size={14} color="#16a34a" />
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>Quick AI Prompts</div>
                <div style={{ fontSize: '0.70rem', color: '#64748b' }}>Log, edit, or update</div>
              </div>
            </button>
          </div>
        )}

        {/* Modal/Drawer: Paste Raw Text */}
        {showPasteModal && (
          <div style={{
            position: 'absolute',
            bottom: '100%',
            left: '0',
            right: '0',
            marginBottom: '10px',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '12px',
            boxShadow: '0 16px 36px -4px rgba(15, 23, 42, 0.18)',
            padding: '14px',
            zIndex: 50,
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>
                📋 Paste Customer Complaint Text
              </span>
              <button 
                onClick={() => setShowPasteModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={15} />
              </button>
            </div>
            <textarea
              className="qms-textarea"
              rows={4}
              placeholder="Paste complaint email, feedback note, or transcript here..."
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              style={{ fontSize: '0.82rem', resize: 'vertical', marginBottom: '8px' }}
            />
            <button
              type="button"
              className="btn-primary"
              onClick={handlePasteAnalyze}
              disabled={analyzing || !pasteText.trim()}
              style={{ width: '100%', justifyContent: 'center', padding: '7px 12px', fontSize: '0.82rem' }}
            >
              <Sparkles size={14} />
              Extract Details with AI
            </button>
          </div>
        )}

        {/* Modal/Drawer: Sample Cases */}
        {showSamplesModal && (
          <div style={{
            position: 'absolute',
            bottom: '100%',
            left: '0',
            right: '0',
            marginBottom: '10px',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '12px',
            boxShadow: '0 16px 36px -4px rgba(15, 23, 42, 0.18)',
            padding: '14px',
            zIndex: 50,
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>
                ✨ Load Sample Demo Case
              </span>
              <button 
                onClick={() => setShowSamplesModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={15} />
              </button>
            </div>
            <SampleDataSelector onSelect={() => setShowSamplesModal(false)} />
          </div>
        )}

        {/* Modal/Drawer: Quick Prompts */}
        {showPromptsModal && (
          <div style={{
            position: 'absolute',
            bottom: '100%',
            left: '0',
            right: '0',
            marginBottom: '10px',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '12px',
            boxShadow: '0 16px 36px -4px rgba(15, 23, 42, 0.18)',
            padding: '14px',
            zIndex: 50,
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>
                💡 Quick AI Prompts (Click to Run)
              </span>
              <button 
                onClick={() => setShowPromptsModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={15} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button
                type="button"
                className="btn-outline"
                onClick={() => executePrompt('Apollo Pharmacy reported discolored capsules in amoxicillin capsules 500 mg')}
                disabled={chatLoading}
                style={{ padding: '6px 10px', fontSize: '0.76rem', textAlign: 'left', borderRadius: '6px', background: '#f8fafc', color: '#1e40af', border: '1px solid #e2e8f0' }}
              >
                <strong style={{ color: '#2563eb' }}>➕ Log:</strong> "Apollo Pharmacy reported discolored capsules in amoxicillin capsules 500 mg"
              </button>
              <button
                type="button"
                className="btn-outline"
                onClick={() => executePrompt('Sorry, the batch number is BMX24602 and the affected quantity is 48 capsules')}
                disabled={chatLoading}
                style={{ padding: '6px 10px', fontSize: '0.76rem', textAlign: 'left', borderRadius: '6px', background: '#f8fafc', color: '#b45309', border: '1px solid #e2e8f0' }}
              >
                <strong style={{ color: '#d97706' }}>✏️ Edit:</strong> "Sorry, the batch number is BMX24602 and the affected quantity is 48 capsules"
              </button>
              <button
                type="button"
                className="btn-outline"
                onClick={() => executePrompt('Sorry, the batch number is CHG260712A and affected quantity is 50 kg 2 HDP drums')}
                disabled={chatLoading}
                style={{ padding: '6px 10px', fontSize: '0.76rem', textAlign: 'left', borderRadius: '6px', background: '#f8fafc', color: '#047857', border: '1px solid #e2e8f0' }}
              >
                <strong style={{ color: '#059669' }}>✏️ Edit API:</strong> "Sorry, the batch number is CHG260712A and affected quantity is 50 kg 2 HDP drums"
              </button>
            </div>
          </div>
        )}

        {/* Input Bar Form matching reference screenshot */}
        <form 
          onSubmit={handleSendChat} 
          style={{ 
            display: 'flex', 
            gap: '8px', 
            alignItems: 'center',
            backgroundColor: '#ffffff',
            border: '1.5px solid #4f46e5',
            borderRadius: '10px',
            padding: '6px 8px 6px 10px',
            boxShadow: '0 2px 10px rgba(79, 70, 229, 0.08)'
          }}
        >
          {/* Paperclip Button for Attachments */}
          <button
            type="button"
            onClick={() => {
              fileInputRef.current?.click();
            }}
            title="Attach file"
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748b',
              padding: '4px',
              borderRadius: '4px'
            }}
          >
            <Paperclip size={17} />
          </button>

          {/* Chat Text Input */}
          <input
            type="text"
            placeholder="Type a message or paste a complaint..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            style={{ 
              fontSize: '0.84rem', 
              padding: '6px 4px', 
              flex: 1,
              border: 'none',
              outline: 'none',
              backgroundColor: 'transparent',
              color: '#0f172a'
            }}
          />

          {/* Up Arrow / Send Button */}
          <button
            type="submit"
            disabled={chatLoading || !chatInput.trim()}
            title="Send message"
            style={{ 
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: (!chatInput.trim() || chatLoading) ? '#e0e7ff' : '#4f46e5',
              color: (!chatInput.trim() || chatLoading) ? '#818cf8' : '#ffffff',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: (!chatInput.trim() || chatLoading) ? 'default' : 'pointer',
              flexShrink: 0,
              transition: 'all 0.15s ease'
            }}
          >
            <ArrowUp size={16} strokeWidth={2.5} />
          </button>
        </form>
      </div>
    </div>
  );
}
