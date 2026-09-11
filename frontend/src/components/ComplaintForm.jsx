import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateEditableField, saveComplaintToDb, resetFormAndAI, setError } from '../store/complaintSlice';
import { 
  RotateCcw, 
  Bookmark, 
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function ComplaintForm() {
  const dispatch = useDispatch();
  const { editableForm, aiResponse, saving, error, successMessage } = useSelector((state) => state.complaints);

  const completeness = aiResponse ? aiResponse.completeness : null;
  const duplicateCheck = aiResponse ? aiResponse.duplicate_check : null;

  const isFormFilled = Boolean(
    (editableForm.product_name && editableForm.product_name.trim()) ||
    (editableForm.batch_number && editableForm.batch_number.trim()) ||
    (editableForm.customer_name && editableForm.customer_name.trim()) ||
    (editableForm.complaint_description && editableForm.complaint_description.trim()) ||
    (editableForm.structured_defect_summary && editableForm.structured_defect_summary.trim())
  );

  const handleChange = (field, val) => {
    dispatch(updateEditableField({ field, value: val }));
  };

  const handleReset = () => {
    dispatch(resetFormAndAI());
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isFormFilled) {
      dispatch(setError('Cannot submit an empty complaint. Please provide at least a Product Name, Batch Number, Customer Name, or Complaint Description.'));
      return;
    }

    const payload = {
      customer_name: editableForm.customer_name,
      product_name: editableForm.product_name,
      product_strength: editableForm.product_strength,
      batch_number: editableForm.batch_number,
      mfg_date: editableForm.mfg_date,
      expiry_date: editableForm.expiry_date,
      quantity_affected: editableForm.quantity_affected || '0',
      source: editableForm.source || 'Pharmacy',
      
      originating_site_block: editableForm.originating_site_block || 'Manufacturing',
      impacted_npm: editableForm.impacted_npm || '',
      structured_defect_summary: editableForm.structured_defect_summary || '',

      complaint_type: editableForm.complaint_type || 'Defect Analysis',
      complaint_description: editableForm.complaint_description || editableForm.structured_defect_summary || 'Customer complaint registered.',
      complaint_date: editableForm.complaint_date || new Date().toISOString().split('T')[0],
      status: editableForm.status || 'Open',

      risk_level: editableForm.risk_level || 'Medium',
      severity: editableForm.severity || 'Major',
      priority: editableForm.priority || 'Medium',
      risk_reason: editableForm.risk_reason || '',
      potential_impact: editableForm.potential_impact || '',

      completeness_confidence: completeness ? completeness.confidence : 1.0,
      missing_fields: completeness ? completeness.missing_fields : [],
      recommendations: aiResponse ? aiResponse.recommendations : [],
      capa_recommendations: aiResponse ? aiResponse.capa_recommendations : [],
      root_cause_suggestions: aiResponse ? aiResponse.root_cause_suggestions : [],
      ai_summary: aiResponse ? aiResponse.summary : '',

      is_duplicate_suspected: duplicateCheck ? duplicateCheck.is_duplicate_suspected : false,
      similar_complaint_ids: duplicateCheck ? duplicateCheck.similar_complaint_ids : [],
      duplicate_explanation: duplicateCheck ? duplicateCheck.explanation : ''
    };

    dispatch(saveComplaintToDb(payload));
  };

  return (
    <div className="qms-card" style={{ padding: '24px' }}>
      {/* Card Header matching reference */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: '22px',
        paddingBottom: '14px',
        borderBottom: '1px solid #f1f5f9'
      }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em', margin: 0 }}>
            Log Customer Complaint
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '3px', margin: '3px 0 0 0' }}>
            API & FDF Quality Assurance Module
          </p>
        </div>

        <div>
          {isFormFilled ? (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              color: '#16a34a',
              padding: '4px 12px',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 600
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#16a34a' }} />
              Ready to Commit
            </div>
          ) : (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#fef3c7',
              border: '1px solid #fde68a',
              color: '#b45309',
              padding: '4px 12px',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 600
            }}>
              Pending Triage
            </div>
          )}
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div style={{
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          color: '#166534',
          borderRadius: '6px',
          padding: '10px 14px',
          fontSize: '0.84rem',
          marginBottom: '18px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          borderRadius: '6px',
          padding: '10px 14px',
          fontSize: '0.84rem',
          marginBottom: '18px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Section 1: ORIGIN & CUSTOMER DETAILS */}
        <div style={{ marginBottom: '22px' }}>
          <div className="form-section-title">
            1. ORIGIN & CUSTOMER DETAILS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label className="qms-label">Complaint Source</label>
              <input
                type="text"
                className="qms-input"
                placeholder="Awaiting AI extraction..."
                value={editableForm.source || ''}
                onChange={(e) => handleChange('source', e.target.value)}
              />
            </div>
            <div>
              <label className="qms-label">Customer Name</label>
              <input
                type="text"
                className="qms-input"
                placeholder="Awaiting AI extraction..."
                value={editableForm.customer_name || ''}
                onChange={(e) => handleChange('customer_name', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Section 2: PRODUCT & BATCH IDENTIFICATION */}
        <div style={{ marginBottom: '22px' }}>
          <div className="form-section-title">
            2. PRODUCT & BATCH IDENTIFICATION
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '14px' }}>
            <div>
              <label className="qms-label">Product Name (API/FDF)</label>
              <input
                type="text"
                className="qms-input"
                placeholder="Awaiting AI extraction..."
                value={editableForm.product_name || ''}
                onChange={(e) => handleChange('product_name', e.target.value)}
              />
            </div>
            <div>
              <label className="qms-label">Product Strength</label>
              <input
                type="text"
                className="qms-input"
                placeholder="Awaiting AI extraction..."
                value={editableForm.product_strength || ''}
                onChange={(e) => handleChange('product_strength', e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '14px' }}>
            <div>
              <label className="qms-label">Batch / Lot Number</label>
              <input
                type="text"
                className="qms-input"
                placeholder="Awaiting AI extraction..."
                value={editableForm.batch_number || ''}
                onChange={(e) => handleChange('batch_number', e.target.value)}
              />
            </div>
            <div>
              <label className="qms-label">Affected Quantity</label>
              <input
                type="text"
                className="qms-input"
                placeholder="Awaiting AI extraction..."
                value={editableForm.quantity_affected || ''}
                onChange={(e) => handleChange('quantity_affected', e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label className="qms-label">Manufacturing Date</label>
              <input
                type="text"
                className="qms-input"
                placeholder="Awaiting AI extraction..."
                value={editableForm.mfg_date || ''}
                onChange={(e) => handleChange('mfg_date', e.target.value)}
              />
            </div>
            <div>
              <label className="qms-label">Expiry Date</label>
              <input
                type="text"
                className="qms-input"
                placeholder="Awaiting AI extraction..."
                value={editableForm.expiry_date || ''}
                onChange={(e) => handleChange('expiry_date', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Section 3: FACILITY & MATERIAL IMPACT */}
        <div style={{ marginBottom: '22px' }}>
          <div className="form-section-title">
            3. FACILITY & MATERIAL IMPACT
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label className="qms-label">Originating Site Block</label>
              <select
                className="qms-select"
                value={editableForm.originating_site_block || ''}
                onChange={(e) => handleChange('originating_site_block', e.target.value)}
              >
                <option value="">Awaiting AI classification...</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Packaging Block A">Packaging Block A</option>
                <option value="Formulation Unit 1">Formulation Unit 1</option>
                <option value="Quality Control Lab">Quality Control Lab</option>
                <option value="Warehouse & Storage">Warehouse & Storage</option>
                <option value="API Synthesis Block">API Synthesis Block</option>
              </select>
            </div>
            <div>
              <label className="qms-label">Impacted Non-Product Materials (NPM)</label>
              <input
                type="text"
                className="qms-input"
                placeholder="e.g., Primary packaging..."
                value={editableForm.impacted_npm || ''}
                onChange={(e) => handleChange('impacted_npm', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Section 4: DEFECT ANALYSIS */}
        <div style={{ marginBottom: '22px' }}>
          <div className="form-section-title">
            4. DEFECT ANALYSIS
          </div>
          <div>
            <label className="qms-label">Structured Defect Summary</label>
            <textarea
              className="qms-textarea"
              rows={3}
              placeholder="AI will synthesize the complaint into a formal QMS description..."
              value={editableForm.structured_defect_summary || editableForm.complaint_description || ''}
              onChange={(e) => {
                handleChange('structured_defect_summary', e.target.value);
                handleChange('complaint_description', e.target.value);
              }}
              style={{ resize: 'vertical' }}
            />
          </div>
        </div>

        {/* Section 5: PRIORITY & SEVERITY */}
        <div style={{ marginBottom: '26px' }}>
          <div className="form-section-title">
            5. PRIORITY & SEVERITY
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label className="qms-label">Severity Level</label>
              <select
                className="qms-select"
                value={editableForm.severity || ''}
                onChange={(e) => handleChange('severity', e.target.value)}
              >
                <option value="">Select severity...</option>
                <option value="Critical">Critical (Severe quality or safety defect)</option>
                <option value="Major">Major (Defect affecting product usage)</option>
                <option value="Minor">Minor (Cosmetic or minor packaging issue)</option>
              </select>
            </div>
            <div>
              <label className="qms-label">Priority</label>
              <select
                className="qms-select"
                value={editableForm.priority || ''}
                onChange={(e) => handleChange('priority', e.target.value)}
              >
                <option value="">Select priority...</option>
                <option value="Urgent">Urgent</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '16px',
          borderTop: '1px solid #f1f5f9'
        }}>
          <button
            type="button"
            className="btn-outline"
            onClick={handleReset}
          >
            <RotateCcw size={15} />
            Reset Form
          </button>

          <button
            type="submit"
            className="btn-primary"
            disabled={saving || !isFormFilled}
            style={{
              opacity: (!isFormFilled || saving) ? 0.6 : 1,
              cursor: (!isFormFilled || saving) ? 'not-allowed' : 'pointer'
            }}
            title={!isFormFilled ? "Please fill in complaint details before saving" : "Save Complaint to QMS Database"}
          >
            {saving ? (
              <>
                <Loader2 size={16} className="pulsing" />
                Saving...
              </>
            ) : (
              <>
                <Bookmark size={15} />
                Save Complaint
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
