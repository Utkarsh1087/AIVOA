import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../services/api';

// Async Thunks
export const analyzeComplaintText = createAsyncThunk(
  'complaints/analyzeText',
  async ({ text, source }, { rejectWithValue, dispatch }) => {
    try {
      dispatch(setExtractionProgress({ active: true, percent: 20, statusText: 'Reading text and extracting key details...' }));
      
      const timer = setTimeout(() => {
        dispatch(setExtractionProgress({ active: true, percent: 70, statusText: 'Evaluating issue severity and checking past complaints...' }));
      }, 700);

      const res = await api.analyzeText(text, source);
      clearTimeout(timer);
      dispatch(setExtractionProgress({ active: true, percent: 100, statusText: 'Information extracted and form filled out!' }));
      return res;
    } catch (err) {
      dispatch(setExtractionProgress({ active: false, percent: 0, statusText: '' }));
      return rejectWithValue(err.message);
    }
  }
);

export const uploadComplaintFile = createAsyncThunk(
  'complaints/uploadFile',
  async ({ file, sourceType }, { rejectWithValue, dispatch }) => {
    try {
      dispatch(setExtractionProgress({ active: true, percent: 20, statusText: `Reading file ${file.name}...` }));
      
      const timer = setTimeout(() => {
        dispatch(setExtractionProgress({ active: true, percent: 70, statusText: 'Extracting details and checking previous records...' }));
      }, 800);

      const res = await api.uploadFile(file, sourceType);
      clearTimeout(timer);
      dispatch(setExtractionProgress({ active: true, percent: 100, statusText: 'Document analyzed and form filled out!' }));
      return res;
    } catch (err) {
      dispatch(setExtractionProgress({ active: false, percent: 0, statusText: '' }));
      return rejectWithValue(err.message);
    }
  }
);

