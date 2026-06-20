import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import { getToken } from './token';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://hey-podcast.onrender.com/api';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  ageRange: string | null;
  profession: string | null;
  /** True once the user has finished personalization onboarding. */
  onboarded: boolean;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
  /** True for a just-created account → route to topic onboarding. */
  isNew: boolean;
}

export interface ApiTopic {
  id: string;
  slug: string;
  label: string;
}

/** A topic plus whether the current user follows it. */
export interface FollowableTopic extends ApiTopic {
  followed: boolean;
}

/** Episode as returned by the server (backend shape, with its topic). */
export interface ApiEpisode {
  id: string;
  title: string;
  summary: string | null;
  audioUrl: string | null;
  transcript: { speaker: 'A' | 'B'; text: string; start?: number; end?: number }[] | null;
  hosts: { A: string; B: string } | null;
  durationSec: number | null;
  status: string;
  publishedAt: string | null;
  createdAt: string;
  topic: ApiTopic | null;
}

/** A recently-played episode (episode + the user's progress). */
export interface ApiContinueItem extends ApiEpisode {
  progressSec: number;
  completed: boolean;
}

/** A saved episode (episode + whether it's downloaded for offline). */
export interface ApiSavedItem extends ApiEpisode {
  downloaded: boolean;
}

export interface ApiSubscription {
  tier: 'free' | 'premium';
  status: string;
  renewsAt: string | null;
}

/** Lifetime listening totals for the profile card. */
export interface ApiStats {
  episodesPlayed: number;
  minutesListened: number;
}

/** Personalization options served by the app config. */
export interface AppConfig {
  ageRanges: string[];
  professions: { label: string; icon: string }[];
  topics: FollowableTopic[];
}

