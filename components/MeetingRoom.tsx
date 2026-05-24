"use client";

import { useEffect, useRef, useState } from "react";
import { X, Loader2, VideoOff, Mic, MicOff, Video } from "lucide-react";

interface MeetingRoomProps {
  roomName: string;
  meetingTitle: string;
  userFullName: string;
  userInitials: string;
  onClose: () => void;
  onEnded?: () => void;
}

interface JitsiAPI {
  dispose: () => void;
  addEventListeners: (listeners: Record<string, () => void>) => void;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    JitsiMeetExternalAPI: any;
  }
}

export function MeetingRoom({
  roomName,
  meetingTitle,
  userFullName,
  userInitials,
  onClose,
  onEnded,
}: MeetingRoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<JitsiAPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    function initJitsi() {
      if (!containerRef.current || !mounted) return;
      try {
        apiRef.current = new window.JitsiMeetExternalAPI("meet.jit.si", {
          roomName,
          parentNode: containerRef.current,
          width: "100%",
          height: "100%",
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            disableDeepLinking: true,
            prejoinPageEnabled: false,
            defaultLanguage: "en",
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            TOOLBAR_BUTTONS: [
              "microphone", "camera", "closedcaptions", "desktop",
              "fullscreen", "fodeviceselection", "hangup", "chat",
              "raisehand", "videoquality", "tileview", "select-background",
              "mute-everyone",
            ],
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
            MOBILE_APP_PROMO: false,
          },
          userInfo: {
            displayName: userFullName,
          },
        });

        apiRef.current?.addEventListeners({
          videoConferenceJoined: () => {
            if (mounted) setLoading(false);
          },
          videoConferenceLeft: () => {
            if (onEnded) onEnded();
            onClose();
          },
          readyToClose: () => {
            onClose();
          },
        });
      } catch (err) {
        if (mounted) {
          setError("Failed to initialize meeting room. Please try again.");
          setLoading(false);
        }
      }
    }

    // Load the Jitsi external API script if not already present
    if (window.JitsiMeetExternalAPI) {
      initJitsi();
    } else {
      const script = document.createElement("script");
      script.src = "https://meet.jit.si/external_api.js";
      script.async = true;
      script.onload = () => { if (mounted) initJitsi(); };
      script.onerror = () => {
        if (mounted) {
          setError("Could not load Jitsi. Check your internet connection.");
          setLoading(false);
        }
      };
      document.head.appendChild(script);
    }

    return () => {
      mounted = false;
      if (apiRef.current) {
        try { apiRef.current.dispose(); } catch {}
        apiRef.current = null;
      }
    };
  }, [roomName, userFullName]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 bg-slate-900 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs text-red-400 font-semibold uppercase tracking-wide">Live</span>
          </div>
          <span className="text-sm font-semibold text-white">{meetingTitle}</span>
          <span className="text-xs text-slate-500 font-mono">{roomName}</span>
        </div>
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Leave Meeting
        </button>
      </div>

      {/* Jitsi container */}
      <div className="flex-1 relative">
        {loading && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 z-10">
            <div className="w-14 h-14 rounded-2xl bg-violet-600/20 flex items-center justify-center mb-4">
              <Video className="w-7 h-7 text-violet-400" />
            </div>
            <div className="flex items-center gap-2 text-slate-300 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Connecting to meeting room…
            </div>
            <p className="text-xs text-slate-500 mt-2">{meetingTitle}</p>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 z-10">
            <div className="w-14 h-14 rounded-2xl bg-red-600/20 flex items-center justify-center mb-4">
              <VideoOff className="w-7 h-7 text-red-400" />
            </div>
            <p className="text-sm text-slate-300 mb-2">{error}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition-colors"
            >
              Close
            </button>
          </div>
        )}
        <div ref={containerRef} className="w-full h-full" />
      </div>
    </div>
  );
}
