'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isToolCall?: boolean;
}

export default function ChatIAPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Carrega mensagens do localStorage
  useEffect(() => {
    const savedMessages = localStorage.getItem('chat_messages');
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        setMessages(parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        })));
      } catch (error) {
        console.error('Erro ao carregar mensagens:', error);
        // Fallback para mensagem inicial
        setMessages([{
          role: 'assistant',
          content: 'Olá! Sou o assistente virtual da Dreams. Posso ajudar você consultando dados em tempo real do sistema, incluindo vendas da Limber Card. Como posso ajudar?',
          timestamp: new Date(),
        }]);
      }
    } else {
      // Mensagem inicial
      setMessages([{
        role: 'assistant',
        content: 'Olá! Sou o assistente virtual da Dreams. Posso ajudar você consultando dados em tempo real do sistema, incluindo vendas da Limber Card. Como posso ajudar?',
        timestamp: new Date(),
      }]);
    }
  }, []);

  // Salva mensagens no localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chat_messages', JSON.stringify(messages));
    }
  }, [messages]);

  // Auto-scroll para a última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Ajusta altura do textarea automaticamente
  const adjustTextareaHeight = () => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    // Adiciona mensagem do usuário
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    try {
      // Prepara histórico da conversa (apenas as últimas 10 mensagens para economizar tokens)
      const conversationHistory = messages.slice(-10).map(msg => ({
        role: msg.role === 'system' ? 'assistant' : msg.role,
        content: msg.content,
      }));

      // Adiciona indicador de que está consultando dados
      const thinkingMessage: Message = {
        role: 'system',
        content: '🔍 Consultando dados em tempo real...',
        timestamp: new Date(),
        isToolCall: true,
      };
      setMessages(prev => [...prev, thinkingMessage]);

      const response = await fetch('/api/chat-ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar mensagem');
      }

      const data = await response.json();

      // Remove mensagem de "consultando dados"
      setMessages(prev => prev.filter(m => !m.isToolCall));

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Erro:', error);
      
      // Remove mensagem de "consultando dados"
      setMessages(prev => prev.filter(m => !m.isToolCall));
      
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const clearHistory = () => {
    if (confirm('Deseja limpar todo o histórico de conversas?')) {
      localStorage.removeItem('chat_messages');
      setMessages([{
        role: 'assistant',
        content: 'Olá! Sou o assistente virtual da Dreams. Posso ajudar você consultando dados em tempo real do sistema, incluindo vendas da Limber Card. Como posso ajudar?',
        timestamp: new Date(),
      }]);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 pt-16 xl:pt-0">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white text-xl">🤖</span>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Chat IA</h1>
              <p className="text-sm text-gray-500">Assistente com acesso a dados em tempo real</p>
            </div>
          </div>
          <button
            onClick={clearHistory}
            className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Limpar
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === 'user' 
                  ? 'justify-end' 
                  : message.role === 'system' 
                  ? 'justify-center' 
                  : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                    : message.role === 'system'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 text-sm italic'
                    : 'bg-white border border-gray-200 text-gray-900'
                }`}
              >
                <p className="text-sm sm:text-base whitespace-pre-wrap break-words">
                  {message.content}
                </p>
                {message.role !== 'system' && (
                  <p
                    className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-purple-100' : 'text-gray-400'
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </p>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 px-4 py-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => {
                  setInputMessage(e.target.value);
                  adjustTextareaHeight();
                }}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem... Ex: 'Quantas vendas tivemos hoje?'"
                disabled={isLoading}
                rows={1}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                style={{ minHeight: '48px', maxHeight: '150px' }}
              />
              <div className="absolute right-2 bottom-2 text-xs text-gray-400">
                {inputMessage.length > 0 && `${inputMessage.length} caracteres`}
              </div>
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="bg-gradient-to-br from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              <span className="hidden sm:inline">Enviar</span>
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Pressione <kbd className="px-2 py-1 bg-gray-100 rounded border border-gray-300">Enter</kbd> para enviar ou <kbd className="px-2 py-1 bg-gray-100 rounded border border-gray-300">Shift+Enter</kbd> para nova linha
          </p>
        </div>
      </div>
    </div>
  );
}
