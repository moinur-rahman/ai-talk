import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  Project,
  CreateProjectPayload,
  UpdateProjectPayload,
} from '@/types/chat';

interface ProjectResponse {
  data: Project;
  message: string;
}

interface ProjectsResponse {
  data: Project[];
  message: string;
}

export const projectApi = createApi({
  reducerPath: 'projectApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/projects`,
    credentials: 'include',
  }),
  tagTypes: ['Projects'],
  endpoints: (builder) => ({
    getProjects: builder.query<
      Project[],
      { search?: string; sort?: 'recent' | 'edited' | 'created' } | void
    >({
      query: (params) => ({
        url: '',
        params: params
          ? { search: params.search || undefined, sort: params.sort }
          : undefined,
      }),
      transformResponse: (response: ProjectsResponse) => response.data,
      providesTags: ['Projects'],
    }),
    getProject: builder.query<Project, string>({
      query: (id) => `/${id}`,
      transformResponse: (response: ProjectResponse) => response.data,
      providesTags: (_result, _error, id) => [{ type: 'Projects', id }],
    }),
    createProject: builder.mutation<Project, CreateProjectPayload>({
      query: (body) => ({ url: '', method: 'POST', body }),
      transformResponse: (response: ProjectResponse) => response.data,
      invalidatesTags: ['Projects'],
    }),
    updateProject: builder.mutation<
      Project,
      { projectId: string } & UpdateProjectPayload
    >({
      query: ({ projectId, ...body }) => ({
        url: `/${projectId}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (response: ProjectResponse) => response.data,
      invalidatesTags: ['Projects'],
    }),
    deleteProject: builder.mutation<void, string>({
      query: (id) => ({ url: `/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Projects'],
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useGetProjectQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
} = projectApi;
