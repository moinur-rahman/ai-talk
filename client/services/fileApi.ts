import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { FileMetadata } from "@/types/chat";

export const fileApi = createApi({
  reducerPath: "fileApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.NEXT_PUBLIC_BACKEND_URL}/files`,
    credentials: "include",
  }),
  endpoints: (builder) => ({
    uploadFile: builder.mutation<
      {
        data: FileMetadata;
        messageCode: string;
      },
      FormData
    >({
      query: (formData) => ({
        url: "/upload",
        method: "POST",
        body: formData,
      }),
    }),
  }),
});

export const { useUploadFileMutation } = fileApi;
