// Google Analytics event tracking utility

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

type EventParams = {
  action: string;
  category: string;
  label?: string;
  value?: number;
};

export const trackEvent = ({ action, category, label, value }: EventParams) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Pre-defined events for consistency
export const analytics = {
  // Auth events
  signUp: () => trackEvent({ action: 'sign_up', category: 'auth' }),
  signIn: () => trackEvent({ action: 'sign_in', category: 'auth' }),
  signOut: () => trackEvent({ action: 'sign_out', category: 'auth' }),

  // Episode events
  logEpisode: (severity?: string) => 
    trackEvent({ action: 'log_episode', category: 'episodes', label: severity }),
  editEpisode: () => 
    trackEvent({ action: 'edit_episode', category: 'episodes' }),
  deleteEpisode: () => 
    trackEvent({ action: 'delete_episode', category: 'episodes' }),

  // Feature usage
  openChat: () => 
    trackEvent({ action: 'open_chat', category: 'features' }),
  sendChatMessage: () => 
    trackEvent({ action: 'send_chat_message', category: 'features' }),
  uploadDocument: () => 
    trackEvent({ action: 'upload_document', category: 'features' }),
  exportData: () => 
    trackEvent({ action: 'export_data', category: 'features' }),
  generateDoctorLetter: () => 
    trackEvent({ action: 'generate_doctor_letter', category: 'features' }),
  startEpisodeMode: () => 
    trackEvent({ action: 'start_episode_mode', category: 'features' }),

  // Engagement
  viewBlogPost: (postId: string) => 
    trackEvent({ action: 'view_blog_post', category: 'engagement', label: postId }),
  viewPricing: () => 
    trackEvent({ action: 'view_pricing', category: 'engagement' }),
  clickUpgrade: () => 
    trackEvent({ action: 'click_upgrade', category: 'conversion' }),
  startCheckout: () => 
    trackEvent({ action: 'begin_checkout', category: 'conversion' }),
  completeSubscription: () => 
    trackEvent({ action: 'purchase', category: 'conversion' }),

  // Subscription events
  startTrial: (tier: string) =>
    trackEvent({ action: 'start_trial', category: 'conversion', label: tier }),
  selectPlan: (plan: string) =>
    trackEvent({ action: 'select_plan', category: 'conversion', label: plan }),
  leadCapture: () =>
    trackEvent({ action: 'lead_capture', category: 'conversion' }),
  
  // Page views (for SPA)
  pageView: (path: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      // Use actual GA4 measurement ID from env or fallback
      const measurementId = (window as any).GA_MEASUREMENT_ID || 'G-XXXXXXXXXX';
      window.gtag('config', measurementId, {
        page_path: path,
      });
    }
  },
};
