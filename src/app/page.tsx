'use client'

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Sparkles,
  Zap,
  Shield,
  Clock,
  Users,
  Star,
  CheckCircle,
  BookOpen,
  MessageSquare,
  FileText,
  Upload,
  Download,
  Eye,
  Menu,
  Play,
  ChevronRight,
  Send,
  Bot,
  X
} from 'lucide-react';
import MaxWidthWrapper from '@/components/MaxWidthWrapper';
import Image from 'next/image';
import { buttonVariants } from '@/components/ui/button';


function useTypewriter(text: string, speed: number = 50): string {
  const [displayText, setDisplayText] = useState<string>('');

  useEffect(() => {
    setDisplayText('');
    if (text) {
      let i = 0;
      const typingInterval = setInterval(() => {
        if (i < text.length) {
          setDisplayText(prev => prev + text.charAt(i));
          i++;
        } else {
          clearInterval(typingInterval);
        }
      }, speed);
      return () => clearInterval(typingInterval);
    }
  }, [text, speed]);

  return displayText;
}

// ---- Animated Bot Message Component ----
interface BotMessageProps {
  text: string;
}

function BotMessage({ text }: BotMessageProps) {
  const displayText = useTypewriter(text, 20);
  return (
    <div className="flex justify-start animate-slide-in">
      <div className="max-w-[80%] p-3 rounded-2xl bg-slate-700 text-slate-100 rounded-bl-sm flex items-start space-x-2">
        <Bot className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
        <span className="text-sm leading-relaxed">{displayText}</span>
      </div>
    </div>
  );
}

// ---- Animated Dashboard Simulation Component ----
interface Message {
  type: 'bot' | 'user';
  text: string;
}

interface SimulationStep {
  userMessage: string;
  botResponse: string;
}

