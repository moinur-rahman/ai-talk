"use client";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { createSelector } from "@reduxjs/toolkit";
import { loadChatHistory } from "@/redux/slices/chatSlice";
import {
  setSelectedModel,
  setSelectedProvider,
} from "@/redux/slices/modelSlice";
import {
  useGetProvidersQuery,
  useGetModelsQuery,
} from "@/services/modelApi";
import { useGetChatHistoryQuery } from "@/services/chatApi";


const selectChatHistories = createSelector(
  [
    (state: RootState) => state.chat.chatHistories,
    (_: RootState, conversationId: string) => conversationId,
  ],
  (chatHistories, conversationId) => chatHistories[conversationId] || []
);

export const useChatData = (conversationId: string) => {
  const dispatch = useDispatch();
  const chatHistories = useSelector((state: RootState) =>
    selectChatHistories(state, conversationId)
  );
  const selectedProvider = useSelector(
    (state: RootState) => state.model.selectedProvider
  );
  const newConversationId = useSelector(
    (state: RootState) => state.chat.newConversationId
  );

  const { data: providers = [] } = useGetProvidersQuery();
  const { data: models = [] } = useGetModelsQuery(selectedProvider?.id ?? "", {
    skip: !selectedProvider,
  });
  const { data: chatHistoryData } = useGetChatHistoryQuery(conversationId, {
    skip:
      newConversationId === conversationId ||
      !conversationId ||
      chatHistories.length > 0,
  });

  const lastModelAndProvider = chatHistoryData?.lastModelAndProvider ?? null;

  useEffect(() => {
    if (chatHistoryData) {
      const { messages } = chatHistoryData;
      dispatch(
        loadChatHistory({
          conversationId: conversationId,
          messages: messages,
        })
      );
    }
  }, [chatHistoryData, dispatch, conversationId]);

  useEffect(() => {
    if (lastModelAndProvider && providers.length > 0) {
      const provider = providers.find(
        (provider) => provider.id === lastModelAndProvider.lastProviderId
      );

      if (provider) {
        dispatch(setSelectedProvider(provider));
      }
    }
  }, [lastModelAndProvider, providers, dispatch]);

  useEffect(() => {
    if (lastModelAndProvider && models.length > 0) {
      const model = models.find(
        (model) => model.id === lastModelAndProvider.lastModelId
      );
      if (model) {
        dispatch(setSelectedModel(model));
      }
    }
  }, [lastModelAndProvider, models, dispatch]);

  return { chatHistories };
};
