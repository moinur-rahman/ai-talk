import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { type RootState } from '@/redux/store';
import { createSelector } from '@reduxjs/toolkit';
import { loadChatHistory } from '@/redux/slices/chatSlice';
import { setSelectedModel } from '@/redux/slices/modelSlice';
import { useGetAllModelsQuery } from '@/services/modelApi';
import { useGetChatHistoryQuery } from '@/services/chatApi';

const selectChatHistories = createSelector(
  [
    (state: RootState) => state.chat.chatHistories,
    (_: RootState, conversationId: string) => conversationId,
  ],
  (chatHistories, conversationId) => chatHistories[conversationId] || [],
);

export const useChatData = (
  conversationId: string,
  switchToMessageId?: string,
) => {
  const dispatch = useDispatch();
  const chatHistories = useSelector((state: RootState) =>
    selectChatHistories(state, conversationId),
  );
  const newConversationId = useSelector(
    (state: RootState) => state.chat.newConversationId,
  );

  const { data: models = [] } = useGetAllModelsQuery();
  const { data: chatHistoryData } = useGetChatHistoryQuery(
    { conversationId, switchToMessageId },
    {
      skip:
        newConversationId === conversationId ||
        !conversationId ||
        (chatHistories.length > 0 && !switchToMessageId),
    },
  );

  useEffect(() => {
    if (chatHistoryData) {
      dispatch(
        loadChatHistory({
          conversationId,
          messages: chatHistoryData.messages,
        }),
      );
    }
  }, [chatHistoryData, dispatch, conversationId]);

  useEffect(() => {
    if (!chatHistoryData || models.length === 0) return;

    const lastModelId = [...chatHistoryData.messages]
      .reverse()
      .find((m) => m.modelId)?.modelId;

    if (!lastModelId) return;

    const model = models.find((m) => m.id === lastModelId);
    if (model) {
      dispatch(setSelectedModel(model));
    }
  }, [chatHistoryData, models, dispatch]);

  return { chatHistories };
};
