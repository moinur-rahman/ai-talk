import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface User {
  id: string;
  name: string;
  displayName: string | null;
  workDescription: string | null;
  customInstructions: string | null;
  email: string;
  role: 'admin' | 'user';
}

export interface UpdateUserDto {
  name?: string;
  displayName?: string;
  workDescription?: string;
  customInstructions?: string;
}

export const userApi = createApi({
  reducerPath: 'userApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.NEXT_PUBLIC_BACKEND_URL}`,
    credentials: 'include',
  }),
  endpoints: (builder) => ({
    getMe: builder.query<User, void>({
      query: () => '/users/me',
    }),
    updateMe: builder.mutation<User, UpdateUserDto>({
      query: (body) => ({ url: '/users/me', method: 'PATCH', body }),
    }),
  }),
});

export const { useGetMeQuery, useUpdateMeMutation } = userApi;
