export type AnalyticsEventType = 'page_view';

export type AnalyticsEvent = {
  id: string;
  type: AnalyticsEventType;
  path: string;
  source: string;
  device: 'desktop' | 'mobile' | 'tablet';
  visitorId: string;
  createdAt: string;
};
