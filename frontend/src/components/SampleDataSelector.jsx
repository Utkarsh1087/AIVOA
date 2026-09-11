import React from 'react';
import { useDispatch } from 'react-redux';
import { setInputText, setSourceType, analyzeComplaintText } from '../store/complaintSlice';
import { FileText, Mail, Sparkles } from 'lucide-react';

export default function SampleDataSelector({ onSelect }) {
  const dispatch = useDispatch();

  const presets = [
    {
      id: 'apollo_amoxicillin',
      title: 'Apollo Pharmacy',
      type: 'Chat / Voice Intake',
      subtitle: 'Amoxicillin 500mg discolored capsules',
      icon: Sparkles,
      color: '#2563eb',
      promptOnly: true,
      promptText: 'Apollo Pharmacy reported discolored capsules in amoxicillin capsules 500 mg',
      content: `Apollo Pharmacy reported discolored capsules in amoxicillin capsules 500 mg`,
      source: 'AI Assistant Chat'
    },
    {
      id: 'metformin_api',
      title: 'Metformin HCl API',
      type: 'QC Incident PDF',
      subtitle: 'Grade IP/BP, Batch MFH260712A seal breach',
      icon: FileText,
      color: '#059669',
      content: `CUSTOMER COMPLAINT INCIDENT REPORT
Customer: Medico Pharma Labs Ltd.
Product Name: Metformin hydrochloride API
Grade / Strength: IP/BP
Batch / Lot Number: MFH260712A
Quantity Affected: 100 kg (4 HDPE drums)
Manufacturing Date: 2026-02-10
Expiry Date: 2029-02-09
Complaint Classification: Packaging Defect / Seal Integrity
Intake Source: Field Quality Incident Report

Detailed Incident Description:
During raw material incoming quality control inspection of Metformin hydrochloride API, lot MFH260712A, our receiving warehouse noted that 2 out of 4 HDPE drums had broken tamper-evident seals and breached inner polyethylene liners with potential particulate risk.`,
      source: 'PDF Attachment'
    },
    {
      id: 'text_paracetamol',
      title: 'Paracetamol 500mg',
      type: 'Customer Email',
      subtitle: 'Crushed blister packaging & broken tablets',
      icon: Mail,
      color: '#7c3aed',
      content: `CUSTOMER COMPLAINT REPORT
Customer: City Hospital & Care Center
Product: Paracetamol Tablets
Strength: 500mg Tablets
Batch Number: PCM202604
Mfg Date: 2026-01-15
Expiry Date: 2028-01-14
Quantity Affected: 20 units
Complaint Date: 2026-09-08
Source: Customer Email

Description:
Upon unboxing shipment from batch PCM202604, hospital staff noticed that 15 blister strips contain crushed foil and broken tablets with white powder residue inside secondary cartons.`,
      source: 'Customer Email'
    }
  ];

  const handleSelectPreset = (preset) => {
    dispatch(setInputText(preset.content));
    dispatch(setSourceType(preset.source));
    dispatch(analyzeComplaintText({ text: preset.content, source: preset.source }));
    if (onSelect) onSelect();
  };

  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '0.72rem',
        fontWeight: 700,
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: '6px'
      }}>
        <Sparkles size={12} color="#d97706" />
        Try with a Sample Example:
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '6px'
      }}>
        {presets.map((p) => {
          const Icon = p.icon;
          return (
            <button
              key={p.id}
              onClick={() => handleSelectPreset(p)}
              className="btn-outline"
              style={{
                padding: '6px 8px',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '2px',
                borderRadius: '6px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', width: '100%' }}>
                <Icon size={13} color={p.color} />
                <span style={{ fontWeight: 600, fontSize: '0.76rem', color: '#0f172a' }}>
                  {p.title}
                </span>
              </div>
              <span style={{ fontSize: '0.68rem', color: '#64748b', lineHeight: '1.2', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                {p.subtitle}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
