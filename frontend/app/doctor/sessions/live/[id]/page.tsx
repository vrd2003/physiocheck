'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { apiEndpoints } from '@/lib/api';
import { Card } from '@/components/cards/Card';
import { ChevronLeft, Activity, Target, Phone, PhoneOff, Video } from 'lucide-react';
import Link from 'next/link';
import Peer from 'simple-peer';
import { supabase } from '@/lib/supabase';

interface SessionData {
  exercise_id: string;
  patient_id: string;
  timestamp: string;
  rep_count: number;
  correct_reps: number;
  incorrect_reps: number;
  accuracy: number;
  posture_status: 'correct' | 'warning' | 'incorrect';
  feedback_message: string;
  target_reps: number;
  session_complete: boolean;
  angles?: Record<string, number>;
}

export default function LiveSessionPage() {
  const params = useParams();
  const id = params.id as string;
  const wsRef = useRef<WebSocket | null>(null);
  const [data, setData] = useState<SessionData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Video Call State
  const [isInCall, setIsInCall] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null); // Local (Doctor)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null); // Remote (Patient)
  const myVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<Peer.Instance | null>(null);

  useEffect(() => {
    const connectWs = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        // Use existing endpoint structure but ensure token is passed
        const wsUrl = `${apiEndpoints.doctor.sessions.monitor(id)}?token=${session?.access_token || ''}`;
        
        console.log('Connecting to monitor:', wsUrl);
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('Connected to monitor');
          setIsConnected(true);
          setError(null);
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            if (message.error) {
               setError(message.error);
               return;
            }

            if (message.type === 'signal') {
                handleSignal(message);
            } else if (message.type === 'exercise_update') {
               // Update stats from patient broadcast
               setData(message);
            } else if (message.type === 'status_update') {
                // handle status
            }

          } catch (err) {
            console.error('Failed to parse message:', err);
          }
        };

        ws.onclose = () => {
          console.log('Disconnected from monitor');
          setIsConnected(false);
          endCall(); // Clean up if WS drops
        };

        ws.onerror = (err) => {
          console.error('WebSocket error:', err);
          setError('Connection error');
        };
    };

    connectWs();

    return () => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.close();
        }
        endCall();
    };
  }, [id]);

  // const hasProcessedAnswer = useRef(false);

  const startCall = async () => {
      try {
          // hasProcessedAnswer.current = false; // Reset state for new call
          const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          setStream(localStream);
          
          const peer = new Peer({
              initiator: true,
              trickle: false,
              stream: localStream
          });
          
          peer.on('signal', (data) => {
              wsRef.current?.send(JSON.stringify({
                  type: 'signal',
                  target: 'patient',
                  data: data
              }));
          });

          peer.on('stream', (remoteStream) => {
              console.log("DEBUG: Received remote stream");
              setRemoteStream(remoteStream);
              if (remoteVideo.current) {
                  remoteVideo.current.srcObject = remoteStream;
              }
          });
          
          peerRef.current = peer;
          setIsInCall(true);

      } catch (err) {
          console.error('Failed to get local stream', err);
          setError('Failed to access camera/microphone');
      }
  };

  const handleSignal = (message: any) => {
      console.log("DEBUG: Received signal", message.data.type);
      if (peerRef.current) {
          try {
              // Simply pass all signals to the peer instance
              peerRef.current.signal(message.data);
          } catch (err) {
              console.error("DEBUG: Failed to signal peer:", err);
          }
      }
  };

  const endCall = () => {
      if (peerRef.current) {
          peerRef.current.destroy();
          peerRef.current = null;
      }
      // hasProcessedAnswer.current = false;
      if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
      }
      setRemoteStream(null);
      setIsInCall(false);
  };
  
  // Effect to attach local stream to video element when it becomes available
  useEffect(() => {
    if (stream && myVideo.current) {
        myVideo.current.srcObject = stream;
    }
  }, [stream]);

  // Effect to attach remote stream
  useEffect(() => {
      if (remoteStream && remoteVideo.current) {
          remoteVideo.current.srcObject = remoteStream;
      }
  }, [remoteStream]);


  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/doctor/patients" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Live Session Monitor</h1>
          <p className="text-slate-500">Patient ID: {id}</p>
        </div>
        <div className="ml-auto flex items-center gap-4">
             {isConnected && !isInCall && (
                <button 
                    onClick={startCall}
                    className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
                >
                    <Video className="h-4 w-4" />
                    Join Video Call
                </button>
             )}
             {isInCall && (
                <button 
                    onClick={endCall}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                    <PhoneOff className="h-4 w-4" />
                    End Call
                </button>
             )}
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
                {isConnected ? 'Live' : 'Disconnected'}
            </span>
        </div>
      </div>

      {error && (
        <Card className="p-4 bg-red-50 border-red-200 text-red-800">
            Error: {error}
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Feed */}
        <div className="lg:col-span-2 space-y-4">
            <Card className="aspect-video bg-black flex items-center justify-center overflow-hidden relative rounded-xl">
                {isInCall && remoteStream ? (
                    <>
                        {/* Remote Stream (Patient) - Large */}
                        <video 
                            ref={remoteVideo}
                            autoPlay
                            playsInline
                            className="w-full h-full object-contain"
                        />
                        {/* Local Stream (Doctor) - Small PiP */}
                        <div className="absolute bottom-4 right-4 w-48 h-36 bg-slate-900 rounded-lg border border-slate-700 overflow-hidden shadow-xl z-10">
                             <video 
                                ref={myVideo}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover"
                             />
                             <div className="absolute bottom-1 right-1 bg-black/60 px-2 py-0.5 rounded text-xs text-white">
                                You
                             </div>
                        </div>
                    </>
                ) : (
                    <div className="text-white/50 flex flex-col items-center gap-2">
                        <Activity className="h-10 w-10 animate-pulse" />
                        <p>{isConnected ? 'Waiting for video stream...' : 'Connecting...'}</p>
                        {!isInCall && isConnected && (
                            <button onClick={startCall} className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white text-sm transition">
                                Start Video Call
                            </button>
                        )}
                    </div>
                )}
                
                {data?.feedback_message && (
                    <div className="absolute bottom-4 left-4 right-4 max-w-md mx-auto">
                        <div className={`p-3 rounded-lg text-center font-medium ${
                            data.posture_status === 'correct' ? 'bg-green-500/90 text-white' :
                            data.posture_status === 'warning' ? 'bg-yellow-500/90 text-white' :
                            'bg-red-500/90 text-white'
                        }`}>
                            {data.feedback_message}
                        </div>
                    </div>
                )}
            </Card>
        </div>

        {/* Stats Panel */}
        <div className="space-y-6">
            <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2 text-slate-900">
                    <Activity className="h-5 w-5 text-teal-600" />
                    Session Stats
                </h3>
                
                <div className="grid gap-4">
                    <div className="p-4 bg-slate-50 rounded-lg">
                        <div className="text-sm text-slate-500 mb-1">Repetitions</div>
                        <div className="text-3xl font-bold text-slate-900">
                            {data?.rep_count || 0} <span className="text-lg text-slate-400 font-normal">/ {data?.target_reps || 10}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-green-50 rounded-lg">
                            <div className="text-xs text-green-600 mb-1">Correct</div>
                            <div className="text-2xl font-bold text-green-700">
                                {data?.correct_reps || 0}
                            </div>
                        </div>
                        <div className="p-3 bg-red-50 rounded-lg">
                            <div className="text-xs text-red-600 mb-1">Incorrect</div>
                            <div className="text-2xl font-bold text-red-700">
                                {data?.incorrect_reps || 0}
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-lg">
                        <div className="text-sm text-slate-500 mb-1">Accuracy</div>
                        <div className="text-3xl font-bold text-slate-900">
                            {data?.accuracy || 0}%
                        </div>
                    </div>
                </div>
            </Card>

            {data?.angles && Object.keys(data.angles).length > 0 && (
                <Card className="p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2 text-slate-900">
                        <Target className="h-5 w-5 text-teal-600" />
                        Joint Angles
                    </h3>
                    <div className="space-y-2">
                        {Object.entries(data.angles).map(([joint, angle]) => (
                            <div key={joint} className="flex justify-between items-center text-sm">
                                <span className="capitalize text-slate-600">{joint.replace('_', ' ')}:</span>
                                <span className="font-mono font-medium text-slate-900">{Math.round(angle as number)}°</span>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
      </div>
    </div>
  );
}
