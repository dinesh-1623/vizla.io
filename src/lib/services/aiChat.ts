import { supabase } from '@/lib/supabase/browser';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface DataCard {
  type: 'metric' | 'vehicle' | 'driver' | 'list' | 'chart';
  title: string;
  data: Record<string, any>;
  actionUrl?: string;
}

export interface QuickAction {
  label: string;
  action: string;
  variant?: 'default' | 'outline' | 'secondary';
}

export interface ChatRequest {
  messages: ChatMessage[];
  userId: string;
  context?: {
    currentPage?: string;
    timestamp?: string;
    userRole?: string;
  };
}

export interface ChatResponse {
  message: string;
  dataCards?: DataCard[];
  quickActions?: QuickAction[];
  metadata?: {
    intent?: string;
    functionCalls?: string[];
    confidence?: number;
  };
}

export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('ai-chat-assistant', {
      body: request,
    });

    if (error) {
      throw error;
    }

    return data as ChatResponse;
  } catch (error) {
    console.error('Error calling AI chat assistant:', error);
    throw error;
  }
}

