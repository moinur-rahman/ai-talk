import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface UsageSummary {
  messageCount: number;
  inputTokens: number;
  outputTokens: number;
  reasoningTokens: number;
  totalTokens: number;
  totalCost: number;
}

export interface UsageByModel {
  modelName: string;
  providerName: string;
  messageCount: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  totalCost: number;
  percentOfTotalCost: number;
}

export interface DailyUsage {
  date: string;
  messageCount: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  totalCost: number;
}

export interface ModelPricing {
  id: string;
  modelId: string;
  modelName: string;
  providerName: string;
  inputTokenPrice: number;
  outputTokenPrice: number;
  reasoningTokenPrice: number | null;
  updatedAt: string;
}

export interface UpdatePricingPayload {
  modelId: string;
  inputTokenPrice: number;
  outputTokenPrice: number;
  reasoningTokenPrice?: number;
}

interface DateRangeParams {
  from?: string;
  to?: string;
}

export const usageApi = createApi({
  reducerPath: 'usageApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.NEXT_PUBLIC_BACKEND_URL}/usage`,
    credentials: 'include',
  }),
  tagTypes: ['UsageDashboard', 'ModelPricing'],
  endpoints: (builder) => ({
    getDashboardSummary: builder.query<UsageSummary, DateRangeParams>({
      query: (params) => ({ url: '/dashboard', params }),
      transformResponse: (res: { data: UsageSummary }) => res.data,
      providesTags: ['UsageDashboard'],
    }),
    getUsageByModel: builder.query<UsageByModel[], DateRangeParams>({
      query: (params) => ({ url: '/by-model', params }),
      transformResponse: (res: { data: UsageByModel[] }) => res.data,
      providesTags: ['UsageDashboard'],
    }),
    getDailyUsage: builder.query<DailyUsage[], DateRangeParams>({
      query: (params) => ({ url: '/daily', params }),
      transformResponse: (res: { data: DailyUsage[] }) => res.data,
      providesTags: ['UsageDashboard'],
    }),
    getAllModelPricing: builder.query<ModelPricing[], void>({
      query: () => '/pricing',
      transformResponse: (res: { data: ModelPricing[] }) => res.data,
      providesTags: ['ModelPricing'],
    }),
    upsertModelPricing: builder.mutation<void, UpdatePricingPayload>({
      query: ({ modelId, ...body }) => ({
        url: `/pricing/${modelId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['ModelPricing', 'UsageDashboard'],
    }),
  }),
});

export const {
  useGetDashboardSummaryQuery,
  useGetUsageByModelQuery,
  useGetDailyUsageQuery,
  useGetAllModelPricingQuery,
  useUpsertModelPricingMutation,
} = usageApi;