export const sendAssistantChat = createAsyncThunk(
  'complaints/sendAssistantChat',
  async ({ message, context }, { rejectWithValue }) => {
    try {
      return await api.assistantChat(message, context);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const saveComplaintToDb = createAsyncThunk(
  'complaints/saveToDb',
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const saved = await api.saveComplaint(payload);
      dispatch(fetchComplaintsHistory({}));
      dispatch(fetchDashboardStats());
      return saved;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchComplaintsHistory = createAsyncThunk(
  'complaints/fetchHistory',
  async (params, { rejectWithValue }) => {
    try {
      return await api.getComplaints(params);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchDashboardStats = createAsyncThunk(
  'complaints/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      return await api.getDashboardStats();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const initialForm = {
  customer_name: '',
  source: '',
  product_name: '',
  product_strength: '',
  batch_number: '',
  mfg_date: '',
  expiry_date: '',
  quantity_affected: '',
  originating_site_block: 'Manufacturing',
  impacted_npm: '',
  structured_defect_summary: '',
  complaint_type: '',
  complaint_date: '',
  complaint_description: '',
  status: 'Open',
  severity: '',
  priority: '',
  risk_level: 'Medium',
  risk_reason: '',
  potential_impact: ''
};

const initialState = {
  activeView: 'input', // 'input', 'logs', 'dashboard'
  inputText: '',
  sourceType: 'Pharmacy',
  
  analyzing: false,
  saving: false,
  loadingLogs: false,
  chatLoading: false,

  aiResponse: null, // Full response from LangGraph API
  
  // Pre-populated editable form state
  editableForm: { ...initialForm },

  // Progress Bar for extraction
  extractionProgress: {
    active: false,
    percent: 0,
    statusText: 'Analyzing document content and extracting key details... Please wait, this may take a few moments.'
  },

  // Interactive AI Assistant Chat thread
  chatMessages: [
    {
      id: 1,
      sender: 'ai',
      text: 'Ready to process new complaints. You can paste the raw email from the customer, or upload a PDF of the complaint report. I will extract the data and run the initial risk assessment.'
    }
  ],

  isSidebarCollapsed: false,

  complaintsList: [],
  dashboardStats: null,
  
  selectedComplaintDetail: null,
  isDetailModalOpen: false,

  error: null,
  successMessage: null
};

const complaintSlice = createSlice({
  name: 'complaints',
  initialState,
  reducers: {
    setActiveView: (state, action) => {
      state.activeView = action.payload;
    },
    setInputText: (state, action) => {
      state.inputText = action.payload;
    },
    setSourceType: (state, action) => {
      state.sourceType = action.payload;
    },
    updateEditableField: (state, action) => {
      const { field, value } = action.payload;
      state.editableForm[field] = value;
    },
    resetFormAndAI: (state) => {
      state.aiResponse = null;
      state.editableForm = { ...initialForm };
      state.inputText = '';
      state.extractionProgress = {
        active: false,
        percent: 0,
        statusText: 'Analyzing document content and extracting key details... Please wait, this may take a few moments.'
      };
      state.chatMessages = [
        {
          id: 1,
          sender: 'ai',
          text: 'Upload a complaint document or paste text above. I will automatically extract the details and populate the form for you.'
        }
      ];
      state.error = null;
      state.successMessage = null;
    },
    setExtractionProgress: (state, action) => {
      state.extractionProgress = {
        ...state.extractionProgress,
        ...action.payload
      };
    },
    addChatMessage: (state, action) => {
      state.chatMessages.push({
        id: Date.now(),
        ...action.payload
      });
    },
    setSelectedComplaintDetail: (state, action) => {
      state.selectedComplaintDetail = action.payload;
      state.isDetailModalOpen = true;
    },
    closeDetailModal: (state) => {
      state.isDetailModalOpen = false;
      state.selectedComplaintDetail = null;
    },
    toggleSidebar: (state) => {
      state.isSidebarCollapsed = !state.isSidebarCollapsed;
    },
    setSidebarCollapsed: (state, action) => {
      state.isSidebarCollapsed = action.payload;
    },
    clearMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },
    setError: (state, action) => {
      state.error = action.payload;
    }
  },
  extraReducers: (builder) => {
    // Analyze Text
    builder
      .addCase(analyzeComplaintText.pending, (state) => {
        state.analyzing = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(analyzeComplaintText.fulfilled, (state, action) => {
        state.analyzing = false;
        
        if (action.payload.is_relevant === false) {
          state.aiResponse = null;
          state.editableForm = { ...initialForm };
          const reason = action.payload.relevance_explanation || 'The provided content is not recognized as a pharmaceutical product complaint.';
          state.error = reason;
          state.chatMessages.push({
            id: Date.now(),
            sender: 'ai',
            text: `⚠️ ${reason} Please paste or upload a document describing a product quality defect, batch issue, or customer complaint.`
          });
          return;
        }

        state.aiResponse = action.payload;
        
        const c = action.payload.complaint || {};
        const r = action.payload.risk_assessment || {};

        state.editableForm = {
          customer_name: c.customer_name || '',
          source: c.source || state.sourceType || 'Pharmacy',
          product_name: c.product_name || '',
          product_strength: c.product_strength || '',
          batch_number: c.batch_number || '',
          mfg_date: c.mfg_date || '',
          expiry_date: c.expiry_date || '',
          quantity_affected: c.quantity_affected || '',
          originating_site_block: c.originating_site_block || 'Manufacturing',
          impacted_npm: c.impacted_npm || '',
          structured_defect_summary: c.structured_defect_summary || (action.payload.summary || ''),
          complaint_type: c.complaint_type || 'Packaging Defect',
          complaint_date: c.complaint_date || new Date().toISOString().split('T')[0],
          complaint_description: c.complaint_description || state.inputText,
          status: 'Open',
          severity: r.severity || c.severity || 'Major',
          priority: r.priority || c.priority || 'High',
          risk_level: r.risk_level || 'Medium',
          risk_reason: r.reason || '',
          potential_impact: r.potential_impact || ''
        };

        state.chatMessages.push({
          id: Date.now(),
          sender: 'ai',
          text: `Complaint parsed successfully. I've extracted the product details, mapped the batch information, and generated an initial risk assessment for the defect.`
        });

        state.successMessage = 'Complaint details extracted & form filled successfully!';
      })
      .addCase(analyzeComplaintText.rejected, (state, action) => {
        state.analyzing = false;
        state.error = action.payload || 'Failed to analyze complaint text';
      });

    // Upload File
    builder
      .addCase(uploadComplaintFile.pending, (state) => {
        state.analyzing = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(uploadComplaintFile.fulfilled, (state, action) => {
        state.analyzing = false;
        
        if (action.payload.is_relevant === false) {
          state.aiResponse = null;
          state.editableForm = { ...initialForm };
          const reason = action.payload.relevance_explanation || 'The uploaded file is not recognized as a pharmaceutical product complaint or defect report.';
          state.error = reason;
          state.chatMessages.push({
            id: Date.now(),
            sender: 'ai',
            text: `⚠️ ${reason} Please upload a document with pharmaceutical customer complaint details.`
          });
          return;
        }

        state.aiResponse = action.payload;
        
        const c = action.payload.complaint || {};
        const r = action.payload.risk_assessment || {};

        state.editableForm = {
          customer_name: c.customer_name || '',
          source: c.source || 'Uploaded Document',
          product_name: c.product_name || '',
          product_strength: c.product_strength || '',
          batch_number: c.batch_number || '',
          mfg_date: c.mfg_date || '',
          expiry_date: c.expiry_date || '',
          quantity_affected: c.quantity_affected || '',
          originating_site_block: c.originating_site_block || 'Manufacturing',
          impacted_npm: c.impacted_npm || '',
          structured_defect_summary: c.structured_defect_summary || (action.payload.summary || ''),
          complaint_type: c.complaint_type || 'File Intake',
          complaint_date: c.complaint_date || new Date().toISOString().split('T')[0],
          complaint_description: c.complaint_description || '',
          status: 'Open',
          severity: r.severity || c.severity || 'Major',
          priority: r.priority || c.priority || 'High',
          risk_level: r.risk_level || 'Medium',
          risk_reason: r.reason || '',
          potential_impact: r.potential_impact || ''
        };

        state.chatMessages.push({
          id: Date.now(),
          sender: 'ai',
          text: `Complaint parsed successfully. I've extracted the product details, mapped the batch information, and generated an initial risk assessment for the defect.`
        });

        state.successMessage = 'Document analyzed & form filled successfully!';
      })
      .addCase(uploadComplaintFile.rejected, (state, action) => {
        state.analyzing = false;
        state.error = action.payload || 'Failed to upload and analyze document';
      });

    // Send Assistant Chat
    builder
      .addCase(sendAssistantChat.pending, (state) => {
        state.chatLoading = true;
      })
      .addCase(sendAssistantChat.fulfilled, (state, action) => {
        state.chatLoading = false;
        const res = action.payload;

        // Push AI response to chat thread
        state.chatMessages.push({
          id: Date.now(),
          sender: 'ai',
          text: res.reply
        });

        // If an AI Tool (log_complaint or edit_complaint) modified the complaint form
        if (res.updated_form) {
          state.editableForm = {
            ...state.editableForm,
            ...res.updated_form
          };
        }

        // If AI risk assessment / workflow data is returned
        if (res.ai_response) {
          state.aiResponse = res.ai_response;
          if (res.ai_response.risk_assessment) {
            state.editableForm.risk_level = res.ai_response.risk_assessment.risk_level || state.editableForm.risk_level;
            state.editableForm.severity = res.ai_response.risk_assessment.severity || state.editableForm.severity;
            state.editableForm.priority = res.ai_response.risk_assessment.priority || state.editableForm.priority;
            state.editableForm.risk_reason = res.ai_response.risk_assessment.reason || state.editableForm.risk_reason;
            state.editableForm.potential_impact = res.ai_response.risk_assessment.potential_impact || state.editableForm.potential_impact;
          }
        }
      })
      .addCase(sendAssistantChat.rejected, (state, action) => {
        state.chatLoading = false;
        state.chatMessages.push({
          id: Date.now(),
          sender: 'ai',
          text: 'Sorry, I encountered an issue processing your request. Please try again.'
        });
      });

    // Save to DB
    builder
      .addCase(saveComplaintToDb.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(saveComplaintToDb.fulfilled, (state, action) => {
        state.saving = false;
        state.successMessage = `Complaint #${action.payload.id} successfully saved to QMS Database!`;
        state.aiResponse = null;
        state.editableForm = { ...initialForm };
        state.inputText = '';
        state.activeView = 'logs';
      })
      .addCase(saveComplaintToDb.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || 'Failed to save complaint to database';
      });

    // Fetch Logs
    builder
      .addCase(fetchComplaintsHistory.pending, (state) => {
        state.loadingLogs = true;
      })
      .addCase(fetchComplaintsHistory.fulfilled, (state, action) => {
        state.loadingLogs = false;
        state.complaintsList = action.payload;
      })
      .addCase(fetchComplaintsHistory.rejected, (state, action) => {
        state.loadingLogs = false;
        state.error = action.payload || 'Failed to load complaint logs';
      });

    // Fetch Dashboard Stats
    builder
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.dashboardStats = action.payload;
      });
  }
});

export const {
  setActiveView,
  setInputText,
  setSourceType,
  updateEditableField,
  resetFormAndAI,
  setExtractionProgress,
  addChatMessage,
  setSelectedComplaintDetail,
  closeDetailModal,
  toggleSidebar,
  setSidebarCollapsed,
  clearMessages,
  setError
} = complaintSlice.actions;

export default complaintSlice.reducer;