/** An item in the user's notification inbox. */
export interface ApiNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  episodeId: string | null;
  read: boolean;
  createdAt: string;
}

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (headers) => {
      const token = getToken();
      if (token) headers.set('authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Episodes', 'Topics', 'Me', 'Continue', 'Saved', 'Subscription', 'Notifications'],
  endpoints: (builder) => ({
    // ── Auth ──────────────────────────────────────────────────────────────
    register: builder.mutation<
      AuthResponse,
      { email: string; password: string; displayName?: string }
    >({
      query: (body) => ({ url: 'auth/register', method: 'POST', body }),
    }),

    login: builder.mutation<AuthResponse, { email: string; password: string }>({
      query: (body) => ({ url: 'auth/login', method: 'POST', body }),
    }),

    googleLogin: builder.mutation<AuthResponse, { idToken: string }>({
      query: (body) => ({ url: 'auth/google', method: 'POST', body }),
    }),

    getMe: builder.query<AuthUser, void>({
      query: () => 'auth/me',
      providesTags: ['Me'],
    }),

    updateMe: builder.mutation<
      AuthUser,
      {
        displayName?: string;
        ageRange?: string | null;
        profession?: string | null;
        onboarded?: boolean;
      }
    >({
      query: (body) => ({ url: 'auth/me', method: 'PATCH', body }),
      invalidatesTags: ['Me'],
    }),

    deleteAccount: builder.mutation<void, void>({
      query: () => ({ url: 'auth/me', method: 'DELETE' }),
    }),

    // ── Content ───────────────────────────────────────────────────────────
    getEpisodes: builder.query<ApiEpisode[], void>({
      query: () => 'episodes',
      providesTags: ['Episodes'],
    }),

    // Home hero card: only the newest episode owned by the user (never a
    // shared/global digest). One row, so home stays light as the feed grows.
    getDigestHero: builder.query<ApiEpisode | null, void>({
      query: () => 'episodes/digest-hero',
      providesTags: ['Episodes'],
    }),

    // Single episode — used to poll generation status until it's 'ready'.
    getEpisode: builder.query<ApiEpisode, string>({
      query: (id) => `episodes/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Episodes', id }],
    }),

    // Recently-played episodes (Home "Recent activity").
    getContinue: builder.query<ApiContinueItem[], void>({
      query: () => 'episodes/continue',
      providesTags: ['Continue'],
    }),

    // Lifetime listening totals for the Profile stats card.
    getStats: builder.query<ApiStats, void>({
      query: () => 'episodes/stats',
      providesTags: ['Continue'],
    }),

    // Record/advance playback progress for an episode.
    updateProgress: builder.mutation<
      unknown,
      { id: string; positionSec: number; completed?: boolean }
    >({
      query: ({ id, ...body }) => ({
        url: `episodes/${id}/progress`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Continue'],
    }),

    getTopics: builder.query<FollowableTopic[], void>({
      query: () => 'topics',
      providesTags: ['Topics'],
    }),

    // Only topics the user doesn't follow yet — for the Discover "Browse" grid.
    getBrowseTopics: builder.query<ApiTopic[], void>({
      query: () => 'topics/browse',
      providesTags: ['Topics'],
    }),

    // Global (shared) episodes for a topic — browsable samples before following.
    getTopicEpisodes: builder.query<ApiEpisode[], string>({
      query: (id) => `topics/${id}/episodes`,
      providesTags: ['Episodes'],
    }),

    // App config for the personalization screen (age ranges, professions, topics).
    getConfig: builder.query<AppConfig, void>({
      query: () => 'config',
      providesTags: ['Topics'],
    }),

    // Replace the user's followed topics with this exact set.
    setMyTopics: builder.mutation<{ topicIds: string[] }, { topicIds: string[] }>({
      query: (body) => ({ url: 'topics/follows', method: 'PUT', body }),
      invalidatesTags: ['Topics', 'Episodes', 'Continue'],
    }),

    generateEpisode: builder.mutation<ApiEpisode, { prompt: string }>({
      query: (body) => ({ url: 'episodes/generate', method: 'POST', body }),
      invalidatesTags: ['Episodes'],
    }),

    // Personalized daily digest from all the user's followed topics (free).
    // Used by onboarding and any "generate my digest now" action.
    generateDigest: builder.mutation<ApiEpisode, void>({
      query: () => ({ url: 'episodes/digest', method: 'POST' }),
      invalidatesTags: ['Episodes', 'Continue'],
    }),

    // ── Library (saved) ─────────────────────────────────────────────────────
    getSaved: builder.query<ApiSavedItem[], void>({
      query: () => 'episodes/saved',
      providesTags: ['Saved'],
    }),

    toggleSaved: builder.mutation<{ episodeId: string; saved: boolean }, { id: string; saved: boolean }>({
      query: ({ id, saved }) => ({ url: `episodes/${id}/saved`, method: 'PUT', body: { saved } }),
      invalidatesTags: ['Saved'],
    }),

    // ── Subscription ────────────────────────────────────────────────────────
    getSubscription: builder.query<ApiSubscription, void>({
      query: () => 'subscription',
      providesTags: ['Subscription'],
    }),

    subscribe: builder.mutation<ApiSubscription, { plan: 'monthly' | 'yearly' }>({
      query: (body) => ({ url: 'subscription', method: 'POST', body }),
      invalidatesTags: ['Subscription'],
    }),

    redeemPromo: builder.mutation<
      { tier: string; status: string; renewsAt: string | null; trialDays: number },
      { code: string }
    >({
      query: (body) => ({ url: 'promo/redeem', method: 'POST', body }),
      invalidatesTags: ['Subscription', 'Me'],
    }),

    // ── Notifications ───────────────────────────────────────────────────────
    getNotifications: builder.query<ApiNotification[], void>({
      query: () => 'notifications',
      providesTags: ['Notifications'],
    }),

    markNotificationsRead: builder.mutation<void, void>({
      query: () => ({ url: 'notifications/read', method: 'POST' }),
      invalidatesTags: ['Notifications'],
    }),

    // Device push-token registration (used by PushProvider).
    registerPushToken: builder.mutation<void, { token: string; platform?: string }>({
      query: (body) => ({ url: 'notifications/register', method: 'POST', body }),
    }),

    unregisterPushToken: builder.mutation<void, { token: string }>({
      query: (body) => ({ url: 'notifications/register', method: 'DELETE', body }),
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useGoogleLoginMutation,
  useGetMeQuery,
  useUpdateMeMutation,
  useDeleteAccountMutation,
  useGetEpisodesQuery,
  useGetDigestHeroQuery,
  useGetEpisodeQuery,
  useGetContinueQuery,
  useGetStatsQuery,
  useUpdateProgressMutation,
  useGetTopicsQuery,
  useGetBrowseTopicsQuery,
  useGetTopicEpisodesQuery,
  useGetConfigQuery,
  useSetMyTopicsMutation,
  useGenerateEpisodeMutation,
  useGenerateDigestMutation,
  useGetSavedQuery,
  useToggleSavedMutation,
  useGetSubscriptionQuery,
  useSubscribeMutation,
  useRedeemPromoMutation,
  useGetNotificationsQuery,
  useMarkNotificationsReadMutation,
  useRegisterPushTokenMutation,
  useUnregisterPushTokenMutation,
} = api;
