'use client';
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FiCheck,
  FiChevronRight,
  FiFolder,
  FiMic,
  FiMicOff,
  FiPaperclip,
  FiPlus,
  FiSend,
  FiType,
} from 'react-icons/fi';
import { FaStop } from 'react-icons/fa';
import { toast } from 'sonner';
import { useChat } from '@/contexts/ChatContext';
import { useUpdateConversationProjectMutation } from '@/services/chatApi';
import { useGetProjectsQuery } from '@/services/projectApi';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setResponseStyle } from '@/redux/slices/modelSlice';
import type { Project } from '@/types/chat';
import ProviderDropdown from '../ProviderDropdown';
import ModelDropdown from '../ModelDropdown';
import ReasoningToggle from '../ReasoningToggle';
import FilePreviews from './FilePreviews';
import useVoiceInput from './useVoiceInput';
import useFileUpload from './useFileUpload';

const RESPONSE_STYLES = [
  'Normal',
  'Learning',
  'Concise',
  'Explanatory',
  'Formal',
];

interface SendMessageProps {
  defaultRows?: number;
  currentProject?: { id: string; name: string } | null;
  disableProjectPicker?: boolean;
}

const SendMessage = ({
  defaultRows = 1,
  currentProject,
  disableProjectPicker = false,
}: SendMessageProps) => {
  const router = useRouter();
  const { streaming, error, sendMessage, stopStream, conversationId } =
    useChat();

  const dispatch = useAppDispatch();
  const responseStyle = useAppSelector((state) => state.model.responseStyle);

  const [prompt, setPrompt] = useState('');
  const [pendingProject, setPendingProject] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showStyleSubmenu, setShowStyleSubmenu] = useState(false);
  const [showProjectSubmenu, setShowProjectSubmenu] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const styleSubmenuTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const projectSubmenuTimer = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const [updateProject] = useUpdateConversationProjectMutation();
  const { data: projects = [], isLoading: isLoadingProjects } =
    useGetProjectsQuery();

  const activeProject = conversationId ? currentProject : pendingProject;

  const {
    filePreviews,
    uploadedAttachments,
    fileInputRef,
    handleFileClick,
    handleFileChange,
    handlePaste,
    removeFile,
    reset: resetFiles,
  } = useFileUpload();

  const handleTranscript = useCallback(
    (text: string) => setPrompt((prev) => (prev ? `${prev} ${text}` : text)),
    [],
  );
  const { isListening, toggleListening, stopIfListening } =
    useVoiceInput(handleTranscript);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
        setShowStyleSubmenu(false);
        setShowProjectSubmenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const textarea = textAreaRef.current;
    if (!textarea) return;
    const adjustHeight = () => {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    };
    textarea.addEventListener('input', adjustHeight);
    return () => textarea.removeEventListener('input', adjustHeight);
  }, []);

  const handleSelectProject = async (project: { id: string; name: string }) => {
    setIsMenuOpen(false);
    setShowProjectSubmenu(false);
    if (conversationId) {
      const result = await updateProject({ conversationId, projectId: project.id });
      if ('error' in result) {
        toast.error('Failed to add to project');
      } else {
        toast.success(`Added to ${project.name}`);
      }
    } else {
      setPendingProject(project);
      toast.success(`Added to ${project.name}`);
    }
  };

  const handleRemoveProject = async () => {
    if (conversationId) {
      const result = await updateProject({ conversationId, projectId: null });
      if ('error' in result) {
        toast.error('Failed to remove from project');
      } else {
        toast.success('Removed from project');
      }
    } else {
      setPendingProject(null);
      toast.success('Removed from project');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if ((conversationId && streaming[conversationId]) || !prompt.trim()) return;

    try {
      const effectiveProject = pendingProject ?? currentProject ?? undefined;
      const newConversationId = await sendMessage({
        prompt,
        attachments:
          uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
        project: effectiveProject,
      });

      setPrompt('');
      resetFiles();
      setPendingProject(null);

      if (newConversationId && !conversationId) {
        router.push(`/chat/${newConversationId}`);
      }
    } catch (err) {
      console.error('Error generating text:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  };

  return (
    <div className="w-full max-w-[52rem]">
      {(error?.global || (conversationId && error?.[conversationId])) && (
        <div className="text-red-400 text-xs mb-2 px-1">
          {error?.global || (conversationId && error?.[conversationId])}
        </div>
      )}

      <FilePreviews filePreviews={filePreviews} onRemove={removeFile} />

      <form
        onSubmit={handleSubmit}
        className="flex flex-col bg-surface-elevated border border-border rounded-2xl focus-within:border-accent/40 transition-all duration-200 px-2 pt-2 pb-1"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          multiple
        />

        <textarea
          ref={textAreaRef}
          className="w-full px-2 py-1.5 bg-transparent text-primary placeholder-muted resize-none outline-none overflow-y-auto text-sm leading-relaxed"
          placeholder="Message..."
          value={prompt}
          onChange={(e) => {
            stopIfListening();
            setPrompt(e.target.value);
          }}
          onKeyDown={(e) => {
            stopIfListening();
            handleKeyDown(e);
          }}
          onPaste={handlePaste}
          rows={defaultRows}
          style={{ maxHeight: '150px' }}
        />

        <div className="flex items-center gap-1 mt-1 pt-1 border-t border-border/50">
          {/* + button with menu */}
          <div className="relative flex-shrink-0" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsMenuOpen((v) => !v)}
              className="p-2 text-muted hover:text-accent hover:bg-accent/10 rounded-lg transition-all duration-150"
              aria-label="More options"
            >
              <FiPlus size={17} />
            </button>

            {isMenuOpen && (
              <div className="absolute bottom-full mb-2 left-0 bg-surface-elevated border border-border rounded-xl shadow-xl z-50 py-1 w-52 overflow-visible">
                <button
                  type="button"
                  onClick={() => {
                    handleFileClick();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2 text-sm text-body hover:bg-surface-overlay transition-colors"
                >
                  <FiPaperclip size={14} className="text-muted flex-shrink-0" />
                  Add files or photos
                </button>

                {!disableProjectPicker && (
                  <div
                    className="relative"
                    onMouseEnter={() => {
                      if (projectSubmenuTimer.current)
                        clearTimeout(projectSubmenuTimer.current);
                      setShowProjectSubmenu(true);
                    }}
                    onMouseLeave={() => {
                      projectSubmenuTimer.current = setTimeout(
                        () => setShowProjectSubmenu(false),
                        150,
                      );
                    }}
                  >
                    <button
                      type="button"
                      className="flex items-center gap-3 w-full px-3 py-2 text-sm text-body hover:bg-surface-overlay transition-colors"
                    >
                      <FiFolder
                        size={14}
                        className="text-muted flex-shrink-0"
                      />
                      <span className="flex-1 text-left">Add to project</span>
                      <FiChevronRight
                        size={13}
                        className="text-muted flex-shrink-0"
                      />
                    </button>

                    {showProjectSubmenu && (
                      <div className="absolute left-full top-0 ml-1 bg-surface-elevated border border-border rounded-xl shadow-xl py-1 w-56 z-50 max-h-60 overflow-y-auto">
                        {isLoadingProjects ? (
                          <p className="text-xs text-muted px-3 py-2">
                            Loading...
                          </p>
                        ) : projects.length === 0 ? (
                          <p className="text-xs text-muted px-3 py-2">
                            No projects found.
                          </p>
                        ) : (
                          projects.map((project: Project) => (
                            <button
                              key={project.id}
                              type="button"
                              onClick={() => handleSelectProject(project)}
                              className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-body hover:bg-surface-overlay transition-colors"
                            >
                              <FiCheck
                                size={13}
                                className={`flex-shrink-0 ${activeProject?.id === project.id ? 'text-accent' : 'opacity-0'}`}
                              />
                              <FiFolder
                                size={13}
                                className="text-muted flex-shrink-0"
                              />
                              <span className="truncate">{project.name}</span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div
                  className="relative"
                  onMouseEnter={() => {
                    if (styleSubmenuTimer.current)
                      clearTimeout(styleSubmenuTimer.current);
                    setShowStyleSubmenu(true);
                  }}
                  onMouseLeave={() => {
                    styleSubmenuTimer.current = setTimeout(
                      () => setShowStyleSubmenu(false),
                      150,
                    );
                  }}
                >
                  <button
                    type="button"
                    className="flex items-center gap-3 w-full px-3 py-2 text-sm text-body hover:bg-surface-overlay transition-colors"
                  >
                    <FiType size={14} className="text-muted flex-shrink-0" />
                    <span className="flex-1 text-left">Use style</span>
                    {responseStyle !== 'Normal' && (
                      <span className="text-xs text-accent mr-1">
                        {responseStyle}
                      </span>
                    )}
                    <FiChevronRight
                      size={13}
                      className="text-muted flex-shrink-0"
                    />
                  </button>

                  {showStyleSubmenu && (
                    <div className="absolute left-full top-0 ml-1 bg-surface-elevated border border-border rounded-xl shadow-xl py-1 w-44 z-50">
                      {RESPONSE_STYLES.map((style) => (
                        <button
                          key={style}
                          type="button"
                          onClick={() => {
                            dispatch(setResponseStyle(style));
                            setIsMenuOpen(false);
                            setShowStyleSubmenu(false);
                          }}
                          className="flex items-center gap-3 w-full px-3 py-2 text-sm text-body hover:bg-surface-overlay transition-colors"
                        >
                          <FiCheck
                            size={13}
                            className={`flex-shrink-0 ${responseStyle === style ? 'text-accent' : 'opacity-0'}`}
                          />
                          {style}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Active project badge */}
          {activeProject && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-accent/10 border border-accent/20 text-accent flex-shrink-0">
              <FiFolder size={12} />
              <span className="text-xs max-w-[72px] truncate">
                {activeProject.name}
              </span>
              {!disableProjectPicker && (
                <button
                  type="button"
                  onClick={handleRemoveProject}
                  className="text-xs leading-none hover:text-accent-hover ml-0.5"
                  aria-label="Remove project"
                >
                  ×
                </button>
              )}
            </div>
          )}

          {/* Active style badge */}
          {responseStyle !== 'Normal' && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-accent/10 border border-accent/20 text-accent flex-shrink-0">
              <FiType size={12} />
              <span className="text-xs">{responseStyle}</span>
              <button
                type="button"
                onClick={() => dispatch(setResponseStyle('Normal'))}
                className="text-xs leading-none hover:text-accent-hover ml-0.5"
                aria-label="Clear style"
              >
                ×
              </button>
            </div>
          )}

          <div className="flex-1" />

          <div className="w-[9rem] flex-shrink-0">
            <ProviderDropdown />
          </div>
          <div className="w-px h-4 bg-border flex-shrink-0" />
          <div className="w-[11rem] flex-shrink-0">
            <ModelDropdown />
          </div>

          <ReasoningToggle />

          <button
            type="button"
            onClick={toggleListening}
            aria-label={isListening ? 'Stop recording' : 'Start voice input'}
            className={`p-2 rounded-lg transition-all duration-150 flex-shrink-0 ${
              isListening
                ? 'text-red-400 hover:text-red-300 hover:bg-red-400/10 animate-pulse'
                : 'text-muted hover:text-accent hover:bg-accent/10'
            }`}
          >
            {isListening ? <FiMicOff size={17} /> : <FiMic size={17} />}
          </button>

          {conversationId && streaming[conversationId] ? (
            <button
              type="button"
              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-all duration-150 flex-shrink-0"
              onClick={stopStream}
              aria-label="Stop"
            >
              <FaStop size={15} />
            </button>
          ) : (
            <button
              type="submit"
              className="p-2 text-accent hover:text-accent-hover hover:bg-accent/10 rounded-lg transition-all duration-150 flex-shrink-0 disabled:text-muted disabled:hover:bg-transparent disabled:cursor-not-allowed"
              disabled={!prompt.trim() && uploadedAttachments.length === 0}
              aria-label="Send Message"
            >
              <FiSend size={17} />
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default SendMessage;
