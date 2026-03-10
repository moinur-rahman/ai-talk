import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
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
  }),
});

export const { useGetMeQuery } = userApi;