function DashboardSimulation() {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [messages, setMessages] = useState<Message[]>([
    { type: 'bot', text: "Hello! I've analyzed your research paper. What would you like to know about it?" }
  ]);
  const [isTyping, setIsTyping] = useState<boolean>(false);

  // Move simulationSteps to useMemo to prevent re-creation on every render
  const simulationSteps: SimulationStep[] = useMemo(() => [
    {
      userMessage: "What are the main findings of this study?",
      botResponse: "Based on the document analysis, the study presents three key findings: 1) The experimental group showed 34% improvement in performance metrics, 2) Cost reduction of 28% was achieved through optimization, and 3) User satisfaction increased by 45% compared to baseline measurements."
    },
    {
      userMessage: "Can you summarize the methodology section?",
      botResponse: "The methodology employed a mixed-methods approach combining quantitative analysis of 1,200 participants over 6 months with qualitative interviews from 50 key stakeholders. The study used randomized controlled trials with statistical significance testing at p<0.05 level."
    }
  ], []);

  useEffect(() => {
    if (currentStep < simulationSteps.length) {
      const step = simulationSteps[currentStep];
      const userMsgTimeout = setTimeout(() => {
        setMessages(prev => [...prev, { type: 'user', text: step.userMessage }]);
        setIsTyping(true);

        const botMsgTimeout = setTimeout(() => {
          setIsTyping(false);
          setMessages(prev => [...prev, { type: 'bot', text: step.botResponse }]);
          setCurrentStep(prev => prev + 1);
        }, 1800);

        return () => clearTimeout(botMsgTimeout);
      }, 1500);

      return () => clearTimeout(userMsgTimeout);
    } else {
      const resetTimeout = setTimeout(() => {
        setMessages([{ type: 'bot', text: "Hello! I've analyzed your research paper. What would you like to know about it?" }]);
        setCurrentStep(0);
      }, 4000);
      return () => clearTimeout(resetTimeout);
    }
  }, [currentStep, simulationSteps]); // Now simulationSteps is stable

  return (
    <div className="w-full max-w-6xl mx-auto bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-2xl overflow-hidden animate-fade-in border border-slate-700">
      <div className="grid grid-cols-1 lg:grid-cols-2 h-[550px]">
        {/* PDF Viewer Side */}
        <div className="bg-slate-700/50 p-6 border-r border-slate-600/50 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-300" />
              Research_Paper_Q2.pdf
            </h3>
            <span className="text-slate-400 text-sm">Page 4 of 28</span>
          </div>
          <div className="bg-slate-800/50 ring-1 ring-slate-700 rounded-lg h-full p-6 relative overflow-hidden">
            <div className="space-y-4">
              <div className="h-4 bg-slate-600 rounded w-1/3 animate-shimmer"></div>
              {[...Array(12)].map((_, i) => (
                <div key={i} className={`h-2 bg-slate-700 rounded animate-shimmer`} style={{
                  width: `${Math.random() * 40 + 50}%`,
                  animationDelay: `${i * 0.05}s`
                }}></div>
              ))}
            </div>
          </div>
        </div>
        {/* Chat Side */}
        <div className="bg-slate-800 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Bot className="h-4 w-4" />
                AI Assistant
              </h3>
            </div>
            <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 custom-scrollbar">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-slide-in`}>
                <div className={`max-w-[80%] p-3 rounded-2xl ${
                  message.type === 'user'
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-br-sm'
                    : 'bg-slate-700 text-slate-100 rounded-bl-sm flex items-start space-x-2'
                }`}>
                  {message.type === 'bot' && (
                    <Bot className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                  )}
                  <span className="text-sm leading-relaxed">{message.text}</span>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start animate-fade-in">
                <div className="bg-slate-700 text-slate-100 p-3 rounded-2xl rounded-bl-sm flex items-center space-x-2">
                  <Bot className="w-4 h-4 text-cyan-400" />
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2 bg-slate-700 rounded-xl p-2">
            <input
              type="text"
              placeholder="Ask anything about your document..."
              className="flex-1 bg-transparent text-white placeholder-slate-400 px-3 py-2 focus:outline-none text-sm"
              disabled
            />
            <button className="bg-cyan-500 hover:bg-cyan-600 text-white p-2 rounded-lg transition-colors">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Hero Section Background ---
interface Hero3DBackgroundProps {
  children: React.ReactNode;
}

interface MousePosition {
  x: number;
  y: number;
}

function Hero3DBackground({ children }: Hero3DBackgroundProps) {
  const [mousePosition, setMousePosition] = useState<MousePosition>({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
      }}
    >
      {/* Dynamic Background with Mouse Interaction */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Main gradient blobs */}
        <div
          className="absolute w-[900px] h-[900px] rounded-full opacity-15 blur-2xl transition-all duration-1000 ease-out"
          style={{
            background: 'radial-gradient(circle, rgba(59,130,246,0.13) 0%, transparent 70%)',
            left: `${mousePosition.x * 0.1}%`,
            top: `${mousePosition.y * 0.1}%`,
            transform: 'translate(-50%, -50%)',
          }}
        />
        <div
          className="absolute w-[700px] h-[700px] rounded-full opacity-10 blur-2xl transition-all duration-1500 ease-out"
          style={{
            background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
            right: `${(100 - mousePosition.x) * 0.05}%`,
            bottom: `${(100 - mousePosition.y) * 0.05}%`,
            transform: 'translate(50%, 50%)',
          }}
        />

        {/* Floating animated icons/blobs */}
        <div className="absolute top-24 left-32 w-8 h-8 bg-blue-400/20 rounded-full animate-float" style={{ animationDelay: '0s' }}></div>
        <div className="absolute top-40 right-40 w-10 h-10 bg-indigo-400/20 rounded-lg animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-32 left-60 w-6 h-6 bg-cyan-300/20 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-2/3 left-1/4 w-12 h-12 bg-emerald-300/20 rounded-2xl animate-float" style={{ animationDelay: '3s' }}></div>
        {/* Animated icon examples */}
        <div className="absolute top-1/3 left-1/2 animate-float" style={{ animationDelay: '1.5s' }}>
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center shadow-lg">
            <svg width="20" height="20" fill="none"><circle cx="10" cy="10" r="8" stroke="#fff" strokeWidth="2"/></svg>
          </div>
        </div>
        <div className="absolute bottom-24 right-1/3 animate-float" style={{ animationDelay: '2.5s' }}>
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-blue-500 rounded-lg flex items-center justify-center shadow-lg">
            <svg width="16" height="16" fill="none"><rect x="2" y="2" width="12" height="12" rx="3" stroke="#fff" strokeWidth="2"/></svg>
          </div>
        </div>
      </div>
      <div className="relative z-10 w-full">{children}</div>
    </section>
  );
}

// ---- Feature and Stat Interfaces ----
interface Feature {
  icon: React.ReactElement;
  title: string;
  description: string;
  gradient: string;
}

interface Stat {
  number: string;
  label: string;
}

interface HowItWorksStep {
  step: string;
  title: string;
  desc: string;
  icon: React.ReactElement;
  color: string;
}

// ---- Main Landing Page ----
export default function Home() {
  // Move simulationSteps inside useMemo to prevent re-creation on every render
  const simulationSteps = useMemo(() => [
    { x: 0, y: 0, rotation: 0 },
    { x: 100, y: 50, rotation: 15 },
    { x: 200, y: 80, rotation: -10 },
    { x: 300, y: 120, rotation: 25 },
    { x: 400, y: 90, rotation: -5 },
    { x: 500, y: 140, rotation: 20 },
    { x: 600, y: 110, rotation: -15 },
    { x: 700, y: 160, rotation: 30 },
    { x: 800, y: 130, rotation: -8 },
    { x: 900, y: 180, rotation: 12 },
    { x: 1000, y: 150, rotation: -20 },
  ], []);

  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [mousePosition, setMousePosition] = useState<MousePosition>({ x: 0, y: 0 });
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    setIsVisible(true);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const features: Feature[] = [
    {
      icon: <Zap className="w-8 h-8" color="white" strokeWidth={2.5} />,
      title: "Lightning Fast",
      description: "Get instant answers from your PDFs with our advanced AI processing.",
      gradient: "bg-gradient-to-br from-blue-400 to-cyan-500"
    },
    {
      icon: <Shield className="w-8 h-8" color="white" strokeWidth={2.5} />,
      title: "Secure & Private",
      description: "Your documents are encrypted and never shared with third parties.",
      gradient: "bg-gradient-to-br from-purple-500 to-pink-500"
    },
    {
      icon: <Users className="w-8 h-8" color="white" strokeWidth={2.5} />,
      title: "Team Collaboration",
      description: "Share insights and collaborate with your team on document analysis.",
      gradient: "bg-gradient-to-br from-green-400 to-teal-500"
    },
    {
      icon: <Clock className="w-8 h-8" color="white" strokeWidth={2.5} />,
      title: "24/7 Available",
      description: "Access your AI assistant anytime, anywhere, on any device.",
      gradient: "bg-gradient-to-br from-orange-400 to-red-500"
    }
  ];

  const stats: Stat[] = [
    { number: '50K+', label: 'Documents Processed' },
    { number: '10K+', label: 'Happy Users' },
    { number: '99.9%', label: 'Accuracy Rate' },
    { number: '24/7', label: 'AI Support' }
  ];

  const howItWorksSteps: HowItWorksStep[] = [
    {
      step: 'Step 1',
      title: 'Create Your Account',
      desc: 'Sign up for free and unlock all features.',
      icon: <Users className="h-6 w-6" />,
      color: 'bg-blue-600'
    },
    {
      step: 'Step 2', 
      title: 'Upload Your PDF',
      desc: 'Drag & drop any PDF file. Our AI processes it instantly.',
      icon: <Zap className="h-6 w-6" />,
      color: 'bg-purple-600'
    },
    {
      step: 'Step 3',
      title: 'Start Chatting',
      desc: 'Ask questions, get summaries, extract insights.',
      icon: <Sparkles className="h-6 w-6" />,
      color: 'bg-green-600'
    }
  ];

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      
      <Hero3DBackground>
        <MaxWidthWrapper>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center relative z-10">
            {/* Left: Text */}
            <div className="py-12 md:py-0">
              <div className="inline-flex items-center px-6 py-2 mb-8 rounded-full bg-white/80 border border-blue-100 shadow animate-fade-in-down">
                <span className="text-blue-600 text-lg animate-bounce">🚀</span>
                <span className="mx-2 text-sm font-semibold text-blue-700">
                  Lexinote just launched with AI superpowers!
                </span>
                <span className="text-yellow-500 text-lg animate-bounce">✨</span>
              </div>
              <h1 className="font-extrabold text-4xl sm:text-6xl lg:text-7xl leading-[1.1] mb-4 tracking-tight">
                <span className="block text-[#22223b]">
                  Unlock the <span className="text-blue-600">power</span> of your
                </span>
                <span className="block mt-2">
                  <span className="font-black text-pink-500">PDFs</span> with <span className="text-blue-600">AI magic</span>
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-700 max-w-xl mb-5">
                Meet <span className="font-bold text-blue-700">Lexinote</span> — transform your documents into interactive conversations. Upload, analyze, and extract insights with advanced AI technology.
              </p>
              <div className="mb-7 text-blue-700 font-semibold text-base sm:text-lg">
                Upload • Chat • Discover • Excel <span role="img" aria-label="target">🎯</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-start items-start">
                <Link
                  href="/dashboard"
                  className="rounded-full bg-gradient-to-r from-blue-500 to-purple-500 px-8 py-4 text-lg font-bold text-white shadow-md hover:from-blue-600 hover:to-purple-600 transition group flex items-center gap-2"
                >
                  Try Lexinote Now
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button
                  className="group bg-white/80 backdrop-blur-sm text-gray-700 px-8 py-4 rounded-full text-lg font-semibold hover:bg-white border border-gray-200/50 hover:border-gray-300 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
                  onClick={() => {
                    const el = document.getElementById('see-in-action');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  type="button"
                >
                  <Play className="h-5 w-5" />
                  Watch Demo
                </button>
              </div>
            </div>
            {/* Right: Animated PDFs */}
            <div className="relative flex justify-center items-center h-[420px] md:h-[500px]">
              {/* Back PDF */}
              <div className="absolute left-12 top-12 scale-110 opacity-60 animate-float" style={{ animationDelay: "0.4s" }}>
                <div className="rounded-2xl bg-white shadow-2xl border border-blue-300/30 w-52 h-64 flex flex-col p-5">
                  <div className="h-5 w-1/2 rounded bg-blue-100 mb-4" />
                  <div className="space-y-2 flex-1">
                    <div className="h-2 w-full rounded bg-gray-100"></div>
                    <div className="h-2 w-5/6 rounded bg-gray-100"></div>
                    <div className="h-2 w-4/6 rounded bg-gray-100"></div>
                  </div>
                </div>
              </div>
              {/* Main PDF */}
              <div className="z-10 animate-float">
                <div className="rounded-2xl bg-white shadow-2xl border border-blue-300/40 w-56 h-72 flex flex-col p-6">
                  <div className="h-6 w-2/3 rounded bg-blue-500 mb-5" />
                  <div className="space-y-3 flex-1">
                    <div className="h-3 w-full rounded bg-gray-200"></div>
                    <div className="h-3 w-5/6 rounded bg-gray-200"></div>
                    <div className="h-3 w-3/5 rounded bg-gray-200"></div>
                  </div>
                </div>
              </div>
              {/* Front PDF */}
              <div className="absolute right-10 bottom-4 scale-95 opacity-70 animate-float" style={{ animationDelay: "1.3s" }}>
                <div className="rounded-2xl bg-white shadow-2xl border border-blue-300/20 w-44 h-56 flex flex-col p-4">
                  <div className="h-4 w-1/3 rounded bg-purple-100 mb-3" />
                  <div className="space-y-2 flex-1">
                    <div className="h-2 w-full rounded bg-gray-100"></div>
                    <div className="h-2 w-3/4 rounded bg-gray-100"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </MaxWidthWrapper>
      </Hero3DBackground>

      {/* Features Grid */}
      <section className="py-20 bg-white">
        <MaxWidthWrapper>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 section-title">
              Why Choose Lexinote?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Experience the future of document interaction with our cutting-edge AI technology.
            </p>
          </div>
          <div className="features__grid grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="feature-card group p-8 rounded-2xl bg-white border border-gray-100 shadow hover:shadow-lg transition transform hover:-translate-y-2"
              >
                <div className={`feature-icon flex items-center justify-center w-20 h-20 rounded-full ${feature.gradient} mb-6`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-base">{feature.description}</p>
              </div>
            ))}
          </div>
        </MaxWidthWrapper>
      </section>

      
      <div
        id="see-in-action"
        className="relative isolate py-24 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900"
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute w-[600px] h-[600px] bg-gradient-to-tr from-blue-400/20 via-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse left-1/4 top-1/4" style={{ animationDuration: '6s' }} />
          <div className="absolute w-[400px] h-[400px] bg-gradient-to-tr from-pink-300/10 via-blue-300/10 to-purple-300/10 rounded-full blur-2xl right-1/4 bottom-1/4 animate-spin" style={{ animationDuration: '12s' }} />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black text-white mb-6">
              See It In <span className="text-transparent bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text">Action</span>
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Watch how Lexinote transforms your PDF into an intelligent conversation partner
            </p>
          </div>
          <div className='mt-16 flow-root sm:mt-24'>
            <div className='flex justify-center'>
              <DashboardSimulation />
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className='mx-auto mb-24 mt-24 max-w-5xl'>
        <div className='mb-10 px-6 lg:px-8'>
          <div className='mx-auto max-w-2xl text-center'>
            <h2 className='text-3xl font-bold text-gray-900 mb-4'>
              How It Works
            </h2>
            <p className='text-lg text-gray-600'>
              Get started in three simple steps.
            </p>
          </div>
        </div>
        <ol className="my-8 pt-8 space-y-8 md:space-y-0 md:flex md:space-x-8 px-4">
          {howItWorksSteps.map((item, idx) => (
            <li
              key={idx}
              className={`md:flex-1 group relative transition-transform duration-500 ease-out
                ${idx === 0 ? "animate-fade-in-up" : idx === 1 ? "animate-fade-in-up delay-150" : "animate-fade-in-up delay-300"}`}
              style={{ animationFillMode: 'both' }}
            >
              <div className="relative flex flex-col space-y-4 bg-white rounded-2xl shadow p-8 border border-gray-100 hover:border-blue-200 transition hover:shadow-xl hover:-translate-y-2">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${item.color} text-white shadow mb-2 group-hover:scale-110 transition-transform duration-300`}>
                  {item.icon}
                </div>
                <span className="text-sm font-bold text-blue-700">{item.step}</span>
                <h3 className="text-lg font-black text-gray-900">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
                {/* Connecting line for desktop */}
                {idx < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gray-200" />
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 animate-gradient-x">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-6">
            <Sparkles className="h-8 w-8 text-white mr-2" />
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Ready to Get Started?
            </h2>
          </div>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of professionals who are already transforming their document workflow
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/dashboard"
              className="bg-white text-gray-900 px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 shadow-xl hover:shadow-2xl flex items-center gap-2"
            >
              Start Free Today
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
                Lexinote
              </h3>
              <p className="text-gray-400 mb-6 max-w-md">
                Transform your document experience with AI-powered insights and seamless workflow integration.
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center hover:scale-110 transition-transform cursor-pointer">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center hover:scale-110 transition-transform cursor-pointer">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-red-600 rounded-full flex items-center justify-center hover:scale-110 transition-transform cursor-pointer">
                  <Star className="h-5 w-5" />
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Lexinote. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}