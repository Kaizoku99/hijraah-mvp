// Server Actions Index
// Export all server actions for easy importing

// Auth
export {
    getMe,
    getAuthenticatedUser,
    getAdminUser,
    logout,
} from './auth'

// Profile
export {
    getProfile,
    createProfile,
    updateProfile,
    updateLanguage,
} from './profile'

// Usage
export { getUsageStats } from './usage'

// Chat
export {
    listConversations,
    getConversationWithMessages,
    createNewConversation,
    sendMessage,
    deleteConversation,
} from './chat'

// Documents
export {
    generateDocumentChecklist,
    getChecklists,
    getChecklist,
    updateChecklistItems,
    deleteChecklist,
    uploadDocument,
    getDocuments,
    getDocumentsForChecklist,
    deleteDocument,
} from './documents'

// Subscription
export {
    getSubscriptionTiers,
    getStatus as getSubscriptionStatus,
    createCheckout,
    createPortal,
    getInvoices,
} from './subscription'

// CRS Calculator
export {
    calculateCrsScore,
    getCrsHistory,
    getLatestCrs,
} from './crs'

// SOP
export {
    generateSop,
    getSop,
    listSops,
    refineSop,
    analyzeSopQualityAction,
    deleteSop,
} from './sop'

// Guides
export {
    listGuides,
    getGuide,
    getCategories,
    searchGuidesAction,
} from './guides'
